---
name: ui-ux-pro-designer
description: Pro-level UI/UX design theory, modern aesthetics, layout systems, typography, color theory, and premium visual excellence.
---

# UI/UX Pro Designer Skill

This skill provides the theoretical foundation and practical guidelines for designing premium, modern, and aesthetically pleasing user interfaces. Apply these principles whenever building or suggesting UI elements to ensure a "wow" factor.

## 1. Core Principles
*   **Visual Hierarchy:** Guide the user's eye. Use size, weight, and color contrast to indicate importance (e.g., H1 > H2 > Body > Muted Text).
*   **Whitespace (Negative Space):** Let elements breathe. Avoid cluttered UIs. Generous padding and margins create a premium, clean feel.
*   **Consistency:** Use a unified design system. Buttons, inputs, and cards should share the same border-radius, shadow logic, and hover effects across the app.

## 2. Color Theory & Usage
*   **The 60-30-10 Rule:** 60% dominant color (usually background), 30% secondary color (cards, secondary elements), 10% accent color (primary buttons, active states, badges).
*   **HSL/HSB over RGB/HEX:** Use HSL for programmatic color variations. Create lighter/darker shades by just tweaking Lightness.
*   **Dark Mode Excellence:** Don't use pure black (`#000000`). Use deep grays (e.g., `#0f172a`, `#18181b`) for backgrounds. Text should be off-white (`#f8fafc`) to reduce eye strain.
*   **Gradients:** Use subtle, multi-stop gradients instead of flat colors for modern backgrounds or hero sections (e.g., subtle mesh gradients).

## 3. Typography
*   **Font Pairings:** Stick to 1 or 2 font families max. Example: Inter/Roboto (clean sans-serif for UI) + Playfair/Merriweather (serif for headings).
*   **Line Height & Width:** Set line-height to `1.5` or `1.6` for body text. Keep line width between 60-80 characters for optimal readability.
*   **Letter Spacing:** Slightly increase tracking for ALL CAPS or small labels. Decrease slightly for large headings to make them look tight and punchy.

## 4. Modern UI Trends
*   **Bento Box Grids:** Organize information in clean, modular grids of cards with varying sizes but consistent gaps.
*   **Glassmorphism:** Use semi-transparent backgrounds with backdrop-blur. Works best over colorful or gradient backgrounds (e.g., `bg-white/10 backdrop-blur-md border border-white/20`).
*   **Subtle Shadows & Depth:** Avoid harsh, solid black shadows. Use large, soft shadows with low opacity and a slight color tint (e.g., `box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05)`).
*   **Soft Borders:** Use `border-radius` strategically. Fully rounded (pill) for action buttons, large rounded corners (`xl` or `2xl`) for main content cards.

## 5. Interactions & Micro-Animations
*   **Hover States:** Every interactive element must respond visually (color change, slight lift/scale, shadow increase).
*   **Transitions:** Add `transition-all duration-200 ease-in-out` to buttons and links. State changes should never be instantaneous.
*   **Skeleton Loaders & Spinners:** Provide visual feedback during loading states. Use pulsing skeletons that match the content shape instead of plain spinners.

## 6. Layout & Responsiveness
*   **Mobile-First Approach:** Always ensure the design works perfectly on small screens before scaling up to desktop.
*   **Fluid Grids:** Use CSS Grid and Flexbox for layouts that adapt smoothly to any screen size.
*   **Container Widths:** Restrict maximum content width on large monitors (e.g., `max-w-7xl`) to keep layouts from stretching too thin.
