# token-dashboard Specification

## Purpose
Enables the team to view and compare open-source large language models by pricing, latency, modalities, and token consumption using a static web dashboard without external dependencies.

## Requirements

### Requirement: Carga de datos del dashboard
The system SHALL fetch and parse the 10 models from `mock-data.json` at initialization and present a descriptive error message if data loading fails.

#### Scenario: Carga exitosa de modelos
- **WHEN** the user accesses `index.html` with valid data available
- **THEN** the system loads the 10 models and renders 10 table rows with their corresponding baseline attributes.

#### Scenario: Fallo en la carga de datos
- **WHEN** `mock-data.json` cannot be retrieved (due to network failure, missing file, or CORS restrictions)
- **THEN** the system renders a prominent, human-readable error notification indicating that the data could not be loaded and providing guidance.

### Requirement: Renderizado de tabla base
The system SHALL display a responsive data table presenting: Model Name, Input Price per Token, Output Price per Token, TTFT (in milliseconds), Input Modality, Output Modality, Daily Token Consumption, and Weekly Token Consumption.

#### Scenario: Contenido de columnas visibles
- **WHEN** the dashboard completes data loading
- **THEN** every model row contains all required columns formatted properly, including dollar formatting for token prices and millisecond suffix for TTFT.

### Requirement: KPIs de resumen
The system SHALL compute and display summary KPIs at the top of the dashboard: total number of models (10), fastest model by TTFT, and slowest model by TTFT.

#### Scenario: Resumen de KPIs correcto
- **WHEN** the dashboard loads the baseline dataset
- **THEN** the KPI cards display total models count of 10, identify Phi-4 as the fastest model (190ms), and identify DeepSeek-R1 as the highest TTFT model (890ms).

### Requirement: Ordenación por columnas
The system SHALL allow sorting the table rows by any column by clicking its header, toggling between ascending and descending order, and displaying visual direction indicators.

#### Scenario: Ordenación por nombre de modelo
- **WHEN** the user clicks on the "Modelo" column header
- **THEN** rows are sorted alphabetically in ascending order, displaying an upward sort indicator; clicking again sorts in descending order with a downward indicator.

#### Scenario: Ordenación numérica por latencia TTFT
- **WHEN** the user clicks on the "Latencia (TTFT)" column header
- **THEN** rows are sorted numerically by `ttft_ms` so that the fastest model (Phi-4 at 190ms) appears first in ascending order.

#### Scenario: Alternancia y reseteo de dirección
- **WHEN** the user switches sorting from one column to another
- **THEN** the previous column loses its active sort indicator and the newly selected column sorts in ascending order by default.

### Requirement: Filtros combinados
The system SHALL filter visible table rows by matching model name substrings and by selecting input and output modalities, updating the display reactively.

#### Scenario: Filtrado por nombre de modelo
- **WHEN** the user types "deep" in the search input
- **THEN** only DeepSeek-V3 and DeepSeek-R1 remain visible in the table, and the counter displays "2 de 10 modelos".

#### Scenario: Filtrado por modalidad de entrada
- **WHEN** the user selects "Text+Image" in the input modality filter
- **THEN** only multimodal models (Mistral Small 3.1 and Gemma 3 27B) remain visible.

#### Scenario: Filtros combinados sin resultados
- **WHEN** the user applies search criteria that match no models
- **THEN** the table displays a friendly empty-state message indicating no matching models were found, with an option to reset filters.

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
