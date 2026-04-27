# Design System Inspired by STEAM for Vietnam

## 1. Visual Theme & Atmosphere

The STEAM for Vietnam design system embodies a modern, tech-forward aesthetic rooted in educational accessibility and innovation. The visual language combines deep navy foundations with vibrant gradient accents—particularly cyan and magenta tones—creating an energetic yet professional atmosphere. The design celebrates AI and advanced education through smooth, contemporary typography and generous whitespace, evoking a sense of possibility and growth. Soft, approachable elements coexist with bold color statements, making complex technology feel welcoming to educators and students alike. The overall mood is inspiring, inclusive, and forward-thinking—balancing playfulness with credibility.

**Key Characteristics**

- Deep navy and midnight blue dominance with cyan and magenta accents
- Clean, rounded geometric forms with subtle glowing effects
- Generous whitespace and clear visual hierarchy
- Friendly yet professional tone
- Technology-forward imagery with approachable illustrations
- Emphasis on clarity and accessibility for educational content

## 2. Color Palette & Roles

### Primary

- **Deep Navy** (`#172B4D`): Primary foundation for headings, text, and structural elements; establishes trust and professionalism
- **Primary Blue** (`#447AFF`): Primary interactive elements, CTAs, links, and focus states; drives engagement
- **Electric Blue** (`#375DE7`): Secondary primary variant for emphasis and visual hierarchy

### Accent Colors

- **Cyan Glow** (`#00D4FF`): Vibrant accent for highlights, gradient overlays, and premium features; associated with STEAM 3.0 Global
- **Magenta Accent** (`#FF00FF`): Gradient component accent for AI-forward branding and dynamic visual elements
- **Warm Gold** (`#FFC400`): Accent for STEAM 2.0 AI curriculum highlighting and positive messaging
- **Coral Red** (`#FF4757`): Accent for STEAM 1.0 Computer Science + Robotics designation

### Interactive

- **Link Blue** (`#447AFF`): Standard link color for navigation and inline interactions
- **Danger Red** (`#CF222E`): Error states and destructive actions; semantic warning indicator
- **Alternative Danger** (`#D0021B`): Secondary error state indicator for critical feedback

### Neutral Scale

- **White** (`#FFFFFF`): Primary background and text overlay on dark surfaces; ensures contrast
- **Light Gray** (`#F6F8FA`): Subtle background surfaces for sections and alternative areas
- **Medium Light Gray** (`#EBECF0`): Secondary container backgrounds and inactive element surfaces
- **Gray Border** (`#C9D1D9`): Borders, dividers, and subtle structural elements
- **Medium Gray** (`#C1C7D0`): Secondary borders and less prominent dividers
- **Slate Gray** (`#97A0AF`): Muted text, secondary labels, and disabled state text
- **Dark Gray** (`#6B778C`): Secondary text, metadata, and supporting copy
- **Charcoal** (`#24292F`): High-contrast dark text on light backgrounds
- **Pure Black** (`#000000`): Maximum contrast text and critical definitions

### Surface & Borders

- **Card Background Light** (`#E7ECFC`): Subtle branded card backgrounds maintaining visual cohesion
- **Divider Subtle** (`#C9D1D9`): Horizontal dividers and container borders
- **Surface Accent** (`#06E38`): Midnight background for hero sections and dramatic visual contrast

### Semantic / Status

- **Error** (`#CF222E`): Error notifications, validation failures, critical alerts
- **Warning** (`#FFAB00`): Warning notifications and cautionary messaging
- **Success** (Inferred `#2DA44E`): Positive confirmations and successful state indicators
- **Info** (Inferred `#375DE7`): Informational messaging and neutral alerts

## 3. Typography Rules

### Font Family

**Primary:** Quicksand (sans-serif) — [https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap)
**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif

**Secondary (Code):** Monospace stack — "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace

### Hierarchy

