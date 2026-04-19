/**
 * Steamify email sender service.
 *
 * This module provides template-based transactional email helpers for:
 * - verification
 * - password reset
 * - organization invitations
 * - team onboarding notifications
 */
import { EvlogError, createError } from "evlog";

import { capturePasswordResetEmail, captureVerificationEmail } from "./test-auth-email-store";

const isE2ETestEmailCaptureEnabled = (): boolean => process.env.ENABLE_E2E_TEST_HELPERS === "1";

export interface Recipients {
  to: string[];
  cc?: string[];
  bcc?: string[];
}

export interface IEmailPayload {
  templateId: number;
  recipients: Recipients;
  subject: string;
  data: Record<string, unknown>;
}

const DEFAULT_TEMPLATE_IDS = {
  accountCreated: 1710,
  organizationInvitation: 1707,
  passwordReset: 1703,
  teamMemberAdded: 1708,
  teamMemberWelcome: 1709,
  verification: 1702,
} as const;

const parseTemplateId = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Read environment variables lazily to ensure this works after dotenv loads.
 */
const getEmailConfig = () => ({
  appName: process.env.APP_NAME ?? "RMS",
  steamifyBasicAuthPass: process.env.STEAMIFY_BASIC_AUTH_PASS,
  steamifyBasicAuthUser: process.env.STEAMIFY_BASIC_AUTH_USER,
  steamifyUrl: process.env.STEAMIFY_URL,
  templateIds: {
    accountCreated: parseTemplateId(
      process.env.TEMPLATE_ID_ACCOUNT_CREATED,
      DEFAULT_TEMPLATE_IDS.accountCreated,
    ),
    organizationInvitation: parseTemplateId(
      process.env.TEMPLATE_ID_ORGANIZATION_INVITATION,
      DEFAULT_TEMPLATE_IDS.organizationInvitation,
    ),
    passwordReset: parseTemplateId(
      process.env.TEMPLATE_ID_PASSWORD_RESET,
      DEFAULT_TEMPLATE_IDS.passwordReset,
    ),
    teamMemberAdded: parseTemplateId(
      process.env.TEMPLATE_ID_TEAM_MEMBER_ADDED,
      DEFAULT_TEMPLATE_IDS.teamMemberAdded,
    ),
    teamMemberWelcome: parseTemplateId(
      process.env.TEMPLATE_ID_TEAM_MEMBER_WELCOME,
      DEFAULT_TEMPLATE_IDS.teamMemberWelcome,
    ),
    verification: parseTemplateId(
      process.env.TEMPLATE_ID_VERIFICATION,
      DEFAULT_TEMPLATE_IDS.verification,
    ),
  },
});

const getBasicAuthHeader = (username: string, password: string): string => {
  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials).toString("base64");
  return `Basic ${encoded}`;
};

/**
 * Send email via Steamify template API.
 */
export const sendSteamifyEmail = async (payload: IEmailPayload): Promise<void> => {
  const { steamifyUrl, steamifyBasicAuthUser, steamifyBasicAuthPass } = getEmailConfig();

  if (!steamifyUrl || !steamifyBasicAuthUser || !steamifyBasicAuthPass) {
    return;
  }

  const requestBody = {
    data: payload.data,
    recipients: {
      bcc: payload.recipients.bcc ?? [],
      cc: payload.recipients.cc ?? [],
      to: payload.recipients.to,
    },
    subject: payload.subject,
    templateId: payload.templateId,
  };

  try {
    const response = await fetch(`${steamifyUrl}/api/emails`, {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: getBasicAuthHeader(steamifyBasicAuthUser, steamifyBasicAuthPass),
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => "Unknown error");
      throw createError({
        fix: "Retry later or verify Steamify credentials and template configuration.",
        internal: {
          provider: "steamify",
          responseBody: errorPayload,
          status: response.status,
          templateId: payload.templateId,
        },
        message: "Unable to send transactional email. Please try again later.",
        status: 502,
        why: `Steamify API returned ${response.status}.`,
      });
    }
  } catch (error) {
    if (error instanceof EvlogError) {
      throw error;
    }

    throw createError({
      cause: error instanceof Error ? error : undefined,
      fix: "Retry later or contact support if this persists.",
      internal: {
        provider: "steamify",
        templateId: payload.templateId,
      },
      message: "Unable to send transactional email. Please try again later.",
      status: 502,
      why: "Email provider request failed unexpectedly.",
    });
  }
};

