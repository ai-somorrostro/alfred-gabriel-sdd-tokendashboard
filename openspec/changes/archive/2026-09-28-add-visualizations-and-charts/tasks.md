# Tasks

## 1. Markup and Chart Layout

- [x] 1.1 Add `#visualizations-section` with price chart card and consumption chart card to `index.html`
- [x] 1.2 Add CSS styles for chart grid, SVG elements, axis lines, legends, toggle buttons, and floating tooltip in `styles.css`

## 2. Native SVG Chart Renderers

- [x] 2.1 Implement `renderPriceChart()` in `app.js` generating native SVG grouped bars comparing input vs output prices per 1M tokens across all 10 models
- [x] 2.2 Implement `renderConsumptionChart()` in `app.js` with period toggling (Semanal / Diario) and stacked/grouped token bars
- [x] 2.3 Implement shared floating tooltip interaction on hover across both charts

## 3. Verification and Acceptance

- [x] 3.1 Verify SVG rendering, scaling, and tooltip accuracy in browser
- [x] 3.2 Verify period toggle switching and absence of third-party charting libraries
