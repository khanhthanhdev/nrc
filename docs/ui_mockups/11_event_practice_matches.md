# Event Practice Matches UI Wireframe

Route: `/$season/$eventId/practice`

## 1. Normal User View

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
|  # Hanoi Regional 2026                                                      |
|  [ Overview ] [ Practice ] [ Qualifications ] [ Playoffs ] [ Rankings ]     |
|  -------------------------------------------------------------------------  |
|                                                                             |
|  ## Practice Matches                                                        |
|                                                                             |
|  [ Search Team... ] [ Highlight ] [ Filter ] [ Reset ]      [ ] Compact Mode|
|                                                                             |
|  +-----------------------------------------------------------------------+  |
|  | Match #       | Red Alliance                  | Blue Alliance                 |  |
|  +-----------------------------------------------------------------------+  |
|  | Practice 1    | 34276 PhilBot26               | 31113 RoboLads                |  |
|  | Sat 2:14 PM   |                               |                               |  |
|  +-----------------------------------------------------------------------+  |
|  | Practice 2    | 33947 FTHN.Omnitrix           | 25266 FschoolBG.Prime         |  |
|  | Sat 2:21 PM   |                               |                               |  |
|  +-----------------------------------------------------------------------+  |
|  | Practice 3    | 34037 PKK - Energy            | 21300 RIAN - Robots           |  |
|  | Sat 2:32 PM   |                               |                               |  |
|  +-----------------------------------------------------------------------+  |
|                                                                             |
|  [1] [2] [3] Next >                                                         |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## UI Notes
- **Alliance Coloring:** Rows or columns for Red/Blue alliances should use subtle background colors (light red/blue).
- **Team Info:** Each alliance slot shows both Team Number and Team Name.
- **Filtering:** Users can highlight their own team or filter by specific teams.
- **Time Display:** Match time is displayed below the match number for clarity.
