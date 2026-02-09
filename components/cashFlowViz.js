// ===========================
// CASH FLOW VISUALIZATION
// ===========================

/**
 * Format currency helper (XSS-safe via Intl API)
 * @param {number} n - Number to format
 * @returns {string} Formatted currency
 */
function formatCashFlowCurrency(n) {
  // SECURITY: Validate input is a finite number
  const num = parseFloat(n);
  if (!isFinite(num)) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * SECURITY: Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtmlCashFlow(str) {
  if (typeof str !== 'string') return String(str);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Render cash flow section
 * @param {Object} snapshot - Financial snapshot
 * @returns {string} HTML for cash flow visualization
 */
function renderCashFlowSection(snapshot) {
  const cashFlow = window.calculateCashFlow(snapshot);

  // SECURITY: Handle empty/invalid cash flow
  if (!cashFlow || !cashFlow.waterfall || cashFlow.waterfall.length === 0) {
    return `
      <div class="cashflow-section">
        <h2>Cash Flow Analysis</h2>
        <p class="section-subtitle">Enter your income information to see your cash flow breakdown.</p>
      </div>
    `;
  }

  const recommendations = window.generateCashFlowRecommendations(cashFlow, snapshot);

  return `
    <div class="cashflow-section">
      <h2>Your Monthly Cash Flow</h2>
      <p class="section-subtitle">
        See where every dollar goes from paycheck to investments
      </p>

      <!-- COMPLIANCE: Educational disclaimer -->
      <div class="cashflow-disclaimer">
        <strong>Educational Tool:</strong> This analysis is for educational purposes only.
        It is not financial, investment, or tax advice. Consult qualified professionals
        before making financial decisions.
      </div>

      <!-- Summary Cards -->
      <div class="cashflow-summary">
        ${renderCashFlowSummaryCards(cashFlow.summary)}
      </div>

      <!-- Waterfall Visualization -->
      <div class="waterfall-viz">
        <h3>Cash Flow Waterfall</h3>
        ${renderWaterfall(cashFlow.waterfall)}
      </div>


      <!-- Optimization Recommendations -->
      <div class="optimization-recommendations">
        <h3>Educational Insights</h3>
        ${renderRecommendations(recommendations)}
      </div>
    </div>
  `;
}

/**
 * Render summary cards
 * @param {Object} summary - Cash flow summary
 * @returns {string} HTML
 */
function renderCashFlowSummaryCards(summary) {
  // SECURITY: Guard against division by zero
  const savingsRate = summary.takeHome > 0
    ? (summary.investments / summary.takeHome) * 100
    : 0;

  // SECURITY: Ensure savingsRate is valid
  const validSavingsRate = isFinite(savingsRate) ? savingsRate : 0;
  const savingsClass = validSavingsRate >= 20 ? 'success' : validSavingsRate >= 10 ? 'gold' : 'danger';
  const leftoverClass = summary.leftover > 100 ? 'gold' : 'success';

  return `
    <div class="summary-card">
      <div class="card-label">Monthly Take-Home</div>
      <div class="card-value">${formatCashFlowCurrency(summary.takeHome)}</div>
    </div>

    <div class="summary-card">
      <div class="card-label">Savings Rate</div>
      <div class="card-value ${savingsClass}">
        ${validSavingsRate.toFixed(1)}%
      </div>
    </div>

    <div class="summary-card">
      <div class="card-label">Debt Interest</div>
      <div class="card-value danger">${formatCashFlowCurrency(summary.debtInterest)}/mo</div>
      <div class="card-detail">${formatCashFlowCurrency(summary.debtInterest * 12)}/year</div>
    </div>

    <div class="summary-card">
      <div class="card-label">Unallocated Cash</div>
      <div class="card-value ${leftoverClass}">
        ${formatCashFlowCurrency(summary.leftover)}
      </div>
    </div>
  `;
}

/**
 * Render waterfall visualization
 * @param {Array} waterfall - Waterfall data
 * @returns {string} HTML
 */
function renderWaterfall(waterfall) {
  return `
    <div class="waterfall-container">
      ${waterfall.map((item, index) => {
        const sign = item.amount >= 0 ? '+' : '';
        const amountStr = formatCashFlowCurrency(Math.abs(item.amount));
        // SECURITY: Ensure percentage is valid
        const percentage = isFinite(item.percentage) ? item.percentage : 0;
        const heightPx = Math.max(percentage * 3, 20);
        const milestoneClass = item.isMilestone ? 'milestone' : '';
        const arrow = index < waterfall.length - 1 ? '<div class="waterfall-arrow" aria-hidden="true">→</div>' : '';
        // SECURITY: Escape category and description
        const safeCategory = escapeHtmlCashFlow(item.category);
        const safeDescription = escapeHtmlCashFlow(item.description);

        return `
          <div class="waterfall-item ${milestoneClass}">
            <div class="waterfall-bar waterfall-${item.color}"
                 style="height: ${heightPx}px;"
                 title="${safeDescription}"
                 role="img"
                 aria-label="${safeCategory}: ${sign}${amountStr}">
              <div class="waterfall-amount">
                ${sign}${amountStr}
              </div>
            </div>
            <div class="waterfall-label">
              <div class="label-name">${safeCategory}</div>
              <div class="label-percentage">${percentage.toFixed(1)}%</div>
            </div>
            ${arrow}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render debt breakdown table
 * SECURITY: All values are sanitized before display
 * @param {Array} debtBreakdown - Debt payment breakdown
 * @returns {string} HTML
 */
function renderDebtBreakdown(debtBreakdown) {
  const rows = debtBreakdown.map(debt => {
    // SECURITY: Guard against division by zero
    const interestPercentage = debt.payment > 0
      ? (debt.interest / debt.payment) * 100
      : 0;
    const validPercentage = isFinite(interestPercentage) ? interestPercentage : 0;
    // SECURITY: Use safe category label lookup
    const categoryLabel = getCategoryLabel(debt.category);

    return `
      <tr>
        <td>${escapeHtmlCashFlow(categoryLabel)}</td>
        <td>${formatCashFlowCurrency(debt.payment)}</td>
        <td class="success">${formatCashFlowCurrency(debt.principal)}</td>
        <td class="danger">${formatCashFlowCurrency(debt.interest)} (${validPercentage.toFixed(0)}%)</td>
        <td>${isFinite(debt.interestRate) ? debt.interestRate.toFixed(2) : '0.00'}%</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="debt-breakdown-section">
      <h3>Debt Payment Breakdown</h3>
      <p class="section-description">
        How your debt payments are split between principal (building equity) and interest
      </p>
      <table class="debt-breakdown-table" role="table">
        <thead>
          <tr>
            <th scope="col">Debt</th>
            <th scope="col">Payment</th>
            <th scope="col">Principal</th>
            <th scope="col">Interest</th>
            <th scope="col">Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Render optimization recommendations
 * COMPLIANCE: Includes disclaimers and educational framing
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {string} HTML
 */
function renderRecommendations(recommendations) {
  if (recommendations.length === 0) {
    return `
      <div class="no-recommendations">
        <h4>Looking Good!</h4>
        <p>Your cash flow appears well-balanced. Continue monitoring your finances and consider consulting a financial advisor for personalized guidance.</p>
      </div>
    `;
  }

  const cards = recommendations.map(rec => {
    // Build savings/gain/impact section with disclaimers
    let extraInfo = '';

    if (rec.potentialSavings && rec.potentialSavings > 0) {
      extraInfo = `
        <div class="rec-savings">
          Estimated potential impact: <strong>${formatCashFlowCurrency(rec.potentialSavings)}</strong>/year*
        </div>
      `;
    } else if (rec.potentialGain && rec.potentialGain > 0) {
      const gainDisclaimer = rec.potentialGainDisclaimer
        ? `<div class="rec-gain-disclaimer">${escapeHtmlCashFlow(rec.potentialGainDisclaimer)}</div>`
        : '';
      extraInfo = `
        <div class="rec-savings">
          Hypothetical annual gain: <strong>${formatCashFlowCurrency(rec.potentialGain)}</strong>*
          ${gainDisclaimer}
        </div>
      `;
    } else if (rec.potentialImpact) {
      extraInfo = `
        <div class="rec-impact">${escapeHtmlCashFlow(rec.potentialImpact)}</div>
      `;
    }

    // COMPLIANCE: Add individual disclaimer if present
    const disclaimer = rec.disclaimer
      ? `<div class="rec-disclaimer">*${escapeHtmlCashFlow(rec.disclaimer)}</div>`
      : '';

    return `
      <div class="recommendation-card recommendation-${rec.priority}">
        <div class="rec-header">
          <span class="rec-priority ${rec.priority}">${escapeHtmlCashFlow(rec.priority.toUpperCase())}</span>
          <span class="rec-category">${escapeHtmlCashFlow(rec.category)}</span>
        </div>
        <h4 class="rec-title">${escapeHtmlCashFlow(rec.title)}</h4>
        <p class="rec-description">${escapeHtmlCashFlow(rec.description)}</p>
        <div class="rec-action">
          <strong>Strategy:</strong> ${escapeHtmlCashFlow(rec.action)}
        </div>
        ${extraInfo}
        ${disclaimer}
      </div>
    `;
  }).join('');

  return `
    <div class="recommendations-list">
      <!-- COMPLIANCE: Master disclaimer for all recommendations -->
      <div class="recommendations-disclaimer">
        <strong>Important:</strong> These insights are for educational purposes only and do not constitute
        financial, investment, or tax advice. All calculations are estimates based on the information provided.
        Actual results will vary. Before making any financial decisions, consult with qualified professionals
        who can evaluate your specific circumstances.
      </div>
      ${cards}
      <!-- COMPLIANCE: Footer disclaimer -->
      <div class="recommendations-footer">
        <p class="assumptions-note">
          <strong>Assumptions:</strong> Investment projections assume a 7% annual return based on historical
          market averages. Past performance does not guarantee future results. Returns may be negative.
        </p>
      </div>
    </div>
  `;
}

/**
 * Get friendly label for debt category
 * SECURITY: Only returns known-safe labels, never user input
 * @param {string} category - Debt category code
 * @returns {string} Friendly label
 */
function getCategoryLabel(category) {
  const labels = {
    CREDIT_CARD: 'Credit Card',
    MEDICAL: 'Medical',
    STUDENT: 'Student Loan',
    AUTO: 'Auto Loan',
    MORTGAGE: 'Mortgage',
    OTHER: 'Other'
  };
  // SECURITY: Only return known labels, not arbitrary user input
  return labels[category] || 'Other';
}

// Expose functions globally
window.renderCashFlowSection = renderCashFlowSection;
