# LedgerCraft Design Tokens & Figma Implementation Specs

> **Implementation status:** This is a frontend design reference. No frontend source code exists in this repository, and these tokens do not create backend behaviour.
**Design System Version:** 1.0.0 (`Precision Ledger`)  
**Target Platform:** Desktop Web (1440px / 1280px Grid)  
**Primary Color Seed:** `#0d9488` (Teal 600)  
**Font Family:** Inter (`sans-serif`)

This document is structured for direct copy-paste into Figma Tokens Studio, Figma Variables (Color / Number / String / Boolean modes), and Auto-Layout component assembly.

---

## 1. Color Variables & Token Mapping (Figma Native Variables)

### 1.1 Brand & Accent Tokens
| Figma Variable Name | Hex Code | Opacity | Semantic Role / Usage |
| :--- | :--- | :--- | :--- |
| `brand/primary/default` | `#0d9488` | 100% | Primary buttons, active nav pills, key brand accents |
| `brand/primary/hover` | `#0f766e` | 100% | Hover state for primary buttons & links |
| `brand/primary/active` | `#115e59` | 100% | Pressed state for primary interactive elements |
| `brand/primary/subtle` | `#f0fdfa` | 100% | Light teal background tint for badges, selected rows |
| `brand/primary/border` | `#99f6e4` | 100% | Focus rings, active border highlights |
| `brand/accent/mint` | `#2dd4bf` | 100% | Secondary metrics, positive financial delta accents |
| `brand/vault/dark` | `#042f2e` | 100% | Showcase backgrounds, deep navy/teal contrast panels |

### 1.2 Neutral & Surface Hierarchy (Light Mode Canvas)
| Figma Variable Name | Hex Code | Tailwind Equivalent | Semantic Role / Usage |
| :--- | :--- | :--- | :--- |
| `surface/canvas` | `#f8f9ff` | `bg-surface` | Default workspace and page background |
| `surface/container/lowest`| `#ffffff` | `bg-white` | Elevated cards, input fields, modal dialogs |
| `surface/container/low` | `#f1f5f9` | `bg-slate-100` | Sub-panels, secondary containers, inactive tabs |
| `surface/container/high` | `#e2e8f0` | `bg-slate-200` | Dividers, chip backgrounds, disabled control fills |
| `border/subtle` | `#e2e8f0` | `border-slate-200` | Standard card borders, grid dividers, table lines |
| `border/strong` | `#cbd5e1` | `border-slate-300` | Input borders, interactive container outlines |

### 1.3 Text & Icon Tokens
| Figma Variable Name | Hex Code | Figma Style Name | Usage |
| :--- | :--- | :--- | :--- |
| `text/primary` | `#0f172a` | `Slate / 900` | Page titles, primary numbers, body text |
| `text/secondary` | `#475569` | `Slate / 600` | Supporting descriptions, table subheadings |
| `text/muted` | `#94a3b8` | `Slate / 400` | Placeholders, inactive icons, timestamps |
| `text/inverse` | `#ffffff` | `White` | Text on primary buttons, showcase panel text |
| `text/brand` | `#0d9488` | `Teal / 600` | Hyperlinks, active tab labels |

### 1.4 Financial Status & Alert Tokens
| Figma Variable Name | Hex Code | Semantic Role | Usage |
| :--- | :--- | :--- | :--- |
| `status/positive/text` | `#16a34a` | Green 600 | Inflows, positive balance, settled splits |
| `status/positive/bg` | `#dcfce7` | Green 100 | Positive badge container |
| `status/negative/text` | `#dc2626` | Red 600 | Over-budget warnings, pending debt, outflows |
| `status/negative/bg` | `#fee2e2` | Red 100 | Warning / error badge container |
| `status/warning/text` | `#d97706` | Amber 600 | Budget approaching limit (80-99%) |
| `status/warning/bg` | `#fef3c7` | Amber 100 | Warning badge container |

---

## 2. Typography Hierarchy (Figma Text Styles)

**Font Family:** `Inter` (Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)

