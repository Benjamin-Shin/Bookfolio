# Design System Strategy: Seogadam (서가담)

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Curator’s Ateliers"**

This design system transcends the utility of a standard book-tracking app to become a curated, tactile experience. We are not building a database; we are designing a digital sanctuary that mirrors the quiet dignity of a high-end independent bookstore. 

To achieve an "Editorial Aesthetic," the layout must break away from the rigid, boxed-in templates of standard mobile apps. We embrace **Asymmetric Intentionality**: using generous white space to create "breathing rooms" and allowing high-end typography to drive the visual rhythm. The interface should feel like fine stationery—textured, layered, and permanent.

---

## 2. Color & Atmospheric Depth
Our palette is rooted in the organic tones of paper, ink, and leather. The goal is to reduce eye strain and evoke a sense of timelessness.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a soft transition that feels like a change in paper weight rather than a digital "wall."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of heavy-stock paper.
*   **Base:** `surface` (#fcf9f3) – The foundational canvas.
*   **Elevated Sections:** `surface-container-low` (#f6f3ed) for secondary content.
*   **Feature Cards:** `surface-container-lowest` (#ffffff) to provide a "pop" of brightness for featured book covers.

### Signature Textures & Glass
To provide professional polish, use **Glassmorphism** for floating elements (like a bottom navigation bar or a persistent search trigger). Use `surface` with 80% opacity and a `20px` backdrop-blur. This allows the book covers to bleed through softly, softening the layout's edges.

---

## 3. Typography: The Editorial Voice
Typography is the cornerstone of the Seogadam identity. We use a high-contrast pairing to distinguish between "The Story" (Serif) and "The Data" (Sans).

*   **Display & Headlines (Newsreader):** This serif font brings the literary magazine feel. Use `display-lg` to `headline-sm` for book titles, section headers, and quotes. The rhythm should feel lyrical and authoritative.
*   **Body & UI (Manrope):** A clean, modern sans-serif. Used for long-form reviews (`body-lg`) and metadata (`label-md`). It provides a necessary functional counterpoint to the romanticism of the serif.

**Visual Hierarchy Tip:** Never center-align long-form text. Keep it left-aligned to maintain the "column" feel of a printed magazine.

---

## 4. Elevation & Tonal Layering
In this design system, shadows are not structural; they are atmospheric.

*   **The Layering Principle:** Use `surface-container` tiers (Lowest to Highest) to create "nested" depth. Place a `surface-container-highest` card on a `surface-container-low` background to signify peak importance without a single drop shadow.
*   **Ambient Shadows:** If a floating action button or a modal requires a shadow, use an extra-diffused blur (24pt–32pt) at 4% opacity, using the `on-surface` color tinted with a hint of `primary` (#163826). It should look like a soft glow of light, not a black smudge.
*   **The "Ghost Border":** If a border is required for accessibility, use `outline-variant` at **15% opacity**. Anything more is too loud for this aesthetic.

---

## 5. Component Guidelines

### Buttons: The Tactile Command
*   **Primary:** Use `primary` (#163826) with `on-primary` text. Apply a subtle gradient from `primary` to `primary-container` to give the button a "weighted" feel, like a wax seal.
*   **Secondary:** Use `secondary-container` (#efe0d4). This should blend into the "paper" of the app, feeling like a debossed area.
*   **Shape:** Use `rounded-sm` (0.125rem) for a sharp, architectural look, or `rounded-md` (0.375rem) for a softer touch. Avoid "Full" rounded pills, which feel too playful.

### Cards: The Book Archive
*   **Rule:** Forbid divider lines. Use vertical white space (32px+) or subtle background shifts between cards.
*   **Visuals:** Book covers are the stars. Treat them like art in a gallery. Give them a very subtle `0.5px` ghost border (`outline-variant` at 10%) to prevent light covers from bleeding into the `surface`.

### Inputs & Search
*   **Style:** Minimalist. No thick boxes. Use a single bottom-stroke or a slightly darker `surface-container-high` background.
*   **Icons:** Use `1.5pt` thin-line icons. They should feel like fine-point pen sketches, never bold or chunky.

### Specialized Component: The "Archivist's Ribbon"
Use the `tertiary` (Burgundy/Deep Red) color for a small, vertical ribbon element on the side of "Currently Reading" cards. This acts as a premium signature mark for the brand.

---

## 6. Do’s and Don’ts

### Do
*   **Embrace Asymmetry:** Let a title sit slightly off-center if it creates a more interesting editorial balance.
*   **Prioritize Legibility:** Use the `secondary` (#675d53) for metadata to ensure it doesn't compete with the main title but remains readable.
*   **Use Generous Margins:** A minimum of 24dp padding on the sides of the screen to maintain the "premium" feel.

### Don’t
*   **No "App-y" Gradients:** Avoid vibrant, neon, or multi-color gradients. Only use tonal gradients (dark green to darker green).
*   **No Heavy Shadows:** If the shadow is the first thing you notice, it is too dark.
*   **No Standard Dividers:** Never use a solid #EEEEEE line to separate content. Use a `surface-variant` color shift instead.
*   **No System Fonts for Headers:** Never fallback to a default sans-serif for headlines; it breaks the editorial illusion immediately.