# Design

## Context

The initial phase establishes the foundation for the TokenDashboard application. The application must run directly in modern browsers without any server-side runtime, build step, or external libraries. Data is statically defined in `mock-data.json`.

## Goals / Non-Goals

**Goals:**
- Provide a clean, semantic HTML5 structure with high readability and responsive design.
- Define a modern CSS design system using CSS variables (dark theme, glassmorphism hints, high contrast typography, accessible data tables).
- Implement a modular vanilla JavaScript architecture in `app.js` with clear separation between state management, data loading, and DOM rendering.
- Render all 10 models in a clean, legible table with formatted metrics.
- Display summary KPIs (total models, fastest TTFT, slowest TTFT).
- Provide graceful degradation and informative error states if `mock-data.json` fails to load.

**Non-Goals:**
- Sorting and interactive filtering (deferred to Feature 1).
- Visual charts and SVG visualizations (deferred to Feature 2).
- Detail view modal / drawer (deferred to Feature 3).

## Decisions

### Decision 1: Pure Vanilla JS with Separation of Concerns
- **Choice**: Structure `app.js` using modular objects/functions:
  - `state`: stores raw models and UI state.
  - `dataService`: handles asynchronous retrieval and parsing of `mock-data.json`.
  - `formatters`: pure utility functions for currency, time, and token counts.
  - `renderer`: pure DOM rendering functions targeting specific container IDs.
- **Alternatives considered**: Single procedural script. Rejected because it becomes unmaintainable as Features 1, 2, and 3 are layered on.

### Decision 2: Dark Theme Design System with CSS Variables
- **Choice**: Modern dark aesthetic (`#0f172a` slate background, `#1e293b` surfaces, `#38bdf8` accent, `#f8fafc` text) defined via `:root` CSS variables.
- **Alternatives considered**: Light theme or basic unstyled HTML. Rejected to maintain professional, premium aesthetic standards.

### Decision 3: Defensive Loading and Error Reporting
- **Choice**: Wrap the `fetch` call in try-catch with specific error guidance. If local `file://` protocol causes a CORS block, display an informative banner recommending a simple HTTP server (e.g., `npx serve` or Python `http.server`).
- **Alternatives considered**: Letting the console log errors silently. Rejected because silent failures cause poor user experience.

## Risks / Trade-offs

- **[Risk]**: Browsers restrict `fetch()` requests on `file://` URLs.
  - **Mitigation**: Implement a visual error container instructing the user to serve the folder over HTTP (or run a dev server), with clear visual cues.
- **[Risk]**: Very small per-token pricing values (e.g., `0.00000007`) can be difficult to read.
  - **Mitigation**: Provide formatted representations (e.g., `$0.00000007` or `$0.07 / 1M tokens`) for maximum clarity.
