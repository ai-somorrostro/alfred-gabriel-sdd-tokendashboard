# Proposal

## Why

Raw data tables require careful reading to discern relative pricing disparities and token consumption volumes across models. Adding high-density native visual charts above the table allows decision-makers to instantly identify cost outliers (such as DeepSeek-R1 at ~$2.19/1M output tokens vs Phi-4 at $0.14/1M) and compare team consumption profiles across daily and weekly horizons.

## What Changes

- **Visualizations Section**:
  - Insert a two-column responsive visual analytics section directly above the table.
  - **Chart 1: Price Comparison (Input vs Output)**:
    - Native SVG grouped bar chart comparing input and output token pricing per 1M tokens across all 10 models.
    - Grid lines, rotated model labels (-45°), legend, and hover tooltips with exact values.
  - **Chart 2: Team Token Consumption**:
    - Native SVG chart displaying token consumption breakdown (input vs output volume) per model.
    - Period toggle button group (Semanal / Diario) to switch between weekly and daily consumption view.
    - Interactive tooltips showing exact token counts formatted with thousands separators.
- **Floating Tooltip**:
  - Global floating tooltip element `#chart-tooltip` displaying precise metrics when hovering over chart bars.
- **Strict Constraint**:
  - 100% native SVG and vanilla JavaScript. Strictly no third-party charting libraries (no Chart.js, D3, or Canvas libraries).

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `token-dashboard`: Add visual analytics requirements for native SVG price comparison and token consumption charts.

## Impact

- **Modified Files**: `index.html` (charts markup and tooltip), `styles.css` (chart containers, SVG typography, tooltips, responsive grid), `app.js` (SVG generator engines).
- **Zero Dependencies**: Retains zero external libraries.
