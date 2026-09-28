/**
 * TokenDashboard - Base Application
 * Asynchronous data retrieval from mock-data.json and responsive table rendering.
 */

// Application state
const state = {
  models: [],
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

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Data loading service
async function loadData() {
  try {
    const response = await fetch('mock-data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    state.models = data;
    state.isLoading = false;

    renderKPIs();
    renderTable();
  } catch (err) {
    console.error('Error al cargar mock-data.json:', err);
    state.error = err.message;
    state.isLoading = false;
    renderError();
  }
}

// Render global KPI summary cards
function renderKPIs() {
  const models = state.models;
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

// Render models comparison table
function renderTable() {
  const tbody = document.getElementById('table-body');
  const countEl = document.getElementById('models-count');
  const models = state.models;

  if (countEl) {
    countEl.textContent = `${models.length} modelos`;
  }

  if (!models || models.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-message">No se encontraron modelos.</td>
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

// Render error notification in table
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadData();
});
