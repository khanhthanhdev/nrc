# Landing Page UI Wireframe
Route: `/`

## 1. Normal User View
(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams                Sign in  [CTA] |
+-----------------------------------------------------------------------------+
|                                                                             |
|   +---------------------------------------------------------------------+   |
|   |                                                                     |   |
|   |               NATIONAL ROBOTICS COMPETITION 2026                    |   |
|   |                                                                     |   |
|   |            Building the future of robotics and engineering          |   |
|   |                                                                     |   |
|   |                 [ View Events ] [ Register ]                        |   |
|   |                                                                     |   |
|   +---------------------------------------------------------------------+   |
|                                                                             |
|  ## Featured Events                                                         |
|  +-------------------------+  +-------------------------+                   |
|  | Event: Hanoi Regional   |  | Event: HCMC Regional    |                   |
|  | Dates: Oct 10-12, 2026  |  | Dates: Nov 5-7, 2026    |                   |
|  | Status: LIVE            |  | Status: OPEN            |                   |
|  | [ View Details ]        |  | [ View Details ]        |                   |
|  +-------------------------+  +-------------------------+                   |
|                                                                             |
|  ## Latest Results                                                          |
|  +-----------------------------------------------------------------------+  |
|  | Q12: Team A & Team B [ 120 ]  vs  Team C & Team D [ 90 ]  - HANOI REG |  |
|  | Q11: Team X & Team Y [ 110 ]  vs  Team Z & Team W [ 110 ] - HANOI REG |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
|  Footer: Terms | Privacy | Contact | Sponsors                           |
+-----------------------------------------------------------------------------+
```

## 2. Staff View
Route: `/staff` (Dashboard)
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
|               |  ## Recent Activity                                         |
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

