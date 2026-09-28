/**
 * Dashboard de Modelos de IA
 * Feature 1, 2 & 3: Carga de datos, ordenación, filtros, gráficas globales y vista de detalle extendida.
 */

// Estado global de la aplicación
const state = {
  rawModels: [], // Datos originales cargados
  filteredModels: [], // Modelos tras filtros y ordenación
  selectedModel: null, // Modelo actualmente abierto en la vista de detalle
  filters: {
    search: '',
    inputModality: 'ALL',
    outputModality: 'ALL'
  },
  sort: {
    column: null,
    direction: 'asc'
  },
  charts: {
    consumptionPeriod: 'week' // 'week' | 'day'
  },
  isLoading: true,
  error: null
};

// Formateadores auxiliares
const formatters = {
  formatTokensCompact(num) {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(0) + 'k';
    }
    return num.toLocaleString();
  },

  formatTokensFull(num) {
    return new Intl.NumberFormat('es-ES').format(num);
  },

  formatPricePerToken(price) {
    return '$' + price.toFixed(8);
  },

  formatPricePerThousand(price) {
    return '$' + (price * 1_000).toFixed(5);
  },

  formatPricePerMillion(price) {
    const perMillion = price * 1_000_000;
    return '$' + perMillion.toFixed(2);
  },

  formatCurrency(val) {
    return '$' + val.toFixed(2);
  }
};

// Carga inicial de datos vía fetch
async function loadData() {
  try {
    const response = await fetch('mock-data.json');
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    state.rawModels = data;
    state.isLoading = false;

    populateModalityOptions();
    applyFiltersAndSort();
  } catch (err) {
    console.error('Error al cargar mock-data.json:', err);
    state.error = err.message;
    state.isLoading = false;
    renderError();
  }
}

// Poblar selects de modalidades dinámicamente
function populateModalityOptions() {
  const inputSelect = document.getElementById('filter-input-modality');
  const outputSelect = document.getElementById('filter-output-modality');
  
  if (!inputSelect || !outputSelect) return;

  const inputModalities = Array.from(new Set(state.rawModels.map(m => m.inputModality))).sort();
  const outputModalities = Array.from(new Set(state.rawModels.map(m => m.outputModality))).sort();

  inputModalities.forEach(mod => {
    const opt = document.createElement('option');
    opt.value = mod;
    opt.textContent = mod;
    inputSelect.appendChild(opt);
  });

  outputModalities.forEach(mod => {
    const opt = document.createElement('option');
    opt.value = mod;
    opt.textContent = mod;
    outputSelect.appendChild(opt);
  });
}

// Aplicar filtros y ordenación
function applyFiltersAndSort() {
  let result = [...state.rawModels];

  // 1. Filtro por nombre
  const query = state.filters.search.trim().toLowerCase();
  if (query) {
    result = result.filter(m => m.name.toLowerCase().includes(query));
  }

  // 2. Filtro por modalidad de entrada
  if (state.filters.inputModality !== 'ALL') {
    result = result.filter(m => m.inputModality === state.filters.inputModality);
  }

  // 3. Filtro por modalidad de salida
  if (state.filters.outputModality !== 'ALL') {
    result = result.filter(m => m.outputModality === state.filters.outputModality);
  }

  // 4. Ordenación si hay una columna activa
  if (state.sort.column) {
    const col = state.sort.column;
    const dir = state.sort.direction === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }

      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      return strA.localeCompare(strB, 'es') * dir;
    });
  }

  state.filteredModels = result;

  renderKPIs(result);
  renderCharts(result);
  renderTable();
  updateSortHeaderIndicators();
}

