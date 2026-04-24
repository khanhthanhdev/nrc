# NRC Web UI Features & Route Mapping

This document maps the features defined in the Product Requirements Document (PRD) to the actual URL routes implemented in the frontend architecture (`apps/web/src/routes`), outlining the expected UI scenes, components, and design requirements for each page.

## 1. Public Pages (Visitor & Participant Views)

These pages are accessible to anonymous visitors and logged-in users. The design should be modern, responsive, and clearly display competition information.

| Feature / Scene | URL Route | UI / Design Elements |
| :--- | :--- | :--- |
| **Landing Page** | `/` | **Hero Section:** Engaging visuals of the robotics competition, primary Call to Action (CTA) to "Register" or "View Events".<br>**Event Highlights:** Carousel or grid of featured/current events.<br>**About & Announcements:** Text sections with imagery.<br>**Latest Results:** Dynamic widgets showing recent match results or top teams. |
| **Season Listing** | `/$season` | **Grid/List View:** Searchable list of events within a specific season.<br>**Event Cards:** Status badges (e.g., "Registration Open", "Live"), dates, locations. |
| **Event Detail** | `/$season/$eventId` | **Header:** Event banner, dates, location, status, and main CTA (e.g., "Register Team").<br>**Tabbed Navigation:** Overview, Rules, Schedule, Participants.<br>This serves as the central hub for a specific event. |
| **Event Qualifications** | `/$season/$eventId/qualifications` | **Match List:** Table showing qualification match schedules, scores, alliances. |
| **Event Match Detail** | `/$season/$eventId/qualifications/$matchNumber` | **Detailed Score Breakdown:** specific match results, penalties, autonomous/teleop scores. |
| **Event Playoffs** | `/$season/$eventId/playoffs` | **Bracket View:** Visual tournament bracket showing progression to the finals. |
| **Event Rankings** | `/$season/$eventId/rankings` | **Leaderboard Table:** Sortable columns for ranking points, win/loss records, and tie-breakers. |
| **Event Awards** | `/$season/$eventId/awards` | **Showcase:** Winners of specific awards for the event (e.g. Inspire Award, Winning Alliance). |
| **Team Listing** | `/teams` | **Grid/List View:** Searchable directory of registered teams.<br>**Filters:** By organization, province/city. |
| **User Directory** | `/users` | **Directory:** View user profiles (if public) or list of participants based on privacy settings. |

## 2. Authentication & Identity

These flows handle user access. The UI must be clean, secure, and preserve context (like invite tokens) across screens. Support for i18n (Vietnamese/English) is crucial here.

| Feature / Scene | URL Route | UI / Design Elements |
| :--- | :--- | :--- |
| **Auth Base (Sign In/Up)** | `/auth` | **Forms:** Combined or toggleable views for Email/password inputs, "Sign in with Google" button. |
| **Forgot Password** | `/auth/forgot-password` | **Form:** Request reset link (email input). |
| **Password Reset** | `/auth/reset-password` | **Form:** Set a new password securely. |
| **Post Verification** | `/auth/post-verify` | **Status Screen:** Confirmation after clicking email verification link. |
| **Accept Invitation**| `/auth/accept-invitation` | **Context Card:** Shows team name, role invited for. Buttons to Accept or redirect to Sign Up. |
| **Onboarding** | `/onboarding` | **Setup Wizard:** Complete user profile, determine `userType` (Participant vs Mentor) upon first login. |

## 3. User & Team Dashboard (Authenticated)

These pages are for regular users, team members, and mentors to manage their profiles and teams.

| Feature / Scene | URL Route | UI / Design Elements |
| :--- | :--- | :--- |
| **User Account Dashboard** | `/account` | **Overview & Settings:** Summary of user's active teams, profile settings, upcoming registered events, and recent notifications. |
| **Create Team** | `/teams/new` | **Multi-step Form / Simple Form:** Inputs for team name, school/org, city/province, description. Promotes user to `TEAM_MENTOR` upon success. |

*(Note: Team management details like edit team, manage members might be handled inside `/account` or modals as per the current routing structure)*

## 4. Event Registration Flow

The registration flow happens from the context of a team registering for an event.

| Feature / Scene | URL Route | UI / Design Elements |
| :--- | :--- | :--- |
| **Registration Landing** | `/register` | **Event Selection:** Choose which open event to register for. |
| **Register for Event** | `/register/$eventId` | **Dynamic Form Wizard:** Event-specific required fields defined by organizers. Prefills team data. |
| **Registration Detail/Status**| `/register/$eventId/$registrationId` | **Status Tracker:** Visual pipeline (Draft &rarr; Submitted &rarr; Under Review &rarr; Approved).<br>**Communication Area:** Chat-like thread for organizer feedback. |

## 5. Admin Dashboard (Staff/Admin)

The administrative backend for managing the platform, reviewing registrations, and monitoring the offline sync.

| Feature / Scene | URL Route | UI / Design Elements |
| :--- | :--- | :--- |
| **Staff Overview** | `/staff` | **Metrics Dashboard:** Total users, active events, pending registrations, recent sync errors. |
| **Season Management** | `/staff/seasons` | **Data Table:** List of seasons. |
| **New Season** | `/staff/seasons/new` | **Form:** Create a new season. |
| **Edit Season** | `/staff/seasons/$seasonId/edit`| **Form:** Update season details. |
| **Event Management** | `/staff/events` | **Data Table:** List of events across seasons. |
| **New Event** | `/staff/events/new` | **Form:** Create a new event with location, dates, etc. |
| **Edit Event** | `/staff/events/$eventId/edit` | **Complex Editor:** Update event settings, sync configurations, and manage registrations. |
