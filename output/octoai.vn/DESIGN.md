# Design System Inspired by OctoAI

## 1. Visual Theme & Atmosphere

OctoAI embodies a modern, intelligent, and futuristic design language centered on approachable AI technology. The visual theme blends soft gradients with bold typography, creating an atmosphere of innovation tempered by accessibility. The use of light periwinkle and lavender backgrounds paired with vibrant purple accents conveys sophistication and forward-thinking technology. Playful, rounded elements—like the OctoAI mascot and button treatments—humanize the AI experience, while generous whitespace and clear hierarchy ensure clarity and focus. The overall mood is welcoming yet powerful, balancing technical capability with user-friendly design.

**Key Characteristics**

- Soft gradient backgrounds transitioning from light periwinkle to lavender
- Bold, oversized display typography for impact
- Fully rounded buttons (pill-shaped) for a friendly, modern aesthetic
- Generous whitespace and breathing room throughout
- Layered glassmorphic and neumorphic depth effects
- Vibrant blue and purple accent colors on neutral backgrounds
- Playful illustration style with gradient-filled character elements
- High contrast text for readability and hierarchy

## 2. Color Palette & Roles

### Primary

- **Primary Blue** (`#1447E6`): Main interactive elements, primary CTAs, and brand-critical links
- **Vibrant Purple** (`#5925DC`): Secondary emphasis, complementary accents, alternative CTAs

### Accent Colors

- **Rich Blue** (`#4D66D4`): Mid-tone interactive states, secondary navigation, hover effects
- **Deep Navy** (`#182230`): Dark headings, primary text on light backgrounds
- **Ultra Dark Navy** (`#080B1E`): Maximum contrast text, premium dark mode support

### Interactive

- **Secondary Navy** (`#475467`): Body text, descriptions, secondary content on light backgrounds
- **Purple Link** (`#5925DC`): Default link color, interactive text elements

### Neutral Scale

- **Pure White** (`#FFFFFF`): Primary background, card surfaces, neutral container fills
- **Almost White** (`#F6F8FF`): Subtle background tint, light container backgrounds, off-white surfaces
- **Off White** (`#FAFAFA`): Secondary backgrounds, slightly distinguished surface layers
- **Light Gray** (`#F5F5F5`): Tertiary backgrounds, disabled states, subtle borders
- **Mid Gray** (`#E5E5E5`): Border colors, dividers, subtle separator lines
- **Dark Gray** (`#212121`): Primary dark mode text, high-contrast headings
- **Very Dark Gray** (`#171717`): Secondary dark mode text, body copy on dark backgrounds
- **Pure Black** (`#0A0A0A`): Darkest neutral, maximum contrast backgrounds, deep shadows

### Surface & Borders

- **Light Periwinkle Background** (`#F6F8FF`): Page backgrounds, large container fills, section separators
- **Lavender Gradient Zone**: Visual metaphor for design surface (light blue-purple gradient area)

### Status & Semantic

- **Warning** (`#F99C00`): Warning messages, caution states, non-critical alerts
- **Warning Alternative** (`#FCBB00`): Secondary warning highlighting, alert accents
- **Error** (`#E40014`): Error messages, destructive actions, critical alerts
- **Success** (`#009588`): Confirmation states, positive outcomes, success indicators

## 3. Typography Rules

### Font Family

