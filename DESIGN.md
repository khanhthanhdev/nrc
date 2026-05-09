# Design System: National Robotics Competition (NRC)

Based on [STEAM for Vietnam](https://www.steamforvietnam.org/) design system.

## 1. Visual Theme & Atmosphere

The NRC website is a modern, tech-forward interface rooted in educational accessibility and innovation. Deep navy foundations pair with vibrant blue accents, creating an energetic yet professional atmosphere. The design celebrates robotics and STEM through smooth, contemporary Quicksand typography and generous whitespace. Soft, approachable elements coexist with bold color statements, making complex competition content feel welcoming.

**Key Characteristics**

- Deep navy and midnight blue dominance with blue interactive accents
- Clean, rounded geometric forms (Quicksand font)
- Generous whitespace and clear visual hierarchy
- Friendly yet professional tone
- Emphasis on clarity and accessibility for educational content

## 2. Design Tokens

All tokens live in `apps/web/src/index.css` as the single source of truth. The Tailwind theme maps them via `@theme inline`.

### Color Tokens (Semantic)

| Token                      | Light        | Dark           | Role                            |
| :------------------------- | :----------- | :------------- | :------------------------------ |
| `--primary`                | `#447aff`    | `#447aff`      | Primary accent, links, focus    |
| `--primary-foreground`     | `#ffffff`    | `#ffffff`      | Text on primary                 |
| `--secondary`              | `#eef4ff`    | `oklch(0.22…)` | Secondary fill                  |
| `--secondary-foreground`   | `#172b4d`    | `oklch(0.98…)` | Text on secondary               |
| `--foreground`             | `#172b4d`    | `oklch(0.98…)` | Primary text                    |
| `--background`             | `#ffffff`    | `oklch(0.09…)` | Page background                 |
| `--card`                   | `#ffffff`    | `oklch(0.14…)` | Card and surface fills          |
| `--card-foreground`        | `#172b4d`    | `oklch(0.98…)` | Text inside cards               |
| `--muted`                  | `#f6f8fa`    | `oklch(0.22…)` | Subtle backgrounds              |
| `--muted-foreground`       | `#6b778c`    | `#97a0af`      | Secondary and disabled text     |
| `--accent`                 | `#edf3ff`    | `oklch(0.24…)` | Hover tint, selection           |
| `--accent-foreground`      | `#172b4d`    | `oklch(0.98…)` | Text on accent                  |
| `--border`                 | `#c9d1d9`    | `oklch(1…/12%)`| Borders, dividers               |
| `--input`                  | `#c9d1d9`    | `oklch(1…/15%)`| Input field borders             |
| `--ring`                   | `#447aff`    | `#447aff`      | Focus ring color                |
| `--destructive`            | `#cf222e`    | `oklch(0.70…)` | Errors, destructive actions     |
| `--brand-hero`             | `#060e38`    | —              | Hero section dark background    |
| `--brand-hero-foreground`  | `#ffffff`    | —              | Text on hero                    |

### Status Colors

| Token                    | Light      | Role                   |
| :----------------------- | :--------- | :--------------------- |
| `--info`                 | `#375de7`  | Informational          |
| `--success`              | `#2da44e`  | Positive outcomes      |
| `--warning`              | `#ffab00`  | Caution states         |
| `--danger-soft`          | `#ffd2d8`  | Soft error background  |
| `--focus-primary`        | `#ffab0033`| Focus ring gold tint   |
| `--focus-information`    | `#375de733`| Focus ring blue tint   |
| `--surface-strong`       | `#d6e1ff`  | Highlighted surface    |

### Raw Palette

For utilities that need raw values rather than semantic tokens:

| Token                    | Value     | Role                        |
| :----------------------- | :-------- | :-------------------------- |
| `--dt-color-blue-500`    | `#447aff` | Primary interactive         |
| `--dt-color-purple-500`  | `#7a5af8` | Secondary accent            |
| `--dt-color-purple-700`  | `#5925dc` | Deep purple                 |
| `--dt-color-pink-500`    | `#ee46bc` | Tertiary accent             |
| `--dt-color-gray-300`    | `#c1c7d0` | Border / divider            |
| `--dt-color-gray-400`    | `#97a0af` | Muted text                  |
| `--dt-color-navy-700`    | `#172b4d` | Primary text / heading      |
| `--dt-color-navy-900`    | `#060e38` | Hero background             |
| `--dt-color-teal-500`    | `#54c9c2` | Accent cyan                 |
| `--dt-color-surface-50`  | `#f6f8fa` | Alt section background      |
| `--dt-color-surface-100` | `#eef4ff` | Soft blue background        |
| `--dt-color-surface-200` | `#d6e1ff` | Blue surface                |

### Typography Tokens

| Token                       | Value                                              | Notes                    |
| :-------------------------- | :------------------------------------------------- | :----------------------- |
| `--font-sans`               | Quicksand, Arial, Helvetica, system-ui             | Primary font             |
| `--font-mono`               | SFMono-Regular, Menlo, Monaco, Consolas            | Code font                |
| `--dt-font-size-xs`         | `12px`                                             | Captions, metadata       |
| `--dt-font-size-sm`         | `14px`                                             | Body small, buttons sm   |
| `--dt-font-size-base`       | `16px`                                             | Body standard, buttons   |
| `--dt-font-size-lg`         | `18px`                                             | Body large               |
| `--dt-font-size-xl`         | `20px`                                             | Heading 3                |
| `--dt-font-size-2xl`        | `24px`                                             | Heading 3 (24px)         |
| `--dt-font-size-3xl`        | `28px`                                             | Heading 2                |
| `--dt-font-size-4xl`        | `36px`                                             | Heading 1                |
| `--dt-font-size-5xl`        | `44px`                                             | Display 2                |
| `--dt-font-size-6xl`        | `56px`                                             | Display 1 (hero)         |
| `--dt-font-weight-normal`   | `400`                                              | Button labels            |
| `--dt-font-weight-medium`   | `500`                                              | Body, links, navigation  |
| `--dt-font-weight-semibold` | `600`                                              | Heading 3                |
| `--dt-font-weight-bold`     | `700`                                              | Headings, display        |

### Spacing Tokens

Base unit: `4px`. Scale:

| Token             | Value | Use                          |
| :---------------- | :---- | :--------------------------- |
| `--dt-spacing-0`  | `0px` | Reset                        |
| `--dt-spacing-1`  | `4px` | Micro gaps, icon margins     |
| `--dt-spacing-2`  | `8px` | Tight padding, form spacing  |
| `--dt-spacing-3`  | `12px`| Internal padding             |
| `--dt-spacing-4`  | `16px`| Standard padding, nav items  |
| `--dt-spacing-5`  | `20px`| Card inner padding           |
| `--dt-spacing-6`  | `24px`| Section gaps, card spacing   |
| `--dt-spacing-7`  | `32px`| Medium section separation    |
| `--dt-spacing-8`  | `32px`| (alias)                      |
| `--dt-spacing-10` | `40px`| Major section margins        |
| `--dt-spacing-12` | `48px`| Between related sections     |
| `--dt-spacing-16` | `64px`| Major section breaks         |
| `--dt-spacing-20` | `80px`| Large blocks                 |
| `--dt-spacing-24` | `96px`| Hero padding                 |

### Border Radius Tokens

| Token               | Value  | Use                              |
| :------------------ | :----- | :------------------------------- |
| `--dt-radius-sm`    | `4px`  | Buttons, inputs, small cards     |
| `--dt-radius-md`    | `8px`  | Standard cards, containers       |
| `--dt-radius-lg`    | `16px` | Feature cards, modals            |
| `--dt-radius-full`  | `9999px`| Pills, circular elements        |

### Shadow Tokens

Shadows use `rgba(0,0,0,…)` black-based values. Increase on interaction.

| Token                | Value                                    | Use                              |
| :------------------- | :--------------------------------------- | :------------------------------- |
| `--dt-shadow-subtle` | `rgba(0,0,0,0.08) 0px 2px 4px 0px`      | Secondary cards, subtle lift     |
| `--dt-shadow-soft`   | `rgba(0,0,0,0.16) 0px 4px 8px 0px`      | Primary cards, dropdowns         |
| `--dt-shadow-glass`  | `rgba(0,0,0,0.24) 0px 8px 16px 0px`     | Hover cards, modals              |
| `--dt-shadow-elevation` | `rgba(0,0,0,0.32) 0px 12px 24px 0px` | Modals, floating elements        |

## 3. Color Palette & Roles

### Primary

- **Deep Navy** (`#172b4d`): Primary text, headings, structural elements; trust and professionalism
- **Primary Blue** (`#447aff`): Interactive elements, CTAs, links, focus states
- **Electric Blue** (`#375de7`): Secondary primary variant for emphasis

### Accent Colors

- **Cyan** (`#54c9c2`): Highlights, gradient overlays, premium features
- **Warm Gold** (`#ffc400`): Positive messaging, curriculum highlights

### Neutral Scale

- **White** (`#ffffff`): Primary background, text overlay on dark surfaces
- **Light Gray** (`#f6f8fa`): Subtle background surfaces, alternate sections
- **Medium Light Gray** (`#ebecf0`): Container backgrounds, inactive surfaces
- **Gray Border** (`#c9d1d9`): Borders, dividers, structural elements
- **Slate Gray** (`#97a0af`): Muted text, secondary labels, disabled text
- **Dark Gray** (`#6b778c`): Secondary text, metadata, supporting copy

### Semantic / Status

- **Error** (`#cf222e`): Error notifications, validation failures
- **Warning** (`#ffab00`): Warning notifications, cautionary messaging
- **Success** (`#2da44e`): Positive confirmations
- **Info** (`#375de7`): Informational messaging

## 4. Typography Rules

### Font Family

**Primary:** Quicksand — `https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap`
**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif
**Code:** "SF Mono", Monaco, Inconsolata, "Fira Code", monospace

### Hierarchy

| Role         | Font      | Size  | Weight | Line Height | Letter Spacing | Notes                             |
| :----------- | :-------- | :---- | :----- | :---------- | :------------- | :-------------------------------- |
| Display 1    | Quicksand | 56px  | 700    | 1.19        | -0.5px         | Hero headlines, main page titles  |
| Display 2    | Quicksand | 44px  | 700    | 1.18        | -0.3px         | Section headings, feature titles  |
| Heading 1    | Quicksand | 36px  | 700    | 1.18        | -0.2px         | Primary section titles            |
| Heading 2    | Quicksand | 28px  | 700    | 1.18        | 0px            | Secondary subsection titles       |
| Heading 3    | Quicksand | 24px  | 600    | 1.2         | 0px            | Tertiary headings                 |
| Body Regular | Quicksand | 16px  | 500    | 1.5         | 0px            | Main body copy                    |
| Body Small   | Quicksand | 14px  | 500    | 1.5         | 0px            | Secondary body text               |
| Button       | Quicksand | 16px  | 400    | 1.5         | 0px            | Button labels                     |
| Button Small | Quicksand | 14px  | 400    | 1.5         | 0px            | Compact button variants           |
| Link         | Quicksand | 16px  | 500    | 1.5         | 0px            | Navigation links, inline links    |
| Caption      | Quicksand | 12px  | 500    | 1.5         | 0.2px          | Image captions, metadata          |
| Code         | Monospace | 13px  | 400    | 1.5         | 0px            | Inline and block code             |

### Principles

- Quicksand's rounded letterforms reinforce the approachable, friendly brand tone
- Weight progression 400 → 500 → 600 → 700 creates clear hierarchy without font switching
- Negative letter spacing at display sizes tightens large headlines for impact
- Minimum 16px body text for readability
- Minimum 44px line height on all interactive text for accessibility

## 5. Component Styling

### Buttons

#### Primary Button (`variant="default"`)

- **Background:** `#447aff`
- **Text Color:** `#ffffff`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `5px 16px`
- **Border Radius:** `4px`
- **Border:** `1px solid #447aff`
- **Height:** `36px`
- **Line Height:** `24px`
- **Hover:** Background darkens to `#375de7`, subtle `translateY(-2px)`
- **Active:** Background compresses to `#2e5db8`
- **Disabled:** Background `#c9d1d9`, text `#6b778c`
- **Focus:** `0 0 0 2px #ffffff, 0 0 0 4px #447aff`

#### Secondary Button (`variant="outline"`)

- **Background:** transparent
- **Text Color:** `#172b4d`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `8px 16px`
- **Border Radius:** `4px`
- **Border:** `1px solid #172b4d`
- **Height:** auto
- **Line Height:** `24px`
- **Hover:** Background `#f6f8fa`, border remains `#172b4d`
- **Active:** Background `#ebecf0`
- **Disabled:** Border `#c9d1d9`, text `#97a0af`

#### Ghost Button (`variant="ghost"`)

- **Background:** transparent
- **Text Color:** `#172b4d`
- **Font Weight:** `700`
- **Padding:** `0px`
- **Border Radius:** `0px`
- **Border:** none
- **Hover:** Text transitions to `#447aff`, underline appears

#### Destructive Button (`variant="destructive"`)

- **Background:** `#cf222e`
- **Text Color:** `#ffffff`
- **Font Weight:** `400`
- **Padding:** `5px 16px`
- **Border Radius:** `4px`
- **Border:** `1px solid #cf222e`
- **Hover:** Background darkens

#### Icon Button

- **Background:** transparent
- **Icon Color:** `#172b4d`
- **Padding:** `8px`
- **Border Radius:** `50%` (circular)
- **Size:** `40px × 40px`
- **Hover:** Background `#f6f8fa`
- **Focus:** `0 0 0 2px #ffffff, 0 0 0 4px #447aff`

### Cards & Containers

#### Standard Card

- **Background:** `#ffffff`
- **Border:** `1px solid #c9d1d9`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0,0,0,0.16) 0px 4px 8px 0px`
- **Hover:** Shadow increases to `rgba(0,0,0,0.24) 0px 8px 16px 0px`

#### Branded Card

- **Background:** `#e7ecfc`
- **Border:** `1px solid #375de7`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0,0,0,0.08) 0px 2px 4px 0px`

#### Dark Hero Section

- **Background:** `#172b4d` → `#060e38` gradient
- **Text Color:** `#ffffff`
- **Padding:** `96px 24px`
- **Border Radius:** `0px` (full width)

