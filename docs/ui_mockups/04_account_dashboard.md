# Account Dashboard UI Wireframe

Route: `/account`

The account dashboard provides a personalized overview of the user's involvement in the National Robotics Competition, including their teams, event registrations, and notifications.

## 1. User View Layout

```ascii
+-----------------------------------------------------------------------------+
| [Header: Logo | Search | Events | Teams | Seasons |           User Profile] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  |                                                                       |  |
|  |  ( Avatar )  Welcome back, Thanh!                                     |  |
|  |              Mentor | Hanoi, Vietnam                                  |  |
|  |                                                                       |  |
|  |  [ Edit Profile ] [ Create New Team ] [ Account Settings ]            |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|  | [ Overview ] [ My Teams ] [ Registrations ] [ Notifications ] [ Help ] |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  +---------------------------+   +---------------------------------------+  |
|  | ## Notifications          |   | ## My Active Teams                    |  |
|  | [!] Action Required:      |   | +-----------------------------------+ |  |
|  | Registration Revision     |   | | Team 101: Robox                   | |  |
|  |                           |   | | [Icon] 5 Members | [ Manage ]     | |  |
|  | [*] New Invite:           |   | +-----------------------------------+ |  |
|  | Join Team 999             |   |                                       |  |
|  |                           |   | +-----------------------------------+ |  |
|  | [i] Event Update:         |   | | Team 404: Cyber                   | |  |
|  | Hanoi Reg Schedule        |   | | [Icon] 3 Members | [ Manage ]     | |  |
|  +---------------------------+   +-----------------------------------+ |  |
|                                  +---------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Tab Content Wireframes

### 2.1 Overview

- Quick stats: Number of teams, Upcoming events, Recent notifications.
- Activity feed of personal actions.

### 2.2 My Teams

- List of teams where the user is a member/mentor/leader.
- Primary CTA to "Create New Team".

### 2.3 Registrations

- Detailed list of all event registrations across all teams.
- Filter by Team or Event status.
- Direct links to registration discussions and document uploads.

### 2.4 Notifications

- Full inbox of all system and team notifications.
- Settings for email and push notification preferences.

## 3. Staff View (Admin managing user)

Route: `/users/$userId`

- **Account Management**: Change role, Update status, Reset password.
- **Audit Log**: View user's login history and administrative actions.
- **Impersonation**: Temporarily log in as the user to troubleshoot issues.
