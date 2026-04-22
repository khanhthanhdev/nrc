# Design System: National Robotics Competition (NRC)

## 1. Visual Theme & Atmosphere

The NRC website should feel minimal, professional, and calm. It is still a modern competition platform, but the interface should communicate operational clarity before excitement. The visual language should avoid loud gradients, thick outlines, oversized radii, and stacked decorative effects.

The overall experience lives on a light neutral canvas with a restrained accent system built from blue, purple, and pink. Brand navy remains the anchor for text and structure, while the accent trio should appear in calls to action, active states, focus moments, and selected data views. Surfaces should feel clean and structured. Separation should come from spacing, contrast, and subtle elevation rather than visible borders everywhere.

**Key Characteristics**

- Minimal, editorial UI with strong hierarchy and generous whitespace
- Professional tone first, expressive accents second
- Low-border interface: most sections separated by spacing, tonal shifts, or very soft hairlines
- Moderate radii, not oversized pills everywhere
- Soft shadows used rarely and lightly
- Strong readability across tables, forms, and public event pages

## 2. Color Palette & Roles

### Primary

- **Navy Ink** (`#172b4d`): Primary text, key headings, and high-confidence actions
- **Signal Blue** (`#447aff`): Primary accent for links, focused states, and selected controls
- **Violet Pulse** (`#7a5af8`): Secondary accent for highlighted UI and gradient transitions
- **Rose Signal** (`#ee46bc`): Tertiary accent for key highlights, status emphasis, and brand energy
- **Pure White** (`#ffffff`): Main surface color

### Supporting

- **Canvas** (`#f7f8fa`): Default page background
- **Soft Surface** (`#f3f5f8`): Secondary panels, grouped controls, table headers
- **Slate Text** (`#667085`): Secondary text and supporting descriptions
- **Hairline** (`#e6ebf2`): Optional border for inputs, separators, and dense data views
- **Critical** (`#d9487d`): Errors, destructive actions, and urgent states

### Usage Rules

- Use blue, purple, and pink as a controlled accent family, with blue doing most of the work
- Prefer white and soft gray surfaces over fully saturated or large gradient containers
- Use purple and pink to enrich active UI moments, not as the constant page background
- Avoid dark surfaces unless the content truly benefits from strong contrast

## 3. Typography Rules

### Font Family

- **Primary (Display & Body)**: `Plus Jakarta Sans`, with fallbacks: `Inter, Arial, Helvetica, sans-serif`
- **Monospace (Code/Data)**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display Hero | Plus Jakarta Sans | 64px (4rem) | 700 | 1.05 | Reserved for key landing moments only |
| Section Heading | Plus Jakarta Sans | 40px (2.5rem) | 700 | 1.15 | Main page headings |
| Card Heading | Plus Jakarta Sans | 22px (1.375rem) | 600 | 1.25 | Section cards and detail headers |
| UI Large | Plus Jakarta Sans | 16px (1rem) | 600 | 1.45 | Tabs, important labels, compact headings |
| Body Standard | Plus Jakarta Sans | 15px (0.9375rem) | 400 | 1.6 | Main reading size |
| UI Standard | Plus Jakarta Sans | 14px (0.875rem) | 500 | 1.5 | Dense UI, metadata, tables |
| Caption / Meta | Plus Jakarta Sans | 13px (0.8125rem) | 400 | 1.45 | Supporting annotations |
| Micro Label | Plus Jakarta Sans | 12px (0.75rem) | 600 | 1.35 | Status chips and small labels |

### Principles

- Use weight and spacing to create hierarchy, not decorative typography
- Keep line lengths moderate and paragraph copy compact
- Tables and operational data should stay crisp and legible, never overly stylized
- Favor disciplined spacing over larger text when improving clarity

## 4. Component Styling

### Buttons

**Primary**
- Background: solid navy or a restrained blue-to-violet gradient when emphasis is needed
- Text: white
- Radius: 12px to 14px
- Border: none
- Shadow: none or a very soft low-elevation shadow
- Hover: slight background darkening, no dramatic lift

**Secondary**
- Background: Soft Surface (`#f3f5f8`)
- Text: Navy Ink (`#172b4d`)
- Border: none
- Hover: slightly darker surface tone or a subtle lavender tint

**Outline**
- Use only when semantic separation matters
- Border: `1px solid #e6ebf2`
- Background: white
- Avoid using outline buttons as the default secondary pattern across the site

### Cards & Containers

- Background: white or soft surface
- Border: optional, subtle hairline only when content is dense
- Radius: 16px to 20px
- Shadow: light and compact
- Prefer one containment layer only; avoid nested bordered cards inside bordered cards

### Inputs & Filters

- Inputs should use a subtle hairline border and white background
- Filter chips may use rounded pills, but regular buttons should not default to full-pill shapes
- Selected states should rely on fill or tint rather than thick outlines
- Blue should signal the default selected state; purple and pink can appear in supporting highlights, badges, and accents

### Tables & Lists

- Prefer row separators over boxed cells
- Use soft background shifts for headers and active rows
- Keep dividers faint

## 5. Layout Principles

### Spacing System

- Base unit: 8px
- Preferred scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- Section spacing should feel generous, especially on desktop
- Inner padding should usually sit between 20px and 32px

### Grid & Container

- Max content width: 1200px to 1360px
- Landing and dashboard layouts should breathe; do not fill width just because space exists
- Use alignment and negative space to organize sections before adding containers

### Visual Hierarchy

- The page should read in clear blocks without requiring visible borders around everything
- Important actions should stand out through contrast and placement, not decoration
- Public pages should feel clean and trustworthy; staff pages should feel efficient and orderly

## 6. Depth & Elevation

| Level | Treatment | Use |
| :--- | :--- | :--- |
| Level 0 | No shadow | Backgrounds, simple sections |
| Level 1 | `0 8px 24px rgba(23, 43, 77, 0.06)` | Primary surface cards |
| Level 2 | `0 14px 34px rgba(23, 43, 77, 0.08)` | Menus, dialogs, emphasized panels |
| Focus | `0 0 0 3px rgba(122, 90, 248, 0.18)` | Keyboard focus only |

**Depth Rule**

If a surface already has contrast through color or spacing, do not also give it a heavy border and heavy shadow.

## 7. Do's and Don'ts

### Do

- Keep the interface quiet and intentional
- Use white space and grouping before adding lines
- Keep radii moderate and consistent
- Use faint borders only where users need structural help
- Let typography and spacing carry most of the hierarchy

### Don't

- Don’t add borders to every card, section, filter, and panel by default
- Don’t rely on gradients as the main visual identity of the product
- Don’t stack blur, border, glow, and shadow on the same component
- Don’t over-round large containers
- Don’t make operational screens feel like marketing pages

## 8. Agent Prompt Guide

### Quick Reference

- "Minimal, professional NRC web interface"
- "White and soft-gray surfaces with restrained blue, purple, and pink accents"
- "Use spacing and tonal separation instead of visible borders"
- "Moderate radii, subtle shadows, no heavy gradient treatment"

### Example Component Prompts

- "Create a page section card with a white background, 18px radius, very light hairline border, and a soft low shadow. Heading in Navy Ink (#172b4d), supporting text in Slate Text (#667085), and only a faint lavender or blue accent when needed."
- "Design a primary action button with a restrained gradient from Signal Blue (#447aff) to Violet Pulse (#7a5af8), white text, 12px radius, and no visible border."
- "Build a filter bar using soft gray chips and one selected state that uses a pale blue-purple tint. Keep the controls understated and professional."
- "Create a data table with a soft gray header row, faint row dividers, and no boxed cell borders."

---