| Role         | Font      | Size | Weight | Line Height | Letter Spacing | Notes                             |
| ------------ | --------- | ---- | ------ | ----------- | -------------- | --------------------------------- |
| Display 1    | Quicksand | 56px | 700    | 66.56px     | -0.5px         | Hero headlines, main page titles  |
| Display 2    | Quicksand | 44px | 700    | 51.92px     | -0.3px         | Section headings, feature titles  |
| Heading 1    | Quicksand | 36px | 700    | 42.48px     | -0.2px         | Primary section titles            |
| Heading 2    | Quicksand | 28px | 700    | 33.12px     | 0px            | Secondary subsection titles       |
| Heading 3    | Quicksand | 24px | 600    | 28.8px      | 0px            | Tertiary headings                 |
| Body Regular | Quicksand | 16px | 500    | 24px        | 0px            | Main body copy, standard text     |
| Body Small   | Quicksand | 14px | 500    | 20.88px     | 0px            | Secondary body text, descriptions |
| Button       | Quicksand | 16px | 400    | 24px        | 0px            | All button labels                 |
| Button Small | Quicksand | 14px | 400    | 20.88px     | 0px            | Compact button variants           |
| Link         | Quicksand | 16px | 500    | 24px        | 0px            | Navigation links, inline links    |
| Caption      | Quicksand | 12px | 500    | 17.92px     | 0.2px          | Image captions, metadata          |
| Code         | Monospace | 13px | 400    | 19.5px      | 0px            | Inline and block code             |

### Principles

- **Generous line height** ensures readability across all screen sizes and promotes visual breathing room
- **Consistent weight progression** (400 → 500 → 600 → 700) creates clear hierarchy without font switching
- **Negative letter spacing at display sizes** tightens large headlines for visual impact
- **Quicksand's rounded letterforms** reinforce the approachable, friendly brand tone
- **All text sizes scale linearly** to maintain proportional relationships at responsive breakpoints
- **Minimum 44px line height** on all interactive text for accessibility compliance

## 4. Component Stylings

### Buttons

#### Primary Button

- **Background:** `#447AFF` (`rgb(68, 122, 255)`)
- **Text Color:** `#FFFFFF`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `5px 16px`
- **Border Radius:** `4px`
- **Border:** `1px solid #447AFF`
- **Height:** `36px`
- **Line Height:** `24px`
- **Hover State:** Background darkens to `#375DE7`
- **Active State:** Background compresses to `#2E5DB8` with inset shadow
- **Disabled State:** Background becomes `#C9D1D9`, text becomes `#6B778C`
- **Focus State:** `0 0 0 2px #FFFFFF, 0 0 0 4px #447AFF`

#### Secondary Button

- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#172B4D`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `8px 16px`
- **Border Radius:** `4px`
- **Border:** `1px solid #172B4D`
- **Height:** Auto
- **Line Height:** `24px`
- **Hover State:** Background becomes `#F6F8FA`, border remains `#172B4D`
- **Active State:** Background becomes `#EBECF0`
- **Disabled State:** Border becomes `#C9D1D9`, text becomes `#97A0AF`

#### Ghost Button

- **Background:** `rgba(0, 0, 0, 0)`
- **Text Color:** `#FFFFFF` (on dark backgrounds) or `#172B4D` (on light backgrounds)
- **Font Size:** `16px`
- **Font Weight:** `700`
- **Padding:** `0px` (text only)
- **Border Radius:** `0px`
- **Border:** None
- **Height:** `24px`
- **Line Height:** `24px`
- **Hover State:** Text color transitions to `#447AFF` or `#FFFFFF` with underline
- **Active State:** Underline persistent, opacity `0.8`

#### Icon Button

- **Background:** `rgba(0, 0, 0, 0)`
- **Icon Color:** `#172B4D`
- **Padding:** `8px`
- **Border Radius:** `50%` (circular)
- **Border:** None
- **Size:** `40px × 40px`
- **Hover State:** Background becomes `#F6F8FA`
- **Focus State:** `0 0 0 2px #FFFFFF, 0 0 0 4px #447AFF`

### Cards & Containers

#### Standard Card