### Inputs & Forms

#### Text Input

- **Background:** `#ffffff`
- **Border:** `1px solid #c9d1d9`
- **Border Radius:** `4px`
- **Padding:** `8px 12px`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Font Family:** Quicksand
- **Line Height:** `24px`
- **Text Color:** `#172b4d`
- **Placeholder Color:** `#97a0af`
- **Focus:** Border becomes `#447aff`, box shadow `0 0 0 2px rgba(68,122,255,0.2)`
- **Error:** Border becomes `#cf222e`, text color `#cf222e`
- **Disabled:** Background `#ebecf0`, text `#97a0af`, border `#c9d1d9`

#### Form Label

- **Font Size:** `14px`
- **Font Weight:** `500`
- **Color:** `#172b4d`
- **Margin Bottom:** `8px`
- **Display:** block

#### Form Error Message

- **Font Size:** `12px`
- **Font Weight:** `400`
- **Color:** `#cf222e`
- **Margin Top:** `4px`

### Navigation

#### Header Link

- **Background:** transparent
- **Text Color:** `#172b4d`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `4px 0px`
- **Height:** `32px`
- **Hover:** Text becomes `#447aff`, underline `2px solid`
- **Active:** Text `#447aff`, underline persistent
- **Focus:** Text `#447aff`, outline `2px solid #447aff`

