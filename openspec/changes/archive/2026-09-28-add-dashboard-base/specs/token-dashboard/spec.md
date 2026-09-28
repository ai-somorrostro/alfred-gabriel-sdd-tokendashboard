# Spec Delta

## Purpose

Enables the team to view and compare open-source large language models by pricing, latency, modalities, and token consumption using a static web dashboard without external dependencies.

## ADDED Requirements

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
