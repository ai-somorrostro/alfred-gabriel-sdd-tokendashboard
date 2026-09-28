/**
 * TokenDashboard - Application Logic
 * Feature 1 & Feature 2: Sorting, filters, and native SVG data visualizations.
 */

// Global Application State
const state = {
  rawModels: [],
  filteredModels: [],
  filters: {
    search: '',
    inputModality: 'ALL',
    outputModality: 'ALL'
  },
  sort: {
    column: 'name',
    direction: 'asc'
  },
  charts: {
    consumptionPeriod: 'week' // 'week' | 'day'
  },
  isLoading: true,
  error: null
};

// Formatter utilities
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

  formatPricePerMillion(price) {
    const perMillion = price * 1_000_000;
    return '$' + perMillion.toFixed(2);
  }
};

// Data loading service
async function loadData() {
  try {
    const response = await fetch('mock-data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    state.rawModels = data;
    state.isLoading = false;

    populateModalityFilterOptions();
    applyFiltersAndSort();
  } catch (err) {
    console.error('Error al cargar mock-data.json:', err);
    state.error = err.message;
    state.isLoading = false;
    renderError();
  }
}

// Populate modality filter dropdowns with unique options from data
function populateModalityFilterOptions() {
  const inputSelect = document.getElementById('filter-input-modality');
  const outputSelect = document.getElementById('filter-output-modality');

  if (!inputSelect || !outputSelect) return;

  const inputModalities = Array.from(new Set(state.rawModels.map(m => m.inputModality))).sort();
  const outputModalities = Array.from(new Set(state.rawModels.map(m => m.outputModality))).sort();

  inputModalities.forEach(mod => {
    const option = document.createElement('option');
    option.value = mod;
    option.textContent = mod;
    inputSelect.appendChild(option);
  });

  outputModalities.forEach(mod => {
    const option = document.createElement('option');
    option.value = mod;
    option.textContent = mod;
    outputSelect.appendChild(option);
  });
}

// Filter and Sort Engine
function applyFiltersAndSort() {
  let result = [...state.rawModels];

  // 1. Text Search Filter (name)
  const query = state.filters.search.trim().toLowerCase();
  if (query) {
    result = result.filter(m => m.name.toLowerCase().includes(query));
  }

  // 2. Input Modality Filter
  if (state.filters.inputModality !== 'ALL') {
    result = result.filter(m => m.inputModality === state.filters.inputModality);
  }

  // 3. Output Modality Filter
  if (state.filters.outputModality !== 'ALL') {
    result = result.filter(m => m.outputModality === state.filters.outputModality);
  }

  // 4. Sorting
  if (state.sort.column) {
    const { column, direction } = state.sort;
    const modifier = direction === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (typeof valA === 'string') {
        return valA.localeCompare(valB, 'es', { sensitivity: 'base' }) * modifier;
      }

      if (typeof valA === 'number') {
        return (valA - valB) * modifier;
      }

      return 0;
    });
  }

  state.filteredModels = result;
  
  renderKPIs(result);
  renderCharts(result);
  renderTable();
  updateSortHeaderIndicators();
}

// Render global KPI summary cards
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

// ==========================================================================
// Feature 2: Native SVG Charts
// ==========================================================================

function renderCharts(models) {
  renderPriceChart(models);
  renderConsumptionChart(models);
}

/**
 * Chart 1: Price Comparison (Input vs Output) per 1M tokens
 */
