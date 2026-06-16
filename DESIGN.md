<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: Delivery Driver App
description: A calm, reliable offline-first mobile tool for delivery drivers.
---

# Design System: Delivery Driver App

## 1. Overview

**Creative North Star: "The Clear Day at Sea"**

The interface is built for motion, sunlight, and one-handed decisions. Like a well-maintained harbor on a clear day, it feels orderly, legible, and quietly confident. Every screen has a single job, and nothing competes for attention unless it requires action. The visual system favors cool neutrals and a disciplined navy accent, warmed only by small, purposeful highlights that signal caution or progress.

This is a restrained product palette: most of the surface is neutral, the primary accent is used sparingly, and semantic color (success, warning, error) is reserved for status that needs immediate reading. Motion is minimal by default and respects reduced-motion settings; transitions exist only to confirm state changes.

**Key Characteristics:**
- One task per screen, with a clear primary action.
- High-contrast, glance-first hierarchy for outdoor use.
- Restrained color: navy primary, warm amber functional accent, neutral surfaces.
- Single warm humanist sans family for labels, body, and headings.
- Flat, tonal layering instead of decorative shadows.
- Reduced motion as the default; animations only for feedback.

## 2. Colors

The palette is cool and utility-driven, with a warm amber functional accent for warnings and progress. Exact values will be resolved during implementation in OKLCH.

### Primary
- **Cool Navy** ([to be resolved during implementation]): Primary actions, selected navigation, active progress, and the core brand signal. Used on ≤10% of any screen.

### Secondary / Accent
- **Warm Amber** ([to be resolved during implementation]): Warnings, pending states, in-progress badges, and highlights that need to cut through outdoor glare. Distinct from the navy in both hue and lightness.

### Neutral
- **White** ([to be resolved during implementation]): Primary background. Pure or near-pure white to maximize readability in sunlight.
- **Cool Surface Gray** ([to be resolved during implementation]): Cards, panels, and section backgrounds. Slightly darker than the background, tinted toward the navy hue family.
- **Cool Ink** ([to be resolved during implementation]): Body text, headings, and primary labels. Must meet ≥7:1 contrast against the white background.
- **Muted Cool Gray** ([to be resolved during implementation]): Secondary text, placeholders, and disabled states. Must remain legible in direct sunlight.

### Semantic
- **Success Green** ([to be resolved during implementation]): Delivered, confirmed, online, synced.
- **Warning Amber** ([to be resolved during implementation]): Pending, retry, low battery, slow sync.
- **Error Red** ([to be resolved during implementation]): Failed delivery, sync error, critical alert.

### Named Rules
**The 10% Voice Rule.** The navy primary is the brand voice; it should occupy no more than 10% of an average screen. Its rarity is what makes call-to-actions readable at a glance.

**The Sunlight Rule.** Every text-to-background pairing must pass WCAG 2.2 AA at minimum, and primary operational text should target AAA. The app is used outdoors first.

## 3. Typography

**Font Family:** Single warm humanist sans ([font to be chosen at implementation]; e.g., Inter, SF Pro, or a humanist alternative with warm curves).

**Character:** Friendly, open, and extremely legible at small sizes. One family carries everything from large status numbers to tiny labels, differentiated by weight and size rather than by switching typefaces.

### Hierarchy
- **Display** ([to be resolved]): Large status numbers and hero counts only (e.g., "12 pending"). Used sparingly.
- **Headline** ([to be resolved]): Screen titles and major section headers.
- **Title** ([to be resolved]): Card titles, customer names, order IDs.
- **Body** ([to be resolved]): Addresses, instructions, descriptions. Keep line length short; this is mobile prose.
- **Label** ([to be resolved]): Buttons, badges, form labels, tab text. May use medium weight and slightly tighter tracking for clarity.

### Named Rules
**The One Family Rule.** Use one typeface for the entire app. Contrast comes from weight and size, not from pairing.

## 4. Elevation

The system is flat by default. Depth is conveyed through tonal shifts (white → cool surface gray) rather than shadows. If shadows are introduced later, they should be subtle, diffuse, and reserved for overlays or modals that genuinely need to sit above the content layer.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Elevation is a state, not a decoration.

## 5. Components

<!-- Components will be documented here once they exist in the codebase. Re-run /impeccable document in scan mode after the first screens are built. -->

## 6. Do's and Don'ts

### Do:
- **Do** use the navy primary only for primary actions and the current selection.
- **Do** ensure every operational text element remains readable in direct sunlight.
- **Do** use large touch targets (at least 44×44 dp) for every interactive element.
- **Do** keep primary actions within one-handed thumb reach on common phone sizes.
- **Do** respect system font-size and reduced-motion preferences.
- **Do** use plain, operational language on buttons and labels.

### Don't:
- **Don't** use dense dashboard-style interfaces with small touch targets and information overload.
- **Don't** use aggressive gamification, celebratory animations, or playful illustrations.
- **Don't** default to dark mode aesthetics designed for indoor tools.
- **Don't** use undifferentiated generic SaaS cream-and-blue palettes.
- **Don't** use gradient text or side-stripe accent borders.
- **Don't** animate anything that doesn't convey a state change.