- **Background:** `#FFFFFF`
- **Border:** `1px solid #C9D1D9`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0, 0, 0, 0.16) 0px 4px 8px 0px`
- **Hover State:** Box shadow increases to `rgba(0, 0, 0, 0.24) 0px 8px 16px 0px`

#### Branded Card (Light Accent)

- **Background:** `#E7ECFC`
- **Border:** `1px solid #375DE7`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0, 0, 0, 0.08) 0px 2px 4px 0px`

#### Dark Hero Section

- **Background:** `#172B4D` (linear gradient to `#060E38`)
- **Text Color:** `#FFFFFF`
- **Padding:** `96px 24px`
- **Border Radius:** `0px` (full width)
- **Box Shadow:** None

#### Section Container

- **Background:** `#F6F8FA` or transparent
- **Padding:** `64px 24px`
- **Max Width:** `1200px`
- **Margin:** `0 auto`
- **Border Radius:** `0px`

### Inputs & Forms

#### Text Input

- **Background:** `#FFFFFF`
- **Border:** `1px solid #C9D1D9`
- **Border Radius:** `4px`
- **Padding:** `8px 12px`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Font Family:** Quicksand
- **Line Height:** `24px`
- **Text Color:** `#172B4D`
- **Placeholder Color:** `#97A0AF`
- **Focus State:** Border becomes `#447AFF`, box shadow `0 0 0 2px rgba(68, 122, 255, 0.2)`
- **Error State:** Border becomes `#CF222E`, text color `#CF222E`
- **Disabled State:** Background becomes `#EBECF0`, text becomes `#97A0AF`, border becomes `#C9D1D9`

#### Textarea

- **Background:** `#FFFFFF`
- **Border:** `1px solid #C9D1D9`
- **Border Radius:** `4px`
- **Padding:** `12px`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Font Family:** Quicksand
- **Line Height:** `20.88px`
- **Min Height:** `120px`
- **Resize:** `vertical`
- **Focus State:** Border becomes `#447AFF`, box shadow `0 0 0 2px rgba(68, 122, 255, 0.2)`

#### Form Label

- **Font Size:** `14px`
- **Font Weight:** `500`
- **Color:** `#172B4D`
- **Margin Bottom:** `8px`
- **Display:** `block`
- **Line Height:** `20.88px`

#### Form Error Message

- **Font Size:** `12px`
- **Font Weight:** `400`
- **Color:** `#CF222E`
- **Margin Top:** `4px`
- **Line Height:** `17.92px`

### Navigation

#### Header Navigation Link

- **Background:** Transparent
- **Text Color:** `#172B4D`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `4px 0px`
- **Height:** `32px`
- **Line Height:** `24px`
- **Border Bottom:** None (default)
- **Hover State:** Text color becomes `#447AFF`, underline appears (2px solid)
- **Active State:** Text color `#447AFF`, underline persistent
- **Focus State:** Text color `#447AFF`, outline `2px solid #447AFF`

#### Mobile Navigation Item

- **Background:** `#FFFFFF` (default), `#F6F8FA` (hover)
- **Text Color:** `#172B4D`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `12px 16px`
- **Border Left:** `4px solid transparent` (default), `4px solid #447AFF` (active)
- **Hover State:** Background becomes `#EBECF0`, border remains transparent
- **Active State:** Border becomes `4px solid #447AFF`, background becomes `#E7ECFC`

#### Dropdown Menu Container

- **Background:** `#FFFFFF`
- **Border:** `1px solid #C9D1D9`
- **Border Radius:** `4px`
- **Box Shadow:** `rgba(0, 0, 0, 0.16) 0px 4px 8px 0px`
- **Padding:** `8px 0px`
- **Min Width:** `200px`

#### Dropdown Menu Item

- **Padding:** `8px 16px`
- **Font Size:** `14px`
- **Font Weight:** `500`
- **Color:** `#172B4D`
- **Hover State:** Background becomes `#F6F8FA`
- **Active State:** Background becomes `#E7ECFC`, text becomes `#447AFF`

