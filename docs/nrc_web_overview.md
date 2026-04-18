# NRC Web Product Requirements Document

## 1. Document Purpose

This document defines the product requirements for the National Robotics Competition website (`NRC Web`).
Core feature:

- Landing Page
- Event Management
- User create, manage team
- Team register to event
- Live scoring, match results, ranking page for each event
- Sync (pull, put feature) --> The web just manage team -> the local app will process others then sync results, ranking to web

This PRD focuses on:

- product scope
- user roles
- feature requirements
- major workflows
- sync requirements with the offline event-control application

This document does not define the final database schema in detail. Database design should be produced as a separate follow-up document after this PRD is approved.

## 2. Product Summary

`NRC Web` is the public and administrative web platform for the National Robotics Competition.

The system must support:

- a public landing page
- public event pages
- public results and rankings pages
- user authentication with Better Auth
- team creation and team profile management
- event registration and review workflows
- an admin dashboard
- synchronization with an offline application that controls live event operations such as inspection, matches, rankings, and awards

Current implementation baseline in this repository:

- API framework: `Hono` with `oRPC` for type-safe RPC
- ORM: `Drizzle`
- database: `PostgreSQL`
- frontend app: `Vite` + `React` + `TanStack Router`
- frontend data layer: `@orpc/tanstack-query` + TanStack React Query
- frontend i18n: `i18next` with locale JSON files under `apps/web/public/locales`
- authentication target: `Better Auth` integration to be added on top of the current app structure

### Architecture Overview

The system follows a contract-first architecture aligned with the current monorepo:

- `packages/api` owns shared API contracts, context helpers, and routers using Valibot + oRPC
- `packages/db` owns Drizzle schema and database access concerns
- `apps/server` exposes `/rpc` and `/api-reference`
- `apps/web` is the frontend application built with React, Vite, and TanStack Router
- `apps/web/src/utils/orpc.ts` is the single frontend oRPC client entry point
- Frontend data fetching uses TanStack React Query via `@orpc/tanstack-query`
- Web features should be implemented within the existing route/component structure, not a separate service package

### Frontend Folder Structure

```
apps/web/src/
├── routes/              # TanStack Router route files
├── components/          # Shared UI components and layout pieces
├── lib/                 # Shared utilities/helpers
├── utils/orpc.ts        # Single oRPC client entry point
├── i18n/                # i18next configuration and provider
├── routeTree.gen.ts     # Generated TanStack Router tree
└── index.css            # Global styles
```

```
apps/web/public/locales/
├── en/                  # English translation namespaces
└── vi/                  # Vietnamese translation namespaces
```

## 3. Product Goals

### 3.1. Primary Goals

- Provide a credible public-facing website for the competition.
- Allow users to sign up, create teams, and register for events without organizer intervention for normal flows.
- Give organizers a single admin dashboard for event setup, registration review, and user management.
- Publish event schedules, results, rankings, and awards in a clear public format.
- Support both Vietnamese and English across the public site and authenticated user flows.
- Integrate with the offline event-control application through controlled pull and push synchronization.

### 3.2. Success Criteria

- Users can complete sign-up and team creation without manual admin support.
- Teams can register for events and track organizer feedback from the website.
- Admins can manage event lifecycle and review registrations from one dashboard.
- Offline event data can be synced reliably with audit logs and optional review gates.
- Public event pages become the canonical place to view event information, schedule, results, rankings, and awards.
- Users can switch between Vietnamese and English without losing key flow context such as auth redirects or event registration progress.

## 4. Non-Goals

The first version does not need to include:

- direct bracket editing by public users
- payment processing
- live scoring control from the website
- advanced CMS workflows for marketing content
- a mobile app

## 5. Users and Roles

### 5.1. Anonymous Visitor

- Can access public pages.
- Can view landing page, events, teams, results, rankings, awards, and public documents.
- Cannot create teams or register for events.

### 5.2. Regular User

Base user role after registration.

- Can sign in and maintain a personal account.
- Can become a team mentor if eligible.
- Can accept a team invitation.

### 5.3. Team Mentor

Team owner or team manager.

- Must be at least 18 years old to create a team.
- Can manage team profile.
- Can invite team members.
- Can register the team to events.
- Can receive organizer comments and notifications about registration and matches.

### 5.4. Team Leader

Team captain within a team.

- Can view team information and event participation.
- May have read-only or limited operational permissions depending on the final permission matrix.

### 5.5. Team Member

- Can join a team by invitation.
- Can view team information, event participation, and team-related notifications.

### 5.6. Admin

