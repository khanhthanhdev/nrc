# Design System: National Robotics Competition (NRC)

## 1. Visual Theme & Atmosphere

The National Robotics Competition (NRC) interface represents the intersection of educational accessibility and bleeding-edge technology. Drawing from its STEAM for Vietnam heritage and the modern tech infrastructure of OctoAI, the design feels like a high-energy tournament command center: approachable enough for young competitors, yet sophisticated enough to reflect the serious engineering happening behind the scenes. 

The experience lives on a clean white canvas anchored by the deep, authoritative navy (`#172b4d`) of STEAM for Vietnam. A unified single-typeface system using **Plus Jakarta Sans** (from OctoAI) drives both display and body text with crisp, geometric tech precision. Weight and scale create hierarchy rather than font contrast, delivering an engineered, cohesive aesthetic perfect for robotics competition management.

Where Cohere uses dramatic restraint and ElevenLabs uses ethereal lightness, NRC uses **kinetic energy**. Gradients bridging Tech Blue (`#447aff`) and Octo Purple (`#7a5af8`) highlight active tournament states, leaderboards, and primary actions. Elements are contained in modern, generously rounded cards (24px to 30px) that lift off the page using OctoAI's signature multi-layered, diffused shadow stacks.

**Key Characteristics:**

- Pure white canvas grounded by deep educational navy (`#172b4d`)
- Single unified typeface: Plus Jakarta Sans for all display and body text
- Generous border radii: 24px–30px for standard cards, full pill (9999px) for buttons
- Kinetic color accents: Vibrant blue-to-purple transitions for high-energy tournament elements
- Heavy, diffused elevation shadows for floating primary components
- High-contrast UI suitable for both desktop tournament management and mobile score tracking

## 2. Color Palette & Roles

### Primary

- **Navy Black** (`#172b4d`): The primary headline text and dark surface color. Brings serious, authoritative weight.
- **Tech Blue** (`#447aff`): The primary interactive accent. Used for standard buttons, active states, and primary links.
- **Pure White** (`#ffffff`): The primary page background and card surface.

### Secondary & Accent

- **Octo Purple** (`#7a5af8`): Secondary accent color, used alongside Tech Blue to create energetic gradients for hero sections and tournament leaderboards.
- **Energy Pink** (`#ee46bc`): Tertiary accent for warning states, live-match indicators, or high-priority notifications. 
- **Dark Charcoal** (`#212121`): Alternate dark background for high-contrast tech panels (e.g., code snippets or match bracket viewers).

### Neutrals & Text

- **Slate Gray** (`#6b778c`): Standard secondary text, descriptions, and metadata.
- **Muted Gray** (`#97a0af`): Tertiary text, disabled states, and subtle UI borders.
- **Light Surface** (`#f0f2f5` - *derived*): Soft gray for secondary page backgrounds to allow white cards to pop.

## 3. Typography Rules

### Font Family

- **Primary (Display & Body)**: `Plus Jakarta Sans`, with fallbacks: `Inter, Arial, Helvetica, sans-serif`
- **Monospace (Code/Data)**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`

### Hierarchy

To maintain visual hierarchy with a single typeface, this system relies heavily on weight contrast (jumping from 400 to 700) and distinct size stepping.

| Role | Font | Size | Weight | Line Height | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display Hero | Plus Jakarta Sans | 96px (6.00rem) | 800 (ExtraBold) | 1.00 | Massive impact for tournament branding; ultra-heavy |
| Section Heading | Plus Jakarta Sans | 56px (3.50rem) | 700 (Bold) | 1.25 | Main page sections |
| Card Heading | Plus Jakarta Sans | 24px (1.50rem) | 700 (Bold) | 1.33 | Bracket titles, team names |
| UI Large | Plus Jakarta Sans | 18px (1.13rem) | 600 (SemiBold) | 1.50 | Important UI elements, high-level stats |
| Body Standard | Plus Jakarta Sans | 16px (1.00rem) | 400 (Regular) | 1.50 | Standard reading text, descriptive paragraphs |
| Button Label | Plus Jakarta Sans | 16px (1.00rem) | 700 (Bold) | 1.25 | Action-oriented, highly legible |
| UI Standard | Plus Jakarta Sans | 14px (0.88rem) | 500 (Medium) | 1.43 | Standard UI text, list items, table data |
| Caption / Meta | Plus Jakarta Sans | 14px (0.88rem) | 400 (Regular) | 1.43 | Timestamps, match scores, metadata |
| Micro Tag | Plus Jakarta Sans | 12px (0.75rem) | 700 (Bold) | 1.33 | Uppercase status tags (e.g., "LIVE", "FINAL") |

### Principles

- **Unified Tech Aesthetic**: Plus Jakarta Sans drives the entire interface. Its geometric structure feels engineered and precise, perfectly matching a robotics competition environment.
- **Weight as Hierarchy**: Because we lack a second font family, skip weights to create contrast. Pair a 700 (Bold) heading directly with a 400 (Regular) body text to ensure clear structural boundaries.
- **Tabular Data Focus**: Plus Jakarta Sans handles numbers exceptionally well. Keep weight consistent (typically 500 Medium) in leaderboards and brackets to ensure match scores and rankings align perfectly in vertical columns.
- **Whitespace Compensation**: A single sans-serif system can look dense. Maintain the generous 24px–32px internal card padding to give the typography room to breathe.

## 4. Component Stylings

### Buttons

**Primary Kinetic Pill**
- Background: Gradient from Tech Blue (`#447aff`) to Octo Purple (`#7a5af8`)
- Text: Pure White (`#ffffff`), Plus Jakarta Sans 16px Bold
- Padding: 12px 32px
- Radius: 9999px (Pill)
- Shadow: OctoAI dynamic shadow (`rgba(41, 41, 41, 0.26) 0px 10px 20px -10px`)
- Hover: Slight scale up (`transform: translateY(-2px)`), shadow intensifies

