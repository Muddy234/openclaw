/**
 * cashFlowGauge.js
 * Persistent cash flow gauge that shows remaining budget as user makes allocation choices
 * Displays in sidebar alongside FIRE Progress tracker
 */

/**
 * Calculate all cash flow allocations from the current snapshot
 * ONLY counts explicit user allocations - does not auto-allocate remaining cash flow
 * @param {Object} snapshot - Current financial snapshot
 * @returns {Object} Allocation breakdown and totals
 */
function calculateCashFlowAllocations(snapshot) {
  const settings = snapshot.fireSettings || {};
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const totalCashFlow = monthlyTakeHome - monthlyExpense;

  const allocations = [];
  let totalAllocated = 0;

  // Only calculate allocations if we have positive cash flow
  if (totalCashFlow <= 0) {
    return {
      totalCashFlow: Math.max(0, totalCashFlow),
      totalAllocated: 0,
      remaining: Math.max(0, totalCashFlow),
      allocations: [],
      isOverBudget: false,
      overBudgetAmount: 0,
    };
  }

  // === USER-DEFINED ALLOCATIONS ONLY ===
  // The gauge only tracks what the user has explicitly chosen to allocate.
  // This prevents the "waterfall" behavior where all cash flow is auto-consumed.

  const userAllocations = settings.allocations || {};

  // Helper to add allocation if user has set an explicit positive amount
  const addAllocationIfSet = (key, label, category) => {
    const amount = userAllocations[key];
    // Only count explicit numeric values > 0 (not null, not undefined)
    if (typeof amount === 'number' && amount > 0) {
      allocations.push({ key, label, amount, category });
      totalAllocated += amount;
    }
  };

  // Foundation allocations (only if user explicitly set them)
  addAllocationIfSet('starterEF', 'Starter EF', 'foundation');
  addAllocationIfSet('emergencyFund', 'Emergency Fund', 'foundation');

  // Flexible allocations
  addAllocationIfSet('highInterestDebt', 'High-Int Debt', 'flexible');
  addAllocationIfSet('hsaIra', 'HSA & IRA', 'flexible');
  addAllocationIfSet('moderateDebt', 'Moderate Debt', 'flexible');
  addAllocationIfSet('max401k', 'Max 401k', 'flexible');
  addAllocationIfSet('taxableInvesting', 'Brokerage', 'flexible');

  // Debt minimum payments (sum of all debt minimums)
  // This is auto-calculated but represents a fixed commitment
  const totalDebtMinimums = (snapshot.debts || []).reduce((sum, debt) => {
    if (debt.balance > 0 && debt.minPayment > 0) {
      return sum + debt.minPayment;
    }
    // Calculate minimum if not stored
    if (debt.balance > 0) {
      const minPmt = typeof calculateMonthlyPayment === 'function'
        ? calculateMonthlyPayment(debt.balance, debt.interestRate, debt.termMonths || 60)
        : 0;
      return sum + Math.round(minPmt);
    }
    return sum;
  }, 0);

  if (totalDebtMinimums > 0) {
    allocations.push({
      key: 'debtMinimums',
      label: 'Debt Minimums',
      amount: totalDebtMinimums,
      category: 'required',
    });
    totalAllocated += totalDebtMinimums;
  }

  const remaining = totalCashFlow - totalAllocated;
  const isOverBudget = remaining < 0;

  return {
    totalCashFlow,
    totalAllocated,
    remaining: Math.max(0, remaining),
    allocations,
    isOverBudget,
    overBudgetAmount: isOverBudget ? Math.abs(remaining) : 0,
  };
}

/**
 * Render the Cash Flow Gauge for the sidebar
 * @param {Object} snapshot - Current financial snapshot
 * @returns {string} HTML for the gauge
 */
