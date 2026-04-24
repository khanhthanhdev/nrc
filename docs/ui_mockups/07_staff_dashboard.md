# Staff Dashboard UI Wireframe
Route: `/staff`

## 1. Normal User View
Route: `/account` (Account Dashboard)
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
|  | [+ Create New Team]            | | [ Browse Events to Register ]       | |
|  +--------------------------------+ +-------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View
Route: `/staff` (Staff Dashboard)
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Staff Overview                                           |
| Overview (Active)                                                           |
|               |  +----------------+ +---------------+ +---------+          |
| CONTENT       |  | Active Seasons | | Pending Regs. | | Sync    |          |
| ────────────  |  |       2        | |      15       | | Errors  |          |
| Seasons       |  +----------------+ +---------------+ |    0    |          |
| Events        |                                       +---------+          |
| Registrations |                                                             |
|               |  ## Recent Registrations                                    |
| ADMINISTRATION|  +-------------------------------------------------------+  |
| ────────────  |  | Team 101 -> Hanoi Reg | Submitted | [ Review ]        |  |
| Users         |  | Team 202 -> HCMC Reg  | Draft     | [ View ]          |  |
| Sync Logs     |  | Team 999 -> Hanoi Reg | Revision  | [ Review ]        |  |
| Settings      |  +-------------------------------------------------------+  |
|               |                                                             |
| ────────────  |  ## Quick Actions                                           |
| ← Back to     |  [ + Create New Event ]   [ Manage Sync API Keys ]          |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```


