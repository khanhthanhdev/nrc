# Team Profile UI Wireframe
Route: `/teams/$teamNumber`

## 1. Normal User View
(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams                Sign in  [CTA] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [----------------------- Cover Image ----------------------------------]   |
|  |                                                                      |   |
|  |   ( O )  Team 101: Robox                                             |   |
|  |  Avatar  Hanoi University of Science and Technology                  |   |
|  |                                                                      |   |
|  [----------------------------------------------------------------------]   |
|                                                                             |
|  ## About Us                                                                |
|  We are a passionate group of robotics enthusiasts from Hanoi...            |
|                                                                             |
|  +--------------------------------+ +-------------------------------------+ |
|  | ## Roster (5 Members)          | | ## Achievements                     | |
|  |                                | |                                     | |
|  | - Nguyen Van A (Captain)       | | [Icon] Inspire Award (Hanoi 2026)   | |
|  | - Tran Thi B (Builder)         | | [Icon] Finalist (HCMC 2025)         | |
|  | - Le Van C (Programmer)        | |                                     | |
|  | - Pham D (Driver)              | | ## Event History                    | |
|  | - Vu E (Mentor)                | | - Hanoi Regional 2026 (Rank: 1)     | |
|  |                                | | - HCMC Regional 2025 (Rank: 2)      | |
|  +--------------------------------+ +-------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View (Team Management)
Route: `/staff/teams/$teamId`
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Manage Team: Robox (101)                                 |
| Overview      |                                                             |
|               |  [ Edit Profile ] [ Manage Roster ] [ View Registrations ]  |
| CONTENT       |  ---------------------------------------------------------  |
| ────────────  |                                                             |
| Seasons       |  ## Team Stats                                              |
| Events        |  - Season 2026: 1 Event (Hanoi Reg)                         |
| Registrations |  - All-time Wins: 15                                        |
|               |  - Status: [ VERIFIED ]                                     |
| ADMINISTRATION|                                                             |
| ────────────  |  ## Internal Notes                                          |
| Users         |  - Team has history of late arrivals.                       |
| Sync Logs     |  - High performance in autonomous period.                   |
| Settings      |                                                             |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```