function renderCashFlowGauge(snapshot) {
  // Check if we have enough data
  if (!snapshot || !snapshot.general || !snapshot.general.monthlyTakeHome) {
    return '';
  }

  const data = calculateCashFlowAllocations(snapshot);

  // Calculate percentage for visual
  const percentUsed = data.totalCashFlow > 0
    ? Math.min(100, (data.totalAllocated / data.totalCashFlow) * 100)
    : 0;
  const percentRemaining = 100 - percentUsed;

  // Determine status class
  let statusClass = 'gauge-healthy';
  let statusLabel = 'Available';
  if (data.isOverBudget) {
    statusClass = 'gauge-over';
    statusLabel = 'Over Budget';
  } else if (percentRemaining <= 10) {
    statusClass = 'gauge-low';
    statusLabel = 'Almost Full';
  } else if (percentRemaining <= 30) {
    statusClass = 'gauge-moderate';
    statusLabel = 'Filling Up';
  }

  // Format currency helper
  const formatCurrency = (n) => {
    return '$' + Math.abs(Math.round(n)).toLocaleString();
  };

  // Build allocation breakdown HTML
  const breakdownItems = data.allocations.map(alloc => `
    <div class="gauge-breakdown-item">
      <span class="gauge-breakdown-label">${alloc.label}</span>
      <span class="gauge-breakdown-amount">-${formatCurrency(alloc.amount)}</span>
    </div>
  `).join('');

  return `
    <div class="cash-flow-gauge ${statusClass}"
         role="complementary"
         aria-label="Monthly Cash Flow Budget">
      <div class="gauge-header">
        <span class="gauge-title">Monthly Cash Flow</span>
        <span class="gauge-total">${formatCurrency(data.totalCashFlow)}</span>
      </div>

      <!-- Visual Tank -->
      <div class="gauge-tank" aria-hidden="true">
        <div class="gauge-tank-fill" style="height: ${percentRemaining}%"></div>
        <div class="gauge-tank-used" style="height: ${percentUsed}%"></div>
        ${data.isOverBudget ? `
          <div class="gauge-tank-overflow">
            <span class="gauge-overflow-icon">!</span>
          </div>
        ` : ''}
      </div>

      <!-- Remaining Amount -->
      <div class="gauge-remaining">
        <span class="gauge-remaining-amount ${data.isOverBudget ? 'text-danger' : ''}">
          ${data.isOverBudget ? '-' : ''}${formatCurrency(data.isOverBudget ? data.overBudgetAmount : data.remaining)}
        </span>
        <span class="gauge-remaining-label">${data.isOverBudget ? 'over budget' : 'remaining'}</span>
      </div>

      <!-- Expandable Breakdown -->
      <details class="gauge-breakdown">
        <summary class="gauge-breakdown-toggle">
          ${data.allocations.length} allocation${data.allocations.length !== 1 ? 's' : ''}
        </summary>
        <div class="gauge-breakdown-list">
          <div class="gauge-breakdown-item gauge-breakdown-header">
            <span class="gauge-breakdown-label">Total Available</span>
            <span class="gauge-breakdown-amount">${formatCurrency(data.totalCashFlow)}</span>
          </div>
          ${breakdownItems}
          <div class="gauge-breakdown-item gauge-breakdown-total">
            <span class="gauge-breakdown-label">Remaining</span>
            <span class="gauge-breakdown-amount ${data.isOverBudget ? 'text-danger' : 'text-success'}">
              ${data.isOverBudget ? '-' : ''}${formatCurrency(data.isOverBudget ? data.overBudgetAmount : data.remaining)}
            </span>
          </div>
        </div>
      </details>

      <!-- Status indicator -->
      <div class="gauge-status">
        <span class="gauge-status-dot"></span>
        <span class="gauge-status-label">${statusLabel}</span>
      </div>
    </div>
  `;
}

// Expose globally
window.renderCashFlowGauge = renderCashFlowGauge;
window.calculateCashFlowAllocations = calculateCashFlowAllocations;