**Secondary Outline**
- Background: Transparent
- Border: `1px solid #447aff`
- Text: Tech Blue (`#447aff`)
- Radius: 9999px (Pill)
- Hover: Background shifts to very light blue tint (`rgba(68, 122, 255, 0.05)`)

### Cards & Containers

- Background: Pure White (`#ffffff`)
- Border: Optional subtle border `1px solid #e2e8f0` for flat cards
- Radius: **24px to 30px** — an organic, modern containment that softens the dense data of tournament brackets
- Shadow (Elevated Cards): Deep, diffused OctoAI shadow (`rgba(41, 41, 41, 0.1) 0px 27px 27px -20px`)
- Content: Team stats, match schedules, live score widgets

### Badges & Status Indicators

- Use heavy border-radius (9999px)
- Text: 12px Plus Jakarta Sans Bold, Uppercase
- LIVE match: Energy Pink (`#ee46bc`) background with white text
- UPCOMING match: Tech Blue (`#447aff`) background

## 5. Layout Principles

### Spacing System

- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
- Internal Card Padding: 24px or 32px to give complex match data breathing room.
- Section Vertical Spacing: 96px to separate distinct tournament phases (e.g., Groups vs. Knockouts).

### Grid & Container

- Max container width: 1200px to 1440px for dense data views (leaderboards).
- Tournament Brackets require horizontal scrolling on smaller viewports but maintain strict alignment on a 4px/8px micro-grid.

### Visual Hierarchy

- **Data is king**: In a tournament context, numbers (scores, rankings, times) should be emphasized using Plus Jakarta Sans Bold.
- **Clear grouping**: Use elevated white cards on a light gray background to distinctly group different matches or competition tracks.

## 6. Depth & Elevation

| Level | Treatment | Use |
| :--- | :--- | :--- |
| Level 0 (Flat) | No shadow | Page background, simple text blocks |
| Level 1 (Subtle) | `rgba(0, 0, 0, 0.05) 0px 4px 6px -1px` | Standard schedule cards, list items |
| Level 2 (Floating) | `rgba(41, 41, 41, 0.26) 0px 27px 27px -20px` | Active match cards, primary CTAs |
| Level 3 (Focus) | `0 0 0 4px rgba(68, 122, 255, 0.2)` | Keyboard focus rings around inputs |

**Shadow Philosophy**: Inherited from OctoAI, shadows are large, diffused, and heavily offset vertically. They don't just separate elements; they make interactive tournament components feel like tactile, floating dashboard widgets.

## 7. Do's and Don'ts

### Do
- Use Navy Black (`#172b4d`) for primary text to maintain readability and authority.
- Apply Plus Jakarta Sans at varying weights (400–800) to establish hierarchy across all text: headings, body, and data displays.
- Use 9999px pill radii for all buttons to invite interaction.
- Utilize large, diffused shadows for active elements (like the currently live match).
- Incorporate Tech Blue (`#447aff`) to Octo Purple (`#7a5af8`) gradients for high-impact visual moments.
- Keep tabular data (scores, rankings) at weight 500 Medium to ensure perfect vertical alignment.

### Don't
- Don't use sharp corners (0px to 4px) on large containers; stick to the 24px-30px organic radius.
- Don't switch typefaces for body text; maintain Plus Jakarta Sans throughout for cohesion.
- Don't overdo the Energy Pink (`#ee46bc`); reserve it strictly for "LIVE" or critical alert states.
- Don't use heavy, dark borders; separate elements using elevation (shadows) and background contrast.
- Don't rely solely on size for hierarchy; leverage weight contrast to guide visual attention.

## 8. Agent Prompt Guide

### Quick Color Reference
- Primary Text / Heading: "Navy Black (#172b4d)"
- Page Background: "Light Surface (#f0f2f5) or Pure White (#ffffff)"
- Interactive / Accent: "Tech Blue (#447aff)"
- Secondary Accent: "Octo Purple (#7a5af8)"
- Body Text: "Slate Gray (#6b778c)"

### Example Component Prompts

- "Create a tournament match card: Pure White (#ffffff) background, 24px border-radius, floating shadow (rgba(41, 41, 41, 0.1) 0px 27px 27px -20px). Team names in Navy Black (#172b4d) using Plus Jakarta Sans at 24px Bold. Match time in Slate Gray (#6b778c) Plus Jakarta Sans 14px Regular."
- "Design a primary registration button: 9999px pill shape. Background gradient from Tech Blue (#447aff) to Octo Purple (#7a5af8). Text is Pure White, Plus Jakarta Sans 16px Bold. Add a subtle translateY(-2px) hover effect."
- "Build a Live Score badge: Energy Pink (#ee46bc) background, 9999px radius. Text is Pure White, Plus Jakarta Sans 12px Bold, uppercase."
- "Create a leaderboard table header: Navy Black (#172b4d) background. Column titles in Pure White, Plus Jakarta Sans 14px Bold. Data rows use Plus Jakarta Sans 14px Medium for perfect alignment. Border-bottom 1px solid Muted Gray (#97a0af)."

---
