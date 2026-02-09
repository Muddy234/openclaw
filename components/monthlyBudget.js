/**
 * monthlyBudget.js
 * Rendering + initialization for Monthly Budget tab enhancements:
 * - Budget Health Score hero banner
 * - Cash Flow Waterfall Chart (Chart.js)
 * - Expense Category Estimator (slider cards)
 * - 50/30/20 Rule Analyzer
 */

// Chart instance for cleanup
let waterfallChartInstance = null;

// ===========================
// BUDGET HEALTH SCORE
// ===========================

/**
 * Render Budget Health Score hero banner
 * @param {Object} snapshot
 * @param {Object} metrics - From calculateMetrics()
 * @returns {string} HTML
 */
function renderBudgetHealthScore(snapshot, metrics) {
  if (!snapshot || !metrics) return '';

  const health = typeof calculateBudgetHealthScore === 'function'
    ? calculateBudgetHealthScore(snapshot, metrics)
    : null;

  if (!health) return '';

  // SVG circular gauge
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (health.score / 100) * circumference;

  const componentsHtml = health.components.map(c => `
    <div class="budget-health__component">
      <div class="budget-health__component-header">
        <span class="budget-health__component-label">${c.label}</span>
        <span class="budget-health__component-score">${c.score}<span class="budget-health__component-max">/100</span></span>
      </div>
      <div class="budget-health__component-bar">
        <div class="budget-health__component-fill" style="width: ${c.score}%; background: ${c.score >= 80 ? '#30D158' : c.score >= 60 ? '#E5A823' : '#FF453A'}"></div>
      </div>
      <div class="budget-health__component-detail">
        <span>${c.detail}</span>
        <span class="text-dim">Target: ${c.ideal}</span>
      </div>
    </div>
  `).join('');

  const suggestionsHtml = health.grade !== 'A' && health.suggestions.length > 0
    ? `
      <div class="budget-health__suggestions">
        <h4 class="budget-health__suggestions-title">How to Improve Your Score</h4>
        <ul class="budget-health__suggestions-list">
          ${health.suggestions.map(s => `
            <li class="budget-health__suggestion">
              <span class="budget-health__suggestion-points">+${s.points} pts</span>
              <span class="budget-health__suggestion-text">${s.text}</span>
              ${s.tabLink ? `<button class="budget-health__suggestion-link" onclick="if(typeof DashboardTabs!=='undefined')DashboardTabs.switchTab('${s.tabLink}')">Go to ${s.tabLink}</button>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '';

  return `
    <div class="budget-health card" role="region" aria-label="Budget Health Score">
      <div class="budget-health__hero">
        <div class="budget-health__gauge">
          <svg viewBox="0 0 120 120" class="budget-health__svg" aria-hidden="true">
            <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#2C2C2E" stroke-width="8"/>
            <circle cx="60" cy="60" r="${radius}"
              fill="none" stroke="${health.gradeColor}" stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${dashOffset}"
              transform="rotate(-90 60 60)"
              class="budget-health__gauge-fill"/>
          </svg>
          <div class="budget-health__grade" style="color: ${health.gradeColor}">
            <span class="budget-health__grade-letter">${health.grade}</span>
            <span class="budget-health__grade-score">${health.score}/100</span>
          </div>
          <span class="sr-only">Budget Health Score: ${health.grade} (${health.score} out of 100)</span>
        </div>
        <div class="budget-health__summary">
          <h3 class="budget-health__title">Budget Health Score</h3>
          <p class="budget-health__subtitle text-secondary">
            ${health.grade === 'A' ? 'Excellent! Your budget fundamentals are strong.' :
              health.grade === 'B' ? 'Good shape. A few adjustments could take you further.' :
              health.grade === 'C' ? 'Room for improvement. Focus on the suggestions below.' :
              'Needs attention. Start with the highest-impact suggestions below.'}
          </p>
        </div>
      </div>

      <div class="budget-health__components">
        ${componentsHtml}
      </div>

      ${suggestionsHtml}

      <p class="budget-disclaimer">
        This score is for educational purposes only and does not constitute financial advice.
        Individual circumstances vary. Consult a qualified financial professional for personalized guidance.
      </p>
    </div>
  `;
}

// ===========================
// CASH FLOW WATERFALL
// ===========================

/**
 * Render waterfall chart container
 * @param {Object} snapshot
 * @returns {string} HTML
 */
function renderBudgetWaterfall(snapshot) {
  if (!snapshot || !snapshot.general.annualIncome) return '';

  return `
    <div class="budget-waterfall card" role="region" aria-label="Cash Flow Waterfall">
      <h3 class="panel-header">Where Your Money Goes</h3>
      <p class="text-secondary text-sm" style="margin-bottom: 1rem;">Monthly cash flow from income to savings</p>
      <div class="budget-waterfall__container">
        <canvas id="budgetWaterfallChart"></canvas>
      </div>
    </div>
  `;
}

// ===========================
// EXPENSE CATEGORY ESTIMATOR
// ===========================

/**
 * Render expense category slider cards
 * @param {Object} snapshot
 * @returns {string} HTML
 */
function renderExpenseCategoryEstimator(snapshot) {
  if (!snapshot) return '';

  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const categories = snapshot.expenseCategories || {};
  const totalAllocated = Object.values(categories).reduce((sum, v) => sum + (v || 0), 0);
  const unallocated = Math.max(0, monthlyExpense - totalAllocated);
  const hasData = totalAllocated > 0;

  // Determine open state
  const detailsOpen = hasData ? 'open' : '';

  const categoryKeys = Object.keys(EXPENSE_CATEGORIES);
  // Group: needs first, then wants
  const needs = categoryKeys.filter(k => EXPENSE_CATEGORIES[k].budgetType === 'need');
  const wants = categoryKeys.filter(k => EXPENSE_CATEGORIES[k].budgetType === 'want');

  const renderSliderCard = (key) => {
    const meta = EXPENSE_CATEGORIES[key];
    const value = categories[key] || 0;
    const pct = monthlyExpense > 0 ? Math.round((value / monthlyExpense) * 100) : 0;
    const maxVal = Math.max(monthlyExpense, 1);

    return `
      <div class="expense-card" data-category="${key}">
        <div class="expense-card__header">
          <span class="expense-card__icon" aria-hidden="true">${meta.icon}</span>
          <span class="expense-card__label">${meta.label}</span>
          <span class="expense-card__badge expense-card__badge--${meta.budgetType}">${meta.budgetType === 'need' ? 'Need' : 'Want'}</span>
        </div>
        <input type="range" class="expense-slider"
          min="0" max="${maxVal}" step="25" value="${value}"
          data-category="${key}"
          aria-label="${meta.label} monthly amount"
          aria-valuenow="${value}"
          ${monthlyExpense <= 0 ? 'disabled' : ''}>
        <div class="expense-card__values">
          <span class="expense-card__amount" data-amount-for="${key}">$${value.toLocaleString()}</span>
          <span class="expense-card__pct" data-pct-for="${key}">${pct}%</span>
        </div>
      </div>
    `;
  };

  return `
    <details class="expense-estimator" ${detailsOpen} data-details-key="expenseEstimator">
      <summary class="expense-estimator__summary">
        <h3 class="panel-header" style="display:inline; border:none; padding:0;">Expense Breakdown</h3>
        <span class="expense-estimator__badge ${unallocated > 0 ? 'expense-estimator__badge--warn' : 'expense-estimator__badge--ok'}">
          ${hasData
            ? (unallocated > 0 ? `$${unallocated.toLocaleString()} unallocated` : 'Fully allocated')
            : 'Not set'}
        </span>
      </summary>

      <div class="expense-estimator__content">
        ${monthlyExpense <= 0
          ? '<p class="text-secondary text-sm">Enter your monthly expenses above to enable the breakdown.</p>'
          : `
            <div class="expense-estimator__bar">
              <div class="expense-estimator__bar-fill" style="width: ${monthlyExpense > 0 ? Math.min(100, (totalAllocated / monthlyExpense) * 100) : 0}%"></div>
              <span class="expense-estimator__bar-label">
                $${totalAllocated.toLocaleString()} of $${monthlyExpense.toLocaleString()} allocated
              </span>
            </div>

            <div class="expense-card-grid">
              <div class="expense-card-group">
                <h4 class="expense-card-group__title text-secondary">Needs</h4>
                ${needs.map(renderSliderCard).join('')}
              </div>
              <div class="expense-card-group">
                <h4 class="expense-card-group__title text-secondary">Wants</h4>
                ${wants.map(renderSliderCard).join('')}
              </div>
            </div>

            <p class="budget-disclaimer">
              This breakdown is for your self-assessment. Actual spending categories may overlap.
            </p>
          `}
      </div>
    </details>
  `;
}

// ===========================
// 50/30/20 RULE ANALYZER
// ===========================

/**
 * Render 50/30/20 rule analysis
 * @param {Object} snapshot
 * @param {Object} metrics
 * @returns {string} HTML
 */
function render503020Analyzer(snapshot, metrics) {
  if (!snapshot || !metrics) return '';

  const rule = typeof calculate503020 === 'function'
    ? calculate503020(snapshot, metrics)
    : null;

  if (!rule) return '';

  const detailsOpen = rule.hasData ? 'open' : '';

  const renderBucket = (label, data, color) => {
    const overUnder = data.diff > 0 ? 'over' : data.diff < 0 ? 'under' : 'on-target';
    const diffText = data.diff === 0 ? 'On target'
      : data.diff > 0 ? `${Math.abs(data.diff)}% over`
      : `${Math.abs(data.diff)}% under`;
    return `
      <div class="rule-503020__bucket">
        <div class="rule-503020__bucket-header">
          <span class="rule-503020__bucket-label">${label}</span>
          <span class="rule-503020__bucket-target">Target: ${data.target}%</span>
        </div>
        <div class="rule-503020__bucket-bar">
          <div class="rule-503020__bucket-fill" style="width: ${Math.min(100, Math.max(0, data.pct))}%; background: ${color}"></div>
        </div>
        <div class="rule-503020__bucket-values">
          <span class="rule-503020__bucket-pct" style="color: ${color}">${data.pct}%</span>
          <span class="rule-503020__bucket-amount">$${data.amount.toLocaleString()}/mo</span>
          <span class="rule-503020__bucket-diff rule-503020__bucket-diff--${overUnder}">${diffText}</span>
        </div>
      </div>
    `;
  };

  const needsColor = '#6366F1';
  const wantsColor = '#F59E0B';
  const savingsColor = '#30D158';

  // Stacked bar widths
  const totalPct = Math.max(1, rule.needs.pct + rule.wants.pct + rule.savings.pct);
  const needsWidth = (rule.needs.pct / totalPct) * 100;
  const wantsWidth = (rule.wants.pct / totalPct) * 100;
  const savingsWidth = (rule.savings.pct / totalPct) * 100;

  return `
    <details class="rule-503020" ${detailsOpen} data-details-key="rule503020">
      <summary class="rule-503020__summary">
        <h3 class="panel-header" style="display:inline; border:none; padding:0;">50/30/20 Budget Analysis</h3>
        ${rule.hasData
          ? `<span class="rule-503020__badge">${rule.needs.pct}/${rule.wants.pct}/${rule.savings.pct}</span>`
          : '<span class="rule-503020__badge rule-503020__badge--empty">Fill in expenses above</span>'}
      </summary>

      <div class="rule-503020__content">
        ${!rule.hasData
          ? '<p class="text-secondary text-sm">Fill in the expense breakdown above to see your 50/30/20 analysis.</p>'
          : `
            <!-- Stacked bar -->
            <div class="rule-503020__stacked-bar" role="img" aria-label="Budget split: ${rule.needs.pct}% needs, ${rule.wants.pct}% wants, ${rule.savings.pct}% savings">
              <div class="rule-503020__segment" style="width: ${needsWidth}%; background: ${needsColor}">
                ${needsWidth > 10 ? `<span>${rule.needs.pct}%</span>` : ''}
              </div>
              <div class="rule-503020__segment" style="width: ${wantsWidth}%; background: ${wantsColor}">
                ${wantsWidth > 10 ? `<span>${rule.wants.pct}%</span>` : ''}
              </div>
              <div class="rule-503020__segment" style="width: ${savingsWidth}%; background: ${savingsColor}">
                ${savingsWidth > 10 ? `<span>${rule.savings.pct}%</span>` : ''}
              </div>
            </div>

            <!-- Target reference line -->
            <div class="rule-503020__target-bar" aria-hidden="true">
              <div class="rule-503020__target-segment" style="width: 50%"><span>50%</span></div>
              <div class="rule-503020__target-segment" style="width: 30%"><span>30%</span></div>
              <div class="rule-503020__target-segment" style="width: 20%"><span>20%</span></div>
            </div>
            <div class="rule-503020__target-labels" aria-hidden="true">
              <span>Ideal</span>
            </div>

            <!-- Buckets -->
            <div class="rule-503020__buckets">
              ${renderBucket('Needs', rule.needs, needsColor)}
              ${renderBucket('Wants', rule.wants, wantsColor)}
              ${renderBucket('Savings', rule.savings, savingsColor)}
            </div>
          `}

        <details class="rule-503020__explainer">
          <summary class="text-secondary text-sm">What is the 50/30/20 rule?</summary>
          <p class="text-secondary text-sm" style="margin-top: 0.5rem; line-height: 1.6;">
            The 50/30/20 guideline suggests allocating 50% of after-tax income to needs (housing, food, utilities),
            30% to wants (entertainment, dining out), and 20% to savings and debt repayment.
            It's a starting framework — your ideal split depends on your goals and circumstances.
          </p>
        </details>

        <p class="budget-disclaimer">
          The 50/30/20 rule is a general guideline for educational purposes.
          Individual financial situations vary. Consult a financial professional for personalized budgeting advice.
        </p>
      </div>
    </details>
  `;
}

// ===========================
// CHART INITIALIZATION
// ===========================

/**
 * Initialize the waterfall Chart.js bar chart
 */
function initBudgetCharts() {
  const canvas = document.getElementById('budgetWaterfallChart');
  if (!canvas) return;

  // Destroy previous instance
  if (waterfallChartInstance) {
    waterfallChartInstance.destroy();
    waterfallChartInstance = null;
  }

  const { snapshot } = typeof getState === 'function' ? getState() : { snapshot: null };
  if (!snapshot || !snapshot.general.annualIncome) return;

  const cashFlow = typeof calculateCashFlow === 'function'
    ? calculateCashFlow(snapshot)
    : null;

  if (!cashFlow) return;

  const chartData = typeof buildWaterfallChartData === 'function'
    ? buildWaterfallChartData(cashFlow)
    : null;

  if (!chartData) return;

  const ctx = canvas.getContext('2d');

  waterfallChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: [{
        data: chartData.data,
        backgroundColor: chartData.colors,
        borderColor: chartData.colors.map(c => c),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) => {
              const info = chartData.tooltipData[item.dataIndex];
              if (!info) return '';
              const sign = info.isPositive ? '' : '-';
              return [
                `${sign}$${Math.round(info.amount).toLocaleString()}/month`,
                `${info.percentage}% of gross income`,
              ];
            },
          },
          backgroundColor: '#1C1C1F',
          titleColor: '#FFFFFF',
          bodyColor: '#8E8E93',
          borderColor: '#2C2C2E',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#8E8E93',
            font: { size: 11 },
            maxRotation: 45,
            minRotation: 0,
          },
          border: { display: false },
        },
        y: {
          grid: {
            color: 'rgba(255,255,255,0.05)',
            drawTicks: false,
          },
          ticks: {
            color: '#8E8E93',
            font: { size: 11 },
            callback: (val) => {
              if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
              return '$' + val;
            },
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });
}

// ===========================
// SLIDER INITIALIZATION
// ===========================

/**
 * Initialize expense slider event delegation
 */
function initExpenseSliders() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (!dashboardContent || dashboardContent._expenseSliderInit) return;

  dashboardContent._expenseSliderInit = true;

  // Restore collapsible details state
  restoreDetailsState();

  // Save details state on toggle
  dashboardContent.addEventListener('toggle', (e) => {
    if (e.target.matches('[data-details-key]')) {
      saveDetailsState();
    }
  }, true);

  // Slider input event (live update during drag)
  dashboardContent.addEventListener('input', (e) => {
    if (!e.target.matches('.expense-slider')) return;

    const category = e.target.dataset.category;
    const value = parseInt(e.target.value) || 0;
    const { snapshot } = getState();
    const monthlyExpense = snapshot.general.monthlyExpense || 0;

    // Update dollar amount display
    const amountEl = dashboardContent.querySelector(`[data-amount-for="${category}"]`);
    if (amountEl) amountEl.textContent = '$' + value.toLocaleString();

    // Update percentage display
    const pctEl = dashboardContent.querySelector(`[data-pct-for="${category}"]`);
    if (pctEl) {
      const pct = monthlyExpense > 0 ? Math.round((value / monthlyExpense) * 100) : 0;
      pctEl.textContent = pct + '%';
    }

    // Update aria
    e.target.setAttribute('aria-valuenow', value);

    // Update summary bar
    updateAllocationBar(dashboardContent, snapshot, category, value);
  });

  // Slider change event (persist on release)
  dashboardContent.addEventListener('change', (e) => {
    if (!e.target.matches('.expense-slider')) return;

    const category = e.target.dataset.category;
    const value = parseInt(e.target.value) || 0;

    // Persist to state (no render)
    if (typeof updateExpenseCategories === 'function') {
      updateExpenseCategories({ [category]: value });
    }

    // Update 50/30/20 display if open
    update503020Display();
  });
}

/**
 * Update the allocation summary bar during slider drag
 */
function updateAllocationBar(container, snapshot, changedCategory, changedValue) {
  const categories = { ...(snapshot.expenseCategories || {}) };
  categories[changedCategory] = changedValue;

  const totalAllocated = Object.values(categories).reduce((sum, v) => sum + (v || 0), 0);
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const unallocated = Math.max(0, monthlyExpense - totalAllocated);

  const fillEl = container.querySelector('.expense-estimator__bar-fill');
  if (fillEl) {
    fillEl.style.width = monthlyExpense > 0 ? Math.min(100, (totalAllocated / monthlyExpense) * 100) + '%' : '0%';
  }

  const labelEl = container.querySelector('.expense-estimator__bar-label');
  if (labelEl) {
    labelEl.textContent = `$${totalAllocated.toLocaleString()} of $${monthlyExpense.toLocaleString()} allocated`;
  }

  const badgeEl = container.querySelector('.expense-estimator__badge');
  if (badgeEl) {
    if (totalAllocated > 0) {
      badgeEl.textContent = unallocated > 0 ? `$${unallocated.toLocaleString()} unallocated` : 'Fully allocated';
      badgeEl.className = 'expense-estimator__badge ' + (unallocated > 0 ? 'expense-estimator__badge--warn' : 'expense-estimator__badge--ok');
    } else {
      badgeEl.textContent = 'Not set';
      badgeEl.className = 'expense-estimator__badge';
    }
  }
}

/**
 * Update the 50/30/20 display when sliders change (without full re-render)
 */
function update503020Display() {
  const container = document.querySelector('.rule-503020__content');
  if (!container) return;

  // Re-render the 50/30/20 section content
  const { snapshot } = getState();
  const metrics = typeof calculateMetrics === 'function' ? calculateMetrics(snapshot) : null;
  if (!metrics) return;

  const rule = calculate503020(snapshot, metrics);
  if (!rule || !rule.hasData) return;

  // Update stacked bar segments
  const totalPct = Math.max(1, rule.needs.pct + rule.wants.pct + rule.savings.pct);
  const segments = container.querySelectorAll('.rule-503020__stacked-bar .rule-503020__segment');
  if (segments.length === 3) {
    const widths = [
      (rule.needs.pct / totalPct) * 100,
      (rule.wants.pct / totalPct) * 100,
      (rule.savings.pct / totalPct) * 100,
    ];
    const pcts = [rule.needs.pct, rule.wants.pct, rule.savings.pct];
    segments.forEach((seg, i) => {
      seg.style.width = widths[i] + '%';
      const span = seg.querySelector('span');
      if (span) span.textContent = widths[i] > 10 ? pcts[i] + '%' : '';
    });
  }

  // Update bucket values
  const buckets = container.querySelectorAll('.rule-503020__bucket');
  const bucketData = [rule.needs, rule.wants, rule.savings];
  buckets.forEach((bucket, i) => {
    const data = bucketData[i];
    if (!data) return;
    const fill = bucket.querySelector('.rule-503020__bucket-fill');
    if (fill) fill.style.width = Math.min(100, Math.max(0, data.pct)) + '%';
    const pctEl = bucket.querySelector('.rule-503020__bucket-pct');
    if (pctEl) pctEl.textContent = data.pct + '%';
    const amtEl = bucket.querySelector('.rule-503020__bucket-amount');
    if (amtEl) amtEl.textContent = '$' + data.amount.toLocaleString() + '/mo';
    const diffEl = bucket.querySelector('.rule-503020__bucket-diff');
    if (diffEl) {
      const overUnder = data.diff > 0 ? 'over' : data.diff < 0 ? 'under' : 'on-target';
      diffEl.textContent = data.diff === 0 ? 'On target' : data.diff > 0 ? `${Math.abs(data.diff)}% over` : `${Math.abs(data.diff)}% under`;
      diffEl.className = `rule-503020__bucket-diff rule-503020__bucket-diff--${overUnder}`;
    }
  });

  // Update badge in summary
  const badge = document.querySelector('.rule-503020__badge');
  if (badge && rule.hasData) {
    badge.textContent = `${rule.needs.pct}/${rule.wants.pct}/${rule.savings.pct}`;
    badge.classList.remove('rule-503020__badge--empty');
  }
}

// ===========================
// DETAILS STATE PERSISTENCE
// ===========================

const DETAILS_STATE_KEY = 'financialGPS_detailsState';

function saveDetailsState() {
  const state = {};
  document.querySelectorAll('[data-details-key]').forEach(el => {
    state[el.dataset.detailsKey] = el.open;
  });
  try {
    sessionStorage.setItem(DETAILS_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

function restoreDetailsState() {
  try {
    const saved = sessionStorage.getItem(DETAILS_STATE_KEY);
    if (!saved) return;
    const state = JSON.parse(saved);
    Object.entries(state).forEach(([key, isOpen]) => {
      const el = document.querySelector(`[data-details-key="${key}"]`);
      if (el) el.open = isOpen;
    });
  } catch (e) { /* ignore */ }
}

// Expose globally
window.renderBudgetHealthScore = renderBudgetHealthScore;
window.renderBudgetWaterfall = renderBudgetWaterfall;
window.renderExpenseCategoryEstimator = renderExpenseCategoryEstimator;
window.render503020Analyzer = render503020Analyzer;
window.initBudgetCharts = initBudgetCharts;
window.initExpenseSliders = initExpenseSliders;
