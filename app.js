/**
 * TokenDashboard - Application Logic
 * Feature 1: Sorting across all columns and reactive combined filters by name and modality.
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
    renderKPIs();
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

  state.filteredModels = result;
  updateSortHeaderIndicators();
  renderTable();
}

// Render global KPI summary cards
function renderKPIs() {
  const models = state.rawModels;
  if (!models || models.length === 0) return;

  const totalModelsEl = document.getElementById('kpi-total-models');
  const avgTtftEl = document.getElementById('kpi-avg-ttft');
  const avgPriceEl = document.getElementById('kpi-avg-price');
  const totalTokensEl = document.getElementById('kpi-total-tokens');

  const totalModels = models.length;
  const avgTtft = Math.round(models.reduce((acc, m) => acc + m.ttft_ms, 0) / totalModels);
  const avgInputPrice = models.reduce((acc, m) => acc + m.inputPricePerToken, 0) / totalModels;
  const avgOutputPrice = models.reduce((acc, m) => acc + m.outputPricePerToken, 0) / totalModels;
  const totalWeeklyTokens = models.reduce((acc, m) => acc + (m.inputTokensWeek + m.outputTokensWeek), 0);

  if (totalModelsEl) totalModelsEl.textContent = totalModels;
  if (avgTtftEl) avgTtftEl.textContent = `${avgTtft} ms`;
  if (avgPriceEl) {
    avgPriceEl.textContent = `${formatters.formatPricePerMillion(avgInputPrice)} / ${formatters.formatPricePerMillion(avgOutputPrice)}`;
  }
  if (totalTokensEl) totalTokensEl.textContent = formatters.formatTokensCompact(totalWeeklyTokens);
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
