# Design System Strategy: The Artisan’s Palette

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Confectionary Atelier."** 

Unlike generic e-commerce templates that feel cold and transactional, this system treats the digital interface like a high-end lifestyle magazine. We are moving away from the "grid-of-boxes" approach toward an editorial experience characterized by intentional asymmetry, organic overlaps, and breathable whitespace. By leveraging the playful spirit of the logo and grounding it in sophisticated typography and tonal depth, we create an environment that feels as curated and handcrafted as the bakery’s own offerings.

This system breaks the "template" look by:
- **Asymmetric Layouts:** Using the 8px grid to create unexpected margins and overlapping image-text containers.
- **Tonal Sophistication:** Moving beyond flat colors into a world of "nested" surfaces and ambient light.
- **Typographic Scale:** Utilizing extreme contrast between large, elegant serif displays and functional, modern sans-serif body text.

---

## 2. Colors & Surface Philosophy
The palette is a celebration of warmth. We utilize the pinks (`primary`) and yellows (`secondary`) not as mere accents, but as structural elements that guide the user’s eye.

### The "No-Line" Rule
To maintain a premium, editorial feel, **1px solid borders for sectioning are strictly prohibited.** We define boundaries through:
- **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
- **Negative Space:** Using the spacing scale (e.g., `12` or `16` tokens) to create natural breaks.

### Surface Hierarchy & Nesting
Think of the UI as layers of fine parchment. 
- Use `surface` (`#fff4f6`) for the main canvas.
- Use `surface-container-low` (`#ffecf1`) for secondary content blocks.
- Use `surface-container-lowest` (`#ffffff`) for interactive cards to make them "pop" naturally.

### The "Glass & Gradient" Rule
To elevate the "homemade" feel into something professional and signature:
- **CTAs:** Apply a subtle linear gradient from `primary` (`#b30068`) to `primary-container` (`#ff6ead`) at a 135° angle.
- **Floating Overlays:** Use Glassmorphism for elements like "Quick View" modals or Navigation Bars. Apply `surface-container` with 80% opacity and a `20px` backdrop-blur.

---

## 3. Typography
Our typography is the bridge between "Playful" and "Professional."

- **Display & Headlines (Playfair Display):** These are our "editorial voice." Use `display-lg` for hero sections and `headline-lg` for product categories. The high-contrast serifs evoke the sophistication of a boutique bakery.
- **Body & Labels (Inter):** These are our "functional voice." Inter provides maximum legibility for ingredient lists, prices, and descriptions.
- **Hierarchy Tip:** Always pair a `display-sm` heading with `body-md` text to create a clear, authoritative hierarchy that feels intentional and spacious.

---

## 4. Elevation & Depth
We reject the standard "drop shadow." Depth in this system is achieved through **Tonal Layering.**

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on top of a `surface-container-high` section. The slight color shift creates a soft, sophisticated lift.
- **Ambient Shadows:** If a floating element (like a FAB or Cart button) requires a shadow, it must be tinted. Use the `on-surface` color at 6% opacity with a blur of `32px` and a Y-offset of `8px`. This mimics natural light passing through sugar or glass.
- **The "Ghost Border" Fallback:** If a container requires more definition (e.g., in a high-density list), use a "Ghost Border." Apply the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons
- **Primary:** Rounded (`xl` token / `3rem`), using the Primary-to-Container gradient. No border.
- **Secondary:** `surface-container-lowest` background with `primary` text.
- **States:** On hover, increase the surface elevation by shifting from `surface-container-low` to `surface-container-highest`.

### Product Cards
- **Structure:** Use `rounded-lg` (`2rem`) for the main container. 
- **Imagery:** Images should "bleed" to the top and sides, or overlap the card edge slightly to create a 3D effect.
- **Separation:** Forbid dividers. Use `spacing-6` (`2rem`) of vertical whitespace between the product name and the price.

### Selection Chips
- Use the `secondary-container` (`#ffd709`) with `on-secondary-container` text for active states. Use `rounded-full` for a playful, "macaron-like" feel.

### Input Fields
- Background should be `surface-container-highest`. 
- Rounding must be `md` (`1.5rem`) to match the soft aesthetic of the brand logo. 
- Focus state: A "Ghost Border" of `primary` at 40% opacity.

---

## 6. Do’s and Don’ts

### Do:
- **Overlapping Elements:** Allow product images to break the container bounds or overlap with large Display typography.
- **Tonal Depth:** Use the full range of `surface-container` tokens to create a "stacked paper" look.
- **Generous Leading:** Increase line-height for `body-lg` to 1.6x to ensure an airy, premium reading experience.

### Don’t:
- **Don’t use 1px black or grey borders.** It kills the "artisan" feel.
- **Don’t use sharp corners.** Every interactive element must use at least the `md` (`1.5rem`) rounding token to maintain the "warm and inviting" vibe.
- **Don’t crowd the content.** If a section feels "busy," increase the spacing token by two levels (e.g., move from `8` to `12`).
- **Don’t use pure black text.** Always use `on-surface` (`#3a2a30`) to keep the interface soft and integrated with the pink/cream background.

---

## 7. Spacing & Grid
This system is built on an **8px grid (0.5rem base).**
- **Internal Padding:** Minimum `4` (`1.4rem`) for all cards.
- **Section Margins:** Use `20` (`7rem`) or `24` (`8.5rem`) to create "The Big Breath"—large gaps of whitespace that signal luxury and high-end curation.