/**
 * fireJourney.js
 * Renders the FIRE Journey Progress with Foundation (fixed) and Flexible (reorderable) sections
 *
 * Note: CONTRIBUTION_LIMITS is defined in projections.js (loaded before this file)
 */

// Default order for flexible boxes (can be reordered by user)
const DEFAULT_FLEXIBLE_ORDER = ['highInterestDebt', 'hsaIra', 'moderateDebt', 'max401k', 'taxableInvesting'];

// Box descriptions for the flexible section
const BOX_DESCRIPTIONS = {
  highInterestDebt: 'High interest debt typically grows faster than most investments. Paying it off provides a mathematically certain savings equivalent to the interest rate.',
  hsaIra: 'Tax-advantaged accounts that reduce taxable income now (Traditional) or provide tax-free growth (Roth). HSA offers triple tax benefits for medical expenses.',
  moderateDebt: 'Moderate interest debt (excluding mortgage) still costs more than savings accounts yield. Eliminating it frees up cash flow.',
  max401k: 'Tax-deferred growth on up to $23,000/year. Reduces current taxable income and compounds over decades.',
  taxableInvesting: 'No contribution limits or withdrawal restrictions. Provides flexibility and liquidity, ideal for early retirement or large purchases.',
};

// Get flexible box order from localStorage or use default
function getFlexibleBoxOrder() {
  try {
    const saved = localStorage.getItem('fireFlexibleOrder');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that all required keys are present
      if (Array.isArray(parsed) && parsed.length === 5 &&
          DEFAULT_FLEXIBLE_ORDER.every(key => parsed.includes(key))) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load flexible box order:', e);
  }
  return [...DEFAULT_FLEXIBLE_ORDER];
}

// Save flexible box order to localStorage
function saveFlexibleBoxOrder(order) {
  try {
    localStorage.setItem('fireFlexibleOrder', JSON.stringify(order));
  } catch (e) {
    console.warn('Failed to save flexible box order:', e);
  }
}

