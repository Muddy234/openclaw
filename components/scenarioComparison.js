/**
 * scenarioComparison.js
 * Scenario Comparison Component for Financial GPS
 *
 * Renders the scenario comparison UI with proper disclaimers and security measures.
 * All projections are hypothetical illustrations for educational purposes only.
 */

// ===========================
// DISCLAIMER CONTENT
// ===========================

const SCENARIO_DISCLAIMER = `These scenario projections are hypothetical illustrations for educational purposes only.
All projections are based on assumptions that may not reflect actual future conditions.
Actual results will vary based on market performance, inflation, life circumstances, tax
law changes, and many other factors. These scenarios do not constitute financial, investment,
or retirement planning advice. Please consult a qualified financial advisor before making financial decisions.`;

const COMPARISON_DISCLAIMER = `Projection Assumptions: Investment returns 7% annually (actual returns will vary),
Inflation 3% annually, Tax rates simplified. Past performance does not guarantee future results.
Market returns can be negative in any given year. This tool cannot predict your actual financial outcomes.`;

// ===========================
// MAIN RENDER FUNCTION
// ===========================

/**
 * Render scenario comparison section
 * @returns {string} HTML for scenario comparison
 */
function renderScenarioComparison() {
  const scenarios = typeof getScenarios === 'function' ? getScenarios() : [];

  return `
    <div class="scenario-section card">
      <div class="scenario-header">
        <h2 class="scenario-title">Financial Scenario Explorer</h2>
        <span class="scenario-badge">Educational Tool</span>
      </div>
      <p class="scenario-subtitle">
        Explore how different hypothetical scenarios might impact your financial trajectory
      </p>

      <!-- Primary Disclaimer -->
      <div class="scenario-disclaimer">
        <div class="disclaimer-icon">&#9888;</div>
        <div class="disclaimer-content">
          <strong>Important Notice</strong>
          <p>${escapeHtml(SCENARIO_DISCLAIMER)}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="scenario-actions">
        <button class="btn btn-primary" onclick="saveCurrentAsBaseline()">
          Save Current as Baseline
        </button>
        <button class="btn btn-ghost" onclick="showScenarioTemplates()">
          Quick Scenarios
        </button>
      </div>

      <!-- Saved Scenarios -->
      ${scenarios.length > 0 ? renderSavedScenarios(scenarios) : renderEmptyState()}

      <!-- Comparison View (if 2+ scenarios exist) -->
      ${scenarios.length >= 2 ? renderComparison(scenarios) : ''}
    </div>
  `;
}

// ===========================
// SCENARIO CARDS
// ===========================

/**
 * Render saved scenarios list
 * @param {Array} scenarios - Array of scenarios
 * @returns {string} HTML
 */