// Renderizado de KPIs
function renderKPIs(models) {
  const totalModelsEl = document.getElementById('kpi-total-models');
  const avgTtftEl = document.getElementById('kpi-avg-ttft');
  const avgPriceEl = document.getElementById('kpi-avg-price');
  const totalTokensEl = document.getElementById('kpi-total-tokens');

  if (!models || models.length === 0) {
    if (totalModelsEl) totalModelsEl.textContent = '0';
    if (avgTtftEl) avgTtftEl.textContent = '-';
    if (avgPriceEl) avgPriceEl.textContent = '-';
    if (totalTokensEl) totalTokensEl.textContent = '-';
    return;
  }

  const count = models.length;
  const avgTtft = Math.round(models.reduce((acc, m) => acc + m.ttft_ms, 0) / count);
  const avgInputPrice = models.reduce((acc, m) => acc + m.inputPricePerToken, 0) / count;
  const avgOutputPrice = models.reduce((acc, m) => acc + m.outputPricePerToken, 0) / count;
  const totalWeeklyTokens = models.reduce((acc, m) => acc + (m.inputTokensWeek + m.outputTokensWeek), 0);

  if (totalModelsEl) {
    totalModelsEl.textContent = count === state.rawModels.length ? `${count}` : `${count} / ${state.rawModels.length}`;
  }
  if (avgTtftEl) avgTtftEl.textContent = `${avgTtft} ms`;
  if (avgPriceEl) {
    avgPriceEl.textContent = `${formatters.formatPricePerMillion(avgInputPrice)} / ${formatters.formatPricePerMillion(avgOutputPrice)}`;
  }
  if (totalTokensEl) totalTokensEl.textContent = formatters.formatTokensCompact(totalWeeklyTokens);
}

// =========================================================
// Feature 2: Visualizaciones y Gráficas Nativas SVG
// =========================================================

function renderCharts(models) {
  renderPriceChart(models);
  renderConsumptionChart(models);
}

/**
 * Gráfico 1: Comparativa de Precios por Token
 */