- Can manage users.
- Can create and manage events.
- Can review event registrations.
- Can manage API keys and sync rules for the offline service.
- Can review pushed sync changes when manual review is enabled.

### 5.7. Manager

Optional staff role below `ADMIN`.

- Can be granted subsets of event operations and registration review permissions.

## 6. Identity and Team Model

The website should align with the Better Auth organization plugin:

- a user account maps to a Better Auth user
- a team maps to a Better Auth organization
- a team invitation maps to a Better Auth organization invitation

Application roles such as `ADMIN` and `MANAGER` stay outside the organization membership model.

Team-specific roles such as `TEAM_MENTOR`, `TEAM_LEADER`, and `TEAM_MEMBER` are resolved from team membership.

### 6.1. `userType`

`userType` is the primary account classification used for onboarding, default navigation, and dashboard experience.

It is not the only source of authorization.

Recommended initial values:

- `PARTICIPANT` for normal self-registered users
- `MENTOR` for users who create or manage a team
- `STAFF` for organizer-side accounts

Default behavior:

- self-sign-up creates the user as `PARTICIPANT`
- team creation or mentor invitation can promote the user to `MENTOR`
- admin assignment can promote the user to `STAFF`

### 6.2. `userRole`

`userRole` should be resolved in two layers instead of one overloaded field.

- system roles: `USER`, `MANAGER`, `ADMIN`
- organization-scoped roles: `TEAM_MENTOR`, `TEAM_LEADER`, `TEAM_MEMBER`

System roles control access to the admin dashboard and cross-team operations.

Organization-scoped roles control permissions inside a specific team.

The authorization layer should calculate effective access from:

- authenticated session
- system role
- active team membership and membership role

Team roles should not be duplicated as global user roles.

## 7. Product Scope

### 7.1. Public Website

The public website includes:

- landing page
- event listing page
- event detail page
- team listing page
- team profile page
- results page
- rankings page
- awards and recognition display

### 7.2. Auth and Identity

The auth system includes:

- email and password sign-up
- email and password sign-in
- Google OAuth
- email verification
- password reset
- invite-aware sign-up and sign-in flows

### 7.3. Team Management

Team management includes:

- create team
- update team profile
- upload avatar and cover image
- invite members
- view team history
- view team event participation
- view team results and awards

### 7.4. Event Registration

Event registration includes:

- browse open events
- dynamic registration forms per event
- submit registration
- receive review comments
- update and resubmit when required
- track registration status

### 7.5. Admin Dashboard

Admin dashboard includes:

- event CRUD
- event registration review
- user management
- sync API key management
- sync logs and review queue

### 7.6. Offline Sync Integration

The system must integrate with the offline event-control application for event operations data.

## 8. Core User Experience Requirements

### 8.1. Landing Page

The landing page must:

- explain the competition clearly
- show featured or current events
- show important announcements
- link to registration and public event pages
- work well on desktop and mobile
- support both Vietnamese and English

Recommended sections:

- hero section
- event highlights
- about the competition
- call to action for teams
- latest results or featured achievements
- sponsor or partner area if needed

### 8.2. Authentication

### Requirements

- Users can sign up with email/password.
- Users can sign in with email/password.
- Users can sign in with Google OAuth.
- The system must verify email addresses for email/password accounts.
- The system must support password reset.
- The system must preserve invite context across sign-up, email verification, and sign-in redirects.
- The system must store a `userType` for onboarding and UX routing.
- The system must store system-level staff `userRole` values outside Better Auth organization membership.
- Team authorization must come from Better Auth organization membership roles instead of duplicated global team roles.
- The system should support verified-email account linking between Google OAuth and email/password where policy allows.
- Auth pages and messages must be available in both Vietnamese and English.
- Invite and redirect context must survive language switching.

### Invite-Aware Flow

When a user receives an invitation before registering:

1. The invitation link opens an invitation landing page.
2. The page shows team name, invited role, email, and expiration.
3. If the user does not have an account, the system redirects to sign-up and preserves the invitation context.
4. After sign-up and verification, the system resumes invitation acceptance automatically.
5. The user is added to the team without needing to re-open the email.

If the user is signed in with a different email:

- the system must block acceptance
- the system must ask the user to switch accounts or request a new invite

### 8.3. Team Creation

### Requirements

- Only authenticated users can create a team.
- Only users older than 18 can create a team.
- Creating a team makes the creator a `TEAM_MENTOR`.
- Team creation also creates the linked Better Auth organization.
- The team must have a stable route at `/teams/[teamNumber]`.

### Team Creation Inputs

- team name
- school or organization
- city or province
- optional short description
- terms acceptance

### 8.4. Team Profile

