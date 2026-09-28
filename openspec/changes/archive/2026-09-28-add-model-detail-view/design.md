# Design

## Context

Feature 3 completes the functional requirements by providing an extended detail view per model with telemetry metrics and individual model charts. It must be accessible, responsive, and completely dependency-free.

## Goals / Non-Goals

**Goals:**
- Provide a clean modal overlay with smooth transitions (`backdrop-filter`, subtle scale animation).
- Display complete extended metrics: Input/Output prices per 1M and raw, Output/Input price ratio, TTFT classification, daily and weekly tokens with exact numbers.
- Render a dedicated individual native SVG chart specific to the clicked model.
- Support complete keyboard accessibility: `Escape` key dismissal, focus trapping, `role="dialog"`, and `aria-modal="true"`.

**Non-Goals:**
- Heavy modal libraries or UI frameworks.
- URL hash routing for modal states.

## Decisions

### Decision 1: Centered Modal Dialog over Side Drawer
- **Choice**: Centered responsive modal dialog (`max-width: 680px`) with high contrast background and subtle glow.
- **Rationale**: Provides optimal visual balance on both wide desktop screens and mobile devices without shifting horizontal page layout.

### Decision 2: Keyboard and Backdrop Dismissal
- **Choice**: Close modal on:
  1. Close button click (`#modal-close-btn`).
  2. Clicking anywhere on the semi-transparent modal backdrop (`#model-detail-modal`).
  3. Pressing the `Escape` key (`keydown` listener on `document`).

### Decision 3: Individual Model SVG Visualization
- **Choice**: Render a dedicated SVG comparing the model's Input vs Output tokens across Daily and Weekly periods, with percentage distribution bars.

## Risks / Trade-offs

- **[Risk]**: Background page scrolling while modal is open.
  - **Mitigation**: Add `overflow: hidden` to `document.body` while modal is open, and remove it on close.
