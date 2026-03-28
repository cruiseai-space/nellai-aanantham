# DESIGN-SKILL.md
> **Single Source of Truth** for Design Inspiration, Design Choices, Design Validation, and Google Stitch Integration

---

## Purpose
This skill governs all UI/UX design decisions across the project. It provides:
- **Design Inspiration**: Curated patterns, standards, and creative direction
- **Design Choices**: Deterministic rules for layout, typography, color, and interactions
- **Design Validation**: Automated checks against accessibility, performance, and consistency
- **Google Stitch Integration**: Guidelines for incorporating exported HTML pages

---

## Trigger Phrases
- "Design this component/page"
- "Validate my design"
- "Apply design system"
- "Integrate Stitch export"
- "Review UI/UX"
- "Create bento layout"
- "Set up color theme"
- "Check accessibility"

---

## Phase 1: Spatial Architecture & Layout Mechanics

### 1.1 8-Point Spatial Rhythm Configuration
**When**: Establishing padding, margins, and grid alignments

**Execute**:
1. Enforce an **8-point base unit system**: `4, 8, 16, 24, 32, 48, 64, 96px`
2. Apply spacing hierarchy:
   - Internal padding: `8-16px`
   - Related element gaps: `8-16px`
   - Unrelated element gaps: `24-32px`
   - Section breaks: `48-96px`
3. **Never** use arbitrary prime numbers
4. Apply **Rule of Thirds** and **Fibonacci sequence** for macro-layout balance

**Standards**: 8-Point Grid System, Rule of Thirds, Fibonacci Sequence

---

### 1.2 Bento Grid Structuring & Content-Out Architecture
**When**: Generating dashboards or feature-rich landing pages

**Execute**:
1. Inventory all content first
2. Construct grid system:
   - Desktop: **12-column** grid
   - Mobile: **4-column** grid
3. Partition data into modular **2×2 bento containers** using CSS Grid (`minmax`, `auto-fit`)
4. Map visual flow using **F-Pattern** or **Z-Pattern** heuristics
5. Place highest-priority metrics in the **top-left**

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}
```

**Standards**: CSS Grid, F-Pattern, Z-Pattern

---

### 1.3 Container-Query Responsive Adaptation
**When**: Designing reusable UI components for multiple viewports

**Execute**:
1. **Reject** viewport-based `@media` queries for internal components
2. Use `container-type: inline-size`
3. Define **3 variants minimum**:
   - Compact: `max-width: 300px`
   - Medium: `max-width: 600px`
   - Expanded: `min-width: 601px`
4. Scale gracefully between variants

```css
.card-container {
  container-type: inline-size;
}

