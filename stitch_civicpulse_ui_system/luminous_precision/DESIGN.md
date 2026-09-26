---
name: Luminous Precision
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#47464b'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#77767b'
  outline-variant: '#c8c5cb'
  surface-tint: '#5f5e61'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1e'
  on-primary-container: '#858387'
  inverse-primary: '#c8c5ca'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e1e6'
  primary-fixed-dim: '#c8c5ca'
  on-primary-fixed: '#1b1b1e'
  on-primary-fixed-variant: '#47464a'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.011em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-craft digital minimalism engineered for elite software products. Drawing from the clinical exactitude of Apple hardware interfaces, the purposeful utility of Linear, and the crisp typographical restraint of Vercel, the system communicates uncompromising quality, high execution velocity, and cognitive clarity.

The visual approach merges architectural minimalism with luminous modern surfaces:
- **Atmospheric Clarity:** Surfaces feel weightless and purposeful. Pure whites sit upon barely perceptible warm-zinc field backgrounds to eliminate ocular strain while preserving crisp spatial separation.
- **Precision Engineering:** Hierarchy is articulated through subtle 1px architectural lines, surgical typographic tracking, and meticulous alignment rather than decorative weight or heavy shadows.
- **Controlled Vibrancy:** The interface is predominantly monochrome and quiet, allowing purposeful electric cobalt hits and vivid status indicators to guide attention intuitively.

## Colors

The palette establishes an ultra-refined high-contrast monochrome foundation layered with targeted, high-saturation accents.

### Surface & Neutral Architecture
- **Base Canvas (`#fafafa`):** The ambient field on which modular views rest. Prevents screen glare and elevates pure white modules.
- **Surface Elevation (`#ffffff`):** Reserved for interactive cards, sidebars, modal dialogues, input fields, and elevated panels.
- **Border Gradients & Strokes (`#e4e4e7`, `#f4f4f5`):** Structural 1px division lines. Inner container divisions use `#f4f4f5`; outer card perimeters use `#e4e4e7`.
- **Text Layers:**
  - Primary / Headings: `#09090b` (Deep obsidian zinc with 100% legibility).
  - Secondary / Body: `#71717a` (Neutral zinc, calibrated for reading density).
  - Muted / Meta: `#a1a1aa` (Subtle metadata, keyboard shortcut badges, placeholder states).

### Accent & Functional Accents
- **Primary Action (`#18181b`):** Solid obsidian for core CTAs, commanding attention through weight and stark contrast against light backgrounds.
- **Electric Cobalt Accent (`#2563eb`):** Used deliberately for active navigation indicators, key interactive triggers, link states, selection outlines, and telemetry focus points.
- **Functional Semantics:**
  - Success / Resolved: `#10b981` (Fresh emerald, paired with `#ecfdf5` background tints).
  - Warning / Progress: `#f59e0b` (Warm amber, paired with `#fffbeb` background tints).
  - Critical / Error: `#ef4444` (Pure red, paired with `#fef2f2` background tints).

## Typography

Typography relies on a dual-engine architecture:
- **Plus Jakarta Sans** provides structural elegance, modern geometric curves, and confident presence across Display and Headline scales. Tight negative letter-spacing (`-0.02em` to `-0.035em`) produces the refined, bespoke look signature to top-tier developer and product tools.
- **Inter** handles high-density micro-copy, reading bodies, tables, and navigational labels with neutral clarity, robust tabular numbers (`tnum`), and distinct aperture legibility.

All metric displays, numerical tables, and status counters must strictly enable tabular figure variants (`font-feature-settings: "tnum"`) to preserve vertical balance in data-heavy screens.

## Layout & Spacing

The system utilizes an adaptive 12-column responsive fluid grid pinned to an 8pt modular cadence, with a baseline 4px micro-step for tight atomic components.

### Form Factor Behavior
- **Desktop (1024px+):** Fluid 12-column grid bound to a max-width container of 1440px. 24px (`gutter`) column gutters with 32px (`margin`) boundary margins. Content sections and metrics grids use 3 or 4 equal-column allocations.
- **Tablet (768px - 1023px):** Collapses to 6 columns with 20px gutters and 24px canvas margins. Secondary toolbars and side-panels shift to slide-over drawers or stacked tab bars.
- **Mobile (< 768px):** Single-column stack with 16px (`gutter-mobile` / `margin-mobile`). Multi-metric cards reflow to 2x2 grids or horizontally swipable track containers with snap alignments.

## Elevation & Depth

This design system explicitly rejects dense, multi-layered black drop shadows. Depth is achieved through a combination of luminous white stacking, crisp single-pixel boundary borders, and subtle ambient ground effects:

