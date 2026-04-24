# Auth Base UI Wireframe
Route: `/auth`

## 1. Normal User View
(Header only)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams                Sign in  [CTA] |
+-----------------------------------------------------------------------------+
|                                                                             |
|                +-----------------------------------------------+            |
|                |                                               |            |
|                |  Sign In to your Account                      |            |
|                |                                               |            |
|                |  [ (G) Continue with Google                 ] |            |
|                |                                               |            |
|                |  -------------- or sign in with ------------- |            |
|                |                                               |            |
|                |  Email:                                       |            |
|                |  [ user@example.com                         ] |            |
|                |                                               |            |
|                |  Password:                                    |            |
|                |  [ ********************                     ] |            |
|                |                                               |            |
|                |  [            Sign In                       ] |            |
|                |                                               |            |
|                |  Forgot password? Reset it here.              |            |
|                |                                               |            |
|                |  Don't have an account? [ Sign Up ]           |            |
|                |                                               |            |
|                +-----------------------------------------------+            |
|                                                                             |
+-----------------------------------------------------------------------------+
```

## 2. Staff View (Auth Settings)
Route: `/staff/settings` (Admin only)
(Header + Sidebar)

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
+-----------------------------------------------------------------------------+
| STAFF PANEL   |                                                             |
| ────────────  |  # Authentication Settings                                  |
| Overview      |                                                             |
|               |  [ General ] [ Providers ] [ Roles & Permissions ]          |
| CONTENT       |  --------------------------------------------------         |
| ────────────  |                                                             |
| Seasons       |  ## Provider: Google Auth                                   |
| Events        |  - Client ID: [ **************************** ]              |
| Registrations |  - Status: [ ENABLED ]                                      |
|               |                                                             |
| ADMINISTRATION|  ## Registration Control                                    |
| ────────────  |  - Allow new signups: [ YES / NO ]                          |
| Users         |  - Require email verification: [ YES ]                      |
| Sync Logs     |                                                             |
| Settings (Active)                                                           |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```

