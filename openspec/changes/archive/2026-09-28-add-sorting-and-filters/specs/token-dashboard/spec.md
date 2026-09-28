# Spec Delta

## ADDED Requirements

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