- **Base Elevation (Level 0):** Flat background `#fafafa` with zero elevation.
- **Contained Surface (Level 1 - Cards, Inset Panels):** `#ffffff` background bounded by a 1px solid stroke of `#e4e4e7`. Ambient drop is executed exclusively through `0 1px 2px 0 rgba(0, 0, 0, 0.03)`.
- **Interactive Hover / Floating Module (Level 2 - Menus, Popovers, Hover Cards):** `#ffffff` with a refined dual-stage outline shadow: `0 0 0 1px rgba(24, 24, 27, 0.06), 0 4px 12px -2px rgba(24, 24, 27, 0.06)`.
- **Top Elevation (Level 3 - Dialogues, Command Palettes):** `#ffffff` surrounded by `0 0 0 1px rgba(24, 24, 27, 0.08), 0 16px 36px -8px rgba(24, 24, 27, 0.12)`. Modals rest on a backdrop blur of `rgba(250, 250, 250, 0.7)` with `backdrop-filter: blur(8px)`.

## Shapes

The design system maintains a consistent balance between soft modern curvature and geometric discipline:
- **Small Controls & Chips:** Bound to `rounded-lg` (8px), preventing elements from appearing circular while softening interaction targets.
- **Cards, Tables, and Inset Containers:** Bound to `rounded-xl` (12px to 16px), giving macro structures a tailored, Apple-grade hardware silhouette.
- **Modals, Sheets, and Command Menus:** Bound to `rounded-2xl` (16px to 24px) with matching inner nested corner radiuses calibrated using the nested radius formula: $R_{inner} = R_{outer} - padding$.
- **Status Dots & Circular Avatars:** Strict full circles (`rounded-full`).

## Components

### Buttons
- **Primary:** Background `#18181b`, foreground `#ffffff`, border `1px solid transparent`. Hover shifts to `#27272a`. Active scale down to `0.985`.
- **Secondary:** Background `#ffffff`, foreground `#09090b`, border `1px solid #e4e4e7`. Hover introduces subtle fill `#f4f4f5` and border `#d4d4d8`.
- **Cobalt Accent Action:** Background `#2563eb`, foreground `#ffffff`, subtle inner highlight. Focus ring `0 0 0 2px #ffffff, 0 0 0 4px #2563eb`.
- **Ghost / Minimal:** Background transparent, foreground `#71717a`. Hover switches to text `#09090b` and background `#f4f4f5`.

### Chips & Segment Pills
- **Segmented Control:** Enclosed container in `#f4f4f5` with 4px inner padding. Active pill segment features pure white background (`#ffffff`), 1px subtle boundary stroke `rgba(0, 0, 0, 0.04)`, soft elevation `0 1px 3px rgba(0, 0, 0, 0.05)`, and text `#09090b`.
- **Status Badges:** Compact 6px vertical padding, 10px horizontal. Uses an 8px circular dot indicator with a pulsing halo on active states. Backgrounds are soft pastels (e.g., `#ecfdf5` for success) with crisp, high-contrast text (`#065f46`).

### Inputs & Select Fields
- Default height 36px (compact) or 40px (standard). Background `#ffffff`, border `1px solid #e4e4e7`, text `#09090b`, placeholder text `#a1a1aa`.
- Active focus state: border color collapses to `#2563eb` with an ultra-diffuse outline `0 0 0 3px rgba(37, 99, 235, 0.12)`.
- Trailing keycap badges (`kbd`) render in `#f4f4f5` with border `1px solid #e4e4e7` and text `#71717a`.

### Cards & Data Metric Tiles
- Surface `#ffffff`, border `1px solid #e4e4e7`, corner radius `16px`, padding 24px.
- Zero heavy solid background headers. Metric blocks place the numerical counter in `Plus Jakarta Sans` 32px (`headline-md`) bold obsidian, paired with a small uppercase label in `label-sm` (`#71717a`) and a clean delta chip (emerald `+12.4%` or amber `0.0%`).

### Checkboxes & Radios
- Box size 16x16px, border `1px solid #d4d4d8`, radius 4px (checkbox) or circular (radio).
- Checked state: background `#18181b` (or `#2563eb` for accent flows), checkmark rendered in pure white `#ffffff` stroke with smooth spring animation.

### Tables & Data Lists
- Borderless outer perimeter fitting flush into parent cards. Rows separated by 1px horizontal borders in `#f4f4f5`.
- Header text uses `label-sm` tracking-wider in `#71717a`, row item text in `body-md` `#09090b`. Row hover trigger creates seamless `#fafafa` wash without shifting layout borders.