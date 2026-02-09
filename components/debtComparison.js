/**
 * debtComparison.js
 * Debt Tab Component - Overview, Paydown Strategy, Tips, and Visualizations
 *
 * ACCESSIBILITY: WCAG 2.1 AA compliant
 * - Semantic HTML structure with proper table markup
 * - Keyboard navigable strategy controls
 * - Screen reader friendly with ARIA labels
 * - Minimum 4.5:1 contrast ratios
 *
 * SECURITY: All user input sanitized, XSS prevention via escapeHtml
 * COMPLIANCE: Financial disclaimers included
 */

// ===========================
// DEBT TAB COMPONENT
// ===========================

// Chart instances (for cleanup)
let debtBalanceChartInstance = null;
let debtIndividualChartInstance = null;

// Chart color palette for individual debts
const DEBT_CHART_COLORS = [
  '#EF4444', // Red - Credit Card / high interest
  '#F59E0B', // Amber - Medical
  '#6366F1', // Indigo - Student
  '#06B6D4', // Cyan - Auto
  '#F97316', // Orange - Mortgage
  '#8B5CF6', // Purple - Other
];

// Priority labels for procedural stack
const DEBT_PRIORITY_LABELS = ['FOCUS NOW', 'NEXT', 'THEN'];

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get friendly label for debt category
 * @param {string} category - Debt category code
 * @returns {string} Friendly label
 */