- **Primary Font**: Plus Jakarta Sans (sans-serif stack: `Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Fallback Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`

### Hierarchy

| Role               | Font                 | Size | Weight | Line Height | Letter Spacing | Notes                                                   |
| ------------------ | -------------------- | ---- | ------ | ----------- | -------------- | ------------------------------------------------------- |
| **Display / Hero** | Plus Jakarta Sans    | 96px | 500    | 96px        | 0px            | Large hero titles, main page headings, brand statements |
| **Heading 1**      | Plus Jakarta Sans    | 48px | 600    | 56px        | -0.5px         | Section titles, major content divisions                 |
| **Heading 2**      | Plus Jakarta Sans    | 32px | 600    | 40px        | -0.3px         | Subsection titles, card headers                         |
| **Heading 3**      | Plus Jakarta Sans    | 24px | 600    | 32px        | 0px            | Component titles, smaller headings                      |
| **Body Large**     | Plus Jakarta Sans    | 18px | 400    | 28px        | 0px            | Large body text, introductory paragraphs                |
| **Body**           | Plus Jakarta Sans    | 16px | 400    | 24px        | 0px            | Standard body copy, descriptions                        |
| **Body Small**     | Plus Jakarta Sans    | 14px | 400    | 24px        | 0px            | Secondary body text, captions, metadata                 |
| **Button**         | Plus Jakarta Sans    | 16px | 700    | 20px        | 0.5px          | All button labels, call-to-action text                  |
| **Link**           | Plus Jakarta Sans    | 16px | 600    | 24px        | 0px            | Hyperlinks, navigation items                            |
| **Label**          | Plus Jakarta Sans    | 12px | 600    | 16px        | 0.5px          | Form labels, badges, small tags                         |
| **Code**           | Fira Code, monospace | 14px | 400    | 24px        | 0px            | Monospace code blocks, technical snippets               |

### Principles

- **Weight Distribution**: Use weight 400 for body content, 600 for headings/labels, 700 for buttons to create clear hierarchy
- **Line Height**: Maintain 1.5x font size for body text (24px line height for 16px body) to ensure readability
- **Letter Spacing**: Apply subtle negative tracking (-0.5px) to large display text; use 0.5px for buttons to improve visual balance
- **Color Hierarchy**: Pair dark navy (`#182230`) text with light backgrounds; use white text on dark backgrounds
- **Accessibility**: Ensure minimum 16px on mobile for body text; maintain 4.5:1 contrast ratio for all text

## 4. Component Stylings

### Buttons

#### Primary Button

```
Background Color: #FFFFFF with 30% opacity (rgba(255, 255, 255, 0.3))
Text Color: #212121
Font Size: 16px
Font Weight: 700
Font Family: Plus Jakarta Sans
Padding: 16px 32px
Border Radius: 9999px (fully rounded)
Border: none
Box Shadow: rgba(255, 255, 255, 0.8) -2.422px -2.422px 2.422px inset, rgba(255, 255, 255, 0.8) 2.422px 2.422px 2.422px inset, rgba(255, 255, 255, 0.5) -2.422px -2.422px 12.109px inset, rgba(255, 255, 255, 0.5) 2.422px 2.422px 12.109px inset, rgba(0, 0, 0, 0.03) -7.266px -7.266px 14.531px inset, rgba(0, 0, 0, 0.03) 7.266px 7.266px 14.531px inset, rgba(0, 0, 0, 0.12) 0px 29.063px 58.125px
Height: 52px
Line Height: 20px
Hover State: Increase opacity to 40%, add subtle scale (1.02)
Active State: Decrease opacity to 20%, add inset shadow enhancement
Disabled State: Opacity 50%, cursor not-allowed, reduce text contrast
```

#### Secondary Button (Dark Variant)

```
Background Color: rgba(51, 51, 51, 0.3)
Text Color: #FFFFFF
Font Size: 16px
Font Weight: 700
Font Family: Plus Jakarta Sans
Padding: 16px 32px
Border Radius: 9999px
Border: none
Box Shadow: (same as primary)
Height: 52px
Line Height: 20px
Hover State: Increase background opacity to 45%, light text glow
Active State: Decrease background opacity to 15%
```

#### Compact Button

```
Background Color: rgba(255, 255, 255, 0.3)
Text Color: #212121
Font Size: 16px
Font Weight: 700
Padding: 12px 32px
Border Radius: 9999px
Height: 44px
Box Shadow: (same as primary)
Use for dense layouts, secondary actions
```

#### Ghost Link Button

```
Background Color: transparent
Text Color: #5925DC
Font Size: 16px
Font Weight: 600
Padding: 8px 8px
Border Radius: 0px
Border: none
Box Shadow: none
Line Height: 24px
Hover State: Background color rgba(89, 37, 220, 0.1), slight underline
Active State: Text color #1447E6
```

### Cards & Containers

#### Base Card

```
Background Color: #FFFFFF
Border: 1px solid #E5E5E5
Border Radius: 16px
Padding: 24px
Box Shadow: 0px 4px 12px rgba(0, 0, 0, 0.08)
Hover State: Box shadow 0px 8px 24px rgba(0, 0, 0, 0.12)
Transition: box-shadow 200ms ease-in-out
```

#### Elevated Card (Glass Effect)

```
Background Color: rgba(255, 255, 255, 0.7)
Backdrop Filter: blur(12px)
Border: 1px solid rgba(255, 255, 255, 0.5)
Border Radius: 16px
Padding: 24px
Box Shadow: 0px 8px 32px rgba(0, 0, 0, 0.1)
```

#### Surface Container

```
Background Color: #F6F8FF
Border Radius: 12px
Padding: 20px
Border: 1px solid #E5E5E5
Use for form containers, info boxes, grouped content
```

### Inputs & Forms

#### Text Input

```
Background Color: #FFFFFF
Border: 1px solid #E5E5E5
Border Radius: 8px
Padding: 12px 16px
Font Size: 16px
Font Family: Plus Jakarta Sans
Color: #212121
Focus State: Border color #1447E6, box-shadow 0px 0px 0px 3px rgba(20, 71, 230, 0.1)
Placeholder Color: #A8A8A8
Disabled State: Background #F5F5F5, border #E5E5E5, color #A8A8A8
```

#### Form Label

```
Font Size: 12px
Font Weight: 600
Color: #182230
Margin Bottom: 8px
Display: block
```

#### Form Group Container

```
Display: flex
Flex Direction: column
Gap: 12px
Margin Bottom: 20px
```

### Navigation

#### Navigation Bar

```
Background Color: rgba(255, 255, 255, 0.8)
Backdrop Filter: blur(8px)
Border Bottom: 1px solid rgba(229, 229, 229, 0.3)
Padding: 16px 32px
Display: flex
Align Items: center
Gap: 32px
Height: 64px
Position: sticky, top 0
Z Index: 100
```

#### Navigation Link

```
Font Size: 16px
Font Weight: 600
Color: #182230
Text Decoration: none
Padding: 8px 12px
Border Radius: 4px
Transition: all 200ms ease
Hover State: Color #1447E6, background rgba(20, 71, 230, 0.05)
Active State: Color #1447E6, border-bottom 2px solid #1447E6
```

#### Logo

```
Font Size: 20px
Font Weight: 700
Color: #182230
Display: flex
Align Items: center
Gap: 8px
```

## 5. Layout Principles

### Spacing System

**Base Unit**: 4px

**Scale Progression**:

- **4px**: Micro spacing (icon padding, tight gaps)
- **8px**: XS spacing (small gaps, tight component padding)
- **12px**: S spacing (compact padding, input padding)
- **16px**: M spacing (standard gap, moderate padding)
- **20px**: L spacing (card internal padding)
- **24px**: XL spacing (section padding, card padding)
- **32px**: 2XL spacing (major padding, container sides)
- **40px**: 3XL spacing (section margins, major layout gaps)
- **52px**: 4XL spacing (section separation)
- **60px**: 5XL spacing (major page section gaps)

**Usage Context**:

- Micro (4px–8px): Icon sizing, tight button spacing
- Compact (12px–16px): Form inputs, small components
- Standard (20px–32px): Cards, containers, general padding
- Generous (40px–60px): Page sections, hero areas, vertical rhythm

### Grid & Container

- **Max Width**: 1440px for main content container
- **Column Strategy**: 12-column responsive grid
  - Desktop (1200px+): 12 columns, 32px gutter
  - Tablet (768px–1199px): 8 columns, 24px gutter
  - Mobile (< 768px): 4 columns, 16px gutter
- **Section Pattern**: Full-width containers with inner 1440px max-width wrapper
- **Horizontal Padding**: 32px on desktop, 24px on tablet, 16px on mobile
- **Vertical Rhythm**: 60px spacing between major sections, 40px for subsections

### Whitespace Philosophy

Whitespace is treated as a design element, not empty space. The system emphasizes breathing room around content to improve clarity and reduce cognitive load. Large headlines are given generous margin above and below (40px–60px). Content cards maintain internal padding of 20px–32px to avoid cramping. Section-to-section gaps use 52px–60px to create visual separation. This approach supports the intelligent, uncluttered aesthetic of OctoAI.

### Border Radius Scale

- **0px**: No radius (default, rare)
- **4px**: Tight radius (small badges, minimal rounding)
- **8px**: Small radius (input fields, small buttons, tight components)
- **12px**: Medium radius (cards, containers, moderate components)
- **16px**: Large radius (card containers, prominent containers)
- **20px**: Extra-large radius (large feature cards, hero sections)
- **9999px**: Fully rounded (pill buttons, circular elements, badges)

## 6. Depth & Elevation

| Level            | Treatment                                                                                                                                                     | Use                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Flat (0)**     | No shadow, solid background                                                                                                                                   | Base surfaces, neutral backgrounds               |
| **Raised (1)**   | `0px 2px 4px rgba(0, 0, 0, 0.06)`                                                                                                                             | Small components, tags, labels                   |
| **Card (2)**     | `0px 4px 12px rgba(0, 0, 0, 0.08)`                                                                                                                            | Cards, input fields, small containers            |
| **Elevated (3)** | `0px 8px 24px rgba(0, 0, 0, 0.12)`                                                                                                                            | Hovered cards, modals, major containers          |
| **Modal (4)**    | `0px 12px 40px rgba(0, 0, 0, 0.16)`                                                                                                                           | Modals, dropdowns, overlays, popovers            |
| **Floating (5)** | `0px 16px 56px rgba(0, 0, 0, 0.20)`                                                                                                                           | Floating action buttons, top-level overlays      |
| **Neumorphic**   | `rgba(255, 255, 255, 0.8) -2.422px -2.422px 2.422px inset, rgba(255, 255, 255, 0.8) 2.422px 2.422px 2.422px inset, rgba(0, 0, 0, 0.12) 0px 29.063px 58.125px` | Primary buttons, premium surfaces, hero elements |

**Shadow Philosophy**: OctoAI uses subtle, layered shadows to create depth without heaviness. The neumorphic technique (combined inset and outset shadows) is reserved for primary interactive elements like buttons and featured cards, creating a premium, tactile feel. Standard elevation shadows are soft and diffused, emphasizing a modern, flat aesthetic. All shadows use low-opacity dark colors to maintain the light, airy aesthetic.

## 7. Do's and Don'ts

### Do

- **Do** use the full-rounded (`9999px`) button style for all primary and secondary CTAs to maintain brand consistency
- **Do** apply generous whitespace (32px–60px) between major sections to create breathing room
- **Do** pair dark navy (`#182230`) text with light backgrounds and white text with dark backgrounds for maximum contrast
- **Do** use the neumorphic button shadow treatment on primary interactive elements to add premium depth
- **Do** keep typography hierarchy clear by limiting font sizes to the defined scale (12px, 14px, 16px, 18px, 24px, 32px, 48px, 96px)
- **Do** use #F6F8FF light periwinkle for secondary backgrounds and page section containers
- **Do** maintain consistent 16px padding for form inputs and 20px–24px for card interiors
- **Do** apply subtle blur (8px–12px) and reduced opacity to glassmorphic surfaces for depth
- **Do** use 16px grid gutters on mobile, 24px on tablet, 32px on desktop for responsive consistency
- **Do** reserve warning colors (#F99C00, #FCBB00) strictly for caution/alert states, not general UI

### Don't

- **Don't** use font sizes outside the defined scale; keep to the hierarchy table values only
- **Don't** reduce button padding below 12px; maintain minimum 44px height for touch targets
- **Don't** combine multiple shadow levels on a single element; choose one elevation level
- **Don't** use pure black (`#000000`) for text; use `#212121` or `#182230` for softer contrast
- **Don't** apply border-radius below 8px on input fields or cards; maintain minimum 8px for clarity
- **Don't** mix glassmorphic and neumorphic effects on the same component; pick one treatment
- **Don't** use opacity-based transparency on buttons below 25%; maintain visual readability
- **Don't** reduce section spacing below 40px vertically; avoid cramped layouts
- **Don't** apply error color (#E40014) to non-critical messaging; reserve for validation failures
- **Don't** place body text smaller than 14px; maintain 14px minimum for accessibility
- **Don't** override the Plus Jakarta Sans font stack; maintain font consistency across all text

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name   | Width         | Key Changes                                                                                         |
| ----------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| **Mobile**        | < 768px       | 4 columns, 16px horizontal padding, single-column layouts, 32px section gaps                        |
| **Tablet**        | 768px–1199px  | 8 columns, 24px horizontal padding, 2-column stacks, 40px section gaps, reduced font sizes by 1–2px |
| **Desktop**       | 1200px–1439px | 12 columns, 32px horizontal padding, multi-column grids, 60px section gaps, full typography scale   |
| **Large Desktop** | 1440px+       | 12 columns in 1440px max-width container, 40px outer padding, maximum spacing                       |

### Touch Targets

- **Minimum Touch Size**: 44px × 44px for all interactive elements (buttons, links, form inputs)
- **Comfortable Touch Size**: 48px–56px for primary buttons and frequently used controls
- **Tap Spacing**: 8px minimum gap between adjacent touch targets to prevent accidental activation
- **Icon Buttons**: 40px × 40px minimum with 16px icon interior
- **Form Fields**: 44px–52px height with 12px–16px internal padding

### Collapsing Strategy

- **Navigation**: Hamburger menu trigger at 768px breakpoint; collapse horizontal nav to vertical stack
- **Grid Layouts**: 2–3 column layouts on desktop collapse to single column on mobile (< 768px)
- **Spacing Reduction**: Section margins reduce from 60px (desktop) to 40px (tablet) to 32px (mobile)
- **Font Scaling**: Display size remains 48px on tablet/mobile; body text reduces from 16px to 14px on mobile
- **Button Width**: Full-width buttons (100%) on mobile; fixed width or auto on desktop
- **Container Padding**: 32px desktop → 24px tablet → 16px mobile
- **Hero Section**: Hero text remains impact on mobile but reduces to 48px display; adjust line-height proportionally
- **Images & Media**: Responsive images scale to 100% container width; maintain aspect ratios with CSS aspect-ratio property
- **Modal/Overlay**: Full viewport on mobile, max 90% width; fixed max-width 600px on desktop with centered positioning

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA**: Primary Blue (`#1447E6`)
- **Secondary CTA**: Vibrant Purple (`#5925DC`)
- **Background**: Pure White (`#FFFFFF`)
- **Secondary Background**: Almost White (`#F6F8FF`)
- **Heading Text**: Deep Navy (`#182230`)
- **Body Text**: Secondary Navy (`#475467`)
- **Links**: Purple Link (`#5925DC`)
- **Borders**: Mid Gray (`#E5E5E5`)
- **Error**: Error (`#E40014`)
- **Warning**: Warning (`#F99C00`)
- **Success**: Success (`#009588`)

### Iteration Guide

1. **Typography Foundation**: All text must use Plus Jakarta Sans with weights 400 (body), 600 (headings/links), 700 (buttons). Enforce size scale: 12px, 14px, 16px, 18px, 24px, 32px, 48px, 96px only. Line-height = 1.5× font size for body.
2. **Button Treatment**: Every button must be fully rounded (`border-radius: 9999px`), 44px–52px height, with 16px–32px horizontal padding. Apply neumorphic shadow stack to primary buttons only. Use `background: rgba(255,255,255,0.3)` for light buttons, `rgba(51,51,51,0.3)` for dark buttons.
3. **Color Hierarchy**: Dark navy text (`#182230`) on light backgrounds; white text on dark backgrounds. Maintain 4.5:1 contrast minimum. Use blue (`#1447E6`) and purple (`#5925DC`) for interactive states and focus indicators.
4. **Spacing Consistency**: Build using 4px base unit scale (8px, 12px, 16px, 20px, 24px, 32px, 40px, 52px, 60px). Interior card padding = 20px–24px; section margins = 40px–60px; touch targets = 44px minimum; gutters = 16px (mobile), 24px (tablet), 32px (desktop).
5. **Layout Grids**: Responsive 12-column grid with max-width 1440px. Desktop: 32px padding + 32px gutter. Tablet: 24px padding + 24px gutter. Mobile: 16px padding + 16px gutter. Stack all columns to single column below 768px.
6. **Shadow & Depth**: Reserve neumorphic shadow for premium elements (primary buttons, hero cards). Use standard shadows: `0px 4px 12px rgba(0,0,0,0.08)` for cards, `0px 8px 24px rgba(0,0,0,0.12)` for hover states. No more than one shadow per element.
7. **Form Components**: Input fields: 44px–52px height, 12px–16px padding, 8px border-radius, 1px `#E5E5E5` border. Focus state: `#1447E6` border + `0px 0px 0px 3px rgba(20,71,230,0.1)` glow. Labels: 12px weight-600 color `#182230`, 8px margin-below.
8. **Navigation Bar**: Sticky positioning, 64px height, `rgba(255,255,255,0.8)` background with `blur(8px)` backdrop. Navigation links: 16px weight-600 color `#182230` with hover state `#1447E6` + light background. Collapse to hamburger menu at 768px.
9. **Responsive Enforcement**: Mobile-first development. All elements: 44px+ touch targets. Fonts: Never below 14px on mobile. Sections: 32px gap mobile, 40px tablet, 60px desktop. Test: flex-wrap for grids, width: 100% for mobile containers, clamp() for scalable typography. Max-width 1440px for large screens.
