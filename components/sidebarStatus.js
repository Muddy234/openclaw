/**
 * sidebarStatus.js
 * Compact sidebar status indicators with logo-style icons
 * Shows FIRE progress, Cash Flow status, and Fragility at a glance
 */

// ===========================
// LOGO-STYLE SVG ICONS
// ===========================

// FIRE Net Worth: Flame with upward arrow (growth + FIRE)
const FIRE_ICON = `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 2C12 2 8 6 8 10c0 2.2 1.8 4 4 4s4-1.8 4-4c0-4-4-8-4-8z"/>
  <path d="M12 14c-1.1 0-2 .9-2 2 0 2.2 1.8 4 4 4 1.8 0 3.4-1.2 3.9-3"/>
  <path d="M17 8l2-2m0 0l2 2m-2-2v6" stroke-width="2"/>
</svg>`;

// Cash Flow: Dollar with circular flow arrows
const CASHFLOW_ICON = `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="9"/>
  <path d="M12 7v10M9 9.5c.5-1 1.5-1.5 3-1.5 2 0 3 1 3 2.5s-1 2-3 2.5c-2 .5-3 1.5-3 2.5s1 2 3 2c1.5 0 2.5-.5 3-1.5"/>
  <path d="M5 12H3m18 0h-2" stroke-width="2"/>
  <path d="M12 3v2m0 14v2" stroke-width="2"/>
</svg>`;

// Fragility: Shield with health indicator
const FRAGILITY_ICON = `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 2L4 6v6c0 5.5 3.8 10.3 8 12 4.2-1.7 8-6.5 8-12V6l-8-4z"/>
  <path d="M9 12l2 2 4-4" stroke-width="2"/>
</svg>`;

// Alternative fragility states
const FRAGILITY_WARNING_ICON = `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 2L4 6v6c0 5.5 3.8 10.3 8 12 4.2-1.7 8-6.5 8-12V6l-8-4z"/>
  <path d="M12 8v4m0 4h.01" stroke-width="2"/>
</svg>`;

const FRAGILITY_DANGER_ICON = `<svg class="status-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 2L4 6v6c0 5.5 3.8 10.3 8 12 4.2-1.7 8-6.5 8-12V6l-8-4z"/>
  <path d="M15 9l-6 6m0-6l6 6" stroke-width="2"/>
</svg>`;

// ===========================
// STATUS CALCULATIONS
// ===========================

/**
 * Calculate FIRE status from snapshot
 * @param {Object} snapshot - Current financial snapshot
 * @returns {Object} Status info with value, label, and state
 */
function calculateFireStatus(snapshot) {
  if (!snapshot || !snapshot.general || !snapshot.general.monthlyExpense) {
    return { value: 0, label: '—', state: 'unknown', description: 'Add expenses to track' };
  }

  let projectedNetWorth = 0;
  let fireTarget = 0;

  // Use calculateVerificationProjection for consistency with the chart
  // This uses inflation-adjusted ending expenses for the FIRE target
  if (typeof calculateVerificationProjection === 'function') {
    try {
      const result = calculateVerificationProjection(snapshot);
      if (result && result.summary) {
        projectedNetWorth = result.summary.endingNetWorth || 0;
        fireTarget = result.summary.fireTarget || 0;
      }
    } catch (e) {
      console.warn('SidebarStatus: Could not calculate projection', e);
    }
  } else if (typeof calculateProjection === 'function') {
    // Fallback to basic projection if verification not available
    try {
      const projection = calculateProjection(snapshot);
      if (projection && projection.summary) {
        projectedNetWorth = projection.summary.projectedNetWorth || 0;
        fireTarget = projection.summary.fireTarget || 0;
      }
    } catch (e) {
      console.warn('SidebarStatus: Could not calculate projection', e);
    }
  }

  // Fallback calculation
  if (fireTarget === 0) {
    const annualExp = typeof getFireAnnualExpenses === 'function'
      ? getFireAnnualExpenses(snapshot)
      : (snapshot.general.monthlyExpense || 0) * 12;
    if (annualExp > 0) {
      fireTarget = annualExp * 25;
    }
  }

  const progress = fireTarget > 0 ? Math.round((projectedNetWorth / fireTarget) * 100) : 0;

  let state = 'danger';
  let description = 'Needs attention';
  if (progress >= 100) {
    state = 'success';
    description = 'On track to FIRE!';
  } else if (progress >= 80) {
    state = 'warning';
    description = 'Getting close';
  } else if (progress >= 50) {
    state = 'caution';
    description = 'Making progress';
  }

  return {
    value: progress,
    label: `${progress}%`,
    state,
    description
  };
}

/**
 * Calculate Cash Flow status from snapshot
 * @param {Object} snapshot - Current financial snapshot
 * @returns {Object} Status info with value, label, and state
 */
