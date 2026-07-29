---
name: PUTUL AUTO PARTS AND AUTOSCAN
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#454652'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#767683'
  outline-variant: '#c6c5d4'
  surface-tint: '#4c56af'
  primary: '#000666'
  on-primary: '#ffffff'
  primary-container: '#1a237e'
  on-primary-container: '#8690ee'
  inverse-primary: '#bdc2ff'
  secondary: '#4c616c'
  on-secondary: '#ffffff'
  secondary-container: '#cfe6f2'
  on-secondary-container: '#526772'
  tertiary: '#331000'
  on-tertiary: '#ffffff'
  tertiary-container: '#542000'
  on-tertiary-container: '#fa6d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#343d96'
  secondary-fixed: '#cfe6f2'
  secondary-fixed-dim: '#b4cad6'
  on-secondary-fixed: '#071e27'
  on-secondary-fixed-variant: '#354a53'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#793100'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system for this automotive billing platform is rooted in a **Corporate/Modern** aesthetic, heavily influenced by the structured reliability of Material Design 3. The target audience includes shop owners and technicians who require a high-efficiency Point of Sale (POS) environment. 

The UI evokes an emotional response of **precision, durability, and trust**. By utilizing a refined, systematic approach with ample whitespace and clear structural hierarchy, the design ensures that complex inventory and billing data remain legible and actionable under the fast-paced conditions of an automotive workshop.

## Colors
The palette is engineered for a professional, "industrial-clean" look. 
- **Primary (Deep Automotive Blue):** Used for key actions, navigation headers, and brand identity elements to project stability.
- **Secondary (Mechanical Grey):** Applied to auxiliary UI elements, icons, and metadata to provide a grounded, neutral balance.
- **Tertiary (Safety Orange):** Reserved strictly for critical feedback, such as low-stock alerts, overdue invoices, and high-priority system notifications.
- **Surface & Background:** A base of clean white is accented by light grey (#F8F9FA) to separate container sections and reduce eye strain during prolonged POS use.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-dense environments. The type scale is optimized for a POS interface where scanning speed is vital.
- **Headlines:** Bold and tight-tracked for immediate section recognition.
- **Data Labels:** Medium to Semi-Bold weights are used for field headers and table columns to distinguish metadata from user entry.
- **Numerical Data:** High-contrast weights should be used for pricing and quantities in the billing table to ensure accuracy at a glance.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a standard 12-column structure for desktop and a 4-column structure for mobile. 
- **Spacing Rhythm:** Based on an 8px baseline grid to ensure alignment across all components.
- **POS Optimization:** Large horizontal areas are prioritized for billing tables, while a persistent right-hand sidebar is used for "Summary" and "Finalize Payment" actions on desktop.
- **Margins:** 32px external margins on desktop create a "frame" effect that focuses the user on the central task.

## Elevation & Depth
In line with Material Design 3, this design system uses **Tonal Layers** supplemented by light **Ambient Shadows** to define hierarchy.
- **Level 0 (Background):** #F8F9FA.
- **Level 1 (Cards & Sidebars):** Pure white surface with a very subtle, diffused 4px blur shadow (4% opacity) to lift the billing area from the background.
- **Level 2 (Modals & Overlays):** 8px-12px blur shadows with slightly higher opacity (8%) to draw focus to stock selection or customer creation dialogs.
- **Interactions:** Hover states on list items should utilize a subtle primary-color tint (10% opacity) rather than a shadow increase.

## Shapes
The shape language is **Rounded**, utilizing a 12px-16px corner radius for major containers to soften the industrial nature of the automotive data.
- **Standard Components:** Buttons, input fields, and chips use a 12px radius.
- **Large Containers:** Dashboard cards and billing tables use a 16px radius.
- **Icon Enclosures:** Small circular containers (100% radius) for status indicators.

## Components
- **Buttons:** Primary buttons are Solid Deep Automotive Blue with white text. Secondary buttons use an Outlined style with Mechanical Grey.
- **Data Tables:** Optimized for high-density information. Rows should have a height of 48px-56px with 1px horizontal dividers (#EEEEEE). Alternating "Zebra" striping is discouraged; use hover states for row focus instead.
- **Input Fields:** Filled style with a thick bottom stroke. Active states must use Primary Blue, and error states (low stock/invalid entry) use Safety Orange.
- **Cards:** Used to group "Customer Info," "Vehicle Details," and "Invoice Summary." Cards must have a 1px border (#E0E0E0) to maintain definition on the #F8F9FA background.
- **Status Chips:** Small, rounded badges used to indicate "Paid," "Pending," or "Low Stock." Low stock chips utilize Safety Orange backgrounds with white text for maximum visibility.
- **Quick Action Bar:** A persistent bottom bar for POS shortcuts (e.g., F1 for Search, F12 to Print Invoice).