| Figma Style Name | Weight | Size (px / pt) | Line Height (px) | Letter Spacing | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Display/Hero` | Bold (700) | `32px` | `40px` | `-0.02em` | Auth showcase headers, marketing hero |
| `Heading/Page Title` | SemiBold (600) | `24px` | `32px` | `-0.015em` | Main dashboard & settings page titles |
| `Heading/Section` | SemiBold (600) | `18px` | `24px` | `-0.01em` | Card section titles, modal headers |
| `Heading/Subsection`| Medium (500) | `15px` | `20px` | `0` | Table headers, list grouping labels |
| `Body/Default` | Regular (400) | `14px` | `20px` | `0` | Primary table rows, form inputs, descriptions |
| `Body/Medium` | Medium (500) | `14px` | `20px` | `0` | Form labels, button copy, nav links |
| `Body/Small` | Regular (400) | `12px` | `16px` | `+0.01em` | Helper notes, timestamp badges, footer links |
| `Numbers/Stat Large` | Bold (700) | `28px` | `36px` | `-0.02em` | Net balance, total budget metrics |
| `Numbers/Mono Row` | Medium (500) | `14px` | `20px` | `0` (Tabular) | Transaction currency columns (`$ USD`, `₦ NGN`)|

---

## 3. Spacing, Radii & Elevation (Figma Number Variables)

### 3.1 Spacing Scale (8pt / 4pt Grid)
- `space-1`: `4px` (Tight icon gap, pill padding)
- `space-2`: `8px` (Badge vertical padding, row spacing)
- `space-3`: `12px` (Input vertical padding, card inner gutter)
- `space-4`: `16px` (Default input horizontal padding, card content padding)
- `space-6`: `24px` (Section gap, card margin)
- `space-8`: `32px` (Page header margin, modal container padding)
- `space-12`: `48px` (Screen major column separation)

### 3.2 Corner Radii
- `radius-sm`: `6px` (Buttons, form input fields, badges)
- `radius-md`: `8px` (Dropdown menus, notification toasts)
- `radius-lg`: `12px` (Standard dashboard cards, data tables)
- `radius-xl`: `16px` (Modal dialogs, popovers)
- `radius-full`: `9999px` (Avatars, pills, status indicators)

### 3.3 Elevation / Drop Shadows
- **Shadow 1 (Subtle / Card Outline):**
  - X: `0`, Y: `1px`, Blur: `2px`, Spread: `0`, Color: `rgba(15, 23, 42, 0.04)`
- **Shadow 2 (Dropdown / Popover):**
  - X: `0`, Y: `4px`, Blur: `12px`, Spread: `-2px`, Color: `rgba(15, 23, 42, 0.08)`
- **Shadow 3 (Modal / Floating Action Button):**
  - X: `0`, Y: `12px`, Blur: `24px`, Spread: `-4px`, Color: `rgba(15, 23, 42, 0.12)`

---

## 4. Component Layout Specifications (Figma Auto-Layout Properties)

### 4.1 Global Navigation Header (Top Nav Bar)
- **Auto-Layout Direction:** Horizontal (`Row`)
- **Dimensions:** Width = `Fill container` (100%), Height = `64px` Fixed
- **Padding:** Top/Bottom = `0px`, Left/Right = `24px`
- **Primary Elements & Alignment:**
  - **Left Group:** Space between `16px` — Logo (`32x32px`), App Title (`16px SemiBold`), Divider (`1px x 24px`), Nav Links (`Home`, `Expenses`, `Budgets`, `Splits`).
  - **Right Group:** Space between `12px` — Currency Selector Pill (`USD/NGN`), Search icon button, Notification bell button, User Avatar (`32x32px circle`).
- **Fill / Stroke:** Fill = `#ffffff`, Bottom Stroke = `1px solid #e2e8f0`.

### 4.2 Form Input Fields
- **Auto-Layout Direction:** Vertical (`Column`), Gap = `6px`
- **Label:** `14px Medium`, Color = `#0f172a`
- **Input Container:**
  - Direction: Horizontal, Alignment: Center Left
  - Width: `Fill container`, Height: `40px` (or `44px` touch target)
  - Padding: Horizontal = `14px`, Vertical = `10px`
  - Fill: `#ffffff`, Stroke: `1px solid #cbd5e1`
  - Corner Radius: `6px`
  - Placeholder Text: `14px Regular`, Color = `#94a3b8`
  - Focus State: Stroke = `2px solid #0d9488`, Shadow = `0 0 0 3px rgba(13, 148, 136, 0.15)`

### 4.3 Action Buttons
- **Primary Button:**
  - Direction: Horizontal, Center Aligned, Gap = `8px`
  - Padding: Horizontal = `16px`, Vertical = `10px`
  - Fill: `#0d9488`, Radius: `6px`
  - Typography: `14px Medium`, Color: `#ffffff`
  - Hover: Fill `#0f766e`
- **Secondary / Outline Button:**
  - Padding: Horizontal = `16px`, Vertical = `10px`
  - Fill: `#ffffff`, Stroke: `1px solid #e2e8f0`, Radius: `6px`
  - Typography: `14px Medium`, Color: `#0f172a`
  - Hover: Fill `#f8f9ff`, Stroke `#cbd5e1`

### 4.4 Data Table & Expense Row (Minimal UX)
- **Table Container:** Fill = `#ffffff`, Stroke = `1px solid #e2e8f0`, Radius = `12px`
- **Header Row:**
  - Height = `40px`, Fill = `#f8f9ff`, Border Bottom = `1px solid #e2e8f0`
  - Padding: Horizontal = `20px`
  - Column Text: `12px Medium`, Color = `#475569`, Uppercase / Clean
- **Data Row:**
  - Height = `56px`, Border Bottom = `1px solid #f1f5f9`
  - Padding: Horizontal = `20px`, Gap = `16px`
  - Left Col: Category Icon (`32x32px rounded-lg bg-teal-50`) + Payee name (`14px Medium`)
  - Center Col: Date & Split Tag (`12px Regular Slate 400`)
  - Right Col: Dual-Currency Amount (`14px SemiBold Slate 900` + Subtext in secondary currency)
  - Hover State: Fill = `#f8faff`

### 4.5 Dual-Currency Pill Indicator
- **Auto-Layout:** Horizontal, Center Aligned, Gap = `6px`
- **Padding:** Horizontal = `10px`, Vertical = `4px`
- **Fill:** `#f0fdfa` (Teal 50), Border = `1px solid #ccfbf1`
- **Corner Radius:** `9999px` (Pill)
- **Dot:** `6x6px` Circle, Fill = `#0d9488`
- **Text:** `12px Medium`, Color = `#0f766e`, Content = `USD • NGN Live Sync`

---

## 5. Instructions for Figma Import Plugins

1. **Using "html.to.design" or "HTML to Figma":**
   - In Figma, launch the plugin and select your screen from the LedgerCraft canvas preview URL.
   - The plugin will parse the DOM directly into auto-layout frames matching the exact padding and dimensions above.
2. **Using "Tokens Studio for Figma" (Figma Tokens):**
   - Copy Section 1 and Section 3 into a JSON tokens format, or map the exact Hex codes into Figma's native **Variables** panel under the collection name `LedgerCraft / Core`.
3. **Using Vector Assets:**
   - The LedgerCraft emblem is available as pure vector SVG on the canvas. Simply copy the SVG path directly into Figma for a native vector node.