function calculateCashFlowStatus(snapshot) {
  if (!snapshot || !snapshot.general || !snapshot.general.monthlyTakeHome) {
    return { value: 0, label: '—', state: 'unknown', description: 'Add income to track' };
  }

  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const cashFlow = monthlyTakeHome - monthlyExpense;

  // Calculate allocated vs remaining if function exists
  let remaining = cashFlow;
  let totalAllocated = 0;

  if (typeof calculateCashFlowAllocations === 'function') {
    const data = calculateCashFlowAllocations(snapshot);
    remaining = data.remaining;
    totalAllocated = data.totalAllocated;
  }

  // Format compact currency
  const formatCompact = (n) => {
    const absVal = Math.abs(n);
    if (absVal >= 1000) {
      return (n < 0 ? '-' : '') + '$' + (absVal / 1000).toFixed(1) + 'K';
    }
    return '$' + n.toLocaleString();
  };

  let state = 'success';
  let description = 'Healthy surplus';

  if (cashFlow < 0) {
    state = 'danger';
    description = 'Spending exceeds income';
  } else if (remaining <= 0 && totalAllocated > 0) {
    state = 'warning';
    description = 'Fully allocated';
  } else if (remaining < cashFlow * 0.1) {
    state = 'warning';
    description = 'Almost fully allocated';
  } else if (cashFlow < 500) {
    state = 'caution';
    description = 'Tight margin';
  }

  return {
    value: remaining,
    label: formatCompact(remaining),
    state,
    description
  };
}

/**
 * Calculate Fragility status from snapshot
 * @param {Object} snapshot - Current financial snapshot
 * @returns {Object} Status info with value, label, and state
 */
function calculateFragilityStatus(snapshot) {
  if (!snapshot || !snapshot.general) {
    return { value: 'UNKNOWN', label: '—', state: 'unknown', description: 'Add data to assess' };
  }

  // Use existing metrics calculation if available
  let fragility = 'MODERATE';
  if (typeof calculateMetrics === 'function') {
    const metrics = calculateMetrics(snapshot);
    fragility = metrics.fragility || 'MODERATE';
  }

  let state = 'warning';
  let description = 'Could be stronger';
  let label = 'Moderate';

  switch (fragility) {
    case 'SOLID':
      state = 'success';
      description = 'Strong foundation';
      label = 'Solid';
      break;
    case 'FRAGILE':
      state = 'danger';
      description = 'Needs improvement';
      label = 'Fragile';
      break;
    case 'MODERATE':
    default:
      state = 'warning';
      description = 'Room to improve';
      label = 'Moderate';
      break;
  }

  return {
    value: fragility,
    label,
    state,
    description
  };
}

// ===========================
// RENDER FUNCTION
// ===========================

/**
 * Render the compact sidebar status component
 * @param {Object} snapshot - Current financial snapshot
 * @returns {string} HTML for the status indicators
 */
function renderSidebarStatus(snapshot) {
  const fireStatus = calculateFireStatus(snapshot);
  const cashFlowStatus = calculateCashFlowStatus(snapshot);
  const fragilityStatus = calculateFragilityStatus(snapshot);

  // Get the appropriate fragility icon based on state
  const getFragilityIcon = (state) => {
    switch (state) {
      case 'success': return FRAGILITY_ICON;
      case 'warning': return FRAGILITY_WARNING_ICON;
      case 'danger': return FRAGILITY_DANGER_ICON;
      default: return FRAGILITY_WARNING_ICON;
    }
  };

  return `
    <div class="sidebar-status" role="complementary" aria-label="Financial Status Summary">
      <!-- FIRE Progress -->
      <div class="status-row status-${fireStatus.state}"
           title="${fireStatus.description}"
           role="status"
           aria-label="FIRE Progress: ${fireStatus.label} - ${fireStatus.description}">
        <div class="status-icon-wrapper">
          ${FIRE_ICON}
        </div>
        <div class="status-info">
          <span class="status-label">FIRE</span>
          <span class="status-value">${fireStatus.label}</span>
        </div>
        <span class="status-indicator" aria-hidden="true"></span>
      </div>

      <!-- Cash Flow -->
      <div class="status-row status-${cashFlowStatus.state}"
           title="${cashFlowStatus.description}"
           role="status"
           aria-label="Cash Flow: ${cashFlowStatus.label} - ${cashFlowStatus.description}">
        <div class="status-icon-wrapper">
          ${CASHFLOW_ICON}
        </div>
        <div class="status-info">
          <span class="status-label">Cash Flow</span>
          <span class="status-value">${cashFlowStatus.label}</span>
        </div>
        <span class="status-indicator" aria-hidden="true"></span>
      </div>

      <!-- Fragility -->
      <div class="status-row status-${fragilityStatus.state}"
           title="${fragilityStatus.description}"
           role="status"
           aria-label="Financial Stability: ${fragilityStatus.label} - ${fragilityStatus.description}">
        <div class="status-icon-wrapper">
          ${getFragilityIcon(fragilityStatus.state)}
        </div>
        <div class="status-info">
          <span class="status-label">Stability</span>
          <span class="status-value">${fragilityStatus.label}</span>
        </div>
        <span class="status-indicator" aria-hidden="true"></span>
      </div>
    </div>
  `;
}

// Expose globally
window.renderSidebarStatus = renderSidebarStatus;
window.calculateFireStatus = calculateFireStatus;
window.calculateCashFlowStatus = calculateCashFlowStatus;
window.calculateFragilityStatus = calculateFragilityStatus;