// Calculate foundation boxes (fixed order: 1-4)
function calculateFoundationBoxes(snapshot) {
  const settings = snapshot.fireSettings || {};
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const savings = snapshot.investments.savings || 0;

  let remainingCashFlow = snapshot.general.monthlyTakeHome - monthlyExpense;
  const initialCashFlow = remainingCashFlow;

  const boxes = [];

  // Box 1: Essentials
  const box1Complete = remainingCashFlow >= 0;
  boxes.push({
    id: 1,
    key: 'essentials',
    title: 'Essentials',
    status: box1Complete ? 'COMPLETED' : 'INCOMPLETE',
    allocated: 0,
    details: {
      message: box1Complete
        ? 'Monthly expenses covered'
        : `Shortfall: $${Math.abs(remainingCashFlow).toLocaleString()}/mo`,
    },
  });
  if (remainingCashFlow < 0) {
    remainingCashFlow = 0;
  }

  // Box 2: Starter Emergency Fund ($1,000)
  const starterEFTarget = 1000;
  const starterEFCurrent = Math.min(savings, starterEFTarget);
  const starterEFNeeded = Math.max(0, starterEFTarget - starterEFCurrent);
  const starterEFAllocation = Math.min(remainingCashFlow, starterEFNeeded);
  const box2Complete = savings >= starterEFTarget;

  boxes.push({
    id: 2,
    key: 'starterEF',
    title: 'Starter EF',
    status: box2Complete ? 'COMPLETED' : (starterEFCurrent > 0 ? 'IN_PROGRESS' : 'INCOMPLETE'),
    allocated: box2Complete ? 0 : starterEFAllocation,
    details: {
      target: starterEFTarget,
      current: starterEFCurrent,
      needed: starterEFNeeded,
    },
  });

  if (!box2Complete) {
    remainingCashFlow -= starterEFAllocation;
  }

  // Box 3: Employer Match (HSA and 401k)
  const annualIncome = snapshot.general.annualIncome || 0;

  // HSA Match calculations
  const hasHsaMatch = settings.hasHsaMatch || false;
  const hsaMatchPercent = settings.hsaMatchPercent || 4;
  const isGettingHsaMatch = settings.isGettingHsaMatch || false;
  // HSA contribution to get match: % of salary, capped at annual limit
  const hsaMatchContribAnnual = hasHsaMatch ? Math.min((hsaMatchPercent / 100) * annualIncome, CONTRIBUTION_LIMITS.HSA_INDIVIDUAL) : 0;
  const hsaMatchContribMonthly = hsaMatchContribAnnual / 12;

  // 401k Match calculations
  const has401kMatch = settings.has401kMatch || false;
  const fourOhOneKMatchPercent = settings.fourOhOneKMatchPercent || 4;
  const isGetting401kMatch = settings.isGetting401kMatch || false;
  // 401k contribution to get match: % of salary, capped at annual limit
  const fourOhOneKMatchContribAnnual = has401kMatch ? Math.min((fourOhOneKMatchPercent / 100) * annualIncome, CONTRIBUTION_LIMITS.FOUR_OH_ONE_K) : 0;
  const fourOhOneKMatchContribMonthly = fourOhOneKMatchContribAnnual / 12;

  // Total needed to get all matches
  const hsaNeeded = hasHsaMatch && !isGettingHsaMatch ? hsaMatchContribMonthly : 0;
  const fourOhOneKNeeded = has401kMatch && !isGetting401kMatch ? fourOhOneKMatchContribMonthly : 0;
  const totalMatchContribNeeded = hsaNeeded + fourOhOneKNeeded;

  // Determine status
  let box3Status = 'INCOMPLETE';
  let box3Allocation = 0;

  const noMatchesAvailable = !hasHsaMatch && !has401kMatch;
  const allMatchesReceived = (!hasHsaMatch || isGettingHsaMatch) && (!has401kMatch || isGetting401kMatch);

  if (noMatchesAvailable) {
    box3Status = 'NOT_APPLICABLE';
  } else if (allMatchesReceived) {
    box3Status = 'COMPLETED';
  } else {
    box3Allocation = Math.min(remainingCashFlow, totalMatchContribNeeded);
    box3Status = box3Allocation >= totalMatchContribNeeded ? 'IN_PROGRESS' : 'INCOMPLETE';
    remainingCashFlow -= box3Allocation;
  }

  boxes.push({
    id: 3,
    key: 'employerMatch',
    title: 'Employer Match',
    status: box3Status,
    allocated: box3Allocation,
    details: {
      hasHsaMatch,
      hsaMatchPercent,
      isGettingHsaMatch,
      hsaMatchContribMonthly: Math.round(hsaMatchContribMonthly),
      has401kMatch,
      fourOhOneKMatchPercent,
      isGetting401kMatch,
      fourOhOneKMatchContribMonthly: Math.round(fourOhOneKMatchContribMonthly),
      totalMatchContribNeeded: Math.round(totalMatchContribNeeded),
    },
  });

  // Box 4: Full Emergency Fund
  const efMonths = settings.emergencyFundMonths || 6;
  const efTarget = monthlyExpense * efMonths;
  const availableSavings = Math.max(0, savings - starterEFTarget);
  const efCurrent = Math.min(availableSavings, efTarget);
  const efNeeded = Math.max(0, efTarget - efCurrent);
  const box4Complete = efCurrent >= efTarget;
  const box4Allocation = !box4Complete ? Math.min(remainingCashFlow, efNeeded) : 0;

  boxes.push({
    id: 4,
    key: 'fullEF',
    title: 'Full Emergency Fund',
    status: box4Complete ? 'COMPLETED' : (efCurrent > 0 ? 'IN_PROGRESS' : 'INCOMPLETE'),
    allocated: box4Allocation,
    details: {
      months: efMonths,
      target: efTarget,
      current: efCurrent,
      needed: efNeeded,
    },
  });

  if (!box4Complete) {
    remainingCashFlow -= box4Allocation;
  }

  // Check if foundation is complete
  // Box 3 is considered "handled" if: no matches available, already getting matches, or actively contributing to get matches
  const box3Handled = box3Status === 'COMPLETED' || box3Status === 'NOT_APPLICABLE' || box3Status === 'IN_PROGRESS';
  const foundationComplete = box1Complete && box2Complete && box3Handled && box4Complete;

  return {
    boxes,
    remainingCashFlow,
    initialCashFlow,
    foundationComplete,
  };
}

// Get user allocation for a box (null = all remaining, number = specific amount)
function getUserAllocation(settings, key) {
  const allocations = settings.allocations || {};
  return allocations[key];
}

