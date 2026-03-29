# Design System Document

## 1. Overview & Creative North Star: "The Artisanal Editor"

This design system is crafted to elevate the digital presence of an artisanal bakery into a premium, editorial experience. We are moving away from the "standard" boxy e-commerce template. Our Creative North Star is **"The Artisanal Editor"**—a philosophy that treats every screen like a high-end culinary magazine spread.

The system breaks traditional digital rigidity through:
*   **Intentional Asymmetry:** Utilizing staggered imagery and off-center typography to mimic the organic feel of hand-placed pastries.
*   **Tonal Depth:** Replacing harsh lines with soft shifts in background cream and pink hues.
*   **High-Contrast Scale:** Using dramatic differences between oversized serif headlines and functional sans-serif body text to establish clear authority and warmth.

---

## 2. Colors

The palette is rooted in the warmth of a morning kitchen, utilizing a spectrum of creams, artisanal pinks, and a "patisserie yellow" for moments of joy.

### The Foundation
*   **Canvas (Background):** `hsl(350, 100%, 95%)` (#fff8f8). This soft, warm cream is the primary surface for all experiences.
*   **Primary Accent:** `hsl(326, 82%, 52%)` (#b00068). Use this for high-intent actions and brand-defining moments.
*   **Secondary Accent:** `hsl(48, 100%, 50%)` (#fcd400). Reserved for "special" highlights—think star ratings, "New" tags, or celebratory accents.

### The "No-Line" Rule
To maintain a premium feel, **1px solid borders are prohibited for sectioning.** Structure must be defined by:
1.  **Background Shifts:** Transitioning from `surface` to `surface_container_low` (#fdf0f2) to define content blocks.
2.  **Vertical Space:** Using the 8-point rhythm (e.g., `spacing.16` or 64px) to separate themes.

### Surface Hierarchy & Nesting
Treat the UI as layered sheets of fine vellum paper. Use the `surface-container` tiers to create depth:
*   **Base:** `surface` (#fff8f8)
*   **Nested Cards:** `surface_container_lowest` (#ffffff) to make items pop subtly.
*   **Inset Sections:** `surface_container_high` (#f2e5e7) for search bars or tertiary footers.

### Signature Textures
Apply a subtle linear gradient to primary buttons and hero sections: `linear-gradient(135deg, primary 0%, primary_container 100%)`. This adds a "glazed" finish that flat color lacks.

---

## 3. Typography

The typographic system pairs the elegance of the bakery's craft with the precision of a modern digital tool.

*   **Display & Headlines (Playfair Display):** Our "Artisanal" voice. Use `display-lg` (3.5rem) for hero statements and `headline-md` (1.75rem) for product categories. The high-contrast serifs evoke a heritage feel.
*   **Body & Labels (Inter):** Our "Functional" voice. Set to 87% opacity (`on_surface`) for primary reading and 60% opacity for secondary descriptions.
*   **Scale:** Geometric 1.25x.
    *   **Body-lg:** 16px (Base)
    *   **Title-lg:** 22px
    *   **Headline-lg:** 32px

---

## 4. Elevation & Depth

We eschew "standard" shadows for **Ambient Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_lowest` white card onto a `surface_container_low` background. The difference in hex value provides enough "lift" for a premium look without visual clutter.
*   **Ambient Shadows:** For floating elements (Modals, Hover States), use:
    `box-shadow: 0 1px 3px hsla(0, 0%, 0%, 0.04), 0 10px 40px -10px hsla(350, 50%, 20%, 0.08);`
    *Note: The shadow color is a deep, desaturated version of our brand pink, never pure grey.*
*   **Glassmorphism:** For top navigation bars, use:
    `background: hsla(350, 100%, 95%, 0.8); backdrop-filter: blur(12px);`
    This allows the "bakery warmth" to bleed through the UI as the user scrolls.

---

## 5. Components

### Buttons
*   **Primary:** Rounded `lg` (1rem). Gradient fill (Primary to Primary Container). Label in `on_primary`.
*   **Secondary:** Ghost style. No border. Use `surface_container_highest` background on hover. Label in `primary`.
*   **Tertiary:** Text-only with a Phosphor `ArrowRight` icon.

### Cards (The "Bakery Box")
*   **Style:** No borders. Background: `surface_container_lowest` (#ffffff).
*   **Rounding:** `xl` (1.5rem) to mimic the soft edges of a cake box.
*   **Spacing:** Content padding should never be less than `spacing.5` (1.25rem).

### Inputs
*   **Field:** Background `surface_container_low`. A `2px` bottom-only border in `outline_variant` at 20% opacity.
*   **State:** On focus, the bottom border transitions to `primary` (#b00068).

### Selection (Chips)
*   Use for dietary filters (e.g., "Eggless", "Sugar-Free").
*   **Unselected:** `surface_container_high` with `on_surface_variant` text.
*   **Selected:** `secondary_container` (Yellow) with `on_secondary_container` text.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts for product galleries (e.g., one large image followed by two small ones).
*   **Do** use Phosphor Icons in "Light" or "Thin" weights to maintain the premium editorial feel.
*   **Do** prioritize white space. If a layout feels "busy," double the padding.

### Don't
*   **Don't** use 1px solid borders to separate list items; use a 12px vertical gap instead.
*   **Don't** use pure black (#000000). Always use `on_surface` (87% opacity dark brown/pink) for text.
*   **Don't** use standard "Blue" for links. All interactive elements must be `primary` pink.
*   **Don't** use sharp corners. Every component must use the `md` to `xl` roundedness scale to feel "warm" and approachable.