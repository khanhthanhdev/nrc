# Team Profile UI Wireframe

Route: `/teams/$teamNumber`

This wireframe aligns with the current backend schema while proposing extensions for a premium social media experience.

## 1. Public View Layout (Current Schema)

```ascii
+-----------------------------------------------------------------------------+
| [Header: Logo | Search | Events | Teams | Seasons |           User Profile] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                                                                       |  |
|  |                            [ Cover Image ]                            |  |
|  |                                                                       |  |
|  |     +----------+                                                      |  |
|  |     |  Avatar  |  Team 101: Robox                                     |  |
|  |     |   ( O )  |  Hanoi, Vietnam                                      |  |
|  |     +----------+  School: Hanoi University of Science                 |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|  | [ Overview ] [ Roster ] [ Event History ] [ Media ]                      |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +---------------------------+   +---------------------------------------+  |
|  | ## About Team             |   | ## Latest Achievements                |  |
|  | [ Existing Description ]  |   | (Data from sync/events system)        |  |
|  |                           |   |                                       |  |
|  | ## Team Info              |   | +-----------------------------------+ |  |
|  | [Icon] Team #: 00101      |   | | [Badge] Winner - Hanoi 2026       | |  |
|  | [Icon] School: HUST       |   | +-----------------------------------+ |  |
|  | [Icon] City: Hanoi        |   |                                       |  |
|  | [Icon] Joined: Feb 2025   |   | ## Recent Matches                     |  |
|  |                           |   | +-----------------------------------+ |  |
|  | ## Members (5)            |   | | Q#12: Blue [ 120 ] vs Red [ 45 ]  | |  |
|  | [ A ] [ B ] [ C ]         |   | +-----------------------------------+ |  |
|  +---------------------------+   +---------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Information Architecture Alignment

### 2.1 Supported Fields (Current Backend)

| Field             | Schema Path                 | Notes                  |
| :---------------- | :-------------------------- | :--------------------- |
| **Name**          | `team.name`                 | Required               |
| **Team Number**   | `team.teamNumber`           | Unique 5-digit string  |
| **Description**   | `team.description`          | Max 2000 chars         |
| **School/Org**    | `team.schoolOrOrganization` | Optional               |
| **City/Province** | `team.cityOrProvince`       | Optional               |
| **Avatar**        | `team.avatarUrl`            | Optional               |
| **Cover Image**   | `team.coverImageUrl`        | Optional               |
| **Members**       | `teamMembership`            | Linked to `user` table |

### 2.2 Proposed Premium Extensions

These fields are inspired by FTC Events but require database migrations:

- **Rookie Year**: `team.rookieYear` (integer).
- **Robot Info**: `team_season_data.robotName`, `team_season_data.robotDescription`.
- **Sponsors**: `team_season_data.sponsors` (JSONB or separate table).
- **Social Links**: `team.socialLinks` (JSONB: github, facebook, website).
- **Skills**: `team.skills` (text[]).

## 3. Tab Specifications (Aligned with App Logic)

### 3.1 Overview (Default)

- Combines `team.description` with a summary of `event_participation` (fetched via events API).

### 3.2 Roster

- Lists users from `listTeamMembers` endpoint.
- Displays `user.name` and `membership.role` (MENTOR, LEADER, MEMBER).

### 3.3 Event History

- Fetches data from the `event` package (matches, rankings).
- Displays list of events where the team was registered.

### 3.4 Media

- Currently proposed as a placeholder (requires file/gallery management system).

## 4. Management View (Mentor/Leader)

Route: `/teams/$teamNumber?tab=manage`
Uses `UpdateTeamProfileInput` schema:

- **Identity**: Edit Name, Description, School, City.
- **Media**: Upload Avatar and Cover Image (uses `avatarUrl`, `coverImageUrl`).
- **Members**: `inviteTeamMember`, `removeTeamMember`, `revokeTeamInvitation`.

## 5. Technical Constraints

- **Team Number**: Strict `^\d{5}$` validation in both frontend and backend.
- **Access Control**: Public view is open; `manage` and `invitations` tabs require `TEAM_MENTOR` or `TEAM_LEADER` role.
- **I18n**: All labels and status messages must support `en` and `vi`.