function renderPriceChart(models) {
  const container = document.getElementById('price-chart-container');
  if (!container) return;

  if (!models || models.length === 0) {
    container.innerHTML = `<div class="empty-message" style="padding: 2rem;">Sin datos para los filtros seleccionados</div>`;
    return;
  }

  const width = 600;
  const height = 260;
  const margin = { top: 20, right: 20, bottom: 55, left: 45 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const data = models.map(m => ({
    name: m.name,
    inputPrice1M: m.inputPricePerToken * 1_000_000,
    outputPrice1M: m.outputPricePerToken * 1_000_000,
    inputPriceRaw: m.inputPricePerToken,
    outputPriceRaw: m.outputPricePerToken
  }));

  const maxPrice = Math.max(...data.map(d => Math.max(d.inputPrice1M, d.outputPrice1M)), 0.5);
  const yMax = Math.ceil(maxPrice * 1.15 * 10) / 10;

  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];
  let gridLinesSvg = '';
  yTicks.forEach(tickVal => {
    const yPos = margin.top + innerHeight - (tickVal / yMax) * innerHeight;
    gridLinesSvg += `
      <line class="grid-line" x1="${margin.left}" y1="${yPos}" x2="${width - margin.right}" y2="${yPos}" />
      <text class="axis-text" x="${margin.left - 8}" y="${yPos + 3}" text-anchor="end">$${tickVal.toFixed(1)}</text>
    `;
  });

  const groupWidth = innerWidth / data.length;
  const barPadding = 0.2;
  const usableWidth = groupWidth * (1 - barPadding);
  const barWidth = usableWidth / 2;

  let barsSvg = '';
  data.forEach((d, i) => {
    const groupX = margin.left + i * groupWidth + (groupWidth * barPadding) / 2;
    const inputBarHeight = Math.max((d.inputPrice1M / yMax) * innerHeight, 2);
    const outputBarHeight = Math.max((d.outputPrice1M / yMax) * innerHeight, 2);

    const inputY = margin.top + innerHeight - inputBarHeight;
    const outputY = margin.top + innerHeight - outputBarHeight;

    const inputX = groupX;
    const outputX = groupX + barWidth + 2;

    const displayName = d.name.length > 10 ? d.name.substring(0, 9) + '…' : d.name;

    barsSvg += `
      <rect class="bar-rect" x="${inputX}" y="${inputY}" width="${barWidth - 2}" height="${inputBarHeight}"
        rx="3" fill="var(--chart-input-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Entrada"
        data-val-1m="$${d.inputPrice1M.toFixed(2)}"
        data-val-raw="${formatters.formatPricePerToken(d.inputPriceRaw)}"
      />
      <rect class="bar-rect" x="${outputX}" y="${outputY}" width="${barWidth - 2}" height="${outputBarHeight}"
        rx="3" fill="var(--chart-output-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Salida"
        data-val-1m="$${d.outputPrice1M.toFixed(2)}"
        data-val-raw="${formatters.formatPricePerToken(d.outputPriceRaw)}"
      />
      <text class="axis-text" x="${groupX + usableWidth / 2}" y="${height - margin.bottom + 16}" 
        text-anchor="end" transform="rotate(-30, ${groupX + usableWidth / 2}, ${height - margin.bottom + 16})">
        ${escapeHtml(displayName)}
      </text>
    `;
  });

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      ${gridLinesSvg}
      <line class="axis-line" x1="${margin.left}" y1="${margin.top + innerHeight}" x2="${width - margin.right}" y2="${margin.top + innerHeight}" />
      ${barsSvg}
    </svg>
  `;

  attachChartTooltips(container, 'price');
}

/**
 * Gráfico 2: Consumo de Tokens
 */
function renderConsumptionChart(models) {
  const container = document.getElementById('consumption-chart-container');
  if (!container) return;

  if (!models || models.length === 0) {
    container.innerHTML = `<div class="empty-message" style="padding: 2rem;">Sin datos para los filtros seleccionados</div>`;
    return;
  }

  const period = state.charts.consumptionPeriod;
  const isWeek = period === 'week';

  const width = 600;
  const height = 260;
  const margin = { top: 20, right: 20, bottom: 55, left: 52 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const data = models.map(m => {
    const inputTokens = isWeek ? m.inputTokensWeek : m.inputTokensDay;
    const outputTokens = isWeek ? m.outputTokensWeek : m.outputTokensDay;
    return {
      name: m.name,
      inputTokens,
      outputTokens,
      inputM: inputTokens / 1_000_000,
      outputM: outputTokens / 1_000_000
    };
  });

  const maxVal = Math.max(...data.map(d => Math.max(d.inputM, d.outputM)), 1);
  const yMax = Math.ceil(maxVal * 1.15);

  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax];
  let gridLinesSvg = '';
  yTicks.forEach(tickVal => {
    const yPos = margin.top + innerHeight - (tickVal / yMax) * innerHeight;
    gridLinesSvg += `
      <line class="grid-line" x1="${margin.left}" y1="${yPos}" x2="${width - margin.right}" y2="${yPos}" />
      <text class="axis-text" x="${margin.left - 8}" y="${yPos + 3}" text-anchor="end">${tickVal}M</text>
    `;
  });

  const groupWidth = innerWidth / data.length;
  const barPadding = 0.2;
  const usableWidth = groupWidth * (1 - barPadding);
  const barWidth = usableWidth / 2;

  let barsSvg = '';
  data.forEach((d, i) => {
    const groupX = margin.left + i * groupWidth + (groupWidth * barPadding) / 2;
    const inputBarHeight = Math.max((d.inputM / yMax) * innerHeight, 2);
    const outputBarHeight = Math.max((d.outputM / yMax) * innerHeight, 2);

    const inputY = margin.top + innerHeight - inputBarHeight;
    const outputY = margin.top + innerHeight - outputBarHeight;

    const inputX = groupX;
    const outputX = groupX + barWidth + 2;

    const displayName = d.name.length > 10 ? d.name.substring(0, 9) + '…' : d.name;

    barsSvg += `
      <rect class="bar-rect" x="${inputX}" y="${inputY}" width="${barWidth - 2}" height="${inputBarHeight}"
        rx="3" fill="var(--chart-input-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Entrada"
        data-tokens="${formatters.formatTokensCompact(d.inputTokens)}"
        data-tokens-full="${formatters.formatTokensFull(d.inputTokens)}"
        data-period="${isWeek ? 'Semanal' : 'Diario'}"
      />
      <rect class="bar-rect" x="${outputX}" y="${outputY}" width="${barWidth - 2}" height="${outputBarHeight}"
        rx="3" fill="var(--chart-output-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Salida"
        data-tokens="${formatters.formatTokensCompact(d.outputTokens)}"
        data-tokens-full="${formatters.formatTokensFull(d.outputTokens)}"
        data-period="${isWeek ? 'Semanal' : 'Diario'}"
      />
      <text class="axis-text" x="${groupX + usableWidth / 2}" y="${height - margin.bottom + 16}" 
        text-anchor="end" transform="rotate(-30, ${groupX + usableWidth / 2}, ${height - margin.bottom + 16})">
        ${escapeHtml(displayName)}
      </text>
    `;
  });

  container.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      ${gridLinesSvg}
      <line class="axis-line" x1="${margin.left}" y1="${margin.top + innerHeight}" x2="${width - margin.right}" y2="${margin.top + innerHeight}" />
      ${barsSvg}
    </svg>
  `;

  attachChartTooltips(container, 'consumption');
}

