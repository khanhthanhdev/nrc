# Account Dashboard UI Wireframe

Route: `/account`

## 1. Normal User View

(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  # Dashboard                                         [ Edit Profile ]       |
|  Welcome back, Thanh! (Role: MENTOR)                                        |
|                                                                             |
|  +--------------------------------+ +-------------------------------------+ |
|  | My Teams                       | | My Registrations                    | |
|  |                                | |                                     | |
|  | + Team 101: Robox              | | Event: Hanoi Reg  - Oct 10          | |
|  |   Members: 5  | [Manage Team]  | | Team: 101 Robox                     | |
|  |                                | | Status: [ Under Review ]            | |
|  | + Team 404: Cyber              | | [ View Discussion / Upload ]        | |
|  |   Members: 3  | [Manage Team]  | |                                     | |
|  |                                | |                                     | |
|  | [+ Create New Team]            | | [ Browse Events to Register ]       | |
|  +--------------------------------+ +-------------------------------------+ |
|                                                                             |
|  ## Notifications                                                           |
|  +-----------------------------------------------------------------------+  |
|  | [!] Registration for "Hanoi Reg" requires revision.       (2 hrs ago) |  |
|  | [*] You have a pending invite to join Team 999.  [Accept] (1 day ago) |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View (Admin managing user)

Route: `/users/$userId`
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Manage User: Thanh (thanh@example.com)                   |
| Overview      |                                                             |
|               |  [ Edit User ] [ Reset Password ] [ Impersonate ]           |
| CONTENT       |  ----------------------------------------------------       |
| ────────────  |                                                             |
| Seasons       |  ## Account Info                                            |
| Events        |  - Role: MENTOR                                             |
| Registrations |  - Status: ACTIVE                                           |
|               |  - Joined: Jan 12, 2026                                     |
| ADMINISTRATION|                                                             |
| ────────────  |  ## Associated Teams                                        |
| Users (Active)|  - Team 101: Robox (Captain)                                |
| Sync Logs     |  - Team 404: Cyber (Mentor)                                 |
| Settings      |                                                             |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```
