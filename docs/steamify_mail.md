/**
 * Email Service - Support for both Resend and Steamify
 * Steamify is used for template-based emails with rich customization
 */

export type Recipients = {
  to: string[];
  cc?: string[];
  bcc?: string[];
};

export type IEmailPayload = {
  templateId: number;
  recipients: Recipients;
  subject: string;
  data: Record<string, unknown>; // object, in which key is a param in email template
};

/**
 * Get environment variables lazily to ensure they're read after dotenv loads
 */
function getEmailConfig() {
  return {
    steamifyUrl: process.env.STEAMIFY_URL,
    steamifyBasicAuthUser: process.env.STEAMIFY_BASIC_AUTH_USER,
    steamifyBasicAuthPass: process.env.STEAMIFY_BASIC_AUTH_PASS,
    templateId: process.env.TEMPLATE_ID
      ? Number(process.env.TEMPLATE_ID)
      : undefined,
    appName: process.env.APP_NAME || "RMS",
    templateIds: {
      verification: process.env.TEMPLATE_ID_VERIFICATION
        ? Number(process.env.TEMPLATE_ID_VERIFICATION)
        : 1702,
      passwordReset: process.env.TEMPLATE_ID_PASSWORD_RESET
        ? Number(process.env.TEMPLATE_ID_PASSWORD_RESET)
        : 1703,
      organizationInvitation: process.env.TEMPLATE_ID_ORGANIZATION_INVITATION
        ? Number(process.env.TEMPLATE_ID_ORGANIZATION_INVITATION)
        : 1707,
      teamMemberAdded: process.env.TEMPLATE_ID_TEAM_MEMBER_ADDED
        ? Number(process.env.TEMPLATE_ID_TEAM_MEMBER_ADDED)
        : 1708,
      teamMemberWelcome: process.env.TEMPLATE_ID_TEAM_MEMBER_WELCOME
        ? Number(process.env.TEMPLATE_ID_TEAM_MEMBER_WELCOME)
        : 1709,
      accountCreated: process.env.TEMPLATE_ID_ACCOUNT_CREATED
        ? Number(process.env.TEMPLATE_ID_ACCOUNT_CREATED)
        : 1710,
    },
  };
}
/**
 * Convert credentials to Basic Auth header
 */
function getBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Send email via Steamify API with template
 */
export async function sendSteamifyEmail(payload: IEmailPayload): Promise<void> {
  const { steamifyUrl, steamifyBasicAuthUser, steamifyBasicAuthPass } =
    getEmailConfig();

  if (!(steamifyUrl && steamifyBasicAuthUser && steamifyBasicAuthPass)) {
    return;
  }

  const requestBody = {
    templateId: payload.templateId,
    recipients: {
      to: payload.recipients.to,
      cc: payload.recipients.cc ?? [],
      bcc: payload.recipients.bcc ?? [],
    },
    subject: payload.subject,
    data: payload.data,
  };

  try {
    const response = await fetch(`${steamifyUrl}/api/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getBasicAuthHeader(
          steamifyBasicAuthUser,
          steamifyBasicAuthPass
        ),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Steamify API error: ${response.status} - ${errorPayload}`
      );
    }
  } catch (_error) {
    throw new Error(
      "Unable to send transactional email. Please try again later."
    );
  }
}

/**
 * Send verification email via Steamify template
 * Template ID: 1691 (Welcome/Verification template)
 */
export async function sendVerificationEmailViaSteamify({
  user,
  url,
}: {
  user: { email: string; name?: string | null };
  url: string;
}): Promise<void> {
  const { appName, templateIds } = getEmailConfig();
  const greetingName = user.name || "there";
  const payload: IEmailPayload = {
    templateId: templateIds.verification,
    recipients: {
      to: [user.email],
    },
    subject: "Verify your email",
    data: {
      greetingName,
      appName,
      url,
    },
  };

  await sendSteamifyEmail(payload);
}

/**
 * Send password reset email via Steamify template
 */
export async function sendPasswordResetEmailViaSteamify({
  user,
  url,
  token,
  resetLink,
}: {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
  resetLink?: string;
}): Promise<void> {
  const { appName, templateIds } = getEmailConfig();
  const greetingName = user.name || "there";
  const payload: IEmailPayload = {
    templateId: templateIds.passwordReset,
    recipients: {
      to: [user.email],
    },
    subject: "Reset your password",
    data: {
      greetingName,
      appName,
      url,
      resetLink: resetLink ?? url,
      token,
    },
  };

  await sendSteamifyEmail(payload);
}

/**
 * Send organization invitation email via Steamify template
 */
export async function sendOrganizationInvitationEmailViaSteamify({
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
}): Promise<void> {
  const { templateIds } = getEmailConfig();
  const inviterName = inviter.user?.name || inviter.user.email;
  const organizationName = organization.name || "an organization";

  const payload: IEmailPayload = {
    templateId: templateIds.organizationInvitation,
    recipients: {
      to: [email],
    },
    subject: `${inviterName} invited you to join ${organizationName}`,
    data: {
      inviterName,
      organizationName,
      organizationDescription: organization.description,
      teamNumber: organization.teamNumber,
      role,
      invitationUrl,
      invitationLink: invitationUrl,
    },
  };

  await sendSteamifyEmail(payload);
}

/**
 * Send team member added email via Steamify template
 */
export async function sendTeamMemberAddedEmailViaSteamify({
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
}): Promise<void> {
  const { templateIds } = getEmailConfig();
  const payload: IEmailPayload = {
    templateId: templateIds.teamMemberAdded,
    recipients: {
      to: [email],
    },
    subject: `You've been added to ${teamName}`,
    data: {
      userName,
      teamName,
      inviterName,
      loginUrl,
      loginLink: loginUrl,
    },
  };

  await sendSteamifyEmail(payload);
}

/**
 * Send team member welcome email via Steamify template
 */
export async function sendTeamMemberWelcomeEmailViaSteamify({
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
}): Promise<void> {
  const { templateIds } = getEmailConfig();
  const payload: IEmailPayload = {
    templateId: templateIds.teamMemberWelcome,
    recipients: {
      to: [email],
    },
    subject: `Welcome! You've been invited to ${teamName}`,
    data: {
      userName,
      teamName,
      inviterName,
      email,
      temporaryPassword,
      loginUrl,
      loginLink: loginUrl,
    },
  };

  await sendSteamifyEmail(payload);
}

/**
 * Send account created email via Steamify template
 */
export async function sendAccountCreatedEmailViaSteamify({
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
}): Promise<void> {
  const { templateIds } = getEmailConfig();
  const firstName = name?.split(" ")[0] || "there";

  const payload: IEmailPayload = {
    templateId: templateIds.accountCreated,
    recipients: {
      to: [email],
    },
    subject: "Welcome to RMS!",
    data: {
      firstName,
      email,
      username,
      temporaryPassword: password,
      loginUrl,
      loginLink: loginUrl,
    },
  };

  await sendSteamifyEmail(payload);
}
