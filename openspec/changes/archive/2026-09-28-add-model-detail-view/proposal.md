# Proposal

## Why

While the main table and global charts allow high-level comparison across models, engineers and designers need to inspect individual models in granular detail when making architectural decisions. An interactive detail view modal triggered by clicking any table row provides an extended deep-dive into each model's full telemetry, pricing ratios, and dedicated individual visual charts.

## What Changes

- **Row Interaction**:
  - Every table row becomes interactively clickable with visual hover feedback (`cursor: pointer`, elevation highlight).
- **Modal Dialog (`#model-detail-modal`)**:
  - Accessible modal dialog overlay with header, body, and footer.
  - Closes via close button, clicking the backdrop, or pressing the `Escape` key.
- **Extended Metrics**:
  - Detailed pricing breakdown (input price, output price, and output/input price ratio multiplier).
  - Latency speed category and comparative TTFT benchmark.
  - Exact token volume statistics for both daily and weekly periods.
- **Model-Specific SVG Visualizations**:
  - Dedicated individual SVG bar chart comparing input vs output token consumption for the selected model.
  - Visual token share distribution meter.
- **Strict Constraint**:
  - Pure native HTML5, CSS3, and Vanilla JavaScript. No modal plugins, external SVG libraries, or frameworks.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `token-dashboard`: Add requirements for interactive row click, accessible modal view, extended metric breakdown, and individual model SVG charts.

## Impact

- **Modified Files**: `index.html` (modal markup), `styles.css` (modal overlay, animations, metrics grid), `app.js` (modal controller, detail chart renderer).
- **Dependencies**: Retains zero external libraries.