function renderPriceChart(models) {
  const container = document.getElementById('price-chart-container');
  if (!container) return;

  if (!models || models.length === 0) {
    container.innerHTML = `<div class="empty-message" style="padding: 2rem;">Sin datos para los filtros seleccionados</div>`;
    return;
  }

  const width = 640;
  const height = 260;
  const margin = { top: 20, right: 20, bottom: 65, left: 50 };
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
      <text class="axis-text" x="${margin.left - 8}" y="${yPos + 3}" text-anchor="end">$${tickVal.toFixed(2)}</text>
    `;
  });

  const groupWidth = innerWidth / data.length;
  const barPadding = 0.25;
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
      <!-- Input Price Bar -->
      <rect class="bar-rect" x="${inputX}" y="${inputY}" width="${barWidth - 2}" height="${inputBarHeight}"
        rx="3" fill="var(--chart-input-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Entrada"
        data-val-1m="$${d.inputPrice1M.toFixed(2)}"
        data-val-raw="${formatters.formatPricePerToken(d.inputPriceRaw)}"
      />

      <!-- Output Price Bar -->
      <rect class="bar-rect" x="${outputX}" y="${outputY}" width="${barWidth - 2}" height="${outputBarHeight}"
        rx="3" fill="var(--chart-output-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Salida"
        data-val-1m="$${d.outputPrice1M.toFixed(2)}"
        data-val-raw="${formatters.formatPricePerToken(d.outputPriceRaw)}"
      />

      <!-- X-axis Model Name -->
      <text class="axis-text" x="${groupX + usableWidth / 2}" y="${height - margin.bottom + 16}" 
        text-anchor="end" transform="rotate(-35, ${groupX + usableWidth / 2}, ${height - margin.bottom + 16})">
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
 * Chart 2: Token Consumption (Weekly vs Daily)
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

  const width = 640;
  const height = 260;
  const margin = { top: 20, right: 20, bottom: 65, left: 52 };
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
  const barPadding = 0.25;
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
      <!-- Input Tokens Bar -->
      <rect class="bar-rect" x="${inputX}" y="${inputY}" width="${barWidth - 2}" height="${inputBarHeight}"
        rx="3" fill="var(--chart-input-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Entrada"
        data-tokens="${formatters.formatTokensCompact(d.inputTokens)}"
        data-tokens-full="${formatters.formatTokensFull(d.inputTokens)}"
        data-period="${isWeek ? 'Semanal' : 'Diario'}"
      />

      <!-- Output Tokens Bar -->
      <rect class="bar-rect" x="${outputX}" y="${outputY}" width="${barWidth - 2}" height="${outputBarHeight}"
        rx="3" fill="var(--chart-output-color)" opacity="0.88"
        data-model="${escapeHtml(d.name)}"
        data-type="Salida"
        data-tokens="${formatters.formatTokensCompact(d.outputTokens)}"
        data-tokens-full="${formatters.formatTokensFull(d.outputTokens)}"
        data-period="${isWeek ? 'Semanal' : 'Diario'}"
      />

      <!-- X-axis Label -->
      <text class="axis-text" x="${groupX + usableWidth / 2}" y="${height - margin.bottom + 16}" 
        text-anchor="end" transform="rotate(-35, ${groupX + usableWidth / 2}, ${height - margin.bottom + 16})">
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
 * Interactive Tooltips for SVG Bars
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
            <span class="tooltip-dot" style="background: ${dotColor};"></span>
            <span>${type}:</span>
            <span class="tooltip-value">${val1M} / 1M</span>
          </div>
          <div class="tooltip-sub">${valRaw} por token</div>
        `;
      } else {
        const tokens = bar.getAttribute('data-tokens');
        const tokensFull = bar.getAttribute('data-tokens-full');
        const period = bar.getAttribute('data-period');
        tooltip.innerHTML = `
          <div class="tooltip-title">${modelName} (${period})</div>
          <div class="tooltip-row">
            <span class="tooltip-dot" style="background: ${dotColor};"></span>
            <span>${type}:</span>
            <span class="tooltip-value">${tokens} tokens</span>
          </div>
          <div class="tooltip-sub">${tokensFull} tokens exactos</div>
        `;
      }

      tooltip.style.display = 'block';
      positionTooltip(e);
    });

    bar.addEventListener('mousemove', (e) => {
      positionTooltip(e);
    });

    bar.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  });
}

function positionTooltip(e) {
  const tooltip = document.getElementById('chart-tooltip');
  if (!tooltip) return;

  const pad = 12;
  let x = e.clientX;
  let y = e.clientY - pad;

  // Prevent overflowing window boundaries
  const rect = tooltip.getBoundingClientRect();
  if (x - rect.width / 2 < 10) x = rect.width / 2 + 10;
  if (x + rect.width / 2 > window.innerWidth - 10) x = window.innerWidth - rect.width / 2 - 10;
  if (y - rect.height < 10) y = e.clientY + pad + rect.height;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

// Badges helper functions
function getTtftBadgeClass(ttft) {
  if (ttft <= 250) return 'ttft-fast';
  if (ttft <= 400) return 'ttft-medium';
  return 'ttft-slow';
}

function getModalityBadgeClass(modality) {
  if (modality.includes('+')) return 'modality-multimodal';
  return 'modality-text';
}

// Render models table
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

  tbody.innerHTML = models.map(model => `
    <tr data-model-name="${escapeHtml(model.name)}">
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
            <span class="tokens-tag">In:</span>
            <span class="num-val">${formatters.formatTokensCompact(model.inputTokensDay)}</span>
          </div>
          <div class="tokens-row" title="Output: ${formatters.formatTokensFull(model.outputTokensDay)} tokens">
            <span class="tokens-tag">Out:</span>
            <span class="num-val">${formatters.formatTokensCompact(model.outputTokensDay)}</span>
          </div>
        </div>
      </td>
      <td class="text-right">
        <div class="tokens-split">
          <div class="tokens-row" title="Input: ${formatters.formatTokensFull(model.inputTokensWeek)} tokens">
            <span class="tokens-tag">In:</span>
            <span class="num-val">${formatters.formatTokensCompact(model.inputTokensWeek)}</span>
          </div>
          <div class="tokens-row" title="Output: ${formatters.formatTokensFull(model.outputTokensWeek)} tokens">
            <span class="tokens-tag">Out:</span>
            <span class="num-val">${formatters.formatTokensCompact(model.outputTokensWeek)}</span>
          </div>
        </div>
      </td>
    </tr>
  `).join('');
}

// Update visual sort indicators in headers
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

// Handle column header sort clicks
function handleSortClick(column) {
  if (state.sort.column === column) {
    state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort.column = column;
    state.sort.direction = 'asc';
  }
  applyFiltersAndSort();
}

// Reset all filters
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

// Attach event listeners
function setupEventListeners() {
  // Sortable headers
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

  // Search input
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

  // Modality select filters
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

  // Reset button
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // Period Toggle Buttons for Consumption Chart
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

  // Resize handler
  window.addEventListener('resize', () => {
    renderCharts(state.filteredModels);
  });
}

// Render error notification
function renderError() {
  const tbody = document.getElementById('table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-message" style="color: var(--accent-rose); line-height: 1.8;">
          <strong>Error al cargar los datos (${escapeHtml(state.error || 'Error desconocido')})</strong><br>
          Si abres el archivo directamente en el navegador (<code>file://</code>), la política CORS puede bloquear la lectura de <code>mock-data.json</code>.<br>
          <em>Solución:</em> Sirve el proyecto mediante un servidor local (ej: <code>npx serve</code> o <code>python3 -m http.server</code>).
        </td>
      </tr>
    `;
  }
}

// XSS Sanitizer
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
});