### Badge

#### Primary Badge

- **Background:** `#E7ECFC`
- **Text Color:** `#375DE7`
- **Font Size:** `12px`
- **Font Weight:** `600`
- **Padding:** `4px 8px`
- **Border Radius:** `50px`
- **Border:** `1px solid #375DE7`
- **Line Height:** `17.92px`

#### Status Badge (Success)

- **Background:** `#E6F4EA`
- **Text Color:** `#2DA44E`
- **Font Size:** `12px`
- **Font Weight:** `600`
- **Padding:** `4px 8px`
- **Border Radius:** `50px`
- **Line Height:** `17.92px`

#### Status Badge (Warning)

- **Background:** `#FFF8C5`
- **Text Color:** `#FFAB00`
- **Font Size:** `12px`
- **Font Weight:** `600`
- **Padding:** `4px 8px`
- **Border Radius:** `50px`
- **Line Height:** `17.92px`

#### Status Badge (Error)

- **Background:** `#FFEBEE`
- **Text Color:** `#CF222E`
- **Font Size:** `12px`
- **Font Weight:** `600`
- **Padding:** `4px 8px`
- **Border Radius:** `50px`
- **Line Height:** `17.92px`

### Tabs

#### Tab Nav Container

- **Background:** `#FFFFFF`
- **Border Bottom:** `2px solid #C9D1D9`
- **Display:** `flex`
- **Overflow:** `auto`

#### Tab Item

- **Background:** Transparent
- **Text Color:** `#6B778C`
- **Font Size:** `16px`
- **Font Weight:** `500`
- **Padding:** `12px 16px`
- **Border Bottom:** `2px solid transparent` (default)
- **Hover State:** Text color becomes `#172B4D`, border bottom appears
- **Active State:** Text color `#447AFF`, border bottom becomes `2px solid #447AFF`
- **Line Height:** `24px`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

**Scale with Usage Context:**

- `4px`: Micro spacing for inline elements, icon margins
- `8px`: Tight padding, form field internal spacing
- `12px`: Component internal padding, small gaps
- `16px`: Standard component padding, navigation items
- `24px`: Section gaps, card spacing, vertical rhythm
- `32px`: Medium section separation
- `48px`: Between related sections
- `64px`: Major section breaks
- `96px`: Hero padding, full-height section padding
- `144px`: Between major content blocks
- `180px`: Maximum spacing for dramatic visual separation

### Grid & Container

- **Max Width:** `1200px` for primary content containers
- **Gutter Width:** `24px` between columns
- **Column System:** 12-column responsive grid
- **Container Padding:** `24px` on sides (mobile), `32px` on tablet, `48px` on desktop
- **Section Pattern:** Full-width colored backgrounds with centered content containers
- **Nested Containers:** Maintain 24px padding within cards and sections

### Whitespace Philosophy

The design system prioritizes generous whitespace to enhance readability and focus. Breathing room around text and elements prevents cognitive overload, particularly important for educational content. Sections are visually separated through combinations of whitespace, subtle borders, and background color shifts rather than heavy dividing lines. Elements breathe individually within containers, with consistent margins creating visual rhythm. Hero sections and featured content receive expanded whitespace treatment to establish prominence.

### Border Radius Scale

- `0px`: Hard edges for structural elements, full-width containers
- `4px`: Buttons, inputs, small cards, form elements
- `8px`: Standard cards, containers, larger UI surfaces
- `12px`: Feature cards, prominent containers
- `16px`: Extra large card variants, modal dialogs
- `50%`: Circular buttons, avatar badges, toggle indicators
- `50% 50% 0 0`: Rounded top containers (optional modal variants)

## 6. Depth & Elevation

