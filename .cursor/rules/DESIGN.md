# Design System: The Private Library

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator.**
This design system rejects the "app-like" sterility of modern software in favor of the tactile, timeless experience of an editorial masterpiece. It is built to feel less like a utility and more like a leather-bound journal or a bespoke shelf in a sun-drenched library. 

To achieve this "High-End Editorial" feel, the system breaks from traditional rigid grids. It prioritizes intentional asymmetry, generous white space (the "breath of the reader"), and overlapping elements that mimic the way a physical bookmark rests against a page. This is not a collection of boxes; it is a composition of layers.

---

## 2. Color & Tonal Depth
The palette is rooted in organic, light-absorbing textures rather than light-emitting digital tones. It uses a base of Ivory and Cream to reduce eye strain and evoke the feeling of high-bound paper.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section sitting on a `surface` background provides all the definition required.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of fine paper. 
- **Base Layer:** `surface` (#faf9f5) for the main canvas.
- **Sectioning:** Use `surface-container-low` (#f4f4f0) for large background blocks (e.g., the background of a "Reading Progress" section).
- **Interactive Cards:** Use `surface-container-lowest` (#ffffff) to make cards "lift" naturally from the page.
- **Overlays:** Use `surface-container-highest` (#e3e3df) for small, high-contrast utility elements.

### Signature Gradients & Glass
- **The Ink Gradient:** For primary CTAs, use a subtle linear gradient from `primary` (#2a0002) to `primary_container` (#4a0e0e). This provides a rich, "ink-pool" depth.
- **Glassmorphism:** Use semi-transparent `surface_container_lowest` (80% opacity) with a 20px backdrop blur for navigation bars and floating headers. This allows the warm tones of the book covers to bleed through softly, integrating the content with the UI.

---

## 3. Typography
The typography scale is the voice of the system. It balances the intellectual authority of a high-contrast serif with the modern clarity of a geometric sans-serif.

| Level | Token | Font Family | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Newsreader | 3.5rem | Book titles and grand narrative headers. |
| **Headline** | `headline-md` | Newsreader | 1.75rem | Section titles (e.g., "From Your Archive"). |
| **Title** | `title-md` | Inter | 1.125rem | Book metadata and prominent UI labels. |
| **Body** | `body-lg` | Inter | 1.0rem | Long-form reading, reviews, and descriptions. |
| **Label** | `label-md` | Inter | 0.75rem | Micro-copy and utility navigation. |

**The Editorial Signature:** When pairing `display` and `title`, use increased letter spacing for `title-md` (0.05em) to create a premium, "small-caps" feel that contrasts against the fluid, organic curves of the Newsreader serif.

---

## 4. Elevation & Depth
In this design system, shadows are an admission of failure in tonal layering. Use them sparingly.

- **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface-container-lowest` card placed on a `surface-container-low` background creates a soft, natural lift without a shadow.
- **Ambient Shadows:** If a "floating" effect is required (e.g., for a Modal), use a `primary` tinted shadow: `0px 12px 32px rgba(42, 0, 2, 0.06)`. This mimics natural light falling on a physical object rather than a digital drop-shadow.
- **The Ghost Border Fallback:** If accessibility requires a stroke, use the `outline_variant` (#dac1bf) at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** Slightly rounded rectangle (Radius: `md` - 0.375rem). Background: `primary` gradient. Text: `on_primary` (Inter, Bold).
- **Secondary:** Transparent background with an `outline_variant` Ghost Border. 
- **Tertiary (The "Editorial" Action):** No container. `primary` text color, `label-md` uppercase, with a 1px `tertiary` underline offset by 4px. Use for "View All" or "Read More."
- **Constraint:** No "pill" (999px) shapes. We are building a journal, not a social media app.

### Cards & Lists
- **The "No Divider" Rule:** Forbid the use of horizontal divider lines. Use vertical white space (using the 24px or 32px spacing scale) to separate list items.
- **Book Cards:** Use `surface-container-lowest` with a Radius of `sm` (0.125rem). The sharp edges evoke the corners of a hardcover book.

### Selection & Input
- **Chips:** Rectangular with `xs` radius. Background: `surface-container-high`. Text: `on_surface`.
- **Input Fields:** Bottom-border only (Ghost Border style). Focus state transitions the bottom border to `muted gold` (#B18E3F).

### Signature Component: "The Vellum Overlay"
A custom bottom sheet component using 90% opacity `surface_container_lowest` with a heavy backdrop blur. Used for "Quick Notes" or "Annotation" features to maintain the context of the book underneath.

---

## 6. Do's and Don'ts

### Do
- **Use Asymmetry:** Align book covers to a different grid than the text to create a curated, scrap-booked feel.
- **Embrace Wide Margins:** Use a minimum of 24pt side margins to give content an "expensive" amount of room.
- **Color by Context:** Use `forest green` for "Read" status and `burgundy` for "Currently Reading."

### Don't
- **Don't use pure black:** It is too harsh for the Ivory background. Always use `on_surface` (#1a1c1a).
- **Don't use standard icons:** Use "Thin" or "Light" weight iconography to match the delicacy of the serif typography.
- **Don't use motion blur:** Keep transitions snappy but soft (Ease-in-out), like the turning of a page. Avoid "bouncy" or "playful" animations.