The team page at `/teams/[teamNumber]` acts like the team home page.

It must support:

- team avatar
- team cover image
- team description
- school or organization information
- member list
- team history across events
- match results
- awards won by the team

The page should have both:

- a public view
- a management view for permitted team members

### 8.5. Team Invitations

### Requirements

- A team mentor can invite other people by email.
- Invitees can be assigned team roles such as `TEAM_LEADER` or `TEAM_MEMBER`.
- Invitations must expire after a configurable period.
- Invitations must have clear status values such as pending, accepted, expired, and revoked.
- The system should prevent conflicting active team membership unless an admin overrides the rule.

### 8.6. Event Listing and Event Detail

Public event routes must use `/events`.

The event detail page should be the main public event entry point and should support:

- overview
- rules or documents
- registration information
- schedule
- results
- rankings
- awards
- participants or teams
- live links if enabled

### 8.7. Event Registration

### Requirements

- A team mentor can register a team for an event.
- Each event can define its own registration steps and required fields.
- The event registration form must support organizer-defined fields.
- Team data should prefill wherever possible.
- Registration status must be visible to the team.

### Registration Statuses

At minimum:

- draft
- submitted
- under_review
- needs_revision
- approved
- denied
- withdrawn

### Team Experience

The team must be able to:

- open the registration record
- view organizer comments
- upload or update required information
- resubmit when revision is requested
- receive notifications about status changes

### 8.8. Notifications and Subscriptions

Users should be able to subscribe to receive notifications related to:

- team activity
- registration status changes
- organizer comments
- upcoming matches
- event announcements

Notification delivery may include:

- in-app notifications
- email notifications

User-facing notification content should support both Vietnamese and English. Initial delivery may use a single stored locale preference per user.

### 8.9. Results, Rankings, and Awards

The public site must publish:

- match results
- event rankings
- team awards

The team page at `/teams/[teamNumber]` must also display:

- event participation history
- match history
- awards history

### 8.10. Frontend Localization

The frontend must support two languages in v1:

- English (`en`)
- Vietnamese (`vi`)

Requirements:

- All public pages, auth flows, team management pages, registration flows, admin pages, and notification UI must use translatable copy.
- Translation files should be organized under `apps/web/public/locales/en` and `apps/web/public/locales/vi`.
- The frontend should use the existing `apps/web/src/i18n` setup for detection, provider wiring, and message loading.
- The application should detect a preferred language from browser settings on first visit and persist the user choice for later sessions.
- Users must be able to switch languages manually from the UI.
- The active language must update document-level metadata such as the `<html lang>` attribute.
- Route structure can remain locale-neutral in v1; localized path segments are not required for the first release.
- Validation messages, empty states, loading states, and auth errors must be translated, not just page headings.

## 9. Admin Requirements

### 9.1. Admin Dashboard

The admin dashboard is the main operational UI for organizers.

It must allow admins to:

- manage users
- manage events
- review registrations
- manage offline sync settings
- monitor sync logs

### 9.2. User Management

Admins must be able to:

- view all users
- search and filter users
- update user profile metadata
- change staff permissions
- lock or unlock accounts if needed
- inspect team membership and registration activity

### 9.3. Event Management

Admins must be able to create and update events, including:

- event name
- slug
- summary and description
- registration start and end dates
- event start and end dates
- location
- event status
- public documents
- event-specific registration steps

Event statuses should support:

- draft
- published
- registration_open
- registration_closed
- active
- completed
- archived

### 9.4. Registration Review

Admins must be able to:

- view registrations by event
- review submitted data
- approve registration
- deny registration
- request changes
- leave comments
- track review history

Comments should be visible to the team in the registration record.

### 9.5. Sync Management

Admins must be able to:

- generate and revoke API keys per event
- configure whether pushed data is auto-accepted or requires manual review
- inspect all pull and push logs
- review pending pushed changes before acceptance when manual review is enabled

## 10. Offline Sync Requirements

### 10.1. Overview

The competition currently has an offline application that controls event operations such as matches and inspections.

That application must sync with NRC Web.

The website is responsible for:

- public event data publishing
- teams and registrations
- auditability of sync actions

The offline application is responsible for:

- operational event control during live competition
- producing official inspection and match operation data

### 10.2. Event API Keys

Each event must have its own API key or equivalent machine credential.

Requirements:

- API keys are created by admins
- API keys are scoped to a specific event
- API keys can be revoked or rotated
- API key usage is logged

### 10.3. Pull Data from NRC Web to Offline Service

The offline service must be able to pull:

- event info
- approved team registrations for that event
- relevant team profile data required for event operations