#### Mobile Navigation Item

- **Background:** `#ffffff` (default), `#f6f8fa` (hover)
- **Text Color:** `#172b4d`
- **Font Weight:** `500`
- **Padding:** `12px 16px`
- **Border Left:** `4px solid transparent` (default), `4px solid #447aff` (active)
- **Active:** Background `#e7ecfc`

### Badges

#### Primary Badge

- **Background:** `#e7ecfc`
- **Text Color:** `#375de7`
- **Font Size:** `12px`
- **Font Weight:** `600`
- **Padding:** `4px 8px`
- **Border Radius:** `50px` (pill)
- **Border:** `1px solid #375de7`

#### Status Badges

| Status    | Background | Text Color |
| :-------- | :--------- | :--------- |
| Success   | `#e6f4ea`  | `#2da44e`  |
| Warning   | `#fff8c5`  | `#ffab00`  |
| Error     | `#ffebee`  | `#cf222e`  |

### Tabs

#### Tab Nav Container

- **Background:** `#ffffff`
- **Border Bottom:** `2px solid #c9d1d9`
- **Display:** flex

#### Tab Item

- **Background:** transparent
- **Text Color:** `#6b778c`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `12px 16px`
- **Border Bottom:** `2px solid transparent` (default)
- **Hover:** Text `#172b4d`, border bottom appears
- **Active:** Text `#447aff`, border bottom `2px solid #447aff`

