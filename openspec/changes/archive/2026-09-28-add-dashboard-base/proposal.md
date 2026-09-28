# Proposal

## Why

The design and engineering teams currently lack a centralized internal view to compare open-source large language models (LLMs) evaluated by the team. Team members look up pricing, latency, and token consumption metrics in disparate locations. To solve this, we need a baseline web dashboard that loads the 10 evaluated models from `mock-data.json` and renders an intuitive, responsive comparison table with key metrics, providing the foundation for subsequent analytical features.

## What Changes

- Create `index.html` with semantic structure: page header, KPI summary row, main table section, and container for loading/error messages.
- Create `styles.css` defining the visual design system: cohesive dark-themed color palette, modern typography, flexible grid/flex layouts, clean data table formatting, and responsive wrappers.
- Create `app.js` providing:
  - Asynchronous data fetching from `mock-data.json`.
  - Robust error handling for network or format errors (displaying clear error messages instead of empty broken views).
  - Data transformation and baseline table rendering showing all 10 models with their model name, input/output token pricing, latency (TTFT in ms), modalities, and daily/weekly token volumes.
- Strictly adhere to constraints: zero external dependencies, no third-party libraries, plain HTML/CSS/JS.

## Capabilities

### New Capabilities
- `token-dashboard`: Core dashboard capability covering data acquisition from `mock-data.json`, error state handling, KPI summaries, and responsive baseline table rendering.

### Modified Capabilities
*(None - greenfield baseline)*

## Impact

- **New files**: `index.html`, `styles.css`, `app.js`.
- **Existing files**: `mock-data.json` is consumed as read-only.
- **Dependencies**: No external dependencies or build tooling required. Standard modern browser environment.
