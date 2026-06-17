# Product

## Register

product

## Users

Delivery drivers for an ecommerce logistics operation. They spend most of their shift outdoors, on foot or on a vehicle, often under direct sunlight, with one hand free and limited attention to spare. Their job is to move orders from the depot to customers reliably and report what happened. They are not power users of technology; they need clarity over density.

## Product Purpose

A mobile app that lets drivers take orders from the depot, deliver them to customers, and mark undelivered orders to return. It works offline-first: actions are recorded locally and synchronized when connectivity returns. The app reduces administrative friction so drivers can focus on the road and the customer.

## Brand Personality

Calm, reliable, human.

- **Calm**: nothing shouts for attention unless it truly needs action.
- **Reliable**: status, next steps, and consequences are always clear.
- **Human**: error states explain what to do; success moments acknowledge the work; language is plain, never robotic.

## Anti-references

- Avoid dense dashboard-style interfaces with small touch targets and information overload.
- Avoid aggressive gamification, celebratory animations, or playful illustrations that trivialize a physically demanding job.
- Avoid dark-mode-by-default aesthetics designed for indoor tools; the app must work in bright daylight.
- Avoid undifferentiated generic SaaS cream-and-blue palettes that feel interchangeable with any productivity app.

## Design Principles

1. **One task per screen.** Every view has a single clear job: take this order, confirm this delivery, report this exception.
2. **Glance first, read second.** Status, progress, and next action must be readable at a glance in sunlight while walking.
3. **Offline is the default assumption.** The interface always shows the local truth and communicates sync state without panic.
4. **Touch for gloves and motion.** Targets are large, forgiving, and reachable one-handed; animations are subtle and respect reduced motion.
5. **Language is operational, not abstract.** Buttons and messages describe what happens next, not system concepts.

## Accessibility & Inclusion

- Target WCAG 2.2 AA as a minimum; AAA contrast for primary action text and status labels used outdoors.
- Default to reduced or eliminated motion; any animation must have a `prefers-reduced-motion` fallback.
- Optimize for sunlight readability: strong contrast ratios, large type for key information, and clear icon + label pairings.
- Support one-handed use on common phone sizes; place primary actions within thumb reach.
- Respect system font size and contrast settings.