## 6. Layout Principles

### Spacing System

Base unit: `4px`. Common values: `4px, 8px, 16px, 24px, 32px, 64px, 96px`.

| Context             | Values               |
| :------------------ | :------------------- |
| Micro (inline)      | `4px`                |
| Tight (forms)       | `8px`                |
| Standard (padding)  | `16px`               |
| Section gaps        | `24px`               |
| Medium separation   | `32px`               |
| Major breaks        | `64px`               |
| Hero padding        | `96px`               |

### Grid & Container

- **Max Width:** `1200px`
- **Gutter:** `24px`
- **Columns:** 12-column responsive grid
- **Container Padding:** `24px` (mobile) → `32px` (tablet) → `48px` (desktop)

### Border Radius Scale

| Value   | Use                                    |
| :------ | :------------------------------------- |
| `0px`   | Full-width containers, hero sections   |
| `4px`   | Buttons, inputs, small cards           |
| `8px`   | Standard cards, containers             |
| `12px`  | Feature cards, prominent containers    |
| `16px`  | Large cards, modals                    |
| `50%`   | Circular buttons, avatars              |
| `50px`  | Pills (badges only)                    |

## 7. Depth & Elevation

| Level     | Treatment                                | Use                                   |
| :-------- | :--------------------------------------- | :------------------------------------ |
| None      | No shadow                                | Text-only sections, flat backgrounds  |
| Subtle    | `rgba(0,0,0,0.08) 0px 2px 4px 0px`      | Secondary cards, subtle elevation     |
| Standard  | `rgba(0,0,0,0.16) 0px 4px 8px 0px`      | Primary cards, dropdowns              |
| Elevated  | `rgba(0,0,0,0.24) 0px 8px 16px 0px`     | Hover states, modals                  |
| High      | `rgba(0,0,0,0.32) 0px 12px 24px 0px`    | Modal dialogs, FABs                   |
| Maximum   | `rgba(0,0,0,0.40) 0px 16px 32px 0px`    | Critical modals, toast notifications  |

