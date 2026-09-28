# Spec Delta

## ADDED Requirements

### Requirement: Gráfica de comparación de precios SVG
The system SHALL render a responsive native SVG grouped bar chart above the table comparing input and output prices per 1M tokens across all models.

#### Scenario: Visualización de barras de precio
- **WHEN** the dashboard completes data loading
- **THEN** a native SVG chart renders containing two distinct color-coded bars (input vs output price) for each of the 10 models, with visible axes, scales, and model labels.

#### Scenario: Tooltip interactivo en barras de precio
- **WHEN** the user hovers over any price bar
- **THEN** a tooltip appears displaying the model name, token role (Input or Output), price per 1M tokens, and exact unit price per token.

### Requirement: Gráfica de consumo de tokens del equipo
The system SHALL render a native SVG chart displaying token consumption breakdown (input and output tokens) per model with a toggle to switch between weekly and daily volume.

#### Scenario: Cambio de periodo Diario / Semanal
- **WHEN** the user toggles from "Semanal" to "Diario"
- **THEN** the consumption SVG chart re-renders immediately to display `inputTokensDay` and `outputTokensDay`, updating bar heights and axis scales.

#### Scenario: Tooltip de consumo de tokens
- **WHEN** the user hovers over a consumption bar
- **THEN** a tooltip displays the model name, period, and exact formatted token count with thousands separators.