/**
 * Tooltips interactivos de gráficas globales
 */
function attachChartTooltips(container, chartType) {
  const tooltip = document.getElementById('chart-tooltip');
  if (!tooltip) return;

  const bars = container.querySelectorAll('.bar-rect');
  bars.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const modelName = bar.getAttribute('data-model');
      const type = bar.getAttribute('data-type');
      const isInput = type === 'Entrada';
      const dotColor = isInput ? 'var(--chart-input-color)' : 'var(--chart-output-color)';

      if (chartType === 'price') {
        const val1M = bar.getAttribute('data-val-1m');
        const valRaw = bar.getAttribute('data-val-raw');
        tooltip.innerHTML = `
          <div class="tooltip-title">${modelName}</div>
          <div class="tooltip-row">
            <span><span class="tooltip-dot" style="background:${dotColor}"></span>Token ${type}:</span>
            <strong>${val1M} / 1M</strong>
          </div>
          <div class="tooltip-row" style="color: var(--text-muted); font-size: 0.7rem;">
            <span>Unitario:</span>
            <span>${valRaw}</span>
          </div>
        `;
      } else {
        const tokens = bar.getAttribute('data-tokens');
        const tokensFull = bar.getAttribute('data-tokens-full');
        const period = bar.getAttribute('data-period');
        tooltip.innerHTML = `
          <div class="tooltip-title">${modelName} (${period})</div>
          <div class="tooltip-row">
            <span><span class="tooltip-dot" style="background:${dotColor}"></span>Tokens ${type}:</span>
            <strong>${tokens}</strong>
          </div>
          <div class="tooltip-row" style="color: var(--text-muted); font-size: 0.7rem;">
            <span>Total exacto:</span>
            <span>${tokensFull}</span>
          </div>
        `;
      }

      tooltip.style.display = 'block';
      tooltip.style.left = e.clientX + 'px';
      tooltip.style.top = e.clientY + 'px';
    });

    bar.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.clientX + 'px';
      tooltip.style.top = e.clientY + 'px';
    });

    bar.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

// Clases para badges
function getTtftBadgeClass(ttft) {
  if (ttft <= 250) return 'ttft-fast';
  if (ttft <= 400) return 'ttft-medium';
  return 'ttft-slow';
}

function getModalityBadgeClass(modality) {
  if (modality.includes('+')) return 'modality-multimodal';
  return 'modality-text';
}