@container (max-width: 300px) {
  .card { /* Compact variant */ }
}
```

**Standards**: Container Queries, Responsive Design

---

### 1.4 Algorithmic Component Dimensioning
**When**: Generating interactive buttons or data chips

**Execute**:
1. Calculate: `text line-height + vertical padding`
2. Enforce ratio: **Target Width = Computed Height × 2**
3. Override ratio only for **WCAG minimum touch targets: 44×44px**

**Standards**: WCAG 2.1, Touch Target Sizes

---

## Phase 2: Mathematical Typography & Iconometry

### 2.1 Geometric Typography Scaling
**When**: Initializing a project's text system

**Execute**:
1. Limit to **2 font families** (Sans-serif for UI, Serif for Display)
2. Establish base size:
   - Desktop: `16px`
   - Mobile: `14px`
3. Scale headings using geometric ratio (`1.25x` or `1.5x`):
   ```
   size_n = base_size × ratio^(n-1)
   ```
4. Limit line lengths to **60-75 characters**

```css
:root {
  --font-base: 16px;
  --scale-ratio: 1.25;
  --font-sm: calc(var(--font-base) / var(--scale-ratio));
  --font-lg: calc(var(--font-base) * var(--scale-ratio));
  --font-xl: calc(var(--font-lg) * var(--scale-ratio));
  --font-2xl: calc(var(--font-xl) * var(--scale-ratio));
}
```

**Standards**: Modular Scale, Typography

---

### 2.2 Hierarchical Line Height & Kerning
**When**: Formatting text blocks for readability

**Execute**:
1. Assign line heights programmatically:
   - Body text: `1.5 × font-size`
   - Small text: `1.4 × font-size`
   - Headings: `1.1 - 1.2 × font-size`
2. Apply kerning reduction of **-2% to -3%** on large display text only

**Standards**: Line Height, Kerning

---

### 2.3 Iconometry & Vertical Rhythm Synchronization
**When**: Placing vector icons adjacent to text elements

**Execute**:
1. Extract adjacent text's **computed CSS line-height** (not font-size)
2. Force SVG bounding box to match exact pixel integer (e.g., `24px` box for `16px` font with `1.5x` line-height)
3. Apply `align-items: center` to eliminate sub-pixel baseline misalignment

```css
.icon-text {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-text svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
```

**Standards**: Vertical Rhythm, Iconography

---

## Phase 3: Color Systems & Dimensional Physics

### 3.1 4-Layer Semantic Color Architecture
**When**: Generating color variables and themes

**Execute**:
1. Implement **4-layer functional system**:
   - **Layer 1**: Background canvas
   - **Layer 2**: Elevated surfaces
   - **Layer 3**: Text/Icons
   - **Layer 4**: Accents/CTAs
2. Utilize **triadic color schemes** for harmony
3. Apply text opacity cascade:
   - Primary: `87%`
   - Secondary: `60%`
   - Tertiary: `38%`

```css
:root {
  /* Layer 1 - Canvas */
  --bg-canvas: hsl(0, 0%, 100%);
  
  /* Layer 2 - Surfaces */
  --bg-surface: hsl(0, 0%, 98%);
  --bg-elevated: hsl(0, 0%, 96%);
  
  /* Layer 3 - Text */
  --text-primary: hsla(0, 0%, 0%, 0.87);
  --text-secondary: hsla(0, 0%, 0%, 0.60);
  --text-tertiary: hsla(0, 0%, 0%, 0.38);
  
  /* Layer 4 - Accents */
  --accent-primary: hsl(220, 90%, 56%);
  --accent-success: hsl(142, 76%, 36%);
  --accent-error: hsl(0, 84%, 60%);
}
```

**Standards**: Color Theory, Semantic Color

---

### 3.2 HSL Dark Mode Physics (Zero-Shadow Elevation)
**When**: Compiling `prefers-color-scheme: dark` variables

**Execute**:
1. **Nullify** all `box-shadow` properties
2. Calculate Z-axis elevation via **HSL lightness (L)**:
   - Base canvas: `≤ 15%` lightness
   - Each Z-index step up: increase lightness by `3-5%`
3. **Desaturate** accent colors by `15-20%`
4. Invert text inside chips to prevent retina halation

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-canvas: hsl(220, 15%, 10%);
    --bg-surface: hsl(220, 15%, 13%);
    --bg-elevated: hsl(220, 15%, 16%);
    --text-primary: hsla(0, 0%, 100%, 0.87);
  }
}
```

**Standards**: Dark Mode, HSL Color Model

---

### 3.3 High-Fidelity Light Mode Depth
**When**: Establishing elevation in light environments

**Execute**:
1. Render shadows **virtually invisible** to the naked eye
2. **Maximize blur radius**, **minimize opacity**
3. Reserve pronounced shadows for **transient elements only**: Dropdowns, Popovers

```css
.card {
  box-shadow: 0 1px 3px hsla(0, 0%, 0%, 0.04),
              0 4px 12px hsla(0, 0%, 0%, 0.02);
}
.dropdown {
  box-shadow: 0 4px 24px hsla(0, 0%, 0%, 0.12);
}
```

**Standards**: Shadow Rendering, Elevation

---

### 3.4 Performance-Optimized Glassmorphism
**When**: Designing overlays, modals, or premium SaaS cards

**Execute**:
1. Apply `backdrop-filter: blur(10-20px)`
2. Add `1px` low-opacity white inside border
3. Add subtle inner shadow for glass volume
4. **Limit** `backdrop-filter` usage to `<50%` of viewport

```css
.glass-card {
  background: hsla(0, 0%, 100%, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid hsla(0, 0%, 100%, 0.3);
  box-shadow: inset 0 1px 0 hsla(0, 0%, 100%, 0.4);
}
```

**Standards**: Glassmorphism, Performance Optimization

---

## Phase 4: Component States & Interaction Mechanics

### 4.1 Exhaustive State Matrix Generation
**When**: Defining interactive states of any UI primitive

**Execute** - Generate visual variables for **6+ states**:

| State | Visual Treatment |
|-------|-----------------|
| Default | Baseline appearance |
| Hover | `scale(1.02)`, `+5% brightness`, expanded shadow |
| Active/Pressed | `scale(0.98)`, inset shadow |
| Focus | `2px` semantic outline ring |
| Disabled | `opacity: 0.5`, grayscale background |
| Loading | Continuous shimmer mask animation |
| Error | Semantic red tint |
| Success | Semantic green tint |

```css
.btn {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}
.btn:hover { transform: scale(1.02); filter: brightness(1.05); }
.btn:active { transform: scale(0.98); }
.btn:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
.btn:disabled { opacity: 0.5; pointer-events: none; }
```

**Standards**: State Management, UI Feedback

---

### 4.2 Cognitive Interruption Routing
**When**: Determining UI paradigm for a triggered user task

**Execute** (Hick's Law Assessment):
1. If task is **simple** (≤2 inputs), **non-destructive**, and requires visual context:
   → Generate **non-blocking Popover**
2. If task is **complex**, **destructive**, or initiates new workflow:
   → Generate **full-screen background-blurred Modal**

**Standards**: Hick's Law, UI Paradigms

---

### 4.3 Optimistic UI State Representation
**When**: Writing client-to-server data mutation logic

**Execute**:
1. Bind click event
2. **Instantly** mutate local DOM (e.g., remove deleted row visually)
3. Fire success Toast immediately
4. Process database fetch asynchronously
5. **Only if** server returns non-200 status: revert DOM state + fire Error Toast

**Standards**: Optimistic UI, Error Handling

---

### 4.4 Micro-Interaction Timing & Easing
**When**: Choreographing UI animations

**Execute**:
1. Enforce timing bounds:
   - Micro-interactions: `150-200ms`
   - Component transitions: `200-300ms`
2. Easing functions:
   - Entering elements: `ease-out`
   - Exiting elements: `ease-in`
3. Hover tooltips: **300ms delay** (prevent rapid-fire triggering)

```css
:root {
  --duration-micro: 150ms;
  --duration-transition: 250ms;
  --ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0.0, 1, 1);
}
```

**Standards**: Animation Timing, Easing Functions

---

## Phase 5: Accessibility, Performance & Anti-Vibe Enforcement

### 5.1 Accessibility-First Semantic Generation
**When**: Writing DOM structure and attributes

**Execute**:
1. Map interactions natively:
   - `<button>` for actions
   - `<a>` for navigation
2. Verify keyboard tab index logic
3. Enforce contrast ratios:
   - Text: **≥4.5:1**
   - Component boundaries: **≥3:1**
4. Inject reduced-motion constraints:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Standards**: WCAG 2.1, Semantic HTML

---

### 5.2 Performance-Conscious Effect Auditing
**When**: Evaluating CSS animations and transitions

**Execute**:
1. **Strip** transitions on layout properties: `width`, `height`, `margin`, `padding`
2. **Permit** animations exclusively on GPU-accelerated properties:
   - `transform`
   - `opacity`

```css
/* ✅ Good */
.card { transition: transform 200ms, opacity 200ms; }

/* ❌ Bad - triggers layout recalc */
.card { transition: width 200ms, padding 200ms; }
```

**Standards**: CSS Performance, GPU Acceleration

---

### 5.3 Vibe-Code Suppression & Normalization
**When**: Post-processing raw LLM-generated UI code or Google Stitch exports

**Execute**:
1. **Identify and replace** Unicode emojis with **Phosphor/Lucide** vector icons
2. **Scan and mute** hyper-saturated hex codes (reduce saturation)
3. **Detect and remove** "dead cards" lacking actionable data
4. **Strip** "lorem ipsum" → inject realistic, context-aware placeholder data

**Standards**: Code Normalization, Placeholder Data

---

## Phase 6: System Architecture & Presentation Handoff

### 6.1 Atomic to Molecular API Construction
**When**: Structuring finalized design system for developer handoff

**Execute**:
1. Build from **token layer up**
2. Define CSS/Design tokens as **single source of truth**
3. Define Component API strictly:
   - Props
   - Defaults
   - Constraints
   - Slots
4. Map out **progressive disclosure empty states** for every data container

```javascript
// Component API Example
const Button = {
  props: {
    variant: { type: 'primary' | 'secondary' | 'ghost', default: 'primary' },
    size: { type: 'sm' | 'md' | 'lg', default: 'md' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
  },
  slots: ['icon-left', 'default', 'icon-right']
};
```

**Standards**: Design Tokens, Component API

---

### 6.2 High-Fidelity Spatial Presentation Transformations
**When**: Exporting designs for portfolio or stakeholder review

**Execute**:

**Creative/Portfolio Mode**:
```css
.presentation-card {
  transform: perspective(1000px) rotateX(2deg) rotateY(-14deg);
  box-shadow: 0 50px 100px hsla(0, 0%, 0%, 0.25);
}
```

**Professional/Enterprise Mode**:
- Integrate flat UI into realistic AI-generated environmental lifestyle mockups
- Use natural desk lighting for market-ready tangibility

**Standards**: 3D Presentation, Environmental Mockups

---

## Google Stitch Integration Guidelines

When incorporating HTML pages exported from Google Stitch:

### Pre-Integration Checklist
- [ ] Run **Phase 5.3 Vibe-Code Suppression** on exported code
- [ ] Validate color values against **Phase 3** color system
- [ ] Check spacing values conform to **8-point grid** (Phase 1.1)
- [ ] Verify typography scales match **Phase 2.1** modular scale

### Integration Steps
1. **Extract** Stitch-generated HTML structure
2. **Map** Stitch classes to project design tokens
3. **Replace** inline styles with CSS custom properties
4. **Audit** for accessibility (Phase 5.1)
5. **Optimize** animations (Phase 5.2)
6. **Test** all component states (Phase 4.1)

### Post-Integration Validation
```bash
# Checklist
✓ 8-point spacing compliance
✓ Typography hierarchy intact
✓ Color contrast ratios ≥4.5:1
✓ Touch targets ≥44×44px
✓ Animations use transform/opacity only
✓ Container queries for responsiveness
✓ Dark mode support
```

---

## Design Validation Checklist

Use this checklist to validate any UI component or page:

### Spatial & Layout
- [ ] Uses 8-point spacing system
- [ ] Grid follows 12-col (desktop) / 4-col (mobile)
- [ ] Container queries for component responsiveness
- [ ] Touch targets minimum 44×44px

### Typography
- [ ] Maximum 2 font families
- [ ] Geometric scale ratio applied
- [ ] Line lengths 60-75 characters
- [ ] Icons match adjacent text line-height

### Color & Depth
- [ ] 4-layer semantic color architecture
- [ ] Dark mode uses lightness elevation (no shadows)
- [ ] Light mode shadows subtle and high-blur
- [ ] Text opacity cascade (87%/60%/38%)

### States & Interactions
- [ ] All 6+ states defined (hover, active, focus, disabled, loading, error)
- [ ] Animations 150-300ms
- [ ] Uses ease-out for enter, ease-in for exit
- [ ] Optimistic UI for mutations

### Accessibility & Performance
- [ ] Semantic HTML elements
- [ ] Contrast ratios WCAG compliant
- [ ] Reduced-motion media query present
- [ ] Animations use transform/opacity only

---

## Quick Reference: CSS Token Template

```css
:root {
  /* Spacing (8-point) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;
  --space-8: 96px;

  /* Typography */
  --font-base: 16px;
  --font-scale: 1.25;
  --line-height-body: 1.5;
  --line-height-heading: 1.15;

  /* Colors - Light Mode */
  --bg-canvas: hsl(0, 0%, 100%);
  --bg-surface: hsl(0, 0%, 98%);
  --text-primary: hsla(0, 0%, 0%, 0.87);
  --text-secondary: hsla(0, 0%, 0%, 0.60);
  --accent: hsl(220, 90%, 56%);

  /* Transitions */
  --duration-micro: 150ms;
  --duration-default: 250ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1, 1);
}
```

---

## Example Prompts

- "Create a dashboard using bento grid layout"
- "Validate this component against the design system"
- "Set up dark mode for this page"
- "Review the Stitch export and normalize it"
- "Generate button states for this CTA"
- "Check accessibility compliance"
- "Apply glassmorphism to this modal"

---

*This skill ensures design consistency, accessibility compliance, and performance optimization across all UI/UX work.*