| Level         | Treatment                               | Use                                                        |
| ------------- | --------------------------------------- | ---------------------------------------------------------- |
| None (Flat)   | No shadow                               | Text-only sections, flat backgrounds                       |
| Subtle (sm)   | `rgba(0, 0, 0, 0.08) 0px 2px 4px 0px`   | Secondary cards, subtle elevation                          |
| Standard (md) | `rgba(0, 0, 0, 0.16) 0px 4px 8px 0px`   | Primary cards, dropdown menus, typical components          |
| Elevated (lg) | `rgba(0, 0, 0, 0.24) 0px 8px 16px 0px`  | Hover states on cards, modals (initial)                    |
| High (xl)     | `rgba(0, 0, 0, 0.32) 0px 12px 24px 0px` | Modal dialogs, floating action buttons, prominent overlays |
| Maximum (xxl) | `rgba(0, 0, 0, 0.40) 0px 16px 32px 0px` | Critical modals, toast notifications, top-layer components |

**Shadow Philosophy:** Shadows are used sparingly and subtly to establish layering without overwhelming the visual hierarchy. Most components rely on border and background differentiation rather than shadow depth. Shadows increase on interaction (hover, focus) to provide tactile feedback. Dark hero sections and branded backgrounds deliberately avoid shadows, maintaining flat structural integrity. The standard shadow (`md`) is applied to discrete, interactive surfaces like cards and dropdowns. Elevation is reserved for modal dialogs and floating elements that require clear visual separation from background content.

## 7. Do's and Don'ts

### Do

- **Use `#447AFF` for all interactive states** — links, buttons, focus outlines, active navigation
- **Establish hierarchy through Quicksand font weight** — 700 for headings, 500 for body, 400 for buttons
- **Maintain minimum `36px` height for all touch targets** — exceeds 44px accessibility standard
- **Apply generous padding (`24px+`) inside sections** — ensures content doesn't feel cramped
- **Use `#F6F8FA` backgrounds for alternate sections** — subtle visual separation without harshness
- **Include focus outlines on all interactive elements** — `0 0 0 2px #FFFFFF, 0 0 0 4px #447AFF` on dark, inverse on light
- **Scale typography linearly** — maintain established pixel sizes across breakpoints for proportional harmony
- **Combine borders with soft shadows** for card depth — `1px border + md shadow` is standard
- **Reserve dark navy (`#172B4D`) for primary text and structure** — the system's foundational color
- **Test contrast ratios** — all text meets WCAG AA minimum 4.5:1 on intended backgrounds

### Don't

- **Avoid mixing fonts** — stick exclusively to Quicksand for consistency
- **Never use pure black (`#000000`) for body text** — use `#172B4D` or `#24292F` instead
- **Don't apply shadows to full-width hero sections** — maintains clean, bold visual impact
- **Avoid button padding less than `5px 16px`** — undermines touch target accessibility
- **Never disable the focus outline for "aesthetic" reasons** — keyboard navigation is essential
- **Don't combine multiple accent colors in single component** — choose cyan or magenta, not both
- **Avoid font sizes below `12px`** — violates readability standards
- **Never set line height below `1.4x` the font size** — ensures accessible reading experience
- **Don't use gray text (`#6B778C`) for primary calls to action** — reduce perceived importance
- **Avoid rounded borders greater than `16px` on rectangular elements** — creates "pillbox" appearance that's dated

## 8. Responsive Behavior

### Breakpoints

| Name    | Width           | Key Changes                                                                                |
| ------- | --------------- | ------------------------------------------------------------------------------------------ |
| Mobile  | `320px–639px`   | Single column, `24px` padding, stacked navigation, `16px` base text                        |
| Tablet  | `640px–1023px`  | Two-column layout, `32px` padding, expanded navigation, `18px` base text                   |
| Desktop | `1024px–1439px` | Multi-column layout, `48px` padding, full navigation, `16px` base text, `1200px` container |
| Wide    | `1440px+`       | Max `1400px` container, `64px` padding, expanded whitespace, consistent `16px` base        |

### Touch Targets

