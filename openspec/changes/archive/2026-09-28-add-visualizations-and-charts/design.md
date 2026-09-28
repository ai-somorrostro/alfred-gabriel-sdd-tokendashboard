# Design

## Context

Feature 2 introduces visual chart comparisons. The design department requested price comparisons across models and consumption tracking across daily/weekly periods. The primary technical constraint is native SVG or HTML5 Canvas without any charting libraries.

## Goals / Non-Goals

**Goals:**
- Implement two modular SVG chart renderers in `app.js`: `renderPriceChart()` and `renderConsumptionChart()`.
- Use responsive SVG containers with `viewBox` coordinates (e.g. `0 0 680 320`) to scale seamlessly across desktop and mobile.
- Support interactive hover tooltips displaying precise data points.
- Provide a smooth toggle between weekly and daily consumption views.

**Non-Goals:**
- Third-party chart engines (Chart.js, D3, etc.) - strictly prohibited.
- Model detail drawer / modal (deferred to Feature 3).

## Decisions

### Decision 1: Native SVG over HTML5 Canvas
- **Choice**: Native SVG elements (`<rect>`, `<text>`, `<line>`, `<g>`) created via pure string templates or DOM builders.
- **Rationale**: SVG elements are DOM-friendly, retain crisp vector resolution across high-DPI displays, and support hover interactions directly via CSS `:hover` and pointer events without manual pixel hit-testing.

### Decision 2: Normalized Coordinates and Margin System
- **Choice**: Use a standard chart margin box pattern:
  - `margin = { top: 25, right: 20, bottom: 65, left: 60 }`
  - `width = 680`, `height = 320`, `plotWidth = width - left - right`, `plotHeight = height - top - bottom`
- **Rationale**: Prevents label truncation, keeps axis lines aligned, and accommodates -45° rotated model names.

### Decision 3: Shared Floating Tooltip
- **Choice**: A single `div#chart-tooltip` with `position: fixed` or `position: absolute`, updated via `mousemove` and `mouseleave` handlers attached to SVG bar groups.

## Risks / Trade-offs

- **[Risk]**: SVG labels overlapping on small screens.
  - **Mitigation**: Rotate X-axis text -45 degrees, use abbreviated model labels if necessary, and enable horizontal overflow scrolling on narrow mobile viewports.
