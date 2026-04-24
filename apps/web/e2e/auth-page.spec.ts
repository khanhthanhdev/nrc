import { setTimeout as delay } from "node:timers/promises";
import type { APIRequestContext, APIResponse, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000";
const WEB_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
const AUTH_HELPER_BASE_URL = `${API_BASE_URL}/api/test/auth`;
const POST_VERIFY_CALLBACK_URL = `${WEB_BASE_URL}/auth/post-verify`;

interface CapturedEmailPayload {
  createdAt: string;
  token: string | null;
  url: string;
}

interface CapturedEmailResponse {
  email: string;
  reset: CapturedEmailPayload | null;
  verification: CapturedEmailPayload | null;
}

interface TestUserResponse {
  email: string;
  emailVerified: boolean;
  id: string;
  onboardingCompleted: boolean;
  providers: string[];
}

interface SignUpSuccessResponse {
  token: string | null;
  user: {
    email: string;
    id: string;
  };
}

interface AuthErrorResponse {
  code?: string;
  message?: string;
}

const sleep = (milliseconds: number): Promise<void> => delay(milliseconds);

const createTestEmail = (label: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `pw-auth-${label}-${timestamp}-${randomSuffix}@example.com`;
};

const readJson = async <T>(response: APIResponse): Promise<T> => {
  const payload = (await response.json()) as T;
  return payload;
};

const ensureOk = async (response: APIResponse, context: string): Promise<void> => {
  if (response.ok()) {
    return;
  }

  const errorBody = await response.text();
  throw new Error(`${context} failed with ${response.status()}: ${errorBody}`);
};

const clearCapturedEmails = async (request: APIRequestContext, email: string): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/clear-captured-email`, {
    data: { email },
  });

  await ensureOk(response, "clear-captured-email");
};

const waitForCapturedEmail = async (
  request: APIRequestContext,
  email: string,
  type: "reset" | "verification",
): Promise<CapturedEmailPayload> => {
  for (const _attempt of Array.from({ length: 40 })) {
    const response = await request.get(`${AUTH_HELPER_BASE_URL}/captured-email`, {
      params: { email },
    });

    await ensureOk(response, "captured-email");

    const payload = await readJson<CapturedEmailResponse>(response);
    const emailPayload = payload[type];

    if (emailPayload) {
      return emailPayload;
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for ${type} email capture for ${email}`);
};

const signUpWithCredentials = async (
  request: APIRequestContext,
  input: { email: string; name: string; password: string },
): Promise<APIResponse> => {
  const response = await request.post(`${API_BASE_URL}/api/auth/sign-up/email`, {
    data: {
      ...input,
      callbackURL: POST_VERIFY_CALLBACK_URL,
    },
  });

  return response;
};

const completeOnboardingForm = async (page: Page): Promise<void> => {
  await expect(page.getByRole("heading", { level: 1, name: "Complete onboarding" })).toBeVisible();

  await page.getByLabel("Phone number").fill("0911222333");
  await page.getByLabel("Address").fill("225 Le Loi, District 1");
  await page.getByLabel("Organization / School").fill("NRC Academy");
  await page.getByLabel("Date of birth").fill("2000-10-10");
  await page.getByRole("button", { name: "Save and continue" }).click();
};

const expectHomePageLoaded = async (page: Page): Promise<void> => {
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Competition operations built with a public-facing calm.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open public event" })).toBeVisible();
};

const expectOnboardingPageLoaded = async (page: Page): Promise<void> => {
  await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);
  await expect(page.getByRole("heading", { level: 1, name: "Complete onboarding" })).toBeVisible();
};

const getTestUser = async (
  request: APIRequestContext,
  email: string,
): Promise<TestUserResponse> => {
  const response = await request.get(`${AUTH_HELPER_BASE_URL}/user`, {
    params: { email },
  });
  await ensureOk(response, "user");
  return readJson<TestUserResponse>(response);
};