// Renderizado de la tabla
function renderTable() {
  const tbody = document.getElementById('table-body');
  const countEl = document.getElementById('models-count');
  const models = state.filteredModels;
  const total = state.rawModels.length;

  if (countEl) {
    if (models.length === total) {
      countEl.textContent = `${total} modelos`;
    } else {
      countEl.textContent = `Mostrando ${models.length} de ${total} modelos`;
    }
  }

  if (!models || models.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-message">
          <div class="empty-state-content">
            <p>No se encontraron modelos con los filtros seleccionados.</p>
            <button type="button" class="btn btn-secondary" onclick="resetFilters()">Limpiar filtros</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = models.map(model => {
    return `
      <tr data-model-name="${escapeHtml(model.name)}" title="Clic para abrir vista extendida de ${escapeHtml(model.name)}">
        <td>
          <div class="cell-model-name">
            <span>${escapeHtml(model.name)}</span>
          </div>
        </td>
        <td>
          <span class="modality-badge ${getModalityBadgeClass(model.inputModality)}">
            ${escapeHtml(model.inputModality)}
          </span>
        </td>
        <td>
          <span class="modality-badge ${getModalityBadgeClass(model.outputModality)}">
            ${escapeHtml(model.outputModality)}
          </span>
        </td>
        <td class="text-right">
          <span class="ttft-badge ${getTtftBadgeClass(model.ttft_ms)}">
            ${model.ttft_ms} ms
          </span>
        </td>
        <td class="text-right">
          <span class="price-main">${formatters.formatPricePerMillion(model.inputPricePerToken)}</span>
          <span class="cell-subtext">${formatters.formatPricePerToken(model.inputPricePerToken)}</span>
        </td>
        <td class="text-right">
          <span class="price-main">${formatters.formatPricePerMillion(model.outputPricePerToken)}</span>
          <span class="cell-subtext">${formatters.formatPricePerToken(model.outputPricePerToken)}</span>
        </td>
        <td class="text-right">
          <div class="tokens-split">
            <div class="tokens-row" title="Input: ${formatters.formatTokensFull(model.inputTokensDay)} tokens">
              <span class="tokens-tag in">In:</span>
              <span class="num-val">${formatters.formatTokensCompact(model.inputTokensDay)}</span>
            </div>
            <div class="tokens-row" title="Output: ${formatters.formatTokensFull(model.outputTokensDay)} tokens">
              <span class="tokens-tag out">Out:</span>
              <span class="num-val">${formatters.formatTokensCompact(model.outputTokensDay)}</span>
            </div>
          </div>
        </td>
        <td class="text-right">
          <div class="tokens-split">
            <div class="tokens-row" title="Input: ${formatters.formatTokensFull(model.inputTokensWeek)} tokens">
              <span class="tokens-tag in">In:</span>
              <span class="num-val">${formatters.formatTokensCompact(model.inputTokensWeek)}</span>
            </div>
            <div class="tokens-row" title="Output: ${formatters.formatTokensFull(model.outputTokensWeek)} tokens">
              <span class="tokens-tag out">Out:</span>
              <span class="num-val">${formatters.formatTokensCompact(model.outputTokensWeek)}</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Feature 3: Asignar evento de clic a cada fila
  const rows = tbody.querySelectorAll('tr[data-model-name]');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const modelName = row.getAttribute('data-model-name');
      openModelDetail(modelName);
    });
  });
}

// Indicadores de orden en encabezados
function updateSortHeaderIndicators() {
  const headers = document.querySelectorAll('.models-table th.sortable');
  headers.forEach(th => {
    const col = th.getAttribute('data-column');
    const iconEl = th.querySelector('.sort-icon');
    if (state.sort.column === col) {
      th.classList.add('sort-active');
      th.setAttribute('aria-sort', state.sort.direction === 'asc' ? 'ascending' : 'descending');
      if (iconEl) {
        iconEl.textContent = state.sort.direction === 'asc' ? '▲' : '▼';
      }
    } else {
      th.classList.remove('sort-active');
      th.removeAttribute('aria-sort');
      if (iconEl) {
        iconEl.textContent = '⇅';
      }
    }
  });
}

// Clic de ordenación
function handleSortClick(column) {
  if (state.sort.column === column) {
    state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort.column = column;
    state.sort.direction = 'asc';
  }
  applyFiltersAndSort();
}

// Restablecer filtros
function resetFilters() {
  state.filters.search = '';
  state.filters.inputModality = 'ALL';
  state.filters.outputModality = 'ALL';

  const searchInput = document.getElementById('filter-search');
  const clearBtn = document.getElementById('search-clear-btn');
  const inputSelect = document.getElementById('filter-input-modality');
  const outputSelect = document.getElementById('filter-output-modality');

  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  if (inputSelect) inputSelect.value = 'ALL';
  if (outputSelect) outputSelect.value = 'ALL';

  applyFiltersAndSort();
}

// =========================================================
// Feature 3: Vista de Detalle Extendido (Drawer Modal)
// =========================================================

function openModelDetail(modelName) {
  const model = state.rawModels.find(m => m.name === modelName);
  if (!model) return;

  state.selectedModel = model;

  const overlay = document.getElementById('detail-modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const badgesEl = document.getElementById('modal-badges');
  const contentEl = document.getElementById('drawer-content');

  if (titleEl) titleEl.textContent = model.name;

  if (badgesEl) {
    badgesEl.innerHTML = `
      <span class="modality-badge ${getModalityBadgeClass(model.inputModality)}">In: ${escapeHtml(model.inputModality)}</span>
      <span class="modality-badge ${getModalityBadgeClass(model.outputModality)}">Out: ${escapeHtml(model.outputModality)}</span>
      <span class="ttft-badge ${getTtftBadgeClass(model.ttft_ms)}">TTFT: ${model.ttft_ms} ms</span>
    `;
  }

  // Cálculos financieros y ratios extendidos
  const dailyCost = (model.inputTokensDay * model.inputPricePerToken) + (model.outputTokensDay * model.outputPricePerToken);
  const weeklyCost = (model.inputTokensWeek * model.inputPricePerToken) + (model.outputTokensWeek * model.outputPricePerToken);
  
  const totalTokensDay = model.inputTokensDay + model.outputTokensDay;
  const totalTokensWeek = model.inputTokensWeek + model.outputTokensWeek;
  const inRatioWeek = ((model.inputTokensWeek / totalTokensWeek) * 100).toFixed(1);
  const outRatioWeek = ((model.outputTokensWeek / totalTokensWeek) * 100).toFixed(1);

  // Benchmarking de TTFT respecto al promedio de modelos
  const avgCatalogTtft = Math.round(state.rawModels.reduce((acc, m) => acc + m.ttft_ms, 0) / state.rawModels.length);
  const ttftDiff = model.ttft_ms - avgCatalogTtft;
  const ttftDiffText = ttftDiff <= 0 
    ? `${Math.abs(ttftDiff)} ms más rápido que la media` 
    : `${ttftDiff} ms más lento que la media`;

  if (contentEl) {
    contentEl.innerHTML = `
      <!-- Cost Breakdown Section -->
      <div class="drawer-section">
        <span class="drawer-section-title">Desglose Económico Detallado</span>
        <div class="drawer-metric-grid">
          <div class="drawer-metric-card">
            <span class="drawer-metric-label">Token Entrada (1M)</span>
            <span class="drawer-metric-val" style="color: var(--chart-input-color);">${formatters.formatPricePerMillion(model.inputPricePerToken)}</span>
            <span class="drawer-metric-sub">1K: ${formatters.formatPricePerThousand(model.inputPricePerToken)} &bull; ${formatters.formatPricePerToken(model.inputPricePerToken)}/tok</span>
          </div>
          <div class="drawer-metric-card">
            <span class="drawer-metric-label">Token Salida (1M)</span>
            <span class="drawer-metric-val" style="color: var(--chart-output-color);">${formatters.formatPricePerMillion(model.outputPricePerToken)}</span>
            <span class="drawer-metric-sub">1K: ${formatters.formatPricePerThousand(model.outputPricePerToken)} &bull; ${formatters.formatPricePerToken(model.outputPricePerToken)}/tok</span>
          </div>
          <div class="drawer-metric-card">
            <span class="drawer-metric-label">Gasto Diario Estimado</span>
            <span class="drawer-metric-val">${formatters.formatCurrency(dailyCost)}</span>
            <span class="drawer-metric-sub">${formatters.formatTokensCompact(totalTokensDay)} tokens/día</span>
          </div>
          <div class="drawer-metric-card">
            <span class="drawer-metric-label">Gasto Semanal Estimado</span>
            <span class="drawer-metric-val">${formatters.formatCurrency(weeklyCost)}</span>
            <span class="drawer-metric-sub">${formatters.formatTokensCompact(totalTokensWeek)} tokens/semana</span>
          </div>
        </div>
      </div>

      <!-- Individual Chart 1: Model Token Breakdown (SVG) -->
      <div class="drawer-section">
        <span class="drawer-section-title">Gráfica Específica: Consumo Diario vs Semanal</span>
        <div class="drawer-chart-card">
          <div class="drawer-chart-header">
            <span>Volumen de Entrada vs Salida</span>
            <div class="chart-legend" style="margin: 0;">
              <div class="legend-item"><span class="legend-color legend-input"></span><span>In (${inRatioWeek}%)</span></div>
              <div class="legend-item"><span class="legend-color legend-output"></span><span>Out (${outRatioWeek}%)</span></div>
            </div>
          </div>
          <div class="drawer-chart-svg-wrap" id="model-consumption-chart">
            ${renderIndividualModelConsumptionSvg(model)}
          </div>
        </div>
      </div>

      <!-- Individual Chart 2: TTFT Benchmark vs Media (SVG) -->
      <div class="drawer-section">
        <span class="drawer-section-title">Gráfica Específica: Benchmark de Latencia TTFT</span>
        <div class="drawer-chart-card">
          <div class="drawer-chart-header">
            <span>Velocidad frente a la media del catálogo (${avgCatalogTtft} ms)</span>
            <span style="font-size: 0.72rem; color: ${ttftDiff <= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${ttftDiffText}</span>
          </div>
          <div class="drawer-chart-svg-wrap" style="height: 110px;" id="model-ttft-benchmark">
            ${renderIndividualModelTtftSvg(model, avgCatalogTtft)}
          </div>
        </div>
      </div>
    `;
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Renderiza gráfico SVG individual de consumo para el modelo seleccionado
 */
function renderIndividualModelConsumptionSvg(model) {
  const width = 500;
  const height = 180;
  const margin = { top: 25, right: 25, bottom: 35, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const data = [
    {
      period: 'Diario',
      inM: model.inputTokensDay / 1_000_000,
      outM: model.outputTokensDay / 1_000_000,
      inRaw: model.inputTokensDay,
      outRaw: model.outputTokensDay
    },
    {
      period: 'Semanal',
      inM: model.inputTokensWeek / 1_000_000,
      outM: model.outputTokensWeek / 1_000_000,
      inRaw: model.inputTokensWeek,
      outRaw: model.outputTokensWeek
    }
  ];

  const maxVal = Math.max(...data.map(d => Math.max(d.inM, d.outM)), 1);
  const yMax = Math.ceil(maxVal * 1.15);

  const yTicks = [0, Math.round(yMax * 0.5), yMax];
  let gridLines = '';
  yTicks.forEach(tick => {
    const yPos = margin.top + innerHeight - (tick / yMax) * innerHeight;
    gridLines += `
      <line class="grid-line" x1="${margin.left}" y1="${yPos}" x2="${width - margin.right}" y2="${yPos}" />
      <text class="axis-text" x="${margin.left - 8}" y="${yPos + 3}" text-anchor="end">${tick}M</text>
    `;
  });

  const groupWidth = innerWidth / data.length;
  const barWidth = 40;

  let bars = '';
  data.forEach((d, i) => {
    const groupCenter = margin.left + i * groupWidth + groupWidth / 2;
    const inHeight = Math.max((d.inM / yMax) * innerHeight, 3);
    const outHeight = Math.max((d.outM / yMax) * innerHeight, 3);

    const inX = groupCenter - barWidth - 4;
    const outX = groupCenter + 4;
    const inY = margin.top + innerHeight - inHeight;
    const outY = margin.top + innerHeight - outHeight;

    bars += `
      <!-- Entrada -->
      <rect x="${inX}" y="${inY}" width="${barWidth}" height="${inHeight}" rx="4" fill="var(--chart-input-color)" />
      <text class="axis-text" x="${inX + barWidth / 2}" y="${inY - 5}" text-anchor="middle" fill="var(--chart-input-color)">
        ${formatters.formatTokensCompact(d.inRaw)}
      </text>

      <!-- Salida -->
      <rect x="${outX}" y="${outY}" width="${barWidth}" height="${outHeight}" rx="4" fill="var(--chart-output-color)" />
      <text class="axis-text" x="${outX + barWidth / 2}" y="${outY - 5}" text-anchor="middle" fill="var(--chart-output-color)">
        ${formatters.formatTokensCompact(d.outRaw)}
      </text>

      <!-- Label Período -->
      <text class="axis-text" x="${groupCenter}" y="${height - 10}" text-anchor="middle" style="font-weight: 600; fill: var(--text-secondary);">
        Consumo ${d.period}
      </text>
    `;
  });

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      ${gridLines}
      <line class="axis-line" x1="${margin.left}" y1="${margin.top + innerHeight}" x2="${width - margin.right}" y2="${margin.top + innerHeight}" />
      ${bars}
    </svg>
  `;
}

/**
 * Renderiza gráfico SVG individual de TTFT benchmark frente a la media
 */
function renderIndividualModelTtftSvg(model, avgTtft) {
  const width = 500;
  const height = 90;
  const margin = { top: 15, right: 30, bottom: 25, left: 30 };
  const innerWidth = width - margin.left - margin.right;

  // Rango de escala entre 100ms y 1000ms
  const minMs = 100;
  const maxMs = 1000;
  const scale = (ms) => margin.left + Math.max(0, Math.min(1, (ms - minMs) / (maxMs - minMs))) * innerWidth;

  const modelX = scale(model.ttft_ms);
  const avgX = scale(avgTtft);
  const isFaster = model.ttft_ms <= avgTtft;
  const barColor = isFaster ? 'var(--accent-emerald)' : 'var(--accent-rose)';

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      <!-- Fondo de la barra de rango -->
      <rect x="${margin.left}" y="32" width="${innerWidth}" height="10" rx="5" fill="var(--bg-surface)" />
      
      <!-- Marcador de la media del catálogo -->
      <line x1="${avgX}" y1="18" x2="${avgX}" y2="52" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="3 3" />
      <text x="${avgX}" y="14" text-anchor="middle" class="axis-text" style="font-size: 9px; fill: var(--text-muted);">
        Media: ${avgTtft} ms
      </text>

      <!-- Marcador del modelo actual -->
      <circle cx="${modelX}" cy="37" r="8" fill="${barColor}" stroke="#ffffff" stroke-width="2" />
      <text x="${modelX}" y="65" text-anchor="middle" class="axis-text" style="font-weight: 700; fill: ${barColor};">
        ${model.name}: ${model.ttft_ms} ms
      </text>

      <!-- Extremos de la escala -->
      <text x="${margin.left}" y="52" class="axis-text" style="font-size: 8px;">${minMs}ms (Rápido)</text>
      <text x="${width - margin.right}" y="52" text-anchor="end" class="axis-text" style="font-size: 8px;">${maxMs}ms (Lento)</text>
    </svg>
  `;
}

// Cerrar panel de detalle
function closeModelDetail() {
  const overlay = document.getElementById('detail-modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  document.body.style.overflow = '';
  state.selectedModel = null;
}

// Configuración de escuchadores de eventos
function setupEventListeners() {
  // 1. Cabeceras ordenables
  const headers = document.querySelectorAll('.models-table th.sortable');
  headers.forEach(th => {
    const column = th.getAttribute('data-column');
    th.addEventListener('click', () => handleSortClick(column));
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSortClick(column);
      }
    });
  });

  // 2. Buscador por texto
  const searchInput = document.getElementById('filter-search');
  const clearBtn = document.getElementById('search-clear-btn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = e.target.value ? 'block' : 'none';
      }
      applyFiltersAndSort();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.style.display = 'none';
      state.filters.search = '';
      applyFiltersAndSort();
    });
  }

  // 3. Selectores de modalidad
  const inputSelect = document.getElementById('filter-input-modality');
  if (inputSelect) {
    inputSelect.addEventListener('change', (e) => {
      state.filters.inputModality = e.target.value;
      applyFiltersAndSort();
    });
  }

  const outputSelect = document.getElementById('filter-output-modality');
  if (outputSelect) {
    outputSelect.addEventListener('change', (e) => {
      state.filters.outputModality = e.target.value;
      applyFiltersAndSort();
    });
  }

  // 4. Botón de reset de filtros
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // 5. Toggle de período de consumo (Feature 2)
  const btnWeek = document.getElementById('btn-period-week');
  const btnDay = document.getElementById('btn-period-day');
  if (btnWeek && btnDay) {
    btnWeek.addEventListener('click', () => {
      if (state.charts.consumptionPeriod !== 'week') {
        state.charts.consumptionPeriod = 'week';
        btnWeek.classList.add('active');
        btnDay.classList.remove('active');
        renderConsumptionChart(state.filteredModels);
      }
    });

    btnDay.addEventListener('click', () => {
      if (state.charts.consumptionPeriod !== 'day') {
        state.charts.consumptionPeriod = 'day';
        btnDay.classList.add('active');
        btnWeek.classList.remove('active');
        renderConsumptionChart(state.filteredModels);
      }
    });
  }

  // 6. Cierre del Drawer / Modal (Feature 3)
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeModelDetail);
  }

  const overlay = document.getElementById('detail-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModelDetail();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selectedModel) {
      closeModelDetail();
    }
  });

  // 7. Redimensionamiento para SVG
  window.addEventListener('resize', () => {
    renderCharts(state.filteredModels);
  });
}

// Renderizado de error
function renderError() {
  const tbody = document.getElementById('table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-message" style="color: var(--accent-rose);">
          Error al cargar los datos (${escapeHtml(state.error || 'Error desconocido')}). Asegúrate de acceder mediante un servidor local (HTTP).
        </td>
      </tr>
    `;
  }
}

// Escapar cadenas para seguridad XSS
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
});
