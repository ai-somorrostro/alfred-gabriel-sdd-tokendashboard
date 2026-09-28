# Design

## Context

The base dashboard displays 10 models in static order. Feature 1 adds filtering by name and modalities, and column sorting. To maintain performance and maintainability, the processing pipeline must be deterministic and pure.

## Goals / Non-Goals

**Goals:**
- Provide a clean filter bar above the table containing search input, input modality select, output modality select, and clear filters action.
- Implement bidirectional sorting for all columns with visual indicator cues.
- Maintain a single unidirectional data flow: `state.models` → `filter(models)` → `sort(filtered)` → `render(sorted)`.
- Ensure keyboard accessibility (proper `button` elements inside `th`, `aria-sort` attributes).

**Non-Goals:**
- Visual charts or SVG graphs (deferred to Feature 2).
- Row detail view modal (deferred to Feature 3).

## Decisions

### Decision 1: Pure Functional Pipeline
- **Choice**: Separate filter state (`filters = { search: '', inputModality: 'all', outputModality: 'all' }`) and sort state (`sort = { column: 'name', direction: 'asc' }`). A single master function `getVisibleModels()` applies filtering followed by sorting, returning a fresh array to `renderTable()`.
- **Alternatives considered**: Mutating the underlying `state.models` array directly. Rejected because it destroys the original ordering and creates state desynchronization.

### Decision 2: Numeric vs String Sorting Strategy
- **Choice**: Determine comparison logic by data type:
  - Strings (`name`, `inputModality`, `outputModality`): `localeCompare` with sensitivity settings.
  - Numbers (`ttft_ms`, `inputPricePerToken`, `outputPricePerToken`, tokens): standard numeric subtraction (`a - b` or `b - a`).
- **Alternatives considered**: Generic string conversion. Rejected because sorting numbers as strings causes `190` to sort after `1100000`.

### Decision 3: Accessible Header Buttons
- **Choice**: Wrap column header contents in `<button class="sort-button" data-column="...">` with SVG/caret indicators. Update `aria-sort` on the parent `th` to reflect `ascending`, `descending`, or `none`.

## Risks / Trade-offs

- **[Risk]**: Empty filter results leaving table blank without explanation.
  - **Mitigation**: Render a dedicated empty-state `<tr>` with a "Restablecer filtros" button.