Shadows increase on interaction (hover, focus) for tactile feedback. Dark hero sections avoid shadows.

## 8. Tailwind Utility Reference

| Utility                      | Token                     | Example                         |
| :--------------------------- | :------------------------ | :------------------------------ |
| `bg-primary`                 | `--primary`               | Primary button bg               |
| `text-primary-foreground`    | `--primary-foreground`    | Text on primary                 |
| `bg-secondary`               | `--secondary`             | Secondary fill                  |
| `bg-muted`                   | `--muted`                 | Subtle backgrounds              |
| `text-muted-foreground`      | `--muted-foreground`      | Disabled/secondary text         |
| `bg-accent`                  | `--accent`                | Hover tint                      |
| `border-border`              | `--border`                | Standard border                 |
| `ring-ring`                  | `--ring`                  | Focus ring                      |
| `shadow-subtle`              | `--dt-shadow-subtle`      | Subtle shadow                   |
| `shadow-soft`                | `--dt-shadow-soft`        | Card shadow                     |
| `shadow-glass`               | `--dt-shadow-glass`       | Elevated shadow                 |
| `rounded-sm`                 | `4px`                     | Buttons, inputs                 |
| `rounded-md`                 | `8px`                     | Cards                           |
| `rounded-lg`                 | `16px`                    | Feature cards                   |
| `rounded-full`               | `9999px`                  | Pills, circles                  |
| `text-xs` … `text-6xl`      | `--dt-font-size-*`        | Typography scale                |
| `font-sans`                  | `--font-sans`             | Quicksand                       |
| `font-mono`                  | `--font-mono`             | Code font                       |

### CSS Utility Classes

