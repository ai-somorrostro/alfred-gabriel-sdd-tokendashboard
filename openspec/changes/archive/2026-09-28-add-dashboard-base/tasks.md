# Tasks

## 1. Project Scaffold and Visual Layout

- [x] 1.1 Create `index.html` with semantic structure (header, summary metrics section, table container, error feedback area) and verify DOM elements in browser
- [x] 1.2 Create `styles.css` with dark theme variables, responsive layout rules, typography, and table styling, verifying visual presentation

## 2. Data Layer and Rendering

- [x] 2.1 Implement `dataService.fetchModels()` in `app.js` to fetch and parse `mock-data.json` with try/catch error handling, verifying error banner on simulated failure
- [x] 2.2 Implement formatting helpers and `renderer.renderTable()` in `app.js` to populate table rows for all 10 models with prices, TTFT, modalities, and token volumes, verifying 10 rows in the DOM
- [x] 2.3 Implement KPI computation and render top summary cards (total models, fastest model, slowest model), verifying correct values (10 models, Phi-4 at 190ms, DeepSeek-R1 at 890ms)

## 3. Verification and Acceptance

- [x] 3.1 Verify data table rendering and error state handling in browser environment
- [x] 3.2 Verify adherence to constraints (zero external scripts/styles, pure vanilla JS, valid semantic HTML)
