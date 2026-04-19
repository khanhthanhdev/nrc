# Authentication Source of Truth

## 1. Status and Ownership

- Status: Active implementation specification.
- Last updated: 2026-04-19.
- Canonical auth runtime: Better Auth mounted at `/api/auth/*` on `apps/server`.
- Canonical onboarding API: oRPC endpoints under `auth.*` in `packages/api`.

This document is the canonical source for authentication behavior, onboarding gating, and duplicate-account conflict handling.

## 2. Supported Authentication Methods

The system supports:

- Email/password sign-up and sign-in.
- Google OAuth sign-in/sign-up.
- Email verification for credential accounts.
- Password reset.

### 2.1 Email Verification Behavior

- Credential sign-up requires email verification before credential sign-in.
- Verification email is sent via Steamify adapter.
- After successful verification, user is auto-signed-in.
- Post-verification routing:
  - if onboarding is incomplete -> `/onboarding`
  - if onboarding is complete -> `/`

### 2.2 Duplicate Email Conflict Policy

Policy is asymmetric and explicit:

1. Password-first account, then Google sign-in using same verified email:

- account linking is allowed (Better Auth account linking enabled).

2. Google-first account, then email/password sign-up with same email:

- credential sign-up is blocked.
- user must continue with Google.
- API error code: `GOOGLE_ACCOUNT_EXISTS`.

## 3. Onboarding Model and Gate

Onboarding is mandatory (hard gate) for authenticated users.

### 3.1 Required Fields

- Phone number
- Address
- City
- Organization/School
- Date of birth

### 3.2 Canonical City List

- Source file: `vn-city.md`
- Current canonical set in application code: first 34 entries from that list (`VIETNAM_34_CITIES`).

### 3.3 Persistence Fields (user table)

User onboarding fields:

- `phone` (`text`, default `""`, not null)
- `address` (`text`, default `""`, not null)
- `city` (`text`, default `""`, not null)
- `organization_or_school` (`text`, default `""`, not null)
- `date_of_birth` (`date`, default `1970-01-01`, not null)
- `onboarding_completed` (`boolean`, default `false`, not null)

### 3.4 Gate Rule

- If authenticated and `onboarding_completed=false`, user must complete `/onboarding` before entering protected app routes.

## 4. API and Routing Contract

### 4.1 Auth HTTP Surface

- Better Auth endpoints: `/api/auth/*`
- Google callback path (default Better Auth base path): `/api/auth/callback/google`

### 4.2 Onboarding RPC Surface

- `auth.getOnboardingProfile`
- `auth.completeOnboarding`

Both require authenticated session context.

### 4.3 Web Routes

- `/auth`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/post-verify`
- `/onboarding`

Post-auth and post-verification routing behavior uses onboarding completion state.

## 5. Environment Contract

Required server environment variables:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `ADMIN_EMAIL` as a comma-separated allowlist
- `MANAGER_EMAIL` as a comma-separated allowlist

Email delivery for verification/reset uses existing Steamify variables already defined in server env.

## 6. Verification Checklist

Minimum acceptance checks:

1. Credential sign-up sends verification email and does not auto-enter app before verification.
2. Verification link signs user in and routes to onboarding when incomplete.
3. Google sign-in creates/signs-in user and routes through onboarding gate.
4. Google-first + credential sign-up duplicate email is blocked with clear message.
5. Password reset request and reset completion flow works end-to-end.
6. Onboarding completion sets `onboarding_completed=true` and allows access to `/`.

## 7. Automated Test Coverage

- Unit tests:
  - `apps/server/src/auth/duplicate-email-policy.unit.test.ts`
  - `packages/api/src/features/auth/schemas/onboarding.unit.test.ts`
- E2E tests:
  - `packages/api/src/features/auth/presentation/auth-router.e2e.test.ts`

Run commands:

- `bun run test:unit`
- `bun run test:e2e`
- `bun run test:e2e:api`

## 8. Team Identity Source of Truth (Better Auth Organization)

Team identity and team membership use Better Auth organization tables as the canonical source:

- `organization` maps to NRC team identity.
- `member` maps to team membership.
- `invitation` maps to team invitation flow.
- `session.activeOrganizationId` tracks the active team context.

The app-owned `team` table remains the profile and routing anchor (`team_number`, media, and other team page fields) and keeps a 1:1 link with `organization.id`.

### 8.1 Role Model

- System roles remain outside organization membership: `USER`, `MANAGER`, `ADMIN`.
- Team roles are organization membership roles: `TEAM_MENTOR`, `TEAM_LEADER`, `TEAM_MEMBER`.
- Organization creator role is `TEAM_MENTOR`.

### 8.2 Invitation Flow and Policy

#### 8.2.1 Creation and Delivery

- Invitation creation uses Better Auth organization endpoint:
  - `POST /api/auth/organization/invite-member`
- Server-side policy in current auth config:
  - `requireEmailVerificationOnInvitation=true`
  - `invitationExpiresIn=172800` seconds (48 hours)
  - `cancelPendingInvitationsOnReInvite=true`
- Invitation email delivery is sent by `sendInvitationEmail` via Steamify.
- Email link format:
  - `/auth/accept-invitation?invitationId=<id>`

#### 8.2.2 New User Invitation Flow (email not registered yet)

1. Invitee clicks invitation link from email.
2. `/auth/accept-invitation` checks auth session. If no session, redirect to `/auth?invitationId=<id>`.
3. User signs up (`/auth`) with preserved `invitationId`.
4. If user signs up with email/password, account is created, verification is required, and callback uses `/auth/post-verify?invitationId=<id>`.
5. After verification, `/auth/post-verify` redirects to `/auth/accept-invitation?invitationId=<id>`.
6. Accept route calls `authClient.organization.acceptInvitation({ invitationId })`.
7. On success, Better Auth sets invitation status to accepted, creates organization membership (`member`) with invited role, sets `session.activeOrganizationId`, and web redirects using post-auth rule:

- onboarding incomplete -> `/onboarding`
- onboarding completed -> `/`

#### 8.2.3 Existing User Invitation Flow

- If signed in with matching email:
  - accept is processed immediately at `/auth/accept-invitation`.
- If signed in with a different email:
  - Better Auth rejects acceptance (recipient mismatch).
  - user must sign out and sign in with invited email.

#### 8.2.4 Failure and Rejection Paths

- Missing `invitationId` query:
  - UI shows error and redirects to `/auth`.
- Expired/canceled/invalid invitation:
  - accept call returns error from Better Auth.
- Unverified recipient when verification is required:
  - accept call is rejected until email is verified.
- Recipient email mismatch:
  - accept call is rejected (`YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION`).

#### 8.2.5 Current Surface and Gaps

- Acceptance UI is implemented:
  - `/auth/accept-invitation`
- Invite creation UI is not yet implemented in web routes.
  - Current invite creation is API-driven through Better Auth endpoint(s).
  - Team invite management screen is a follow-up deliverable.

### 8.3 Team Creation Guardrails

- Team creation requires authenticated user session.
- Team creation requires onboarding completion.
- Team creation requires user age >= 18.
- Team creation promotes `userType` from `PARTICIPANT` to `MENTOR` for eligible creators.