export const sendVerificationEmailViaSteamify = async ({
  user,
  url,
}: {
  user: { email: string; name?: string | null };
  url: string;
}): Promise<void> => {
  if (isE2ETestEmailCaptureEnabled()) {
    captureVerificationEmail(user.email, url);
  }

  const { appName, templateIds } = getEmailConfig();
  const greetingName = user.name || "there";

  const payload: IEmailPayload = {
    data: {
      appName,
      greetingName,
      url,
    },
    recipients: {
      to: [user.email],
    },
    subject: "Verify your email",
    templateId: templateIds.verification,
  };

  await sendSteamifyEmail(payload);
};

export const sendPasswordResetEmailViaSteamify = async ({
  user,
  url,
  token,
  resetLink,
}: {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
  resetLink?: string;
}): Promise<void> => {
  const resolvedResetLink = resetLink ?? url;

  if (isE2ETestEmailCaptureEnabled()) {
    capturePasswordResetEmail(user.email, resolvedResetLink, token);
  }

  const { appName, templateIds } = getEmailConfig();
  const greetingName = user.name || "there";

  const payload: IEmailPayload = {
    data: {
      appName,
      greetingName,
      resetLink: resolvedResetLink,
      token,
      url,
    },
    recipients: {
      to: [user.email],
    },
    subject: "Reset your password",
    templateId: templateIds.passwordReset,
  };

  await sendSteamifyEmail(payload);
};

export const sendOrganizationInvitationEmailViaSteamify = async ({
  email,
  role,
  organization,
  inviter,
  invitationUrl,
}: {
  email: string;
  role: string;
  organization: {
    name?: string | null;
    description?: string | null;
    teamNumber?: string | null;
  };
  inviter: {
    user: {
      name?: string | null;
      email: string;
    };
  };
  invitationUrl: string;
}): Promise<void> => {
  const { templateIds } = getEmailConfig();
  const inviterName = inviter.user.name || inviter.user.email;
  const organizationName = organization.name || "an organization";

  const payload: IEmailPayload = {
    data: {
      invitationLink: invitationUrl,
      invitationUrl,
      inviterName,
      organizationDescription: organization.description,
      organizationName,
      role,
      teamNumber: organization.teamNumber,
    },
    recipients: {
      to: [email],
    },
    subject: `${inviterName} invited you to join ${organizationName}`,
    templateId: templateIds.organizationInvitation,
  };

  await sendSteamifyEmail(payload);
};

export const sendTeamMemberAddedEmailViaSteamify = async ({
  email,
  userName,
  teamName,
  inviterName,
  loginUrl,
}: {
  email: string;
  userName: string;
  teamName: string;
  inviterName: string;
  loginUrl: string;
}): Promise<void> => {
  const { templateIds } = getEmailConfig();

  const payload: IEmailPayload = {
    data: {
      inviterName,
      loginLink: loginUrl,
      loginUrl,
      teamName,
      userName,
    },
    recipients: {
      to: [email],
    },
    subject: `You've been added to ${teamName}`,
    templateId: templateIds.teamMemberAdded,
  };

  await sendSteamifyEmail(payload);
};

export const sendTeamMemberWelcomeEmailViaSteamify = async ({
  email,
  userName,
  teamName,
  inviterName,
  temporaryPassword,
  loginUrl,
}: {
  email: string;
  userName: string;
  teamName: string;
  inviterName: string;
  temporaryPassword: string;
  loginUrl: string;
}): Promise<void> => {
  const { templateIds } = getEmailConfig();

  const payload: IEmailPayload = {
    data: {
      email,
      inviterName,
      loginLink: loginUrl,
      loginUrl,
      teamName,
      temporaryPassword,
      userName,
    },
    recipients: {
      to: [email],
    },
    subject: `Welcome! You've been invited to ${teamName}`,
    templateId: templateIds.teamMemberWelcome,
  };

  await sendSteamifyEmail(payload);
};

export const sendAccountCreatedEmailViaSteamify = async ({
  email,
  name,
  username,
  password,
  loginUrl,
}: {
  email: string;
  name: string;
  username?: string;
  password: string;
  loginUrl: string;
}): Promise<void> => {
  const { templateIds } = getEmailConfig();
  const firstName = name.split(" ")[0] || "there";

  const payload: IEmailPayload = {
    data: {
      email,
      firstName,
      loginLink: loginUrl,
      loginUrl,
      temporaryPassword: password,
      username,
    },
    recipients: {
      to: [email],
    },
    subject: "Welcome to RMS!",
    templateId: templateIds.accountCreated,
  };

  await sendSteamifyEmail(payload);
};
