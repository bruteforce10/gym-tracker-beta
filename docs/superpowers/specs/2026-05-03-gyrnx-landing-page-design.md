# GYRNX Landing Page Design

**Date:** 2026-05-03
**Project:** Gym Tracker
**Goal:** Create a high-impact kinetic typography landing page for GYRNX fitness app

## Overview

A brutalist, kinetic typography landing page for the GYRNX fitness app. The design fully embraces the Kinetic Typography style with massive viewport-based typography, constant motion (marquees), aggressive scale hierarchy, and hard color inversions on hover. Primary conversion goal is user sign-up.

## Design System

Based on `docs/prompt-design.md` and `src/app/globals.css`:

- **Background:** `#0A0A0F` (rich black)
- **Foreground:** `#F5F5F7` (off-white)
- **Primary/Accent:** `#10B981` (emerald)
- **Muted Foreground:** `#8B8BA3`
- **Border:** `#2A2A3A`
- **Font:** Space Grotesk (heading) / Inter (body)
- **Border Radius:** 0px (sharp corners)
- **Style:** No shadows, flat design, 2px borders

## Sections

### 1. Hero Section

**Layout:** Full-viewport height, darkened gym photo background with heavy overlay

**Typography:**
- Main headline: `text-[clamp(4rem,15vw,18rem)]` viewport-based scaling
- Subheadline: `text-xl md:text-2xl lg:text-3xl`
- Background decorative number "01": `text-[15rem] md:text-[20rem]`

**CTA Buttons:**
- Primary (Start Tracking): Emerald background, black text, hover scale 1.05
- Secondary (See Features): Transparent with border, hover invert colors

**Visual Elements:**
- Floating phone mockup with workout summary
- Subtle emerald glow on hover

---

### 2. Marquee / Social Proof

**Layout:** Full-width, `h-20 md:h-24`, bordered top and bottom

**Content:** Infinite scrolling text
- Text: "280+ EXERCISES • TRACK YOUR PROGRESS • SHARE YOUR WORKOUT • BUILD YOUR IDENTITY • REAL-TIME TRACKING •"
- Style: Emerald, uppercase, bold, `text-2xl md:text-3xl`
- Speed: 80 (fast), no gradients, auto-fill true

**Implementation:** `react-fast-marquee` library

---

### 3. Feature Grid (5 Sections)

**Layout Pattern:**
- Each section: `py-32` with top border
- Alternating 2-column layout (content/image flip)
- Massive decorative background numbers (01-05)

**Feature 1: Workout Tracker**
- Title: "TRACK EVERY REP"
- Image: Workout input screen

**Feature 2: Smart Workout Plans**
- Title: "STRUCTURED TRAINING"
- Image: Workout plans list

**Feature 3: Progress Tracking**
- Title: "SEE REAL PROGRESS"
- Image: Charts/analytics

**Feature 4: Goal System**
- Title: "HIT YOUR TARGET"
- Image: Circular progress (70%)

**Feature 5: Social Sharing**
- Title: "SHARE YOUR GRIND"
- Image: Workout summary + share button

**Styling:**
- All phone mockups have 2px borders, sharp corners
- Emerald glow on hover
- Responsive: stacked on mobile, 2-column on tablet+

---

### 4. App Preview Grid

**Layout:**
- 3-column grid (desktop), 2-column (tablet), 1-column (mobile)
- Masonry-style staggered layout
- 5 phone mockups with rotation offsets

**Screens:**
1. Dashboard (-2deg rotation)
2. Workout Plan (spans 2 rows)
3. Progress (+2deg rotation)
4. Workout Input (spans 2 rows)
5. Summary Share (-1deg rotation)

**Interactivity:**
- Hover: Scale 1.05, emerald glow intensifies
- All maintain sharp corners

---

### 5. Differentiation Section

**Layout:**
- Full-width, `py-32`
- Centered section header

**Header:**
- Title: "NOT JUST A GYM APP"

**3 Cards:**
- Grid: 3-column desktop, 1-column mobile
- Cards: "TRACK EVERYTHING", "BUILD REAL PROGRESS", "SHOW YOUR RESULTS"

**Card Interaction:**
- Base: Black background, white text, border
- Hover: Emerald background, black text, scale 1.02
- Duration: 300ms transition

---

### 6. Stats Section

**Layout:**
- Full-width, `py-32`
- Vertical stack of 4 stats

**Stats:**
1. **280+** - EXERCISES
2. **REAL-TIME** - TRACKING
3. **WEEKLY** - REPORTS
4. **SOCIAL** - SHARING

**Styling:**
- Numbers: `text-[6rem] md:text-[8rem] lg:text-[10rem]` in emerald
- Labels: `text-xl md:text-2xl lg:text-3xl` in muted
- Spacing: `space-y-16 md:space-y-20`

---

### 7. Final CTA

**Layout:**
- Full-width, `py-32 md:py-40 lg:py-48`
- Full emerald background (`bg-primary`)
- No border (contrast break)

**Content:**
- Headline: "START YOUR FIRST WORKOUT"
- Subtext: "Stop guessing. Start progressing."
- CTA Button: "GET STARTED" (black background, emerald text, massive)

**Styling:**
- Full emerald background for maximum contrast
- Black text for readability
- Massive button for impact

---

## Technical Requirements

### Dependencies
- `react-fast-marquee` - for infinite marquees
- Existing: Tailwind CSS, shadcn/ui, Lucide icons

### File Structure
```
src/app/
├── page.tsx (landing page - replace redirect)
└── landing/
    ├── components/
    │   ├── hero.tsx
    │   ├── marquee.tsx
    │   ├── feature-section.tsx
    │   ├── app-preview-grid.tsx
    │   ├── differentiation-cards.tsx
    │   ├── stats-section.tsx
    │   └── final-cta.tsx
    └── constants.ts (feature data)
```

### Responsive Approach
- Mobile-first design
- Use `clamp()` for viewport-based typography
- Stack on mobile, 2-column tablet, 3-column desktop
- Maintain dramatic scale at all breakpoints

### Accessibility
- Respect `prefers-reduced-motion`
- Minimum 44x44px touch targets
- High contrast throughout (exceeds WCAG AA)
- Focus indicators on interactive elements

---

## Implementation Notes

1. **Color Usage:** Use CSS variables from `globals.css` - `primary` for emerald, `foreground`, `muted-foreground`, `border`

2. **Typography:** All headings uppercase with `tracking-tighter`. Use `font-heading` class.

3. **Borders:** Always `border-2` for emphasis, `rounded-none` for sharp corners.

4. **Animations:**
   - Marquees: Continuous linear, no pause
   - Hover: 300ms duration, `ease-in-out`
   - Button scale: 1.05 on hover, 0.95 on active

5. **Images:** Use placeholder gym photo for hero. Phone mockups as styled divs for now.

6. **Glow Effect:** Use existing `.glow-emerald` class from `globals.css`.

---

## Success Criteria

- Visual impact matches Kinetic Typography design system
- All sections responsive across mobile/tablet/desktop
- Primary CTA (sign-up) prominent throughout
- Performance: 60fps animations, no layout shifts
- Accessibility: Passes WCAG AA contrast ratios
