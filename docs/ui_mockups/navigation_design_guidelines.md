# Navigation Design Guidelines: Header & Staff Sidebar

## 1. Design Principle

Two distinct layout shells depending on user role and current route context:

| Context | Layout | Navigation |
|:---|:---|:---|
| **All users** (public pages, auth, account, teams, register, events) | **Header only** — full-width content below | Top header bar with nav links |
| **Staff users** on `/staff/*` routes | **Header + Left Sidebar** — sidebar + content area | Top header (compact) + persistent left sidebar |

The header is **always present** (rendered in `__root.tsx`). The sidebar is **only rendered** inside the `staff.tsx` layout route when the user has a staff/admin system role.

---

## 2. Header Bar (All Users)

### Current State
The header already exists at `apps/web/src/components/header.tsx`. It renders a logo, nav links, and a user dropdown. Staff/Admin links are conditionally shown.

### Proposed Design

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams  Register         [User Menu] |
|                           ~~~~                                  v UserName  |
+-----------------------------------------------------------------------------+

Legend:
  ~~~~ = active link underline indicator
  [User Menu] = dropdown with: Account settings, Create team, Sign out
```

#### Unauthenticated State

```ascii
+-----------------------------------------------------------------------------+
| (Logo) STEAM for Vietnam  Home  Events  Teams                Sign in  [CTA] |
|                                                                             |
+-----------------------------------------------------------------------------+

  [CTA] = "Get started" primary button → /register