function renderSavedScenarios(scenarios) {
  return `
    <div class="saved-scenarios">
      <h3 class="scenarios-heading">Your Scenarios</h3>
      <div class="scenario-cards">
        ${scenarios.map(scenario => renderScenarioCard(scenario)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single scenario card
 * @param {Object} scenario - Scenario object
 * @returns {string} HTML
 */
function renderScenarioCard(scenario) {
  const metrics = typeof calculateMetrics === 'function'
    ? calculateMetrics(scenario.snapshot)
    : { savingsRate: 0 };

  const projections = typeof calculateProjections === 'function'
    ? calculateProjections(scenario.snapshot)
    : [];

  const fiNumber = (typeof getFireAnnualExpenses === 'function'
    ? getFireAnnualExpenses(scenario.snapshot)
    : (scenario.snapshot.general?.monthlyExpense || 0) * 12) * 25;
  const fiMonth = projections.findIndex(p => p.netWorth >= fiNumber);
  const currentAge = scenario.snapshot.general?.age || 30;
  const estimatedFIAge = fiMonth !== -1 ? Math.floor(currentAge + fiMonth / 12) : null;

  return `
    <div class="scenario-card ${scenario.isBaseline ? 'scenario-card--baseline' : ''}">
      <div class="scenario-card-header">
        <h4 class="scenario-card-title">
          ${scenario.isBaseline ? '<span class="baseline-star">&#9733;</span> ' : ''}${escapeHtml(scenario.name)}
        </h4>
        <div class="scenario-card-actions">
          <button class="btn-icon" onclick="loadScenarioById('${escapeHtml(scenario.id)}')" title="Load this scenario">
            Load
          </button>
          <button class="btn-icon btn-icon--danger" onclick="deleteScenarioById('${escapeHtml(scenario.id)}')" title="Delete">
            Delete
          </button>
        </div>
      </div>
      <p class="scenario-card-desc">${escapeHtml(scenario.description)}</p>
      <div class="scenario-quick-stats">
        <div class="quick-stat">
          <span class="stat-label">Savings Rate</span>
          <span class="stat-value">${(metrics.savingsRate || 0).toFixed(1)}%</span>
        </div>
        <div class="quick-stat">
          <span class="stat-label">Est. FI Age</span>
          <span class="stat-value">${estimatedFIAge ? estimatedFIAge : 'N/A'}</span>
        </div>
      </div>
      <div class="scenario-card-note">
        <small>Hypothetical projection only</small>
      </div>
    </div>
  `;
}

/**
 * Render empty state when no scenarios exist
 * @returns {string} HTML
 */
function renderEmptyState() {
  return `
    <div class="scenario-empty">
      <div class="empty-icon">&#128173;</div>
      <h3>No scenarios yet</h3>
      <p>Save your current plan as a baseline, then create alternative scenarios to compare hypothetical outcomes.</p>
    </div>
  `;
}

// ===========================
// COMPARISON TABLE
// ===========================

/**
 * Render scenario comparison table and chart
 * @param {Array} scenarios - Array of scenarios
 * @returns {string} HTML
 */
function renderComparison(scenarios) {
  const comparisons = typeof compareScenarios === 'function'
    ? compareScenarios(scenarios.map(s => s.id))
    : null;

  if (!comparisons || comparisons.length < 2) {
    return '';
  }

  return `
    <div class="comparison-section">
      <h3 class="comparison-heading">Scenario Comparison</h3>

      <!-- Comparison Disclaimer -->
      <div class="comparison-disclaimer">
        <small>${escapeHtml(COMPARISON_DISCLAIMER)}</small>
      </div>

      <!-- Assumptions Display -->
      <div class="comparison-assumptions">
        <span class="assumption-tag">Assumes: 7% returns</span>
        <span class="assumption-tag">3% inflation</span>
        <span class="assumption-tag">Simplified taxes</span>
      </div>

      <!-- Comparison Table -->
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              ${comparisons.map(c => `
                <th>${c.isBaseline ? '<span class="baseline-star">&#9733;</span> ' : ''}${escapeHtml(c.name)}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly Savings</td>
              ${comparisons.map(c => `
                <td>${formatScenarioCurrency(c.metrics.monthlyInvestments)}</td>
              `).join('')}
            </tr>
            <tr>
              <td>Savings Rate</td>
              ${comparisons.map(c => `
                <td>${(c.metrics.savingsRate || 0).toFixed(1)}%</td>
              `).join('')}
            </tr>
            <tr>
              <td>Est. FI Age*</td>
              ${comparisons.map(c => `
                <td>${c.metrics.estimatedFIAge ? Math.floor(c.metrics.estimatedFIAge) : 'N/A'}</td>
              `).join('')}
            </tr>
            <tr>
              <td>Projected Net Worth at 65*</td>
              ${comparisons.map(c => `
                <td>${formatScenarioCurrency(c.metrics.projectedNetWorth65)}</td>
              `).join('')}
            </tr>
            <tr>
              <td>DTI Ratio</td>
              ${comparisons.map(c => `
                <td>${(c.metrics.dti || 0).toFixed(1)}%</td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>

      <p class="comparison-footnote">
        *Hypothetical projections based on simplified assumptions. Actual results will differ.
        This comparison is for educational purposes only and is not financial advice.
      </p>

      <!-- Comparison Chart -->
      <div class="comparison-chart">
        <div class="chart-overlay">Hypothetical Illustrations Only</div>
        <canvas id="scenarioComparisonChart"></canvas>
      </div>
    </div>
  `;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Format currency for scenario display
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
function formatScenarioCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

// ===========================
// SCENARIO ACTIONS
// ===========================

/**
 * Save current snapshot as baseline
 */
function saveCurrentAsBaseline() {
  if (typeof getState !== 'function') {
    console.error('getState not available');
    return;
  }

  const { snapshot } = getState();

  try {
    const scenario = createScenario(
      'Baseline',
      'Your current financial plan saved as the baseline for comparison.',
      snapshot,
      true
    );
    addScenario(scenario);

    // Re-render
    if (window.app && typeof window.app.render === 'function') {
      window.app.render();
    }
  } catch (e) {
    console.error('Failed to save baseline:', e);
    alert('Failed to save baseline: ' + e.message);
  }
}

/**
 * Show scenario template selection modal
 */
function showScenarioTemplates() {
  const templates = [
    { id: 'raise_10k', label: 'Scenario: +$10K Income', description: 'Assumes $10,000 annual income increase' },
    { id: 'reduce_expenses_500', label: 'Scenario: $500 Lower Expenses', description: 'Assumes monthly expenses reduced by $500' },
    { id: 'max_401k', label: 'Scenario: Maximum 401(k)', description: 'Assumes 401(k) contributions at annual limit' },
    { id: 'pay_off_high_interest', label: 'Scenario: No High-Interest Debt', description: 'Assumes all debts >10% APR eliminated' },
    { id: 'side_hustle_1k', label: 'Scenario: +$1K Monthly', description: 'Assumes $1,000/month additional income' }
  ];

  const modalHtml = `
    <div class="scenario-modal-overlay" onclick="closeScenarioModal()">
      <div class="scenario-modal" onclick="event.stopPropagation()">
        <h3>Choose a Scenario Template</h3>
        <p class="modal-disclaimer">
          These are hypothetical scenarios for educational exploration.
          They are not recommendations to take any specific action.
        </p>
        <div class="template-list">
          ${templates.map(t => `
            <button class="template-option" onclick="createFromTemplate('${escapeHtml(t.id)}')">
              <div class="template-label">${escapeHtml(t.label)}</div>
              <div class="template-desc">${escapeHtml(t.description)}</div>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-ghost modal-close-btn" onclick="closeScenarioModal()">Cancel</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Create scenario from template
 * @param {string} templateId - Template ID
 */
function createFromTemplate(templateId) {
  if (typeof getState !== 'function') {
    console.error('getState not available');
    return;
  }

  const { snapshot } = getState();

  try {
    const scenario = createScenarioFromTemplate(templateId, snapshot);

    if (scenario) {
      addScenario(scenario);
      closeScenarioModal();

      // Re-render
      if (window.app && typeof window.app.render === 'function') {
        window.app.render();
      }
    }
  } catch (e) {
    console.error('Failed to create scenario:', e);
    alert('Failed to create scenario: ' + e.message);
  }
}

/**
 * Close scenario modal
 */
function closeScenarioModal() {
  const modal = document.querySelector('.scenario-modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// ===========================
// CHART INITIALIZATION
// ===========================

/**
 * Initialize scenario comparison chart
 */
function initScenarioComparisonChart() {
  const ctx = document.getElementById('scenarioComparisonChart');
  if (!ctx) return;

  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not available for scenario comparison');
    return;
  }

  const scenarios = typeof getScenarios === 'function' ? getScenarios() : [];
  const comparisons = typeof compareScenarios === 'function'
    ? compareScenarios(scenarios.map(s => s.id))
    : null;

  if (!comparisons || comparisons.length < 2) return;

  // Color palette for scenarios
  const colors = [
    'rgba(212, 175, 55, 1)',   // Gold (baseline)
    'rgba(96, 165, 250, 1)',    // Blue
    'rgba(34, 197, 94, 1)',     // Green
    'rgba(168, 85, 247, 1)',    // Purple
    'rgba(251, 146, 60, 1)'     // Orange
  ];

  const datasets = comparisons.map((comp, index) => {
    const netWorthData = comp.projections.map(p => p.netWorth);
    const color = colors[index % colors.length];

    return {
      label: comp.name,
      data: netWorthData,
      borderColor: color,
      backgroundColor: color.replace('1)', '0.1)'),
      borderWidth: comp.isBaseline ? 3 : 2,
      borderDash: comp.isBaseline ? [] : [5, 5],
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6
    };
  });

  // Labels (months converted to years)
  const maxLength = Math.max(...comparisons.map(c => c.projections.length));
  const labels = Array.from({ length: maxLength }, (_, i) => {
    const years = Math.floor(i / 12);
    return years;
  });

  // Filter to show only yearly data points for cleaner chart
  const yearlyLabels = [];
  const yearlyDatasets = datasets.map(ds => ({
    ...ds,
    data: []
  }));

  for (let i = 0; i < maxLength; i += 12) {
    yearlyLabels.push(`Year ${Math.floor(i / 12)}`);
    datasets.forEach((ds, idx) => {
      yearlyDatasets[idx].data.push(ds.data[i] || 0);
    });
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: yearlyLabels,
      datasets: yearlyDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#e0e0e0',
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          titleColor: '#d4af37',
          bodyColor: '#e0e0e0',
          borderColor: '#d4af37',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatScenarioCurrency(context.parsed.y);
            },
            footer: function() {
              return 'Hypothetical projection only';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#999' }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#999',
            callback: (value) => formatScenarioCurrency(value)
          }
        }
      }
    }
  });
}

// ===========================
// EXPOSE TO WINDOW
// ===========================

if (typeof window !== 'undefined') {
  window.renderScenarioComparison = renderScenarioComparison;
  window.initScenarioComparisonChart = initScenarioComparisonChart;
  window.saveCurrentAsBaseline = saveCurrentAsBaseline;
  window.showScenarioTemplates = showScenarioTemplates;
  window.createFromTemplate = createFromTemplate;
  window.closeScenarioModal = closeScenarioModal;
}
