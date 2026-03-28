# Google Stitch Design Guide
## Nellai Aanantham — Homemade Bakery Website

> **Design System Reference**: Follow `DESIGN-SKILL.md` for all spatial, typography, color, and interaction decisions.

---

## Brand Identity

### Business Information
| Field | Value |
|-------|-------|
| **Name** | Nellai Aanantham |
| **Tagline** | "Where Every Bite Gives You Aanantham" |
| **FSSAI License** | 22426282000173 |
| **Instagram** | @nellai_aanantham |
| **Phone/WhatsApp** | 9489370369 |

### Logo
- **File**: `logo.png`
- **Style**: Circular badge with playful bakery illustrations
- **Primary Colors**: Pink (#E91E8C), Yellow (#FFD700), White

### Brand Color Palette (Extract from Logo)

```css
:root {
  /* Primary */
  --brand-pink: hsl(326, 82%, 52%);        /* #E91E8C - Logo pink */
  --brand-yellow: hsl(48, 100%, 50%);      /* #FFD700 - Logo yellow */
  --brand-cream: hsl(350, 100%, 95%);      /* #FFE4EC - Light pink background */
  
  /* Neutrals */
  --bg-canvas: hsl(0, 0%, 100%);
  --bg-warm: hsl(30, 50%, 98%);            /* Warm bakery feel */
  --text-primary: hsla(0, 0%, 15%, 0.87);
  --text-secondary: hsla(0, 0%, 15%, 0.60);
  
  /* Semantic */
  --accent-cta: var(--brand-pink);
  --accent-highlight: var(--brand-yellow);
}
```

### Typography

```css
:root {
  /* Font Families */
  --font-display: 'Playfair Display', serif;  /* Headings - elegant */
  --font-body: 'Inter', sans-serif;           /* Body - readable */
  
  /* Scale (1.25 ratio) */
  --font-base: 16px;
  --font-sm: 12.8px;
  --font-lg: 20px;
  --font-xl: 25px;
  --font-2xl: 31.25px;
  --font-3xl: 39px;
}
```

---

## Component Library

### Buttons

#### Primary Button (CTA)
```
┌─────────────────────────────┐
│   Order on WhatsApp  →      │
└─────────────────────────────┘
```
**Specs**:
- Background: `--brand-pink` (#E91E8C)
- Text: White, `font-weight: 600`
- Padding: `16px 32px`
- Border-radius: `9999px` (pill shape)
- Min height: `48px` (touch target)
- Icon: WhatsApp icon on left or arrow on right

**States**:
| State | Style |
|-------|-------|
| Default | `--brand-pink` background |
| Hover | `scale(1.02)`, `brightness(1.05)` |
| Active | `scale(0.98)` |
| Focus | `2px` white outline, `2px` offset |
| Disabled | `opacity: 0.5` |

#### Secondary Button
```
┌─────────────────────────────┐
│      View Full Menu         │
└─────────────────────────────┘
```
**Specs**:
- Background: `transparent`
- Border: `2px solid --brand-pink`
- Text: `--brand-pink`
- Padding: `14px 28px`
- Border-radius: `9999px`

#### Ghost Button (Nav/Links)
```
Menu  About  Contact
```
**Specs**:
- Background: `transparent`
- Text: `--text-primary`
- Padding: `8px 16px`
- Hover: `--brand-pink` text color

#### Icon Button
```
┌─────┐
│ [×] │
└─────┘
```
**Specs**:
- Size: `44×44px` minimum
- Background: `transparent` or `hsla(0,0%,0%,0.05)`
- Border-radius: `50%`
- Icon size: `24px`

---

### Cards

#### Product Card
```
┌────────────────────┐
│   ┌────────────┐   │
│   │   [image]  │   │
│   └────────────┘   │
│                    │
│   Rasamalai Cake   │
│   ₹1,100           │
│                    │
│   [Order →]        │
└────────────────────┘
```
**Specs**:
- Background: `--bg-canvas` (white)
- Padding: `16px`
- Border-radius: `16px`
- Shadow: `0 1px 3px hsla(0,0%,0%,0.04)`
- Gap between elements: `8px`
- Image aspect ratio: `4:3` or `1:1`

#### Category Card (Bento)
```
┌──────────────────────┐
│                      │
│      [image]         │
│                      │
│   ────────────────   │
│   CAKES              │
│   From ₹750          │
└──────────────────────┘
```
**Specs**:
- Min-height: `200px`
- Border-radius: `24px`
- Image: Cover, with gradient overlay
- Gradient: `linear-gradient(to top, hsla(0,0%,0%,0.6), transparent)`
- Text: White, positioned at bottom

---

### Modals & Drawers

#### Bottom Sheet (Mobile Product Detail)
```
┌────────────────────────────────────┐
│  ─────  (drag handle)              │
├────────────────────────────────────┤
│                                    │
│  [Large Image]                     │
│                                    │
│  Product Name                      │
│  ₹Price                            │
│                                    │
│  Description text goes here...     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │   [Order on WhatsApp]        │  │
│  └──────────────────────────────┘  │
│                                    │
│  Call: 9489370369                  │
└────────────────────────────────────┘
```
**Specs**:
- Position: Fixed bottom
- Border-radius: `24px 24px 0 0`
- Background: `--bg-canvas`
- Max-height: `85vh`
- Drag handle: `40px × 4px`, `--text-tertiary`, centered
- Padding: `24px`
- Backdrop: `hsla(0,0%,0%,0.5)` with `backdrop-filter: blur(8px)`

#### Centered Modal (Desktop)
```
┌────────────────────────────────────────┐
│                                    [×] │
│  ┌────────────────────────────────┐    │
│  │         [Image]                │    │
│  └────────────────────────────────┘    │
│                                        │
│  Product Name                          │
│  ₹Price                                │
│                                        │
│  Description...                        │
│                                        │
│  [Order on WhatsApp]                   │
└────────────────────────────────────────┘
```
**Specs**:
- Max-width: `500px`
- Border-radius: `24px`
- Padding: `32px`
- Shadow: `0 24px 48px hsla(0,0%,0%,0.2)`
- Close button: Top-right, `44×44px`
- Animation: `scale(0.95) → scale(1)`, `opacity: 0 → 1`

#### Side Drawer (Mobile Nav)
```
┌──────────────────┬─────────────────────┐
│                  │                     │
│  [Logo]          │                     │
│                  │    (backdrop)       │
│  ─────────────   │                     │
│  Menu            │                     │
│  About           │                     │
│  Contact         │                     │
│  ─────────────   │                     │
│                  │                     │
│  [WhatsApp]      │                     │
│  [Instagram]     │                     │
│                  │                     │
│  FSSAI: ...      │                     │
└──────────────────┴─────────────────────┘
```
**Specs**:
- Width: `280px` or `75vw` max
- Position: Fixed left
- Background: `--bg-canvas`
- Shadow: `4px 0 24px hsla(0,0%,0%,0.15)`
- Animation: Slide in from left, `250ms ease-out`
- Backdrop: Same as modal

---

### Navigation

#### Mobile Header
```
┌────────────────────────────────────┐
│  [☰]      [Logo]           [Cart] │
└────────────────────────────────────┘
```
**Specs**:
- Height: `64px`
- Position: Fixed top
- Background: `--bg-canvas` or glassmorphism
- Z-index: `100`
- Hamburger icon: `24px`, opens drawer

#### Desktop Header
```
┌─────────────────────────────────────────────────────┐
│  [Logo]           Menu  About  Contact     [IG] 📞 │
└─────────────────────────────────────────────────────┘
```
**Specs**:
- Height: `72px`
- Max-width: `1200px`, centered
- Nav items: `gap: 32px`

---

### Popups & Toasts

#### Toast Notification
```
┌────────────────────────────────────┐
│  ✓  Added to favorites!       [×] │
└────────────────────────────────────┘
```
**Specs**:
- Position: Fixed bottom-center or top-center
- Background: `--text-primary` (dark)
- Text: White
- Padding: `16px 24px`
- Border-radius: `12px`
- Auto-dismiss: `3000ms`
- Animation: Slide up + fade in

#### Tooltip (Hover)
```
        ┌─────────────┐
        │ View menu   │
        └──────▽──────┘
           [icon]
```
**Specs**:
- Background: `--text-primary`
- Text: White, `font-size: 14px`
- Padding: `8px 12px`
- Border-radius: `8px`
- Delay: `300ms` before showing
- Arrow: `8px` triangle

---

### Form Elements (If needed)

#### Search Input
```
┌────────────────────────────────────┐
│  🔍  Search cakes, brownies...     │
└────────────────────────────────────┘
```
**Specs**:
- Height: `48px`
- Border: `1px solid hsla(0,0%,0%,0.1)`
- Border-radius: `9999px`
- Padding: `12px 16px 12px 48px` (icon space)
- Focus: `--brand-pink` border

---

### Badges & Tags

#### Product Badge
```
┌───────────┐
│ Bestseller │
└───────────┘
```
**Specs**:
- Background: `--brand-yellow`
- Text: `--text-primary`, `font-weight: 600`, `12px`
- Padding: `4px 8px`
- Border-radius: `4px`
- Position: Absolute top-right of product card

#### Category Tag
```
┌────────────┐
│  Fusion 🔥 │
└────────────┘
```
**Specs**:
- Background: `hsla(326, 82%, 52%, 0.1)` (pink tint)
- Text: `--brand-pink`
- Padding: `4px 12px`
- Border-radius: `9999px`

---

## Screen Specifications

### Screen 1: Hero / Landing Page

**Purpose**: First impression, brand story, primary CTA

**Layout**: Full-viewport hero with bento sections below

```
┌────────────────────────────────────────────────────────┐
│  [Logo]              Nav: Menu | About | Contact | IG  │
├────────────────────────────────────────────────────────┤
│                                                        │
│    ┌──────────────────┐   "Where Every Bite           │
│    │                  │    Gives You Aanantham"       │
│    │   Hero Image     │                               │
│    │   (Cake Photo)   │   [Order Now on WhatsApp]     │
│    │                  │   [View Full Menu]            │
│    └──────────────────┘                               │
│                                                        │
├────────────────────────────────────────────────────────┤
│  FEATURED CATEGORIES (Bento Grid - 3 cards)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Cakes   │ │ Brownies │ │  Drinks  │               │
│  │  [img]   │ │  [img]   │ │  [img]   │               │
│  │ From ₹750│ │ From ₹40 │ │ From ₹50 │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└────────────────────────────────────────────────────────┘
```

**Design Tokens**:
- Hero height: `100vh` (mobile), `80vh` (desktop)
- Gradient overlay: `linear-gradient(to right, hsla(326, 82%, 52%, 0.1), transparent)`
- CTA button: `--brand-pink` background, white text, `border-radius: 9999px`
- Bento cards: `border-radius: 16px`, subtle shadow, hover scale `1.02`

**Accessibility**:
- Primary CTA: minimum `44×44px` touch target
- Contrast ratio: ≥4.5:1 for all text

---

### Screen 2: Full Menu Page

**Purpose**: Complete product catalog with categories

**Layout**: Sticky category tabs + product grid

```
┌────────────────────────────────────────────────────────┐
│  [Logo]              Nav: Menu | About | Contact | IG  │
├────────────────────────────────────────────────────────┤
│  MENU                                          [Search]│
├────────────────────────────────────────────────────────┤
│  [Cakes] [Fusion] [Brownies] [Tres Leches] [Drinks]   │ ← Sticky tabs
├────────────────────────────────────────────────────────┤
│                                                        │
│  CAKES                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │   [img]    │ │   [img]    │ │   [img]    │         │
│  │ Vanilla    │ │ Pineapple  │ │  Mango     │         │
│  │   ₹750     │ │   ₹850     │ │   ₹950     │         │
│  │ [WhatsApp] │ │ [WhatsApp] │ │ [WhatsApp] │         │
│  └────────────┘ └────────────┘ └────────────┘         │
│                                                        │
│  ... (repeat for all categories)                       │
└────────────────────────────────────────────────────────┘
```

**Product Card Spec**:
```css
.product-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: var(--bg-canvas);
  box-shadow: 0 1px 3px hsla(0, 0%, 0%, 0.04);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.product-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.08);
}
```

**Category Tabs**:
- Sticky position: `position: sticky; top: 0`
- Active state: `--brand-pink` underline
- Scroll behavior: `scroll-snap-type: x mandatory`

---

### Screen 3: Product Detail Modal/Sheet

**Purpose**: Expanded view when tapping a product

**Layout**: Bottom sheet (mobile) or centered modal (desktop)

```
┌────────────────────────────────────────────────────────┐
│                                                    [×] │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │              [Large Product Image]               │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Rasamalai Cake                                        │
│  ₹1,100                                               │
│                                                        │
│  Fusion of traditional rasamalai flavors with         │
│  soft sponge cake. Perfect for celebrations.          │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │     [Order on WhatsApp]  💬                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  📞 Call: 9489370369                                   │
└────────────────────────────────────────────────────────┘
```

**Modal Spec** (per Cognitive Interruption Routing - DESIGN-SKILL Phase 4.2):
- Non-destructive action → Bottom sheet / Popover pattern
- Background: `backdrop-filter: blur(16px)`
- Border radius: `24px 24px 0 0` (mobile sheet)

---

### Screen 4: About / Story Page

**Purpose**: Build trust, show homemade authenticity

```
┌────────────────────────────────────────────────────────┐
│  [Logo]              Nav: Menu | About | Contact | IG  │
├────────────────────────────────────────────────────────┤
│                                                        │
│           OUR STORY                                    │
│                                                        │
│  ┌──────────────────┐                                  │
│  │                  │   Homemade with Love             │
│  │  [Kitchen Photo] │                                  │
│  │                  │   Every treat at Nellai          │
│  └──────────────────┘   Aanantham is handcrafted...   │
│                                                        │
├────────────────────────────────────────────────────────┤
│  WHY CHOOSE US                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ 🏠       │ │ ✨       │ │ 🎂       │               │
│  │ Homemade │ │ Fresh    │ │ Custom   │               │
│  │ Daily    │ │ Ingredi- │ │ Orders   │               │
│  └──────────┘ │ ents     │ └──────────┘               │
│               └──────────┘                             │
├────────────────────────────────────────────────────────┤
│  FSSAI Licensed: 22426282000173                        │
└────────────────────────────────────────────────────────┘
```

**Note**: Replace emoji icons with Phosphor/Lucide vector icons per DESIGN-SKILL Phase 5.3

---

### Screen 5: Contact / Order Page

**Purpose**: Clear ordering instructions and contact methods

```
┌────────────────────────────────────────────────────────┐
│  [Logo]              Nav: Menu | About | Contact | IG  │
├────────────────────────────────────────────────────────┤
│                                                        │
│           HOW TO ORDER                                 │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  1️⃣  Browse our menu                            │  │
│  │  2️⃣  WhatsApp your order to 9489370369          │  │
│  │  3️⃣  Confirm details & advance payment          │  │
│  │  4️⃣  Pick up fresh or we deliver!               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│  CONTACT US                                            │
│                                                        │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │ 📱 WhatsApp     │  │ 📸 Instagram    │             │
│  │  9489370369     │  │ @nellai_        │             │
│  │  [Open Chat]    │  │  aanantham      │             │
│  └─────────────────┘  │  [Follow Us]    │             │
│                       └─────────────────┘             │
│                                                        │
│  📞 Phone: 9489370369                                  │
└────────────────────────────────────────────────────────┘
```

**WhatsApp CTA**:
```html
<a href="https://wa.me/919489370369?text=Hi!%20I%20want%20to%20place%20an%20order">
  Order on WhatsApp
</a>
```

---

### Screen 6: Footer (All Pages)

```
┌────────────────────────────────────────────────────────┐
│  [Logo]                                                │
│  "Where Every Bite Gives You Aanantham"               │
│                                                        │
│  Quick Links          Contact          Follow Us       │
│  • Menu               📞 9489370369    [IG Icon]       │
│  • About              📱 WhatsApp                      │
│  • Order                                               │
│                                                        │
│  ─────────────────────────────────────────────────────│
│  FSSAI: 22426282000173        © 2026 Nellai Aanantham │
└────────────────────────────────────────────────────────┘
```

---

## Complete Product Catalog

### Cakes (Standard)
| Product | Price | Category Tag |
|---------|-------|--------------|
| Vanilla Cake | ₹750 | Classic |
| Pineapple Cake | ₹850 | Classic |
| Mango Cake | ₹950 | Fruity |
| Black Forest Cake | ₹950 | Chocolate |
| White Forest Cake | ₹950 | Classic |
| Strawberry Cake | ₹950 | Fruity |
| Blueberry Cake | ₹950 | Fruity |
| Butterscotch Cake | ₹1,050 | Classic |
| Choco Truffle Cake | ₹1,100 | Chocolate |

### Fusion Cakes (Specialty)
| Product | Price | Category Tag |
|---------|-------|--------------|
| Rose Milk Cake | ₹1,050 | Indian Fusion |
| Rasamalai Cake | ₹1,100 | Indian Fusion |
| Red Velvet Cake | ₹1,100 | Premium |
| Kit Kat Cake | ₹1,100 | Premium |
| Gulab Jamun Cake | ₹1,100 | Indian Fusion |
| Oreo Cake | ₹1,100 | Premium |
| Chocolate Delight | ₹1,350 | Premium |

### Brownies (Per Piece)
| Product | Price | Badge |
|---------|-------|-------|
| Classic Brownie | ₹70 | - |
| Double Chocolate | ₹90 | Popular |
| Triple Chocolate | ₹110 | Rich |
| Brownie Balls | ₹40 | Snack |

### Brownies (Box/Party Pack)
| Product | Price | Serves |
|---------|-------|--------|
| Classic Brownie Box | ₹1,150 | 8-10 |
| Choco Chip Brownie Box | ₹1,200 | 8-10 |
| Double Chocolate Box | ₹1,300 | 8-10 |
| Triple Chocolate Box | ₹1,350 | 8-10 |
| Kit Kat Brownie Box | ₹1,300 | 8-10 |
| Oreo Brownie Box | ₹1,300 | 8-10 |
| Nuts Loaded Brownie Box | ₹1,300 | 8-10 |

### Tres Leches (Per Piece)
| Product | Price | Badge |
|---------|-------|-------|
| Rose Milk Tres Leches | ₹55 | - |
| Horlicks Tres Leches | ₹60 | Unique |
| Boost Tres Leches | ₹65 | Unique |
| Rasamalai Tres Leches | ₹70 | Bestseller |

### Drinks
| Product | Price | Type |
|---------|-------|------|
| Hot Chocolate | ₹80 | Hot |
| Cold Coffee | ₹60 | Cold |
| Rose Milk | ₹50 | Cold |
| Badam Milk | ₹50 | Hot/Cold |

---

## Mobile-First Responsive Breakpoints

Per DESIGN-SKILL Phase 1.3 (Container Queries):

```css
/* Grid columns */
--grid-mobile: 4 columns;
--grid-tablet: 8 columns;
--grid-desktop: 12 columns;

/* Breakpoints */
@media (min-width: 640px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }

/* Container query for product cards */
.product-grid {
  container-type: inline-size;
}

@container (max-width: 400px) {
  .product-card { /* Single column */ }
}

@container (min-width: 401px) and (max-width: 800px) {
  .product-card { /* 2 columns */ }
}

@container (min-width: 801px) {
  .product-card { /* 3-4 columns */ }
}
```

---

## Animation & Micro-Interactions

Per DESIGN-SKILL Phase 4.4:

```css
:root {
  --duration-micro: 150ms;
  --duration-transition: 250ms;
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0.0, 1, 1);
}

/* Hover states */
.product-card:hover {
  transform: scale(1.02);
  transition: transform var(--duration-micro) var(--ease-enter);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility Checklist

Per DESIGN-SKILL Phase 5.1:

- [ ] All images have descriptive `alt` text
- [ ] Color contrast ≥4.5:1 for text
- [ ] Touch targets minimum 44×44px
- [ ] Semantic HTML (`<nav>`, `<main>`, `<footer>`, `<button>`, `<a>`)
- [ ] Skip-to-content link
- [ ] Focus visible outlines (`:focus-visible`)
- [ ] Reduced motion media query

---

## Assets Required

### Images
1. Hero image (lifestyle shot of signature cake)
2. Category images (Cakes, Brownies, Drinks, Tres Leches)
3. Individual product photos (matching menu style)
4. Kitchen/baking process photos (for About page)
5. `logo.png` (provided)

### Icons
- Use **Phosphor Icons** or **Lucide Icons**
- WhatsApp, Instagram, Phone, Location
- Home, Menu, Heart, Shopping bag

---

## Google Stitch Implementation Notes

### When Importing to Stitch:
1. **Start with mobile layout** - 4-column grid
2. **Use provided color tokens** - Copy CSS variables
3. **Typography**: Set Playfair Display for headings, Inter for body
4. **Spacing**: Stick to 8px multiples (8, 16, 24, 32, 48)

### Post-Stitch Cleanup (per DESIGN-SKILL Phase 5.3):
- Replace any emoji icons with vector icons
- Verify spacing conforms to 8-point grid
- Check color saturation isn't too high
- Ensure all "lorem ipsum" is replaced with real content

---

## WhatsApp Integration Links

```
# Direct chat with pre-filled message
https://wa.me/919489370369?text=Hi!%20I%20want%20to%20order%20from%20Nellai%20Aanantham

# Product-specific order
https://wa.me/919489370369?text=Hi!%20I'd%20like%20to%20order%20[PRODUCT_NAME]
```

---

## Instagram Embed

```html
<a href="https://instagram.com/nellai_aanantham" target="_blank" rel="noopener">
  @nellai_aanantham
</a>
```

---

## Google Stitch Prompts — Copy & Paste Ready

> **Instructions**: Use these prompts in Google Stitch to generate each screen. After generation, apply the component specs above for consistency.

---

### Prompt 1: Hero / Landing Page

```
Create a mobile-first landing page for "Nellai Aanantham" - a homemade bakery.

BRAND:
- Logo: Circular badge, pink and yellow colors
- Tagline: "Where Every Bite Gives You Aanantham"
- Primary color: Pink (#E91E8C)
- Secondary color: Yellow (#FFD700)
- Background: Soft cream/light pink (#FFE4EC)

LAYOUT:
- Full-screen hero section with large cake image
- Overlay gradient from bottom (dark) for text readability
- Centered brand name and tagline
- Two pill-shaped CTA buttons stacked:
  - Primary (pink): "Order on WhatsApp" with WhatsApp icon
  - Secondary (outline): "View Full Menu"
- Below hero: 3 category cards in a bento grid (Cakes, Brownies, Drinks)
- Each card shows category image, name, and "From ₹X" price

STYLE:
- Warm, inviting, homemade feel
- Rounded corners (16-24px) on all cards
- Playful but professional typography
- Use Playfair Display for headings, Inter for body text
- 8px spacing grid

FOOTER: Show WhatsApp number 9489370369, Instagram @nellai_aanantham, FSSAI: 22426282000173
```

---

### Prompt 2: Full Menu Page

```
Create a menu page for "Nellai Aanantham" bakery with category tabs and product grid.

BRAND COLORS:
- Primary: Pink (#E91E8C)
- Accent: Yellow (#FFD700)
- Background: White with subtle cream tints

HEADER:
- Logo on left
- Navigation: Menu (active), About, Contact
- Mobile: Hamburger menu icon

CATEGORY TABS (sticky, horizontal scroll on mobile):
- Cakes | Fusion Cakes | Brownies | Tres Leches | Drinks
- Active tab: Pink underline
- Pill-shaped background on active

PRODUCT GRID:
- 2 columns mobile, 3-4 columns desktop
- Each product card:
  - Square/4:3 product image
  - Product name (bold)
  - Price in ₹ (e.g., ₹950)
  - Small "Order" button with WhatsApp icon
  - Bestseller/Popular badge on select items (yellow background)

SAMPLE PRODUCTS TO SHOW:
Cakes: Vanilla ₹750, Pineapple ₹850, Rasamalai ₹1,100, Black Forest ₹950
Brownies: Classic ₹70, Double Chocolate ₹90, Triple Chocolate ₹110
Drinks: Hot Chocolate ₹80, Cold Coffee ₹60, Rose Milk ₹50

INTERACTION: Cards should look tappable with subtle shadow, slight scale on hover
```

---

### Prompt 3: Product Detail Bottom Sheet

```
Create a product detail bottom sheet / modal for a bakery app.

TRIGGER: Opens when user taps a product card from the menu

LAYOUT (Bottom Sheet for mobile):
- Drag handle at top (small horizontal pill, centered)
- Large product image (full width, rounded top corners)
- Product name: Large, bold (e.g., "Rasamalai Cake")
- Price: ₹1,100 (prominent, pink color)
- Description: 2-3 lines about the product
- Primary CTA: Full-width pink pill button "Order on WhatsApp"
- Secondary info: "📞 Call: 9489370369" as text link
- Padding: 24px sides

DESKTOP VERSION:
- Centered modal with 500px max-width
- Close X button top-right
- Same content layout

ANIMATION:
- Slides up from bottom (mobile)
- Fades in with slight scale (desktop)
- Backdrop: Blurred dark overlay

STYLE: Same brand colors - Pink, Yellow, Cream background
```

---

### Prompt 4: Mobile Navigation Drawer

```
Create a slide-out navigation drawer for mobile.

TRIGGER: Hamburger menu icon tap

LAYOUT:
- Slides in from LEFT
- Width: 280px or 75% of screen
- Full height

CONTENT (top to bottom):
1. Logo (centered or left-aligned)
2. Divider line
3. Navigation links (vertical list):
   - Home
   - Menu
   - About Us
   - Contact
   - (each with right arrow icon)
4. Divider line
5. Contact section:
   - WhatsApp button (green icon + "9489370369")
   - Instagram link (@nellai_aanantham)
6. Footer: "FSSAI: 22426282000173" in small text

STYLE:
- Background: White
- Text: Dark gray
- Active link: Pink highlight
- Shadow on right edge
- Backdrop: Semi-transparent dark overlay with blur

ANIMATION: Slide in 250ms ease-out
```

---

### Prompt 5: About / Story Page

```
Create an "About Us" page for Nellai Aanantham homemade bakery.

HERO SECTION:
- Large heading: "Our Story"
- Subheading: "Homemade with Love"

STORY SECTION:
- Image on left (kitchen/baking photo), text on right
- Story text: "Every treat at Nellai Aanantham is handcrafted with love using premium ingredients. Based in Nellai (Tirunelveli), we bring you authentic homemade desserts that taste just like grandma's kitchen."

WHY CHOOSE US (3 cards in a row):
- Card 1: House icon + "Homemade Daily" + "Fresh baked every day"
- Card 2: Sparkle icon + "Premium Ingredients" + "No preservatives"
- Card 3: Cake icon + "Custom Orders" + "Personalized for you"

TRUST SECTION:
- FSSAI badge/logo
- License number: 22426282000173
- "Government Certified Food Safety"

CTA SECTION:
- "Ready to taste the happiness?"
- [Order Now on WhatsApp] button

FOOTER: Standard footer with links and contact

STYLE: Warm, trustworthy, use pink accents, cream backgrounds, rounded cards
```

---

### Prompt 6: Contact / How to Order Page

```
Create a "Contact & Order" page for Nellai Aanantham bakery.

SECTION 1 - HOW TO ORDER:
Heading: "How to Order"
Steps (vertical timeline or numbered cards):
1. "Browse our delicious menu" - Menu icon
2. "WhatsApp your order to 9489370369" - WhatsApp icon
3. "Confirm details & make advance payment" - Check icon
4. "Pick up fresh or get it delivered!" - Delivery icon

Each step: Icon on left, text on right, connected by vertical line

SECTION 2 - CONTACT US:
Two large contact cards side by side:

Card 1 - WhatsApp:
- Green WhatsApp icon (large)
- "9489370369"
- "Chat with us anytime"
- [Open WhatsApp] button

Card 2 - Instagram:
- Instagram gradient icon
- "@nellai_aanantham"
- "Follow for updates"
- [Follow Us] button

Below cards:
- Phone icon + "Call us: 9489370369"

SECTION 3 - LOCATION (optional):
- "Based in Tirunelveli, Tamil Nadu"
- Small map or location illustration

FOOTER: Standard with FSSAI info

STYLE: Clean, easy to scan, prominent contact buttons, pink and white color scheme
```

---

### Prompt 7: Footer Component

```
Create a website footer for Nellai Aanantham bakery.

LAYOUT (3 columns on desktop, stacked on mobile):

COLUMN 1 - BRAND:
- Logo (small)
- Tagline: "Where Every Bite Gives You Aanantham"

COLUMN 2 - QUICK LINKS:
- Home
- Menu
- About
- Contact

COLUMN 3 - CONTACT:
- WhatsApp: 9489370369
- Instagram: @nellai_aanantham
- Phone icon for call

BOTTOM BAR (full width):
- Left: FSSAI License: 22426282000173
- Right: © 2026 Nellai Aanantham

STYLE:
- Background: Dark (charcoal #1a1a1a) or brand pink
- Text: White or light cream
- Links: Underline on hover
- Icons: Use simple line icons for WhatsApp, Instagram, Phone
- Padding: 48px vertical
```

---

### Prompt 8: Toast & Notification Component

```
Create toast notification components for a bakery website.

TOAST TYPES:

Success Toast:
- Green checkmark icon
- "Item added to favorites!"
- X close button
- Appears bottom-center
- Slides up, auto-dismisses after 3 seconds

Info Toast:
- Info icon (blue or pink)
- "WhatsApp is the fastest way to order!"
- Same positioning and animation

Error Toast:
- Red X or warning icon
- "Something went wrong. Please try again."
- Same style

STYLE:
- Background: Dark (#1a1a1a) with high contrast
- Text: White
- Border-radius: 12px
- Padding: 16px 24px
- Shadow: Subtle elevation
- Width: Auto (content-based), max 90% of screen
```

---

### Prompt 9: Button Component Library

```
Create a button component library for Nellai Aanantham bakery website.

BUTTON TYPES:

1. PRIMARY BUTTON:
- Pink background (#E91E8C)
- White text, bold
- Pill shape (fully rounded)
- Padding: 16px 32px
- Example: "Order on WhatsApp"
- States: Default, Hover (slightly lighter), Active (slightly darker), Disabled (50% opacity)

2. SECONDARY BUTTON:
- Transparent background
- Pink border (2px)
- Pink text
- Same pill shape
- Example: "View Menu"

3. GHOST BUTTON:
- No background, no border
- Dark text
- Underline on hover
- Example: Navigation links

4. ICON BUTTON:
- Circular, 44px diameter
- Transparent or light background
- Icon centered (24px)
- Example: Close (X), Menu (hamburger), Share

5. SOCIAL BUTTON:
- WhatsApp: Green (#25D366) background, white icon
- Instagram: Gradient background, white icon
- Both pill-shaped with icon + text

Show all buttons with hover states indicated
```

---

### Prompt 10: Product Card Variants

```
Create product card component variants for a bakery menu.

VARIANT 1 - STANDARD CARD:
- Square product image (1:1)
- Product name below
- Price (₹950)
- Small "Order" text button

VARIANT 2 - FEATURED CARD (larger):
- Larger image (4:3 ratio)
- "Bestseller" badge (yellow, top-right corner)
- Product name (larger text)
- Price
- Full-width CTA button

VARIANT 3 - COMPACT CARD (for lists):
- Horizontal layout
- Small image on left (80px square)
- Name + price on right
- Order button aligned right

VARIANT 4 - CATEGORY CARD:
- Large background image (full bleed)
- Dark gradient overlay at bottom
- Category name in white (e.g., "CAKES")
- "From ₹750" subtitle
- Tappable to navigate

STYLE FOR ALL:
- Border-radius: 16px
- Subtle shadow on hover
- Scale up 2% on hover
- Use brand colors (pink, yellow, cream)
```

---

## Post-Generation Checklist

After generating each screen in Stitch, verify:

- [ ] Colors match brand palette (Pink #E91E8C, Yellow #FFD700)
- [ ] All spacing uses 8px multiples (8, 16, 24, 32, 48)
- [ ] Touch targets are minimum 44×44px
- [ ] Border-radius is consistent (16px cards, 24px modals, 9999px buttons)
- [ ] Typography: Playfair Display headings, Inter body
- [ ] Real content replaces any placeholder text
- [ ] Icons are vector (Phosphor/Lucide), not emoji
- [ ] Hover states are defined for interactive elements
- [ ] Mobile layout is tested and responsive

---

*This guide follows DESIGN-SKILL.md principles for all design decisions.*