```

### Header Specifications

| Element | Detail |
|:---|:---|
| **Height** | `min-h-20` (80px), sticky top |
| **Logo** | Official STEAM for Vietnam logo (no subtitle) |
| **Nav links** | `Home`, `Events`, `Teams`, `Register` — visible to all authenticated users |
| **Staff link** | Remove from header; staff navigation moves entirely to the sidebar |
| **Users link** | Remove from header; moves into staff sidebar under admin-only section |
| **Active state** | Underline + primary color via `nrc-nav-link-active` |
| **User menu** | Dropdown: email label, "Account settings", "Create team", "Sign out" |
| **Impersonation** | Yellow banner / button "Stop impersonating" when active |
| **Mobile** | Hamburger menu (☰) replacing nav links below `lg` breakpoint |
| **i18n** | Language switcher (EN/VI toggle) placed before user menu |

### Key Change: Remove Staff/Users from Header Nav
Currently the header conditionally shows "Staff" and "Users" links for staff/admin roles. **Remove these from the header.** Staff users navigate to `/staff` once, and then the sidebar handles all staff navigation. This keeps the public header clean and consistent for everyone.

---

## 3. Staff Sidebar (Staff Users Only)

### When It Appears
The sidebar renders **only** inside the `staff.tsx` layout route component. It does not affect public pages, auth, account, register, or event pages at all.

### Layout Architecture

```ascii
+-- __root.tsx ---------------------------------------------------------------+
|  [ Header Bar (always) ]                                                    |
|  +--- staff.tsx layout ---------------------------------------------------+ |
|  |  +-- Sidebar --+  +-- Content Area (Outlet) -------------------------+ | |
|  |  |             |  |                                                   | | |
|  |  |  Dashboard  |  |  <staff child route renders here>                 | | |
|  |  |  Seasons    |  |                                                   | | |
|  |  |  Events     |  |                                                   | | |
|  |  |  Registr.   |  |                                                   | | |
|  |  |  ─────────  |  |                                                   | | |
|  |  |  Users      |  |                                                   | | |
|  |  |  Sync Logs  |  |                                                   | | |
|  |  |  Settings   |  |                                                   | | |
|  |  |             |  |                                                   | | |
|  |  |  ─────────  |  |                                                   | | |
|  |  |  ← Back to  |  |                                                   | | |
|  |  |    Site     |  |                                                   | | |
|  |  +-------------+  +---------------------------------------------------+ | |
|  +------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------+
```

### Full Sidebar Wireframe

```ascii
+-------------------+
|                   |
|  STAFF PANEL      |
|  ───────────────  |
|                   |
|  Overview     (1) |  ← /staff
|                   |
|  CONTENT          |
|  ───────────────  |
|  Seasons      (2) |  ← /staff/seasons
|  Events       (3) |  ← /staff/events
|  Registrations(4) |  ← /staff/registrations  (future)
|                   |
|  ADMINISTRATION   |
|  ───────────────  |
|  Users        (5) |  ← /users (admin only)
|  Sync Logs    (6) |  ← /staff/sync  (future)
|  Settings     (7) |  ← /staff/settings  (future)
|                   |
|  ───────────────  |
|  ← Back to Site   |  ← /  (returns to public site)
|                   |
+-------------------+
```

### Sidebar Specifications

| Element | Detail |
|:---|:---|
| **Width** | `w-60` (240px) on desktop, collapsible to icon-only `w-16` (64px) |
| **Position** | Fixed left, full viewport height below header (`top: 80px`) |
| **Background** | `bg-sidebar` or subtle surface color distinct from main content |
| **Sections** | Grouped with uppercase labels: `CONTENT`, `ADMINISTRATION` |
| **Nav items** | Icon + label per link; icon-only when collapsed |
| **Active item** | `bg-accent` background + `text-accent-foreground` + left border accent |
| **Hover** | `bg-muted` background transition |
| **Collapse toggle** | Chevron button at sidebar bottom or top; remembers state in localStorage |
| **Admin-only items** | "Users", "Settings" only visible when `isAdminSystemRole` is true |
| **"Back to Site"** | Always at the bottom, navigates to `/` to exit staff context |
| **Mobile** | Sidebar becomes a slide-over drawer, toggled via hamburger in header |

### Sidebar Nav Items & Icons

| Item | Icon (lucide) | Route | Visibility |
|:---|:---|:---|:---|
| Overview | `LayoutDashboard` | `/staff` | All staff |
| Seasons | `CalendarRange` | `/staff/seasons` | All staff |
| Events | `Trophy` | `/staff/events` | All staff |
| Registrations | `ClipboardCheck` | `/staff/registrations` | All staff |
| Users | `Users` | `/users` | Admin only |
| Sync Logs | `RefreshCw` | `/staff/sync` | All staff |
| Settings | `Settings` | `/staff/settings` | Admin only |
| Back to Site | `ArrowLeft` | `/` | All staff |

---

## 4. Implementation Plan

### 4.1 File Structure

```
apps/web/src/components/
├── header.tsx                  # Existing — remove Staff/Users links
├── staff-sidebar.tsx           # NEW — sidebar component
└── ...
```

### 4.2 Changes to `__root.tsx`
No structural changes needed. The root layout stays as header + `<Outlet />`. The sidebar is introduced **inside** `staff.tsx`, not at the root level.

### 4.3 Changes to `staff.tsx`
The `staff.tsx` layout route wraps its `<Outlet />` in a flex container with the sidebar:

```ascii
staff.tsx renders:
┌─────────────────────────────────────────────┐
│ <div className="flex">                      │
│   <StaffSidebar />          <-- NEW         │
│   <div className="flex-1">                  │
│     <Outlet />              <-- child pages  │
│   </div>                                    │
│ </div>                                      │
└─────────────────────────────────────────────┘
```

**Important:** The current `staff.tsx` only renders `<Outlet />` when `pathname !== "/staff"`, otherwise it renders the dashboard cards inline. After this change, the staff layout should **always** render sidebar + outlet, and the dashboard content moves to a dedicated index-like component within staff.tsx itself.

### 4.4 Changes to `header.tsx`
- Remove the conditional `Staff` link (line 90–100 in current code).
- Remove the conditional `Users` link (line 101–111 in current code).
- Optionally: when on a `/staff/*` route, show a subtle "Staff Mode" indicator badge next to the logo.

### 4.5 Mobile Behavior

```ascii
Mobile (< lg breakpoint):

Header:
+---------------------------------------------+
| ☰  (Logo) STEAM for Vietnam       [User Menu]|
+---------------------------------------------+

☰ tap opens a drawer overlay:
+-------------------+
| Navigation        |  ← public links
| ─────────────     |
| Home              |
| Events            |
| Teams             |
| Register          |
| ─────────────     |
| Staff Panel       |  ← only if staff role
|   Overview        |
|   Seasons         |
|   Events          |
|   ...             |
| ─────────────     |
| Sign out          |
+-------------------+

On /staff/* pages:
The sidebar is hidden by default. A toggle button (☰ or dedicated icon) in the header opens it as a slide-over drawer from the left.
```

---

## 5. Visual Summary

### Normal User Experience

```ascii
+-----------------------------------------------------------------------------+
| Header: Logo  Home  Events  Teams  Register               [Avatar ▾]       |
+-----------------------------------------------------------------------------+
|                                                                             |
|                                                                             |
|                       Full-width page content                               |
|                       (no sidebar ever)                                     |
|                                                                             |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Staff User on Public Pages (same as normal user)

```ascii
+-----------------------------------------------------------------------------+
| Header: Logo  Home  Events  Teams  Register               [Avatar ▾]       |
+-----------------------------------------------------------------------------+
|                                                                             |
|                       Full-width page content                               |
|                       (no sidebar — not on /staff/*)                        |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Staff User on `/staff/*` Pages

```ascii
+-----------------------------------------------------------------------------+
| Header: Logo  Home  Events  Teams  Register               [Avatar ▾]       |
+-----------------------------------------------------------------------------+
| Staff Panel   |                                                             |
| ────────────  |  # Staff Overview                                           |
| Overview      |                                                             |
| Seasons       |  +----------------+ +---------------+ +---------+          |
| Events        |  | Active Seasons | | Pending Regs. | | Sync    |          |
| Registrations |  |       2        | |      15       | | Errors  |          |
|               |  +----------------+ +---------------+ |    0    |          |
| ADMIN         |                                       +---------+          |
| ────────────  |                                                             |
| Users         |  ## Recent Activity                                         |
| Sync Logs     |  ...                                                        |
| Settings      |                                                             |
|               |                                                             |
| ────────────  |                                                             |
| ← Back to     |                                                             |
|   Site        |                                                             |
+---------------+-------------------------------------------------------------+
```