### 10.4. Push Data from Offline Service to NRC Web

The offline service must be able to push:

- inspection schedule
- inspection results
- match schedule updates if owned by the offline service
- match results
- event rankings
- team awards

### 10.5. Push Review Modes

The system must support two modes per event:

- auto accept
- manual review

### Auto Accept

- pushed changes are applied immediately
- the action is logged

### Manual Review

- pushed data creates a reviewable change set
- admins can inspect what changed
- admins can accept or reject the change set
- no public data is updated until acceptance

### 10.6. Sync Audit Logs

The system must store:

- request time
- source identity
- event scope
- action type
- payload summary
- result status
- error details if failed
- reviewer and review result for manual reviews

## 11. Functional Requirements Summary

### 11.1. Public Features

- public landing page
- public event list
- public event detail page
- public results and rankings pages
- public team pages

### 11.2. Auth Features

- Better Auth email/password
- Better Auth Google OAuth
- Better Auth organization feature for teams
- invite-aware sign-up flow
- `userType` for onboarding and dashboard routing
- system `userRole` plus organization membership roles for authorization

### 11.3. Team Features

- age-gated team creation
- team profile management
- team invitations
- team event history
- team results and awards history

### 11.4. Registration Features

- dynamic event registration
- status tracking
- comments and revisions
- user notifications

### 11.5. Admin Features

- event CRUD
- registration review
- user management
- sync configuration
- sync logs

### 11.6. Sync Features

- event-scoped API keys
- pull event and team data
- push inspection, results, rankings, and awards
- auto-accept or manual-review workflow

## 12. Non-Functional Requirements

### 12.1. Security

- All auth flows must follow Better Auth security patterns.
- OAuth credentials and API keys must be stored securely.
- Sync endpoints must require event-scoped credentials.
- Admin operations must be audited.

### 12.2. Reliability

- Sync operations must be logged and traceable.
- Failed sync pushes must not silently overwrite public data.
- Manual review mode must allow safe acceptance or rejection.

### 12.3. Performance

- Public event pages should load quickly even during active events.
- Results and rankings pages must support high read traffic during competitions.

### 12.4. Usability

- The product must work on desktop and mobile.
- Team management and event registration flows must be clear for non-technical users.

## 13. High-Level Domain Model

This PRD does not define the final schema, but the core business domains are:

- users
- user profiles and `userType`
- system roles and role assignment logs
- staff roles
- teams
- team memberships
- team invitations
- team profiles and media
- events
- event registration forms and steps
- event registrations
- registration comments and review actions
- notifications and subscriptions
- inspections
- matches
- results
- rankings
- awards
- sync API keys
- sync change sets
- sync logs

## 14. Assumptions

- The website is the source of truth for users, teams, event setup, registrations, and public publishing.
- The offline application is the source of truth for live event operational data once synchronization is enabled for an event.
- Better Auth organization plugin will be used for team membership and invitations.
- Google OAuth is required for sign-in convenience but email/password remains supported.

## 15. Authentication and Frontend Delivery Plan

### 15.1. Goal

Build a multi-provider authentication system that supports public users, team users, and staff users while keeping team membership aligned with the Better Auth organization feature and the frontend aligned with the current Vite + React + TanStack Router structure.

### 15.2. Target Identity Model

Better Auth remains the source of truth for:

- user
- account
- session
- verification
- organization
- organization membership
- organization invitation

The application owns:

- `userType`
- system `userRole`
- authorization helpers and permission policies
- audit logs for sensitive auth and role actions

### 15.3. Authentication Methods

The authentication feature should support:

- Better Auth email and password sign-up and sign-in
- Google OAuth sign-in and sign-up
- email verification for password accounts
- password reset and resend verification actions
- verified-email account linking when a Google account matches an existing password account and policy allows linking
- invite-aware redirects across sign-up, sign-in, verification, and organization acceptance

### 15.4. Frontend Implementation Baseline

Auth, public pages, and dashboard work should fit the current frontend structure:

- route files live in `apps/web/src/routes`
- shared UI lives in `apps/web/src/components`
- shared helpers live in `apps/web/src/lib`
- API access goes through `apps/web/src/utils/orpc.ts`
- i18n configuration lives in `apps/web/src/i18n`
- translation resources live in `apps/web/public/locales/en` and `apps/web/public/locales/vi`

The frontend should not assume a Next.js `app/[locale]` structure. New work should extend the existing TanStack Router application.

### 15.5. Authorization Model

Recommended model:

- `userType` decides onboarding and default dashboard experience
- system `userRole` decides staff authorization
- Better Auth organization membership decides team-scoped authorization

