# Proposal

## Why

While the baseline table lists all 10 models, users cannot dynamically reorder or isolate models according to team criteria (such as identifying the lowest latency model, filtering for multimodal capabilities, or finding models by name). Adding column sorting and combined filtering provides immediate analytical utility without leaving the page.

## What Changes

- **Filter Toolbar**:
  - Search input for real-time model name filtering (case-insensitive substring match).
  - Dropdown filter for Input Modality (options: All, Text, Text+Image).
  - Dropdown filter for Output Modality (options: All, Text).
  - Dynamic result counter (e.g. "Showing 2 of 10 models") and empty-state messaging when filters match 0 models.
- **Interactive Sorting**:
  - Interactive table header buttons allowing sorting on any column: Model Name, Input Modality, Output Modality, Latency (TTFT), Input Price, Output Price, Daily Tokens, Weekly Tokens.
  - Toggle between ascending and descending order on subsequent clicks.
  - Visual sort indicators (▲ / ▼) indicating active sort column and direction.
- **Pure Client-Side Implementation**:
  - Pure Vanilla JS without external state management or sorting libraries.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `token-dashboard`: Introduce column sorting and combined reactive filtering requirements.

## Impact

- **Modified Files**: `index.html` (filter toolbar), `styles.css` (toolbar and sort indicator styles), `app.js` (sort/filter engine).
- **Dependencies**: No external libraries; 100% native DOM and JS.
