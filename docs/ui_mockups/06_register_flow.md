# Registration Flow UI Wireframe

Route: `/register/$eventId`

## 1. Normal User View

(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  # Register for Hanoi Regional 2026                                         |
|                                                                             |
|  Step 1 of 3: Select Team                                                   |
|  [======================------------------------------------] 33%           |
|                                                                             |
|  Which team are you registering?                                            |
|                                                                             |
|  ( ) Team 101: Robox                                                        |
|  ( ) Team 404: Cyber                                                        |
|                                                                             |
|  [ Next Step ]                                                              |
|                                                                             |
|  -------------------------------------------------------------------------  |
|  Note: You must be a TEAM_MENTOR to register a team for an event.           |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View (Registration Review)

Route: `/staff/registrations/$regId`
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Review Registration: Team 101 (Hanoi Reg)                |
| Overview      |                                                             |
|               |  [ Approve ] [ Request Revision ] [ Reject ]                |
| CONTENT       |  ----------------------------------------------------       |
| ────────────  |                                                             |
| Seasons       |  ## Details                                                 |
| Events        |  - Team: Robox (101)                                        |
| Registrations |  - Submitted: Apr 20, 2026                                  |
| (Active)      |  - Fee Status: [ PAID ]                                     |
|               |                                                             |
| ADMINISTRATION|  ## Documents                                               |
| ────────────  |  - Consent Forms: [ View PDF ]                              |
| Users         |  - Roster Sheet: [ View Sheet ]                             |
| Sync Logs     |                                                             |
| Settings      |                                                             |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```