Recommended initial values:

- `userType`: `PARTICIPANT`, `MENTOR`, `STAFF`
- system `userRole`: `USER`, `MANAGER`, `ADMIN`
- organization membership role: `TEAM_MENTOR`, `TEAM_LEADER`, `TEAM_MEMBER`

Authorization should be resolved from the combination of:

- authenticated session
- system `userRole`
- current organization membership role

### 15.6. Delivery Phases

#### Phase 1: Repository Alignment and i18n Baseline

- update `apps/web/src/i18n/config.ts` to support `en` and `vi`
- add Vietnamese locale resources under `apps/web/public/locales/vi`
- replace placeholder or incorrect locale configuration so browser detection and persisted language selection work correctly
- ensure the root document can reflect the active language in `<html lang>`
- define translation namespaces needed for auth, public pages, teams, registration, and admin

#### Phase 2: Schema and Better Auth Configuration

- add Better Auth integration within the current server and API structure
- enable Google OAuth
- enable the Better Auth organization feature for teams and invitations
- add application-owned data for `userType` and system `userRole`
- add audit-friendly timestamps and change tracking for role updates
- create migrations and backfill defaults for existing users

#### Phase 3: Core Auth Flows in `apps/web/src/routes`

- build auth route files inside `apps/web/src/routes`
- build a unified auth entry page for email/password and Google OAuth
- require email verification before protected password-account actions
- implement forgot-password, reset-password, and resend-verification flows
- preserve invitation and redirect context across all auth steps
- translate all auth UI and validation states in both English and Vietnamese

#### Phase 4: Organization and Team Flows

- create team -> create Better Auth organization
- invite member -> create organization invitation
- accept invite -> create organization membership with team role
- promote mentor or leader flows through organization membership updates
- expose current organization context to both web and API layers
- localize team creation, invitation, and membership management UI for `en` and `vi`

#### Phase 5: Authorization and Admin Controls

- add server-side guards for authenticated, staff-only, and team-scoped routes
- add a clear permission matrix for `USER`, `MANAGER`, `ADMIN`, `TEAM_MENTOR`, `TEAM_LEADER`, and `TEAM_MEMBER`
- add admin tools to update `userType`, grant staff roles, and inspect team memberships
- log staff role changes and sensitive authentication actions
- provide bilingual admin UI labels, status names, and review actions

#### Phase 6: Public Pages, Registration UX, QA, and Rollout

- backfill existing users with `userType = PARTICIPANT` and system `userRole = USER`
- verify Google OAuth and email/password account linking rules
- test blocked cases such as unverified email, expired invitation, wrong-email acceptance, and revoked role
- test language switching during auth, registration, and invite acceptance flows
- verify that public event pages, team pages, and registration statuses render correctly in both Vietnamese and English
- release behind a staged rollout if existing active users must be protected from flow changes

### 15.7. Acceptance Criteria

- a user can sign up with email/password and complete email verification
- a user can sign in with Google OAuth
- a user can access the same account through Google OAuth and email/password when verified-email linking is allowed
- team creation creates the linked Better Auth organization and mentor membership
- invitations create `TEAM_LEADER` or `TEAM_MEMBER` memberships correctly
- staff routes enforce system `userRole` independently from team roles
- web and API authorization rules use the same effective permission logic
- the frontend serves both Vietnamese and English from the current `apps/web` application
- switching language does not break auth redirects, invitation acceptance, or event registration progress

### 15.8. Recommended Implementation Order

1. fix current i18n configuration and add `vi` locale resources
2. schema enums and migrations
3. Better Auth configuration updates
4. auth UI and redirect handling in `apps/web/src/routes`
5. organization and team membership flows
6. authorization guards and admin tooling
7. bilingual public/admin content verification and rollout

## 16. Open Questions

These items should be resolved before final database design:

- Can a user mentor more than one team?
- Can a team have more than one mentor?
- What permissions should `TEAM_LEADER` have beyond viewing team data?
- Which event schedule data is owned by the web app versus the offline app?
- Are rankings always computed offline, or can admins edit them manually in the web app?
- Should notifications support browser push in v1 or only email and in-app notifications?
- Should managers have event-limited access or global operational access?
- Should verified Google OAuth accounts always auto-link to an existing email/password account with the same email, or should admins control this behavior?

## 17. Next Document

After PRD approval, the next document should define:

- detailed sync architecture and best practices in `docs/nrc_data_sync_design.md`
- PostgreSQL domain model
- Drizzle schema modules
- table list and relationships
- enum strategy
- sync log and review data model
- indexing and query strategy
- migration sequence from the current auth-only schema