// Calculate a single flexible box given remaining cash flow
function calculateFlexibleBox(key, snapshot, remainingCashFlow, foundationComplete) {
  const settings = snapshot.fireSettings || {};
  const userAllocation = getUserAllocation(settings, key);

  switch (key) {
    case 'highInterestDebt': {
      const highInterestDebts = snapshot.debts.filter(d => d.balance > 0 && d.interestRate > 10);
      const highInterestTotal = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
      const isComplete = highInterestTotal === 0;

      // Calculate allocation based on user setting
      // null = all remaining (aggressive), number = specific extra amount
      let allocation = 0;
      if (!isComplete && foundationComplete && remainingCashFlow > 0) {
        if (userAllocation === null || userAllocation === undefined) {
          allocation = remainingCashFlow; // All remaining (default aggressive)
        } else {
          allocation = Math.min(remainingCashFlow, userAllocation); // User-specified amount
        }
      }

      return {
        key,
        title: 'High-Interest Debt',
        description: BOX_DESCRIPTIONS.highInterestDebt,
        status: isComplete ? 'COMPLETED' : (foundationComplete && remainingCashFlow > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
        allocated: allocation,
        remaining: remainingCashFlow - allocation,
        userAllocation: userAllocation,
        details: {
          debts: highInterestDebts,
          totalBalance: highInterestTotal,
          threshold: '>10%',
        },
      };
    }

    case 'hsaIra': {
      // Read allocations from Tax Destiny tab (source of truth for tax-advantaged contributions)
      const taxAlloc = (snapshot.taxDestiny || {}).allocations || {};
      const hsaMonthly = taxAlloc.hsa || 0;
      const tradIraMonthly = taxAlloc.traditionalIra || 0;
      const rothIraMonthly = taxAlloc.rothIra || 0;
      const iraMonthly = tradIraMonthly + rothIraMonthly;
      const maxTarget = hsaMonthly + iraMonthly;

      // Allocation is whatever the user set in Tax Destiny, capped by available cash flow
      let allocation = 0;
      if (foundationComplete && remainingCashFlow > 0 && maxTarget > 0) {
        allocation = Math.min(remainingCashFlow, maxTarget);
      }

      return {
        key,
        title: 'HSA & IRA',
        description: BOX_DESCRIPTIONS.hsaIra,
        status: foundationComplete && remainingCashFlow > 0 && maxTarget > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        allocated: allocation,
        remaining: remainingCashFlow - allocation,
        userAllocation: maxTarget, // Driven by Tax Destiny
        details: {
          hsaLimit: CONTRIBUTION_LIMITS.HSA_INDIVIDUAL,
          hsaMonthly: Math.round(hsaMonthly),
          iraMonthly: Math.round(iraMonthly),
          maxTarget: Math.round(maxTarget),
          drivenByTaxDestiny: true,
        },
      };
    }

    case 'moderateDebt': {
      const moderateDebts = snapshot.debts.filter(d =>
        d.balance > 0 &&
        d.interestRate >= 5 &&
        d.interestRate <= 10 &&
        d.category !== 'MORTGAGE'
      );
      const moderateTotal = moderateDebts.reduce((sum, d) => sum + d.balance, 0);
      const isComplete = moderateTotal === 0;

      // Calculate allocation based on user setting
      // null = all remaining (aggressive), number = specific extra amount
      let allocation = 0;
      if (!isComplete && foundationComplete && remainingCashFlow > 0) {
        if (userAllocation === null || userAllocation === undefined) {
          allocation = remainingCashFlow; // All remaining (default aggressive)
        } else {
          allocation = Math.min(remainingCashFlow, userAllocation); // User-specified amount
        }
      }

      return {
        key,
        title: 'Moderate Debt',
        description: BOX_DESCRIPTIONS.moderateDebt,
        status: isComplete ? 'COMPLETED' : (foundationComplete && remainingCashFlow > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
        allocated: allocation,
        remaining: remainingCashFlow - allocation,
        userAllocation: userAllocation,
        details: {
          debts: moderateDebts,
          totalBalance: moderateTotal,
          threshold: '5-10%',
        },
      };
    }

    case 'max401k': {
      // Read allocation from Tax Destiny tab (source of truth for 401k contributions)
      const taxAlloc401k = (snapshot.taxDestiny || {}).allocations || {};
      const fourOhOneKMonthly = taxAlloc401k.fourOhOneK || 0;
      const maxTarget = fourOhOneKMonthly;

      // Allocation is whatever the user set in Tax Destiny, capped by available cash flow
      let allocation = 0;
      if (foundationComplete && remainingCashFlow > 0 && maxTarget > 0) {
        allocation = Math.min(remainingCashFlow, maxTarget);
      }

      return {
        key,
        title: 'Max 401k',
        description: BOX_DESCRIPTIONS.max401k,
        status: foundationComplete && remainingCashFlow > 0 && maxTarget > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        allocated: allocation,
        remaining: remainingCashFlow - allocation,
        userAllocation: maxTarget, // Driven by Tax Destiny
        details: {
          fourOhOneKLimit: CONTRIBUTION_LIMITS.FOUR_OH_ONE_K,
          fourOhOneKMonthly: Math.round(fourOhOneKMonthly),
          maxTarget: Math.round(maxTarget),
          drivenByTaxDestiny: true,
        },
      };
    }

    case 'taxableInvesting': {
      // Taxable investing gets remaining cash flow (user can limit if desired)
      let allocation = 0;
      if (foundationComplete && remainingCashFlow > 0) {
        if (userAllocation === null || userAllocation === undefined) {
          allocation = remainingCashFlow; // All remaining (default)
        } else {
          allocation = Math.min(remainingCashFlow, userAllocation); // User-specified amount
        }
      }

      return {
        key,
        title: 'Taxable Investing',
        description: BOX_DESCRIPTIONS.taxableInvesting,
        status: (foundationComplete && allocation > 0) ? 'IN_PROGRESS' : 'NOT_STARTED',
        allocated: allocation,
        remaining: remainingCashFlow - allocation,
        userAllocation: userAllocation,
        details: {
          available: Math.max(0, remainingCashFlow),
        },
      };
    }

    default:
      return null;
  }
}

// Calculate all flexible boxes in user's preferred order
function calculateFlexibleBoxes(snapshot, remainingCashFlow, foundationComplete) {
  const order = getFlexibleBoxOrder();
  const boxes = [];
  let currentRemaining = remainingCashFlow;

  for (const key of order) {
    const box = calculateFlexibleBox(key, snapshot, currentRemaining, foundationComplete);
    if (box) {
      boxes.push(box);
      // Always update remaining cash flow from box's remaining value
      // This ensures cash flows through completed boxes to the next priority
      currentRemaining = box.remaining;
    }
  }

  return boxes;
}

// Full waterfall calculation (for backwards compatibility with projections.js)
function calculateCashFlowWaterfall(snapshot) {
  const foundation = calculateFoundationBoxes(snapshot);
  const flexible = calculateFlexibleBoxes(snapshot, foundation.remainingCashFlow, foundation.foundationComplete);

  // Combine into single boxes array with IDs for compatibility
  const allBoxes = [
    ...foundation.boxes,
    ...flexible.map((box, i) => ({ ...box, id: 5 + i })),
  ];

  return {
    initialCashFlow: foundation.initialCashFlow,
    boxes: allBoxes,
    remainingCashFlow: flexible.length > 0 ? flexible[flexible.length - 1].remaining : foundation.remainingCashFlow,
  };
}

// Render a foundation box (compact, horizontal layout)
function renderFoundationBox(box, snapshot) {
  const settings = snapshot.fireSettings || {};

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'fire-box-completed';
      case 'IN_PROGRESS': return 'fire-box-progress';
      case 'NOT_APPLICABLE': return 'fire-box-na';
      default: return 'fire-box-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'IN_PROGRESS': return '→';
      case 'NOT_APPLICABLE': return '—';
      default: return box.id;
    }
  };

  let content = '';

  switch (box.key) {
    case 'essentials':
      content = `
        <p class="fire-foundation-status ${box.status === 'COMPLETED' ? 'text-success' : 'text-danger'}">
          ${box.details.message}
        </p>
      `;
      break;

    case 'starterEF':
      content = `
        <div class="fire-foundation-row">
          <span>$${box.details.current.toLocaleString()} / $${box.details.target.toLocaleString()}</span>
        </div>
        ${box.allocated > 0 ? `<div class="fire-foundation-alloc">+$${Math.round(box.allocated).toLocaleString()}/mo</div>` : ''}
      `;
      break;

    case 'employerMatch':
      content = `
        <div class="fire-match-section">
          <!-- HSA Match -->
          <div class="fire-match-row">
            <label class="fire-toggle-mini">
              <input type="checkbox"
                ${settings.hasHsaMatch ? 'checked' : ''}
                onchange="updateFireSettings({ hasHsaMatch: this.checked, isGettingHsaMatch: false })"
              >
              <span>HSA</span>
            </label>
            ${settings.hasHsaMatch ? `
              <div class="fire-match-details">
                <div class="fire-match-percent">
                  <input type="number"
                    class="fire-match-input"
                    value="${settings.hsaMatchPercent || 4}"
                    min="1"
                    max="100"
                    onchange="updateFireSettings({ hsaMatchPercent: Number(this.value) })"
                  >
                  <span>%</span>
                </div>
                <label class="fire-toggle-mini">
                  <input type="checkbox"
                    ${settings.isGettingHsaMatch ? 'checked' : ''}
                    onchange="updateFireSettings({ isGettingHsaMatch: this.checked })"
                  >
                  <span>Via payroll</span>
                </label>
                ${!settings.isGettingHsaMatch ? `
                  <span class="fire-match-amount">$${box.details.hsaMatchContribMonthly}/mo</span>
                ` : ''}
              </div>
            ` : ''}
          </div>
          <!-- 401k Match -->
          <div class="fire-match-row">
            <label class="fire-toggle-mini">
              <input type="checkbox"
                ${settings.has401kMatch ? 'checked' : ''}
                onchange="updateFireSettings({ has401kMatch: this.checked, isGetting401kMatch: false })"
              >
              <span>401k</span>
            </label>
            ${settings.has401kMatch ? `
              <div class="fire-match-details">
                <div class="fire-match-percent">
                  <input type="number"
                    class="fire-match-input"
                    value="${settings.fourOhOneKMatchPercent || 4}"
                    min="1"
                    max="100"
                    onchange="updateFireSettings({ fourOhOneKMatchPercent: Number(this.value) })"
                  >
                  <span>%</span>
                </div>
                <label class="fire-toggle-mini">
                  <input type="checkbox"
                    ${settings.isGetting401kMatch ? 'checked' : ''}
                    onchange="updateFireSettings({ isGetting401kMatch: this.checked })"
                  >
                  <span>Via payroll</span>
                </label>
                ${!settings.isGetting401kMatch ? `
                  <span class="fire-match-amount">$${box.details.fourOhOneKMatchContribMonthly}/mo</span>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>
        ${box.allocated > 0 ? `<div class="fire-foundation-alloc">+$${Math.round(box.allocated).toLocaleString()}/mo needed</div>` : ''}
      `;
      break;

    case 'fullEF':
      content = `
        <div class="fire-foundation-controls">
          <div class="fire-ef-toggle">
            <button class="fire-ef-btn ${settings.emergencyFundMonths === 3 ? 'active' : ''}"
              onclick="updateFireSettings({ emergencyFundMonths: 3 })">3mo</button>
            <button class="fire-ef-btn ${settings.emergencyFundMonths === 6 ? 'active' : ''}"
              onclick="updateFireSettings({ emergencyFundMonths: 6 })">6mo</button>
          </div>
        </div>
        <div class="fire-foundation-row">
          <span>$${box.details.current.toLocaleString()} / $${box.details.target.toLocaleString()}</span>
        </div>
        ${box.allocated > 0 ? `<div class="fire-foundation-alloc">+$${Math.round(box.allocated).toLocaleString()}/mo</div>` : ''}
      `;
      break;
  }

  // Map foundation box keys to tooltip keys
  const tooltipKey = {
    'essentials': 'essentialsBox',
    'starterEF': 'starterEFBox',
    'employerMatch': 'employerMatchBox',
    'fullEF': 'fullEFBox'
  }[box.key] || box.key + 'Box';

  return `
    <div class="fire-foundation-box ${getStatusClass(box.status)}">
      <div class="fire-foundation-header">
        <span class="fire-foundation-num">${getStatusIcon(box.status)}</span>
        <span class="fire-foundation-title">${typeof renderTooltip === 'function' ? renderTooltip(tooltipKey, box.title, {}) : box.title}</span>
      </div>
      <div class="fire-foundation-content">
        ${content}
      </div>
    </div>
  `;
}

// Render a flexible box (full width, with description and drag handle)
// isCompleted = true means the box is done and should be fixed at top (non-draggable)
function renderFlexibleBox(box, snapshot, index, cashFlowBefore, isCompleted = false) {
  const settings = snapshot.fireSettings || {};

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'fire-flex-completed';
      case 'IN_PROGRESS': return 'fire-flex-progress';
      default: return 'fire-flex-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'IN_PROGRESS': return '→';
      default: return (index + 5);
    }
  };

  const noFundsRemaining = cashFlowBefore <= 0 && box.status !== 'COMPLETED';

  // Map flexible box keys to tooltip keys
  const tooltipKeyMap = {
    'highInterestDebt': 'highInterestDebtBox',
    'hsaIra': 'hsaIraBox',
    'moderateDebt': 'moderateDebtBox',
    'max401k': 'max401kBox',
    'taxableInvesting': 'taxableInvestingBox'
  };
  const flexTooltipKey = tooltipKeyMap[box.key] || box.key + 'Box';

  // Helper to render the allocation control for any box
  const allocations = settings.allocations || {};
  const currentAllocation = allocations[box.key];
  const isAllRemaining = currentAllocation === null || currentAllocation === undefined;

  const renderAllocationControl = (boxKey, label = 'Extra monthly') => {
    return `
      <div class="fire-flex-allocation">
        <div class="fire-flex-allocation-toggle">
          <label class="fire-toggle-mini">
            <input type="checkbox"
              ${isAllRemaining ? 'checked' : ''}
              onchange="updateBoxAllocation('${boxKey}', this.checked ? null : 0)"
            >
            <span>All available</span>
          </label>
        </div>
        ${!isAllRemaining ? `
          <div class="fire-flex-allocation-input">
            <label class="fire-flex-input-label">${label}:</label>
            <span class="fire-flex-input-prefix">$</span>
            <input type="number"
              class="fire-flex-input fire-flex-allocation-amount"
              value="${currentAllocation || ''}"
              placeholder="0"
              min="0"
              onchange="updateBoxAllocation('${boxKey}', Number(this.value) || 0)"
            >
            <span class="fire-flex-input-suffix">/mo</span>
          </div>
        ` : ''}
      </div>
    `;
  };

  let controls = '';

  switch (box.key) {
    case 'highInterestDebt':
    case 'moderateDebt':
      const debts = box.details.debts;
      controls = `
        <div class="fire-flex-threshold">${box.details.threshold} interest</div>
        ${debts.length > 0 ? `
          <div class="fire-flex-debt-list">
            ${debts.slice(0, 3).map(d => `
              <div class="fire-flex-debt-item">
                <span>${d.label}</span>
                <span>$${d.balance.toLocaleString()} @ ${d.interestRate}%</span>
              </div>
            `).join('')}
            ${debts.length > 3 ? `<div class="fire-flex-debt-more">+${debts.length - 3} more</div>` : ''}
          </div>
          <div class="fire-flex-total">Total: $${box.details.totalBalance.toLocaleString()}</div>
          ${renderAllocationControl(box.key, 'Extra paydown')}
        ` : `
          <p class="fire-flex-empty">No debts in this range</p>
        `}
      `;
      break;

    case 'hsaIra':
      controls = `
        <div class="fire-flex-limits-detail">
          <div class="fire-flex-limit-row">
            <span class="fire-flex-limit-label">HSA:</span>
            <span class="fire-flex-limit-value">$${(box.details.hsaMonthly || 0).toLocaleString()}/mo</span>
          </div>
          <div class="fire-flex-limit-row">
            <span class="fire-flex-limit-label">IRA:</span>
            <span class="fire-flex-limit-value">$${(box.details.iraMonthly || 0).toLocaleString()}/mo</span>
          </div>
          <div class="fire-flex-limit-row fire-flex-limit-remaining">
            <span>Total:</span>
            <span>$${(box.details.maxTarget || 0).toLocaleString()}/mo</span>
          </div>
        </div>
        <div class="fire-flex-tax-destiny-link">
          Set in <a href="#" onclick="event.preventDefault(); if(typeof window.DashboardTabs !== 'undefined') window.DashboardTabs.switchTab('taxes');">Tax Destiny</a> tab
        </div>
      `;
      break;

    case 'max401k':
      controls = `
        <div class="fire-flex-limits-detail">
          <div class="fire-flex-limit-row">
            <span class="fire-flex-limit-label">401k:</span>
            <span class="fire-flex-limit-value">$${(box.details.fourOhOneKMonthly || 0).toLocaleString()}/mo</span>
          </div>
        </div>
        <div class="fire-flex-tax-destiny-link">
          Set in <a href="#" onclick="event.preventDefault(); if(typeof window.DashboardTabs !== 'undefined') window.DashboardTabs.switchTab('taxes');">Tax Destiny</a> tab
        </div>
      `;
      break;

    case 'taxableInvesting':
      controls = `
        <div class="fire-flex-invest-summary">
          ${isAllRemaining ? `
            <span>All remaining cash flow goes here</span>
          ` : `
            <span>Custom allocation</span>
          `}
        </div>
        ${renderAllocationControl(box.key, 'Monthly investment')}
      `;
      break;
  }

  // Completed boxes are fixed (non-draggable), active boxes are draggable
  if (isCompleted) {
    return `
      <div class="fire-flex-box fire-flex-completed fire-flex-fixed">
        <div class="fire-flex-main">
          <div class="fire-flex-fixed-icon" title="Completed">✓</div>
          <div class="fire-flex-content">
            <div class="fire-flex-header">
              <span class="fire-flex-num">✓</span>
              <span class="fire-flex-title">${typeof renderTooltip === 'function' ? renderTooltip(flexTooltipKey, box.title, {}) : box.title}</span>
            </div>
            <p class="fire-flex-description">${box.description}</p>
          </div>
        </div>
        <div class="fire-flex-cashflow fire-flex-cashflow-complete">
          <span class="fire-cashflow-complete-label">Complete</span>
        </div>
      </div>
    `;
  }

  // Active boxes (draggable)
  return `
    <div class="fire-flex-box ${getStatusClass(box.status)} ${noFundsRemaining ? 'fire-flex-no-funds' : ''}"
         draggable="true"
         data-key="${box.key}"
         ondragstart="handleDragStart(event)"
         ondragover="handleDragOver(event)"
         ondrop="handleDrop(event)"
         ondragend="handleDragEnd(event)">
      <div class="fire-flex-main">
        <div class="fire-flex-drag-handle" title="Drag to reorder">⋮⋮</div>
        <div class="fire-flex-content">
          <div class="fire-flex-header">
            <span class="fire-flex-num">${getStatusIcon(box.status)}</span>
            <span class="fire-flex-title">${typeof renderTooltip === 'function' ? renderTooltip(flexTooltipKey, box.title, {}) : box.title}</span>
          </div>
          <p class="fire-flex-description">${box.description}</p>
          <div class="fire-flex-controls">
            ${controls}
          </div>
        </div>
      </div>
      <div class="fire-flex-cashflow">
        <div class="fire-cashflow-row">
          <span class="fire-cashflow-label">Available:</span>
          <span class="fire-cashflow-value">${cashFlowBefore > 0 ? '$' + Math.round(cashFlowBefore).toLocaleString() : '$0'}</span>
        </div>
        ${box.allocated > 0 ? `
          <div class="fire-cashflow-row fire-cashflow-alloc">
            <span class="fire-cashflow-label">Allocate:</span>
            <span class="fire-cashflow-value">-$${Math.round(box.allocated).toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="fire-cashflow-row fire-cashflow-remaining">
          <span class="fire-cashflow-label">Remaining:</span>
          <span class="fire-cashflow-value ${box.remaining > 0 ? 'text-success' : ''}">${box.remaining > 0 ? '$' + Math.round(box.remaining).toLocaleString() : '$0'}</span>
        </div>
      </div>
    </div>
  `;
}

// Drag and drop handlers (global scope for inline event handlers)
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target.closest('.fire-flex-box');
  if (draggedElement) {
    draggedElement.classList.add('fire-flex-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedElement.dataset.key);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const target = e.target.closest('.fire-flex-box');
  if (target && target !== draggedElement) {
    // Add visual indicator
    target.classList.add('fire-flex-drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();

  const target = e.target.closest('.fire-flex-box');
  if (target && target !== draggedElement && draggedElement) {
    if (typeof Debug !== 'undefined') Debug.event('Drag-and-drop: reordering boxes');

    // Get current order
    const currentOrder = getFlexibleBoxOrder();
    const draggedKey = draggedElement.dataset.key;
    const targetKey = target.dataset.key;

    // Reorder
    const draggedOrderIndex = currentOrder.indexOf(draggedKey);
    const targetOrderIndex = currentOrder.indexOf(targetKey);

    currentOrder.splice(draggedOrderIndex, 1);
    currentOrder.splice(targetOrderIndex, 0, draggedKey);

    // Save the new order
    saveFlexibleBoxOrder(currentOrder);

    // Save scroll position and active tab before re-render
    const scrollY = window.scrollY;
    const activeTab = document.querySelector('.dashboard-tab.active');
    const activeTabId = activeTab ? activeTab.dataset.tab : null;

    if (typeof Debug !== 'undefined') Debug.log(`Preserving scroll position: ${scrollY}, active tab: ${activeTabId}`);

    // Trigger re-render
    if (typeof showDashboard === 'function') {
      showDashboard();
    }

    // Restore scroll position and active tab after DOM update
    setTimeout(() => {
      window.scrollTo(0, scrollY);
      // Restore active tab if tab navigation exists
      if (activeTabId && typeof window.DashboardTabs !== 'undefined' && window.DashboardTabs.switchTab) {
        window.DashboardTabs.switchTab(activeTabId);
      }
      if (typeof Debug !== 'undefined') Debug.success('Scroll position restored after drag-and-drop');
    }, 10);
  }

  // Clean up
  document.querySelectorAll('.fire-flex-drag-over').forEach(el => {
    el.classList.remove('fire-flex-drag-over');
  });
}

function handleDragEnd() {
  if (draggedElement) {
    draggedElement.classList.remove('fire-flex-dragging');
  }
  document.querySelectorAll('.fire-flex-drag-over').forEach(el => {
    el.classList.remove('fire-flex-drag-over');
  });
  draggedElement = null;
}

// Render the full FIRE Journey component
function renderFireJourney(snapshot) {
  const foundation = calculateFoundationBoxes(snapshot);
  const flexibleBoxes = calculateFlexibleBoxes(snapshot, foundation.remainingCashFlow, foundation.foundationComplete);

  // Separate completed boxes from non-completed boxes
  const completedBoxes = flexibleBoxes.filter(box => box.status === 'COMPLETED');
  const activeBoxes = flexibleBoxes.filter(box => box.status !== 'COMPLETED');

  // Calculate cash flow at each step for the sidebar (only active boxes use cash flow)
  let runningCashFlow = foundation.remainingCashFlow;
  const activeWithCashFlow = activeBoxes.map(box => {
    const cashFlowBefore = runningCashFlow;
    if (box.allocated > 0) {
      runningCashFlow = box.remaining;
    }
    return { box, cashFlowBefore, isCompleted: false };
  });

  // Completed boxes have no cash flow allocation (they're done)
  const completedWithCashFlow = completedBoxes.map(box => ({
    box,
    cashFlowBefore: 0,
    isCompleted: true,
  }));

  return `
    <div class="card mb-6">
      <div class="fire-journey-header">
        <h3 class="panel-header">FIRE Journey Progress</h3>
        <div class="fire-cashflow-badge">
          Monthly Cash Flow: <strong>$${foundation.initialCashFlow.toLocaleString()}</strong>
        </div>
      </div>

      <!-- Foundation Section (Fixed) -->
      <div class="fire-foundation-section">
        <div class="fire-section-label">
          <span class="fire-section-label-text">Foundation</span>
          <span class="fire-section-label-hint">Complete these first</span>
        </div>
        <div class="fire-foundation-grid">
          ${foundation.boxes.map(box => renderFoundationBox(box, snapshot)).join('')}
        </div>
        ${!foundation.foundationComplete ? `
          <div class="fire-foundation-warning">
            Complete your foundation before prioritizing flexible goals
          </div>
        ` : ''}
      </div>

      <!-- Arrow between sections -->
      <div class="fire-section-arrow">
        <span class="fire-section-arrow-icon">↓</span>
        <span class="fire-section-arrow-amount">$${Math.round(foundation.remainingCashFlow).toLocaleString()}/mo remaining</span>
      </div>

      <!-- Flexible Section (Reorderable) -->
      <div class="fire-flexible-section">
        <div class="fire-section-label">
          <span class="fire-section-label-text">Your Priorities</span>
          <span class="fire-section-label-hint">${activeBoxes.length > 0 ? 'Drag to reorder' : 'All complete!'}</span>
        </div>
        <div class="fire-flexible-list">
          ${completedWithCashFlow.length > 0 ? `
            <!-- Completed boxes (fixed at top, non-draggable) -->
            ${completedWithCashFlow.map(({ box }, index) =>
              renderFlexibleBox(box, snapshot, index, 0, true)
            ).join('')}
          ` : ''}
          ${activeWithCashFlow.length > 0 ? `
            <!-- Active boxes (draggable) -->
            ${activeWithCashFlow.map(({ box, cashFlowBefore }, index) =>
              renderFlexibleBox(box, snapshot, completedWithCashFlow.length + index, cashFlowBefore, false)
            ).join('')}
          ` : ''}
        </div>
      </div>

      <!-- Legend -->
      <div class="fire-legend">
        <div class="legend-item">
          <div class="legend-box fire-box-completed"></div>
          <span>Completed</span>
        </div>
        <div class="legend-item">
          <div class="legend-box fire-box-progress"></div>
          <span>In Progress</span>
        </div>
        <div class="legend-item">
          <div class="legend-box fire-box-pending"></div>
          <span>Waiting</span>
        </div>
      </div>
    </div>
  `;
}