- **Minimum Touch Target:** `44px × 44px` (WCAG 2.5 Level AAA compliance)
- **Comfortable Touch Area:** `48px × 48px` for mobile buttons and interactive elements
- **Navigation Items:** `48px` height minimum on mobile, `40px` on desktop
- **Icon Buttons:** `40px × 40px` standard, `48px × 48px` for primary mobile actions
- **Form Inputs:** `36px` height standard (ensures 24px text + 8px padding)
- **Spacing Between Touch Targets:** Minimum `8px` gap to prevent accidental mis-taps

### Collapsing Strategy

- **Hero Padding:** Reduce from `96px` (desktop) → `64px` (tablet) → `48px` (mobile)
- **Section Padding:** Reduce from `64px` → `48px` → `32px`
- **Typography Scale:** Headings reduce by 2–4px per breakpoint (h2: `44px` desktop → `36px` tablet → `28px` mobile)
- **Column Count:** 3-column (desktop) → 2-column (tablet) → 1-column (mobile)
- **Navigation:** Horizontal menu (desktop/tablet) → Hamburger drawer (mobile)
- **Spacing Between Cards:** Reduce from `24px` → `16px` on mobile
- **Container Margins:** `24px` (mobile) → `32px` (tablet) → `48px` (desktop)
- **Font Sizes:** Body text remains `16px` minimum; optimize line height for mobile (`1.5x` vs `1.5x`)
- **Button Groups:** Stack vertically on mobile (full-width), horizontal on tablet+
- **Modal Dialogs:** `90vw` max-width (mobile), `600px` (tablet), `800px` (desktop)

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Primary Blue (`#447AFF`)
- **Secondary CTA:** Secondary Button with border `#172B4D`, text `#172B4D`
- **Background (Light):** White (`#FFFFFF`)
- **Background (Alt Section):** Light Gray (`#F6F8FA`)
- **Background (Branded):** Branded Light (`#E7ECFC`)
- **Background (Dark Hero):** Deep Navy (`#172B4D`) with gradient to Midnight (`#060E38`)
- **Heading Text:** Deep Navy (`#172B4D`)
- **Body Text:** Dark Gray (`#6B778C`) or Charcoal (`#24292F`)
- **Secondary Text:** Slate Gray (`#97A0AF`)
- **Links:** Primary Blue (`#447AFF`)
- **Borders:** Gray Border (`#C9D1D9`)
- **Error State:** Danger Red (`#CF222E`)
- **Warning State:** Warning Gold (`#FFAB00`)
- **Disabled Elements:** Medium Gray (`#C9D1D9`) background, Slate Gray (`#97A0AF`) text

### Iteration Guide

1. **Use Quicksand exclusively** for all typography; fallback to system sans-serif stack
2. **All interactive elements require visible focus states** — minimum `2px solid #447AFF` outline on light backgrounds
3. **Primary buttons are always `#447AFF` background** with `#FFFFFF` text, `5px 16px` padding, `4px` radius
4. **Cards combine `1px solid #C9D1D9` border with `rgba(0, 0, 0, 0.16) 0px 4px 8px 0px` shadow**
5. **Section backgrounds alternate** between `#FFFFFF` and `#F6F8FA` for visual rhythm
6. **Hero sections use deep navy gradient** (`#172B4D` → `#060E38`) with `96px` padding and `#FFFFFF` text
7. **Form inputs require `8px 12px` padding, `4px` radius, and `1px solid #C9D1D9` border** with focus shadow
8. **Navigation links are `16px` weight-500 Quicksand** with underline on active/hover states
9. **All headings use weight-700 Quicksand** — maintain established sizes (Display: `56px`, h1: `36px`, h2: `28px`)
10. **Spacing follows 4px base unit** — common values are `4px, 8px, 16px, 24px, 32px, 64px, 96px`
11. **Touch targets minimum `44px × 44px`** — larger on mobile (`48px`) for comfortable interaction
12. **Shadows increase on hover** — upgrade from `md` to `lg` for interactive card feedback
13. **Disabled states use `#C9D1D9` background and `#97A0AF` text** across all components
14. **Error states transition borders to `#CF222E`** with matching error text color
15. **Maintain line height minimum `1.4x` font size** — ensures readable rhythm across all sizes
