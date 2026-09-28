# Spec Delta

## ADDED Requirements

### Requirement: Vista de detalle por modelo en modal interactivo
The system SHALL display an accessible modal dialog with extended metrics and individual SVG charts when a table row is clicked.

#### Scenario: Apertura del modal al hacer clic en una fila
- **WHEN** the user clicks on any model row in the table
- **THEN** the modal dialog `#model-detail-modal` becomes visible, displaying the model name, modalities, and full telemetry metrics.

#### Scenario: Cierre del modal
- **WHEN** the user clicks the close button (`#modal-close-btn`), clicks outside the dialog content on the backdrop, or presses `Escape`
- **THEN** the modal closes cleanly and focus returns to the table.

### Requirement: Métricas extendidas y gráficas individuales
The system SHALL present extended metrics and dedicated individual SVG visualizations specific to the selected model inside the detail modal.

#### Scenario: Desglose de métricas extendidas
- **WHEN** the modal opens for a selected model (such as DeepSeek-R1)
- **THEN** the dialog displays input and output prices per 1M, output-to-input pricing ratio multiplier (e.g. 3.98x), TTFT latency rating, and exact daily/weekly token volumes.

#### Scenario: Gráfica individual SVG del modelo
- **WHEN** the modal opens
- **THEN** an individual native SVG chart renders showing the model-specific token breakdown between input and output tokens for daily and weekly windows.