| Class                   | Description                                      |
| :---------------------- | :----------------------------------------------- |
| `.nrc-shell`            | Full-width wrapper with subtle gradient bg        |
| `.nrc-card`             | White bg + hairline border + 8px radius           |
| `.nrc-card-subtle`      | Muted bg + hairline border + 8px radius           |
| `.nrc-shell-panel`      | Panel container (same as nrc-card)                |
| `.nrc-pill`             | Pill shape with hover transition                  |
| `.nrc-nav-link`         | Nav link with transparent border and hover state  |
| `.nrc-nav-link-active`  | Active nav link with bottom indicator             |
| `.nrc-hero`             | Dark hero section (brand-hero bg)                 |
| `.nrc-hero-tab`         | Hero tab with transparent border                  |
| `.nrc-hero-tab-active`  | Active hero tab (white bg, dark text)             |
| `.nrc-focus-ring`       | Focus ring (`0 0 0 3px rgba(68,122,255,0.2)`)    |
| `.nrc-note`             | Muted note box                                    |
| `.nrc-note-danger`      | Red-tinted danger note box                        |

## 9. Responsive Behavior

### Breakpoints

| Name    | Width           | Changes                                                              |
| :------ | :-------------- | :------------------------------------------------------------------- |
| Mobile  | `320px–639px`   | Single column, `24px` padding, stacked nav, `16px` base text         |
| Tablet  | `640px–1023px`  | Two-column, `32px` padding, expanded nav                             |
| Desktop | `1024px–1439px` | Multi-column, `48px` padding, full nav, `1200px` container           |
| Wide    | `1440px+`       | `1400px` max container, `64px` padding                               |

### Touch Targets

- **Minimum:** `44px × 44px` (WCAG 2.5 Level AAA)
- **Comfortable:** `48px × 48px` for mobile
- **Spacing between targets:** minimum `8px`

### Collapsing Strategy

- **Hero padding:** `96px` → `64px` → `48px`
- **Section padding:** `64px` → `48px` → `32px`
- **Typography:** headings reduce 2–4px per breakpoint
- **Columns:** 3 → 2 → 1
- **Navigation:** horizontal → hamburger drawer
- **Container margins:** `24px` → `32px` → `48px`

## 10. Do's and Don'ts

### Do

- Use `#447aff` for all interactive states — links, buttons, focus outlines, active navigation
- Establish hierarchy through Quicksand font weight — 700 for headings, 500 for body, 400 for buttons
- Maintain minimum `36px` height for all touch targets
- Apply generous padding (`24px+`) inside sections
- Use `#f6f8fa` backgrounds for alternate sections
- Include focus outlines on all interactive elements — `0 0 0 2px #fff, 0 0 0 4px #447aff` on dark
- Combine `1px #c9d1d9` border with `rgba(0,0,0,0.16) 0px 4px 8px 0px` shadow for cards
- Reserve dark navy (`#172b4d`) for primary text and structure
- Test contrast ratios — WCAG AA minimum 4.5:1

### Don't

- Don't mix fonts — stick exclusively to Quicksand
- Never use pure black (`#000000`) for body text — use `#172b4d` or `#24292f`
- Don't apply shadows to full-width hero sections
- Never disable focus outlines for "aesthetic" reasons
- Don't combine multiple accent colors in a single component
- Don't use font sizes below `12px`
- Don't use gray text (`#6b778c`) for primary CTAs
- Avoid rounded borders greater than `16px` on rectangular elements

## 11. Agent Prompt Guide

### Quick Reference

- "Modern, professional NRC web interface with Quicksand typography"
- "Deep navy (#172b4d) text on white/blue backgrounds"
- "Blue (#447aff) interactive elements, 4px radius buttons with 1px blue border"
- "Cards: white bg, 1px #c9d1d9 border, 8px radius, soft shadow"
- "Alternate sections with #f6f8fa background"

### Example Prompts

- "Create a primary button with #447aff background, white text, 4px radius, 1px solid #447aff border, 5px 16px padding. Hover: darkens to #375de7."
- "Create a secondary button with transparent background, #172b4d text, 4px radius, 1px solid #172b4d border."
- "Create a card with white background, 1px solid #c9d1d9 border, 8px radius, 24px padding, and rgba(0,0,0,0.16) 0px 4px 8px shadow."
- "Create a form input with white bg, 1px solid #c9d1d9 border, 4px radius, 8px 12px padding. Focus: #447aff border + glow."
- "Create a data table with #f6f8fa header, faint row dividers, no boxed cells."
- "Create a hero section with #172b4d to #060e38 gradient, 96px padding, white text."
