# Event Detail UI Wireframe

Route: `/$season/$eventId`

## 1. Normal User View

(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [---------------- Hero Banner Background Image ------------------------]   |
|  |                                                                      |   |
|  |  # Hanoi Regional 2026                                               |   |
|  |  Date: Oct 10-12, 2026 | Location: Hanoi Innovation Hub              |   |
|  |  Status: [ Registration Open ]                                       |   |
|  |                                                                      |   |
|  |  [ Register Team CTA ]                                               |   |
|  [----------------------------------------------------------------------]   |
|                                                                             |
|  [ Overview ]  [ Rules ]  [ Schedule ]  [ Participants ]                    |
|  [ Qualifications ]  [ Playoffs ]  [ Rankings ]  [ Awards ]                 |
|                                                                             |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  ## Overview                                                                |
|  Welcome to the Hanoi Regional! This event will host 40 teams across...     |
|                                                                             |
|  ## Location Map                                                            |
|  +-----------------------------------------------------------------------+  |
|  |                                                                       |  |
|  |                         [ Map Placeholder ]                           |  |
|  |                                                                       |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+
|  Footer: Terms | Privacy | Contact                                          |
+-----------------------------------------------------------------------------+
```

## 2. Staff View

Route: `/staff/events/$eventId`
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Manage Event: Hanoi Regional 2026                        |
| Overview      |                                                             |
|               |  [ Edit Details ] [ Manage Teams ] [ Match Schedule ]       |
| CONTENT       |  ----------------------------------------------------       |
| ────────────  |                                                             |
| Seasons       |  ## Registration Status                                     |
| Events (Active)|  - Total Capacity: 40 teams                                 |
| Registrations |  - Confirmed: 25                                            |
|               |  - Pending: 10                                              |
| ADMINISTRATION|                                                             |
| ────────────  |  ## Quick Actions                                           |
| Users         |  [ Download Team List (CSV) ] [ Generate Match Schedule ]   |
| Sync Logs     |  [ Send Announcement Email ]  [ Export Results ]            |
| Settings      |                                                             |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```