const seedGoogleOnlyUser = async (
  request: APIRequestContext,
  input: { email: string; onboardingCompleted?: boolean },
): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/seed-google-user`, {
    data: {
      email: input.email,
      onboardingCompleted: input.onboardingCompleted ?? false,
    },
  });
  await ensureOk(response, "seed-google-user");
};

const createSessionForUser = async (request: APIRequestContext, email: string): Promise<void> => {
  const response = await request.post(`${AUTH_HELPER_BASE_URL}/create-session`, {
    data: { email },
  });
  await ensureOk(response, "create-session");
};

test.describe("Authentication Production Flows", () => {
  test("credential sign-up requires email verification before app access", async ({ page }) => {
    const email = createTestEmail("credential-sign-up");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Credential Signup",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");
    const signUpPayload = await readJson<SignUpSuccessResponse>(signUpResponse);
    expect(signUpPayload.token).toBeNull();

    await page.goto("/auth");
    await expect(page.getByRole("heading", { level: 1, name: "Authentication" })).toBeVisible();

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    expect(verificationEmail.url).toContain("/api/auth/verify-email");

    await page.goto("/");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  });

  test("verification link signs in and routes to onboarding", async ({ page }) => {
    const email = createTestEmail("verification-routing");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Verification Routing",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);

    await expectOnboardingPageLoaded(page);
  });

  test("google-authenticated users are routed through onboarding gate", async ({ page }) => {
    const email = createTestEmail("google-gated-user");

    await seedGoogleOnlyUser(page.request, {
      email,
      onboardingCompleted: false,
    });
    await createSessionForUser(page.request, email);

    await page.goto("/");
    await expectOnboardingPageLoaded(page);

    const user = await getTestUser(page.request, email);
    expect(user.providers).toContain("google");
    expect(user.onboardingCompleted).toBe(false);
  });

  test("google-first account blocks credential sign-up with clear message", async ({ page }) => {
    const email = createTestEmail("google-duplicate");

    await seedGoogleOnlyUser(page.request, {
      email,
      onboardingCompleted: false,
    });

    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Duplicate Policy",
      password: "Password123!",
    });
    expect(signUpResponse.status()).toBe(422);
    const errorPayload = await readJson<AuthErrorResponse>(signUpResponse);
    expect(errorPayload.code).toBe("GOOGLE_ACCOUNT_EXISTS");
    expect(errorPayload.message).toBe(
      "This email is already registered with Google. Please continue with Google.",
    );

    const user = await getTestUser(page.request, email);
    expect(user.providers).toContain("google");
    expect(user.providers).not.toContain("credential");
  });

  test("password reset request and completion works end-to-end", async ({ page }) => {
    const email = createTestEmail("password-reset");
    const initialPassword = "Password123!";
    const nextPassword = "Password456!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Password Reset User",
      password: initialPassword,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expectOnboardingPageLoaded(page);

    await page.context().clearCookies();

    const forgotPasswordResponse = await page.request.post(
      `${API_BASE_URL}/api/auth/request-password-reset`,
      {
        data: {
          email,
          redirectTo: `${WEB_BASE_URL}/auth/reset-password`,
        },
      },
    );
    await ensureOk(forgotPasswordResponse, "request-password-reset");

    const resetEmail = await waitForCapturedEmail(page.request, email, "reset");
    const resetToken =
      resetEmail.token ??
      (() => {
        const parsedResetUrl = new URL(resetEmail.url);
        const token = parsedResetUrl.searchParams.get("token");
        return token;
      })();

    expect(typeof resetToken).toBe("string");
    expect(resetToken?.length).toBeGreaterThan(0);

    const resetPasswordResponse = await page.request.post(
      `${API_BASE_URL}/api/auth/reset-password`,
      {
        data: {
          newPassword: nextPassword,
          token: resetToken,
        },
      },
    );
    await ensureOk(resetPasswordResponse, "reset-password");

    const oldPasswordSignInResponse = await page.request.post(
      `${API_BASE_URL}/api/auth/sign-in/email`,
      {
        data: {
          email,
          password: initialPassword,
          rememberMe: true,
        },
      },
    );
    expect(oldPasswordSignInResponse.status()).not.toBe(200);

    const nextPasswordSignInResponse = await page.request.post(
      `${API_BASE_URL}/api/auth/sign-in/email`,
      {
        data: {
          email,
          password: nextPassword,
          rememberMe: true,
        },
      },
    );
    await ensureOk(nextPasswordSignInResponse, "sign-in-email-after-reset");
  });

  test("onboarding completion persists state and allows root access", async ({ page }) => {
    const email = createTestEmail("onboarding-completion");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Onboarding Completion",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expectOnboardingPageLoaded(page);

    await completeOnboardingForm(page);
    await expectHomePageLoaded(page);

    const user = await getTestUser(page.request, email);
    expect(user.onboardingCompleted).toBe(true);

    await page.goto("/");
    await expectHomePageLoaded(page);
  });

  test("unverified credential user cannot sign in via API", async ({ page }) => {
    const email = createTestEmail("unverified-signin");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Unverified Signin",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const signInResponse = await page.request.post(`${API_BASE_URL}/api/auth/sign-in/email`, {
      data: { email, password, rememberMe: true },
    });
    expect(signInResponse.ok()).toBe(false);
  });

  test("verified credential user can sign in and is routed to onboarding", async ({ page }) => {
    const email = createTestEmail("signin-routing");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Signin Routing",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);

    await page.context().clearCookies();

    const signInResponse = await page.request.post(`${API_BASE_URL}/api/auth/sign-in/email`, {
      data: { email, password, rememberMe: true },
    });
    await ensureOk(signInResponse, "sign-in-email");

    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);
  });

  test("post-sign-in routes to root when onboarding is already complete", async ({ page }) => {
    const email = createTestEmail("signin-onboarded");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Signin Onboarded",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);

    await completeOnboardingForm(page);
    await expect(page).toHaveURL(/\/$/);

    const user = await getTestUser(page.request, email);
    expect(user.onboardingCompleted).toBe(true);

    await page.context().clearCookies();

    const signInResponse = await page.request.post(`${API_BASE_URL}/api/auth/sign-in/email`, {
      data: { email, password, rememberMe: true },
    });
    await ensureOk(signInResponse, "sign-in-email");

    await page.goto("/");
    await expectHomePageLoaded(page);
  });

  test("credential-first account retains credential provider after verification", async ({
    page,
  }) => {
    const email = createTestEmail("cred-provider");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Credential Provider",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);

    const user = await getTestUser(page.request, email);
    expect(user.emailVerified).toBe(true);
    expect(user.providers).toContain("credential");
    expect(user.providers).not.toContain("google");
  });

  test("unauthenticated user accessing protected route is redirected to /auth", async ({
    page,
  }) => {
    await page.context().clearCookies();

    await page.goto("/");
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  });

  test("authenticated user visiting /auth is redirected away", async ({ page }) => {
    const email = createTestEmail("already-authed");

    await seedGoogleOnlyUser(page.request, {
      email,
      onboardingCompleted: false,
    });
    await createSessionForUser(page.request, email);

    await page.goto("/auth");

    await expect(page).not.toHaveURL(/\/auth(?:\?|$)/);
  });

  test("onboarded google user accesses root directly without onboarding redirect", async ({
    page,
  }) => {
    const email = createTestEmail("google-onboarded");

    await seedGoogleOnlyUser(page.request, {
      email,
      onboardingCompleted: true,
    });
    await createSessionForUser(page.request, email);

    await page.goto("/");
    await expectHomePageLoaded(page);
  });

  test("forgot password UI page renders and submits", async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { level: 1, name: "Forgot password" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset email" })).toBeVisible();

    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByRole("button", { name: "Send reset email" }).click();
    await expect(
      page.getByRole("status").filter({
        hasText: "If the email exists, a reset link has been sent.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset email" })).toBeEnabled();
  });

  test("reset password page renders form with token", async ({ page }) => {
    await page.goto("/auth/reset-password?token=test-token");
    await expect(page.getByRole("heading", { level: 1, name: "Reset password" })).toBeVisible();
    await expect(page.getByLabel("New password")).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset password" })).toBeVisible();
  });

  test("sign-in with wrong password is rejected", async ({ page }) => {
    const email = createTestEmail("wrong-pw");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Wrong PW User",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);

    await page.context().clearCookies();

    const signInResponse = await page.request.post(`${API_BASE_URL}/api/auth/sign-in/email`, {
      data: { email, password: "WrongPassword999!", rememberMe: true },
    });
    expect(signInResponse.ok()).toBe(false);
  });

  test("sign-in with non-existent email is rejected", async ({ page }) => {
    const email = createTestEmail("nonexistent");

    const signInResponse = await page.request.post(`${API_BASE_URL}/api/auth/sign-in/email`, {
      data: { email, password: "Password123!", rememberMe: true },
    });
    expect(signInResponse.ok()).toBe(false);
  });

  test("session persists across page reloads for authenticated user", async ({ page }) => {
    const email = createTestEmail("session-persist");
    const password = "Password123!";

    await clearCapturedEmails(page.request, email);
    const signUpResponse = await signUpWithCredentials(page.request, {
      email,
      name: "Session Persist",
      password,
    });
    await ensureOk(signUpResponse, "sign-up-email");

    const verificationEmail = await waitForCapturedEmail(page.request, email, "verification");
    await page.goto(verificationEmail.url);
    await expectOnboardingPageLoaded(page);
    await page.reload();
    await expectOnboardingPageLoaded(page);
  });
});