function getDebtCategoryLabel(category) {
  const labels = {
    CREDIT_CARD: 'Credit Card',
    MEDICAL: 'Medical Debt',
    STUDENT: 'Student Loans',
    AUTO: 'Auto Loan',
    MORTGAGE: 'Mortgage',
    OTHER: 'Other Debt'
  };
  return labels[category] || 'Debt';
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatDebtCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDebtDate(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return 'N/A';
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Compute extra payment from aggressiveness percentage and cash flow
 */
function computeExtraPayment(debtSettings, monthlyCashFlow) {
  const aggressiveness = Math.max(0, Math.min(100, Number(debtSettings.aggressiveness) || 0));
  return Math.round(monthlyCashFlow * (aggressiveness / 100));
}

// ===========================
// INTERACTIVE HANDLERS
// ===========================

/**
 * Handle debt strategy selection - updates store and re-renders
 * @param {string} method - 'avalanche' or 'snowball'
 */
function selectDebtStrategy(method) {
  if (method !== 'avalanche' && method !== 'snowball') return;
  updateDebtSettings({ preferredStrategy: method });
}

/**
 * Toggle between avalanche and snowball methods
 */
function toggleDebtMethod() {
  const current = (getState().snapshot.debtSettings || {}).preferredStrategy || 'avalanche';
  updateDebtSettings({ preferredStrategy: current === 'avalanche' ? 'snowball' : 'avalanche' });
}

// Debounce timer for slider
let _aggrDebounceTimer = null;

/**
 * Handle aggressiveness slider change
 * @param {number} value - 0 to 100
 */
function handleAggressivenessChange(value) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

  // Update the displayed amount immediately (no re-render)
  const snapshot = getState().snapshot;
  const monthlyCashFlow = Math.max(0,
    (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0));
  const extraAmt = Math.round(monthlyCashFlow * (clamped / 100));

  const amountEl = document.getElementById('debt-aggr-amount');
  if (amountEl) amountEl.textContent = formatDebtCurrency(extraAmt) + '/mo extra';
  const pctEl = document.getElementById('debt-aggr-pct');
  if (pctEl) pctEl.textContent = clamped + '%';

  // Debounce the full re-render
  clearTimeout(_aggrDebounceTimer);
  _aggrDebounceTimer = setTimeout(() => {
    updateDebtSettings({ aggressiveness: clamped });
  }, 250);
}

/**
 * Restore slider and toggle state after re-render
 */
function restoreDebtControls() {
  const snapshot = getState().snapshot;
  const debtSettings = snapshot.debtSettings || {};
  const slider = document.getElementById('debt-aggr-slider');
  if (slider) {
    slider.value = debtSettings.aggressiveness ?? 100;
  }
}

// ===========================
// MAIN RENDER FUNCTION
// ===========================

/**
 * Render the full Debt Tab
 * @param {Object} snapshot - Current financial snapshot from store
 * @returns {string} HTML string for the entire debts panel
 */
function renderDebtTab(snapshot) {
  if (!snapshot || !snapshot.debts || !snapshot.general) return '';

  // Render debt input section (from debtInput.js)
  const debtInputHtml = typeof renderDebtInputSection === 'function'
    ? renderDebtInputSection(snapshot)
    : '';

  const activeDebts = snapshot.debts.filter(d => d.balance > 0);
  if (activeDebts.length === 0) {
    return renderNoDebtsState(debtInputHtml);
  }

  const debtSettings = snapshot.debtSettings || {};
  const monthlyTakeHome = Number(snapshot.general.monthlyTakeHome) || 0;
  const monthlyExpense = Number(snapshot.general.monthlyExpense) || 0;
  const monthlyCashFlow = Math.max(0, monthlyTakeHome - monthlyExpense);

  // Compute extra payment from aggressiveness percentage
  const extraPayment = computeExtraPayment(debtSettings, monthlyCashFlow);
  const strategy = debtSettings.preferredStrategy || 'avalanche';

  // Run simulation with the user's chosen extra payment
  const comparison = window.compareDebtStrategies(snapshot.debts, extraPayment);

  // Schedule control restoration after DOM render
  setTimeout(restoreDebtControls, 0);

  return `
    <div class="debt-tab-container" role="region" aria-labelledby="debt-tab-title">

      ${debtInputHtml}

      ${renderDebtOverviewTable(activeDebts)}

      ${renderDebtPaydownStrategy(snapshot, monthlyCashFlow, extraPayment, strategy, comparison)}

      ${renderDebtTips()}

      ${renderDebtVisualizations(comparison, strategy)}

      ${renderDebtDisclaimer()}
    </div>
  `;
}

// ===========================
// SECTION 1: DEBT OVERVIEW TABLE
// ===========================

/**
 * Render debt overview table with annual breakdowns
 * @param {Array} activeDebts - Debts with balance > 0
 * @returns {string} HTML string
 */
function renderDebtOverviewTable(activeDebts) {
  const rows = activeDebts.map(debt => {
    const breakdown = calculateDebtAnnualBreakdown(debt);
    return { debt, breakdown };
  });

  const totalBalance = rows.reduce((s, r) => s + r.debt.balance, 0);
  const totalAnnualInterest = rows.reduce((s, r) => s + r.breakdown.annualInterest, 0);
  const totalAnnualPrincipal = rows.reduce((s, r) => s + r.breakdown.annualPrincipal, 0);
  const totalMonthlyPayment = rows.reduce((s, r) => s + r.breakdown.monthlyPayment, 0);

  return `
    <div class="debt-overview-section" role="region" aria-labelledby="debt-overview-title">
      <h3 id="debt-overview-title" class="debt-section-title">Debt Overview</h3>
      <div class="debt-table-wrapper">
        <table class="debt-overview-table" role="table" aria-label="Outstanding debts summary">
          <thead>
            <tr>
              <th scope="col">Debt</th>
              <th scope="col" class="text-right">Balance</th>
              <th scope="col" class="text-right">Rate</th>
              <th scope="col" class="text-right">Annual Interest</th>
              <th scope="col" class="text-right">Annual Principal</th>
              <th scope="col" class="text-right">Monthly Payment</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ debt, breakdown }) => `
              <tr>
                <td>${escapeHtml(getDebtCategoryLabel(debt.category))}</td>
                <td class="text-right">${formatDebtCurrency(debt.balance)}</td>
                <td class="text-right">${(Number(debt.interestRate) || 0).toFixed(1)}%</td>
                <td class="text-right debt-interest-cost">${formatDebtCurrency(breakdown.annualInterest)}</td>
                <td class="text-right">${formatDebtCurrency(breakdown.annualPrincipal)}</td>
                <td class="text-right">${formatDebtCurrency(breakdown.monthlyPayment)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="debt-overview-totals">
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>${formatDebtCurrency(totalBalance)}</strong></td>
              <td class="text-right">--</td>
              <td class="text-right debt-interest-cost"><strong>${formatDebtCurrency(totalAnnualInterest)}</strong></td>
              <td class="text-right"><strong>${formatDebtCurrency(totalAnnualPrincipal)}</strong></td>
              <td class="text-right"><strong>${formatDebtCurrency(totalMonthlyPayment)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

// ===========================
// SECTION 2: DEBT PAYDOWN STRATEGY
// ===========================

/**
 * Render debt paydown strategy section with aggressiveness slider,
 * method toggle, summary stats, and procedural paydown stack
 */
function renderDebtPaydownStrategy(snapshot, monthlyCashFlow, extraPayment, strategy, comparison) {
  const debtSettings = snapshot.debtSettings || {};
  const aggressiveness = Math.max(0, Math.min(100, Number(debtSettings.aggressiveness) || 0));

  const hasComparison = comparison !== null;
  const avalanche = hasComparison ? comparison.avalanche : null;
  const snowball = hasComparison ? comparison.snowball : null;
  const comp = hasComparison ? comparison.comparison : null;
  const selectedResult = strategy === 'avalanche' ? avalanche : snowball;
  const activeDebtCount = comp ? comp.activeDebtCount : 0;

  // Run minimum-only simulation for savings comparison
  let minOnlyInterest = 0;
  if (hasComparison && selectedResult) {
    const minOnlyComparison = window.compareDebtStrategies(snapshot.debts, 0);
    if (minOnlyComparison) {
      const minOnlyResult = strategy === 'avalanche' ? minOnlyComparison.avalanche : minOnlyComparison.snowball;
      minOnlyInterest = minOnlyResult.totalInterestPaid;
    }
  }
  const interestSavings = hasComparison && selectedResult
    ? Math.max(0, minOnlyInterest - selectedResult.totalInterestPaid)
    : 0;

  return `
    <div class="debt-strategy-section" role="region" aria-labelledby="debt-strategy-title">
      <h3 id="debt-strategy-title" class="debt-section-title">Debt Paydown Strategy</h3>

      <!-- Control Bar: Slider + Toggle -->
      <div class="debt-control-bar">
        <div class="debt-control-bar__row">
          <!-- Aggressiveness Slider -->
          <div class="debt-aggr-slider" role="group" aria-labelledby="debt-aggr-label">
            <label id="debt-aggr-label" class="debt-aggr-slider__label">How aggressively do you want to pay down debt?</label>
            <input type="range"
              id="debt-aggr-slider"
              class="debt-aggr-slider__input"
              min="0" max="100" step="5"
              value="${aggressiveness}"
              oninput="handleAggressivenessChange(this.value)"
              aria-label="Debt paydown aggressiveness: ${aggressiveness}% of surplus cash flow"
              aria-valuemin="0" aria-valuemax="100" aria-valuenow="${aggressiveness}"
            >
            <div class="debt-aggr-slider__labels">
              <span class="debt-aggr-slider__min">0%</span>
              <span class="debt-aggr-slider__current" id="debt-aggr-pct">${aggressiveness}%</span>
              <span class="debt-aggr-slider__max">100%</span>
            </div>
            <div class="debt-aggr-slider__amount" id="debt-aggr-amount">
              ${formatDebtCurrency(extraPayment)}/mo extra
            </div>
            <div class="debt-aggr-slider__cashflow">
              Monthly surplus: ${formatDebtCurrency(monthlyCashFlow)}
            </div>
          </div>

          ${activeDebtCount >= 2 ? `
            <!-- Method Toggle -->
            <div class="debt-method-toggle" role="group" aria-label="Debt payoff method">
              <button type="button"
                class="debt-method-toggle__btn ${strategy === 'avalanche' ? 'debt-method-toggle__btn--active' : ''}"
                onclick="selectDebtStrategy('avalanche')"
                aria-pressed="${strategy === 'avalanche' ? 'true' : 'false'}"
                title="Pay highest interest rate first - saves the most money">
                Avalanche
              </button>
              <button type="button"
                class="debt-method-toggle__btn ${strategy === 'snowball' ? 'debt-method-toggle__btn--active' : ''}"
                onclick="selectDebtStrategy('snowball')"
                aria-pressed="${strategy === 'snowball' ? 'true' : 'false'}"
                title="Pay smallest balance first - builds momentum with quick wins">
                Snowball
              </button>
            </div>
          ` : ''}
        </div>

        ${hasComparison && selectedResult ? `
          <!-- Summary Stats -->
          <div class="debt-summary-row">
            <div class="debt-summary-card">
              <span class="debt-summary-card__value">${formatDebtCurrency(selectedResult.totalInterestPaid)}</span>
              <span class="debt-summary-card__label">Est. Total Interest</span>
            </div>
            <div class="debt-summary-card">
              <span class="debt-summary-card__value">${selectedResult.monthsToPayoff} mo</span>
              <span class="debt-summary-card__label">Timeline</span>
            </div>
            <div class="debt-summary-card">
              <span class="debt-summary-card__value debt-summary-card__value--gold">${formatDebtDate(selectedResult.debtFreeDate)}</span>
              <span class="debt-summary-card__label">Debt-Free Date</span>
            </div>
          </div>

          ${comp && comp.interestSavings > 0 && activeDebtCount >= 2 ? `
            <div class="debt-savings-banner" role="status">
              Avalanche could potentially save ${formatDebtCurrency(comp.interestSavings)} in interest
              vs. Snowball
            </div>
          ` : ''}
        ` : ''}
      </div>

      ${hasComparison && selectedResult ? renderProceduralStack(selectedResult, strategy, extraPayment, interestSavings) : `
        <div class="debt-single-info">
          <p>Add your debt information above to see payoff strategy comparisons.</p>
        </div>
      `}
    </div>
  `;
}

/**
 * Render the procedural paydown stack showing debts in payoff order
 */
function renderProceduralStack(selectedResult, strategy, extraPayment, interestSavings) {
  const milestones = selectedResult.paidOffMilestones || [];
  const totalMonths = selectedResult.monthsToPayoff;

  if (milestones.length === 0) return '';

  // Build cumulative freed payment for cascade display
  let cumulativeFreed = 0;

  const cards = milestones.map((milestone, idx) => {
    const priorityLabel = DEBT_PRIORITY_LABELS[idx] || '';
    const priorityNum = idx + 1;
    const isFocus = idx === 0;
    const color = DEBT_CHART_COLORS[idx % DEBT_CHART_COLORS.length];

    // Calculate min payment for this debt
    const minPayment = milestone.freedMonthlyPayment || 0;

    // For the first debt, show extra payment breakdown
    // For subsequent debts, they receive cascade payments
    let paymentText = '';
    if (isFocus && extraPayment > 0) {
      const totalPayment = minPayment + extraPayment + cumulativeFreed;
      paymentText = `${formatDebtCurrency(minPayment)}/mo min + ${formatDebtCurrency(extraPayment + cumulativeFreed)}/mo extra = ${formatDebtCurrency(totalPayment)}/mo`;
    } else if (isFocus) {
      paymentText = `${formatDebtCurrency(minPayment)}/mo (minimum payments only)`;
    } else {
      paymentText = `${formatDebtCurrency(minPayment)}/mo min + cascade payments`;
    }

    // Timeline progress: what fraction of total payoff time does this debt take?
    const progressPct = totalMonths > 0 ? Math.round((milestone.month / totalMonths) * 100) : 0;

    // Payoff date
    const now = new Date();
    const payoffDate = new Date(now.getFullYear(), now.getMonth() + milestone.month, now.getDate());

    const card = `
      <div class="debt-stack__item">
        <div class="debt-stack__card ${isFocus ? 'debt-stack__card--focus' : ''}" style="border-left-color: ${color};">
          <div class="debt-stack__priority-row">
            <span class="debt-stack__priority" style="background: ${color};">${priorityNum}</span>
            ${priorityLabel ? `<span class="debt-stack__priority-label">${escapeHtml(priorityLabel)}</span>` : ''}
          </div>
          <div class="debt-stack__header">
            <span class="debt-stack__name">${escapeHtml(getDebtCategoryLabel(milestone.debtName))}</span>
            <span class="debt-stack__details">${formatDebtCurrency(milestone.balance)} @ ${escapeHtml(String(getDebtRate(milestone.debtName)))}</span>
          </div>
          <div class="debt-stack__progress">
            <div class="debt-stack__progress-bar" style="width: ${progressPct}%; background: ${color};"></div>
          </div>
          <div class="debt-stack__payment">${paymentText}</div>
          <div class="debt-stack__payoff">
            Paid off: Month ${milestone.month} (${formatDebtDate(payoffDate)})
          </div>
        </div>
        ${idx < milestones.length - 1 ? `
          <div class="debt-stack__connector">
            <div class="debt-stack__connector-line"></div>
            <div class="debt-stack__cascade">+${formatDebtCurrency(minPayment)}/mo freed up</div>
          </div>
        ` : ''}
      </div>
    `;

    cumulativeFreed += minPayment;
    return card;
  }).join('');

  return `
    <div class="debt-stack" aria-label="Debt payoff order using ${strategy} method">
      ${cards}

      <!-- Debt Free Card -->
      <div class="debt-stack__debtfree">
        <div class="debt-stack__debtfree-title">DEBT FREE: ${formatDebtDate(selectedResult.debtFreeDate)}</div>
        <div class="debt-stack__debtfree-stats">
          <span>Est. total interest: ${formatDebtCurrency(selectedResult.totalInterestPaid)}</span>
          ${interestSavings > 0 ? `
            <span class="debt-stack__debtfree-savings">
              Estimated savings of ${formatDebtCurrency(interestSavings)} vs. minimum payments only
            </span>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Get the interest rate for a debt by category from current state
 */
function getDebtRate(category) {
  const snapshot = getState().snapshot;
  const debt = snapshot.debts.find(d => d.category === category && d.balance > 0);
  if (debt) return (Number(debt.interestRate) || 0).toFixed(1) + '%';
  return '0.0%';
}

// ===========================
// SECTION 3: TIPS & TRICKS
// ===========================

/**
 * Render collapsible tips and tricks section
 * @returns {string} HTML string
 */
function renderDebtTips() {
  return `
    <div class="debt-tips-section" role="region" aria-labelledby="debt-tips-title">
      <h3 id="debt-tips-title" class="debt-section-title">Tips & Tricks</h3>

      <details class="debt-tips-collapsible">
        <summary class="debt-tips-toggle">Key Debt Statistics</summary>
        <div class="debt-tips-content">
          <ul class="debt-tips-list">
            <li>The average U.S. credit card interest rate is approximately 20-24% APR.</li>
            <li>Paying only minimum payments on a $5,000 credit card at 22% APR could take over 20 years and cost thousands in interest.</li>
            <li>Student loan debt averages around $37,000 per borrower in the U.S.</li>
            <li>The average auto loan term has extended to approximately 68 months.</li>
          </ul>
        </div>
      </details>

      <details class="debt-tips-collapsible">
        <summary class="debt-tips-toggle">Practical Tips for Faster Payoff</summary>
        <div class="debt-tips-content">
          <ul class="debt-tips-list">
            <li><strong>Round up payments:</strong> Rounding to the next $50 or $100 can shave months off your payoff timeline.</li>
            <li><strong>Use windfalls:</strong> Tax refunds, bonuses, or side income can make a significant dent when applied to debt.</li>
            <li><strong>Negotiate rates:</strong> Call your creditors to request lower interest rates, especially if you have a good payment history.</li>
            <li><strong>Automate payments:</strong> Set up automatic payments to avoid missed payments and potential late fees.</li>
            <li><strong>Avoid new debt:</strong> Pause credit card spending while aggressively paying down balances.</li>
          </ul>
        </div>
      </details>

      <details class="debt-tips-collapsible">
        <summary class="debt-tips-toggle">When to Consider Consolidation</summary>
        <div class="debt-tips-content">
          <ul class="debt-tips-list">
            <li>If you have multiple high-interest debts and can qualify for a lower consolidated rate.</li>
            <li>Balance transfer cards with 0% introductory APR can be useful if you can pay off the balance before the promotional period ends.</li>
            <li>Personal consolidation loans may simplify multiple payments into one.</li>
            <li><strong>Caution:</strong> Consolidation does not reduce the principal owed. Extending the term may lower monthly payments but increase total interest paid.</li>
          </ul>
          <p class="debt-tips-disclaimer">
            Consider consulting a qualified financial advisor before making consolidation decisions.
          </p>
        </div>
      </details>
    </div>
  `;
}

// ===========================
// SECTION 4: VISUALIZATIONS
// ===========================

/**
 * Render chart containers for debt visualizations
 * @param {Object} comparison - Result from compareDebtStrategies
 * @param {string} strategy - 'avalanche' or 'snowball'
 * @returns {string} HTML string
 */
function renderDebtVisualizations(comparison, strategy) {
  if (!comparison) return '';

  const selectedResult = strategy === 'avalanche' ? comparison.avalanche : comparison.snowball;

  return `
    <div class="debt-viz-section" role="region" aria-labelledby="debt-viz-title">
      <h3 id="debt-viz-title" class="debt-section-title">Payoff Visualizations</h3>

      <!-- Chart 1: Total Debt Balance Over Time -->
      <div class="debt-chart-block" aria-labelledby="debt-balance-chart-title">
        <h4 id="debt-balance-chart-title" class="debt-chart-title">Total Debt Balance Over Time</h4>
        <div class="debt-chart-container">
          <canvas id="debtBalanceChart"
                  role="img"
                  aria-label="Line chart showing total debt balance declining over time using ${strategy} method"
                  height="80"></canvas>
        </div>
        <p class="debt-chart-fallback" id="debtBalanceChartFallback" style="display: none;">
          Using the ${strategy} method, total debt is paid off in ${selectedResult.monthsToPayoff} months
          with ${formatDebtCurrency(selectedResult.totalInterestPaid)} in total interest paid.
        </p>
      </div>

      <!-- Chart 2: Individual Debt Paydown -->
      <div class="debt-chart-block" aria-labelledby="debt-individual-chart-title">
        <h4 id="debt-individual-chart-title" class="debt-chart-title">Individual Debt Paydown Schedule</h4>
        <div class="debt-chart-container">
          <canvas id="debtIndividualChart"
                  role="img"
                  aria-label="Stacked area chart showing each individual debt being paid down over time"
                  height="80"></canvas>
        </div>
        <p class="debt-chart-fallback" id="debtIndividualChartFallback" style="display: none;">
          Individual debt paydown schedule showing each debt's remaining balance over time.
        </p>
      </div>
    </div>
  `;
}

// ===========================
// EMPTY STATE
// ===========================

/**
 * Render empty state when no debts are present, with input section
 * @param {string} debtInputHtml - HTML from renderDebtInputSection
 * @returns {string} HTML string
 */
function renderNoDebtsState(debtInputHtml) {
  return `
    <div class="debt-tab-container" role="region">
      ${debtInputHtml || ''}
      <div class="debt-empty-state" role="status">
        <div class="debt-empty-icon" aria-hidden="true">&#x2705;</div>
        <h3>No Outstanding Debts</h3>
        <p>Add your debt balances and interest rates above to see your personalized payoff strategy, visualizations, and tips.</p>
      </div>
    </div>
  `;
}

// ===========================
// COMPLIANCE DISCLAIMER
// ===========================

/**
 * Render compliance disclaimer
 * @returns {string} HTML string
 */
function renderDebtDisclaimer() {
  return `
    <div class="debt-tab-disclaimer" role="note">
      <p>
        <strong>Disclaimer:</strong> These projections are estimates for educational purposes only.
        Actual results may vary based on payment timing, interest rate changes, and other factors.
        Historical payment patterns do not guarantee future adherence to payment schedules.
        This tool does not constitute financial advice. Please consult a qualified financial advisor
        for personalized debt management recommendations.
      </p>
    </div>
  `;
}

// ===========================
// CHART INITIALIZATION
// ===========================

/**
 * Shared dark-theme chart options
 */
function getDebtChartOptions(yLabel) {
  return {
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
          usePointStyle: true,
          font: { size: 12 }
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
          title: (tooltipItems) => `Month ${tooltipItems[0].label}`,
          label: (context) => `${context.dataset.label}: ${formatDebtCurrency(context.parsed.y)}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Months from Today',
          color: '#999',
          font: { size: 11 }
        },
        grid: { display: false },
        ticks: { color: '#999', maxTicksLimit: 12 }
      },
      y: {
        title: {
          display: true,
          text: yLabel || 'Debt Remaining',
          color: '#999',
          font: { size: 11 }
        },
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#999',
          callback: (value) => formatDebtCurrency(value)
        }
      }
    }
  };
}

/**
 * Initialize both debt tab charts
 * Called after DOM renders or when switching to debts tab
 */
function initDebtCharts() {
  initDebtBalanceChart();
  initDebtIndividualChart();
}

/**
 * Initialize the total debt balance over time chart
 */
function initDebtBalanceChart() {
  const ctx = document.getElementById('debtBalanceChart');
  if (!ctx) return;

  if (typeof Chart === 'undefined') {
    const fallback = document.getElementById('debtBalanceChartFallback');
    if (fallback) fallback.style.display = 'block';
    return;
  }

  const snapshot = window.store ? window.store.state.snapshot : getState().snapshot;
  if (!snapshot || !snapshot.debts || !snapshot.general) return;

  const debtSettings = snapshot.debtSettings || {};
  const monthlyCashFlow = Math.max(0,
    (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0));
  const extraPayment = computeExtraPayment(debtSettings, monthlyCashFlow);
  const strategy = debtSettings.preferredStrategy || 'avalanche';

  const comparison = window.compareDebtStrategies(snapshot.debts, extraPayment);
  if (!comparison) return;

  const selectedResult = strategy === 'avalanche' ? comparison.avalanche : comparison.snowball;
  const maxMonths = selectedResult.monthsToPayoff;
  const sampleRate = Math.max(1, Math.ceil(maxMonths / 60));

  const labels = [];
  const data = [];

  for (let i = 0; i < maxMonths; i += sampleRate) {
    labels.push(i + 1);
    data.push(selectedResult.timeline[i] ? selectedResult.timeline[i].totalRemaining : 0);
  }
  // Ensure we end at 0
  if (data.length > 0 && data[data.length - 1] > 0) {
    labels.push(maxMonths);
    data.push(0);
  }

  if (debtBalanceChartInstance) debtBalanceChartInstance.destroy();

  debtBalanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${strategy === 'avalanche' ? 'Avalanche' : 'Snowball'} - Total Debt`,
        data,
        borderColor: 'rgba(212, 175, 55, 1)',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(212, 175, 55, 1)',
        fill: true,
      }]
    },
    options: getDebtChartOptions('Total Debt Remaining')
  });
}

/**
 * Initialize the individual debt paydown stacked chart
 */
function initDebtIndividualChart() {
  const ctx = document.getElementById('debtIndividualChart');
  if (!ctx) return;

  if (typeof Chart === 'undefined') {
    const fallback = document.getElementById('debtIndividualChartFallback');
    if (fallback) fallback.style.display = 'block';
    return;
  }

  const snapshot = window.store ? window.store.state.snapshot : getState().snapshot;
  if (!snapshot || !snapshot.debts || !snapshot.general) return;

  const debtSettings = snapshot.debtSettings || {};
  const monthlyCashFlow = Math.max(0,
    (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0));
  const extraPayment = computeExtraPayment(debtSettings, monthlyCashFlow);
  const strategy = debtSettings.preferredStrategy || 'avalanche';

  const comparison = window.compareDebtStrategies(snapshot.debts, extraPayment);
  if (!comparison) return;

  const selectedResult = strategy === 'avalanche' ? comparison.avalanche : comparison.snowball;
  const activeDebts = snapshot.debts.filter(d => d.balance > 0);
  const maxMonths = selectedResult.monthsToPayoff;
  const sampleRate = Math.max(1, Math.ceil(maxMonths / 60));

  const labels = [];
  for (let i = 0; i < maxMonths; i += sampleRate) {
    labels.push(i + 1);
  }

  const datasets = activeDebts.map((debt, idx) => {
    const dataPoints = [];
    for (let i = 0; i < maxMonths; i += sampleRate) {
      const timelineEntry = selectedResult.timeline[i];
      if (timelineEntry) {
        const debtEntry = timelineEntry.debts.find(d => d.category === debt.category);
        dataPoints.push(debtEntry ? debtEntry.remainingBalance : 0);
      } else {
        dataPoints.push(0);
      }
    }
    const color = DEBT_CHART_COLORS[idx % DEBT_CHART_COLORS.length];
    return {
      label: getDebtCategoryLabel(debt.category),
      data: dataPoints,
      borderColor: color,
      backgroundColor: color + '33',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 1,
      pointHoverRadius: 5,
    };
  });

  if (debtIndividualChartInstance) debtIndividualChartInstance.destroy();

  const stackedOptions = getDebtChartOptions('Debt Remaining');
  stackedOptions.scales.x.stacked = true;
  stackedOptions.scales.y.stacked = true;

  debtIndividualChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: stackedOptions
  });
}

// ===========================
// GLOBAL EXPORTS
// ===========================

window.renderDebtTab = renderDebtTab;
window.initDebtCharts = initDebtCharts;
window.selectDebtStrategy = selectDebtStrategy;
window.toggleDebtMethod = toggleDebtMethod;
window.handleAggressivenessChange = handleAggressivenessChange;
window.getDebtCategoryLabel = getDebtCategoryLabel;

// Backward-compatible aliases for app.js, tabNavigation.js, dashboard.js
window.renderDebtComparison = renderDebtTab;
window.initDebtPayoffChart = initDebtCharts;
