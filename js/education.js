/**
 * education.js
 * Educational content library and tooltip system for Financial GPS
 * Provides contextual learning moments for financial concepts
 *
 * DISCLAIMER: All content provided is for educational purposes only and does
 * not constitute financial, investment, tax, or legal advice. Financial GPS
 * is not a registered investment advisor. Past performance does not guarantee
 * future results. Consult with a qualified financial professional before
 * making financial decisions.
 */

// ===========================
// EDUCATIONAL CONTENT LIBRARY
// ===========================

const EDUCATION_CONTENT = {
  // ============================================
  // METRICS TOOLTIPS
  // ============================================

  debtToIncome: {
    title: 'Debt-to-Income Ratio (DTI)',
    explanation: 'Your monthly debt payments divided by your gross monthly income. Lenders use this to assess creditworthiness.',
    benchmark: [
      { range: '< 36%', label: 'Healthy', color: 'success', icon: '\u2713' },
      { range: '36-43%', label: 'Manageable', color: 'gold', icon: '\u26A0' },
      { range: '> 43%', label: 'High Risk', color: 'danger', icon: '\u26D4' }
    ],
    context: (value) => {
      if (value < 36) {
        return 'Your DTI is healthy. You have good financial flexibility and should qualify for favorable loan terms.';
      } else if (value < 43) {
        return 'Your DTI is manageable but approaching the threshold lenders consider risky. Focus on debt reduction.';
      } else {
        return 'Your DTI is high. Prioritize paying down debt before taking on new obligations. This limits your borrowing power.';
      }
    }
  },

  netWorth: {
    title: 'Net Worth',
    explanation: 'Your total assets (investments, savings, property) minus total debts. This is the single most important metric for tracking financial progress.',
    benchmark: [
      { range: 'Age x Income / 10', label: 'On Track', color: 'success', icon: '\u2713' },
      { range: 'Below formula', label: 'Behind', color: 'gold', icon: '\u26A0' },
      { range: 'Negative', label: 'Action Needed', color: 'danger', icon: '\u26D4' }
    ],
    context: (value, age, income) => {
      const expectedNetWorth = (age * income) / 10;
      const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
      if (value >= expectedNetWorth) {
        return `Your net worth of ${formatCurrency(value)} is on track or ahead for your age and income. Keep building!`;
      } else if (value > 0) {
        return `Your net worth is ${formatCurrency(expectedNetWorth - value)} below the expected amount for your age and income. Focus on saving and investing more.`;
      } else {
        return 'Your net worth is negative, meaning debts exceed assets. Prioritize building an emergency fund and paying down high-interest debt.';
      }
    }
  },

  fragility: {
    title: 'Financial Fragility Score',
    explanation: 'Measures how vulnerable you are to financial shocks (job loss, medical emergency). Based on emergency fund coverage, debt burden, and savings rate.',
    benchmark: [
      { range: 'Solid', label: '6+ months expenses saved', color: 'success', icon: '\u{1F6E1}' },
      { range: 'Moderate', label: '3-6 months expenses', color: 'gold', icon: '\u26A0' },
      { range: 'Fragile', label: '< 3 months expenses', color: 'danger', icon: '\u26A1' }
    ],
    context: (level) => {
      if (level === 'SOLID' || level === 'Solid') {
        return 'You have a strong financial buffer. You could weather most emergencies without going into debt.';
      } else if (level === 'MODERATE' || level === 'Moderate') {
        return 'You have some cushion, but an extended job loss or major emergency could strain your finances. Build your emergency fund.';
      } else {
        return 'You are vulnerable to financial shocks. Prioritize building a 3-6 month emergency fund before aggressive investing.';
      }
    }
  },

  savingsRate: {
    title: 'Savings Rate',
    explanation: 'The percentage of your take-home pay that you save/invest each month. This is the #1 predictor of how quickly you\'ll reach financial independence.',
    benchmark: [
      { range: '< 10%', label: 'Slow Progress', color: 'danger', icon: '\u{1F40C}' },
      { range: '10-20%', label: 'Good Start', color: 'gold', icon: '\u{1F44D}' },
      { range: '20-50%', label: 'Excellent', color: 'success', icon: '\u{1F680}' },
      { range: '> 50%', label: 'FIRE Fast Track', color: 'success', icon: '\u{1F525}' }
    ],
    context: (value) => {
      if (value < 10) {
        return 'Your savings rate is low. Small increases (even 1-2%) compound dramatically over time. Look for expense reduction opportunities.';
      } else if (value < 20) {
        return 'You\'re on the right track. Aim to increase this by 5% per year through raises or expense reduction.';
      } else if (value < 50) {
        return 'Excellent savings rate! You\'re building wealth at an above-average pace. Maintain this discipline.';
      } else {
        return 'Incredible savings rate! At this pace and assuming average historical market returns, you could reach financial independence in 10-15 years.';
      }
    }
  },

  // ============================================
  // INPUT FIELD TOOLTIPS
  // ============================================

  monthlyTakeHome: {
    title: 'Monthly Take-Home Pay',
    explanation: 'Your net income after taxes, 401(k) contributions, health insurance, and other payroll deductions. This is what actually hits your bank account.',
    tip: 'If your income varies, use your average over the last 6 months. Include side hustle income if it\'s reliable.'
  },

  monthlyExpense: {
    title: 'Monthly Expenses',
    explanation: 'Your total spending each month, including rent/mortgage, utilities, groceries, transportation, entertainment, subscriptions, and everything else.',
    tip: 'Review 3 months of credit card and bank statements to get an accurate number. Many people underestimate their actual spending.'
  },

  targetRetirement: {
    title: 'Target Retirement Age',
    explanation: 'The age you want to achieve financial independence and have the option to stop working. This doesn\'t mean you will stop working, just that you could.',
    tip: 'Traditional retirement is 65, but FIRE enthusiasts often target 40-55. Be ambitious but realistic based on your savings rate.'
  },

  employerMatch: {
    title: '401(k) Employer Match',
    explanation: 'Free money from your employer matching your 401(k) contributions. Common match: 50% of contributions up to 6% of salary.',
    tip: 'ALWAYS capture the full match. It provides an immediate 50-100% benefit from employer matching. Check your benefits portal for details.'
  },

  // ============================================
  // FIRE BOX TOOLTIPS
  // ============================================

  essentialsBox: {
    title: 'Cover Essentials',
    explanation: 'Your foundation: rent, utilities, groceries, minimum debt payments. If you can\'t cover essentials, you need immediate income or expense action.',
    priority: 'Priority #1 - Non-negotiable',
    action: 'If you can\'t cover essentials, consider: second job, roommate, move to cheaper housing, food assistance programs.'
  },

  starterEFBox: {
    title: 'Starter Emergency Fund ($1,000)',
    explanation: 'A small buffer to prevent new debt when minor emergencies happen (car repair, medical bill). Keeps you from sliding backwards.',
    priority: 'Priority #2 - Critical foundation',
    action: 'Save $1,000 as fast as possible. Park it in a high-yield savings account. This is your "don\'t go into debt" insurance.'
  },

  employerMatchBox: {
    title: 'Employer 401(k) Match',
    explanation: 'Contribute enough to your 401(k) to get the full employer match. This provides an immediate 50-100% benefit on your contributions.',
    priority: 'Priority #3 - Free money',
    action: 'Check your benefits portal to see your match formula (e.g., "50% match up to 6% of salary"). Contribute at least that amount.'
  },

  fullEFBox: {
    title: 'Full Emergency Fund (3-6 Months)',
    explanation: 'Enough savings to cover 3-6 months of expenses. This protects you from job loss, medical emergencies, or major repairs without debt.',
    priority: 'Priority #4 - Financial security',
    action: 'Aim for 6 months if single income or volatile industry, 3 months if dual income. Keep in high-yield savings for easy access.'
  },

  highInterestDebtBox: {
    title: 'High-Interest Debt (7%+)',
    explanation: 'Debt with interest rates above 7% (credit cards, payday loans, some auto loans). This is an emergency - you\'re losing wealth every month.',
    priority: 'Flexible Priority - Often #5',
    action: 'Pay minimums on everything, then avalanche (highest rate first) or snowball (smallest balance first) to build momentum.'
  },

  hsaIraBox: {
    title: 'HSA & IRA Contributions',
    explanation: 'Tax-advantaged retirement accounts. HSA is triple tax-advantaged (deductible, grows tax-free, withdrawals tax-free for medical). IRA reduces current taxes.',
    priority: 'Flexible Priority - Often #6',
    action: 'Max HSA first ($4,300 individual, $8,550 family). Then Roth IRA if income allows ($7,000/year). Automate monthly contributions.'
  },

  moderateDebtBox: {
    title: 'Moderate-Interest Debt (3-7%)',
    explanation: 'Debt with moderate interest rates (student loans, auto loans, mortgage). Debatable whether to pay off aggressively or invest instead.',
    priority: 'Flexible Priority - Often #7',
    action: 'If rate < 5%, consider minimum payments and investing the difference. If rate > 5%, lean toward payoff for the certain interest savings.'
  },

  max401kBox: {
    title: 'Max Out 401(k)',
    explanation: 'Contribute the IRS maximum to your 401(k) ($23,500 in 2025). Massive tax savings and forced savings make this a FIRE accelerator.',
    priority: 'Flexible Priority - Often #8',
    action: 'Increase contribution percentage until you hit the annual max. Use windfalls (bonus, tax refund) to jump-start this.'
  },

  taxableInvestingBox: {
    title: 'Taxable Investing',
    explanation: 'Investing in regular brokerage accounts after maxing tax-advantaged accounts. More flexible (no withdrawal penalties) but less tax-efficient.',
    priority: 'Flexible Priority - Often #9-10',
    action: 'Open brokerage account, invest in low-cost index funds (VTSAX, VTI). This is your "early retirement bridge" before age 59.5.'
  }
};

/**
 * Get education content for a specific topic
 * @param {string} topic - The topic key
 * @param {Object} userData - User's data for personalized context
 * @returns {Object} Education content
 */
function getEducationContent(topic, userData = {}) {
  const content = EDUCATION_CONTENT[topic];
  if (!content) {
    return null;
  }

  // If content has a context function, execute it with user data
  if (content.context && typeof content.context === 'function') {
    return {
      ...content,
      personalizedContext: content.context(userData.value, userData.age, userData.income)
    };
  }

  return content;
}

/**
 * Safely escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Render benchmark indicators
 * @param {Array} benchmarks - Array of benchmark objects
 * @returns {string} HTML for benchmarks
 */
function renderBenchmarks(benchmarks) {
  if (!benchmarks || benchmarks.length === 0) {
    return '';
  }

  return `
    <div class="tooltip-benchmarks">
      ${benchmarks.map(b => `
        <div class="tooltip-benchmark tooltip-benchmark-${escapeHtml(b.color)}">
          <span class="benchmark-icon">${escapeHtml(b.icon)}</span>
          <span class="benchmark-range">${escapeHtml(b.range)}</span>
          <span class="benchmark-label">${escapeHtml(b.label)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render a tooltip component
 * @param {string} topic - The topic key
 * @param {string} label - The visible label to attach tooltip to
 * @param {Object} userData - User's data for context
 * @returns {string} HTML for tooltip
 */
function renderTooltip(topic, label, userData = {}) {
  const content = getEducationContent(topic, userData);
  if (!content) {
    return escapeHtml(label);
  }

  const safeLabel = escapeHtml(label);
  const safeTitle = escapeHtml(content.title);
  const safeExplanation = escapeHtml(content.explanation);
  const safeContext = content.personalizedContext ? escapeHtml(content.personalizedContext) : '';
  const safeTip = content.tip ? escapeHtml(content.tip) : '';
  const safePriority = content.priority ? escapeHtml(content.priority) : '';
  const safeAction = content.action ? escapeHtml(content.action) : '';

  return `
    <span class="tooltip-wrapper" tabindex="0" role="button" aria-describedby="tooltip-${topic}">
      <span class="tooltip-trigger">${safeLabel} <span class="info-icon" aria-hidden="true">i</span></span>
      <div class="tooltip-popup" id="tooltip-${topic}" role="tooltip" aria-hidden="true">
        <div class="tooltip-header">
          <strong>${safeTitle}</strong>
        </div>
        <div class="tooltip-body">
          <p>${safeExplanation}</p>
          ${renderBenchmarks(content.benchmark)}
          ${safeContext ? `<p class="tooltip-context"><strong>Your Situation:</strong> ${safeContext}</p>` : ''}
          ${safePriority ? `<p class="tooltip-priority"><strong>Priority:</strong> ${safePriority}</p>` : ''}
          ${safeTip ? `<p class="tooltip-tip"><strong>Tip:</strong> ${safeTip}</p>` : ''}
          ${safeAction ? `<p class="tooltip-action"><strong>Action:</strong> ${safeAction}</p>` : ''}
        </div>
      </div>
    </span>
  `;
}

// ===========================
// TOOLTIP POSITIONING
// ===========================

/**
 * Position tooltip to prevent viewport overflow
 * Uses fixed positioning for reliable placement regardless of parent overflow
 * @param {HTMLElement} wrapper - The tooltip wrapper element
 */
function positionTooltip(wrapper) {
  const popup = wrapper.querySelector('.tooltip-popup');
  if (!popup) return;

  // Reset any previous positioning
  popup.classList.remove('tooltip-popup-bottom');
  popup.style.top = '';
  popup.style.left = '';
  popup.style.maxHeight = '';

  // Get the wrapper's position relative to viewport
  const wrapperRect = wrapper.getBoundingClientRect();
  const popupWidth = 320; // Default tooltip width from CSS
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 16; // Minimum padding from viewport edge
  const gap = 8; // Gap between trigger and tooltip

  // Get actual popup height (temporarily show to measure)
  popup.style.visibility = 'hidden';
  popup.style.opacity = '0';
  popup.style.display = 'block';
  const popupHeight = popup.offsetHeight;
  popup.style.display = '';
  popup.style.visibility = '';
  popup.style.opacity = '';

  // Determine vertical position (above or below)
  const spaceAbove = wrapperRect.top - padding;
  const spaceBelow = viewportHeight - wrapperRect.bottom - padding;
  let top;
  let positionBelow = false;

  if (spaceAbove >= popupHeight + gap) {
    // Position above (default)
    top = wrapperRect.top - popupHeight - gap;
  } else if (spaceBelow >= popupHeight + gap) {
    // Position below
    top = wrapperRect.bottom + gap;
    positionBelow = true;
    popup.classList.add('tooltip-popup-bottom');
  } else {
    // Not enough space either way, position where there's more room
    if (spaceBelow > spaceAbove) {
      top = wrapperRect.bottom + gap;
      positionBelow = true;
      popup.classList.add('tooltip-popup-bottom');
    } else {
      top = wrapperRect.top - popupHeight - gap;
    }
  }

  // Clamp vertically so the tooltip stays fully within the viewport
  top = Math.max(padding, Math.min(top, viewportHeight - popupHeight - padding));

  // If tooltip is taller than the viewport, cap its height and scroll
  const maxAvailableHeight = viewportHeight - 2 * padding;
  if (popupHeight > maxAvailableHeight) {
    popup.style.maxHeight = `${maxAvailableHeight}px`;
    top = padding;
  }

  // Determine horizontal position (centered, but constrained to viewport)
  let left = wrapperRect.left + (wrapperRect.width / 2) - (popupWidth / 2);

  // Constrain to viewport
  if (left < padding) {
    left = padding;
  } else if (left + popupWidth > viewportWidth - padding) {
    left = viewportWidth - popupWidth - padding;
  }

  // Apply calculated position
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  if (typeof Debug !== 'undefined') {
    Debug.log(`Tooltip: positioned at (${Math.round(left)}, ${Math.round(top)}), ${positionBelow ? 'below' : 'above'}`);
  }
}

// ===========================
// MOBILE TOOLTIP HANDLING
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  // Handle mobile tap to toggle tooltips
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.tooltip-trigger');
    const wrapper = trigger ? trigger.closest('.tooltip-wrapper') : null;

    if (trigger && wrapper) {
      e.preventDefault();
      e.stopPropagation();

      // Toggle active state
      const isActive = wrapper.classList.contains('active');

      // Close all other tooltips
      document.querySelectorAll('.tooltip-wrapper.active').forEach(w => {
        w.classList.remove('active');
        const popup = w.querySelector('.tooltip-popup');
        if (popup) popup.setAttribute('aria-hidden', 'true');
      });

      // Toggle this tooltip
      if (!isActive) {
        wrapper.classList.add('active');
        positionTooltip(wrapper); // Position before showing
        const popup = wrapper.querySelector('.tooltip-popup');
        if (popup) popup.setAttribute('aria-hidden', 'false');
      }
    } else {
      // Click outside - close all tooltips
      const clickedInsidePopup = e.target.closest('.tooltip-popup');
      if (!clickedInsidePopup) {
        document.querySelectorAll('.tooltip-wrapper.active').forEach(w => {
          w.classList.remove('active');
          const popup = w.querySelector('.tooltip-popup');
          if (popup) popup.setAttribute('aria-hidden', 'true');
        });
      }
    }
  });

  // Handle hover for desktop - position tooltip on mouseenter
  document.addEventListener('mouseenter', (e) => {
    const wrapper = e.target.closest('.tooltip-wrapper');
    if (wrapper) {
      positionTooltip(wrapper);
    }
  }, true);

  // Keyboard accessibility - close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.tooltip-wrapper.active').forEach(w => {
        w.classList.remove('active');
        const popup = w.querySelector('.tooltip-popup');
        if (popup) popup.setAttribute('aria-hidden', 'true');
      });
    }
  });

  // Handle focus for keyboard navigation
  document.addEventListener('focusin', (e) => {
    const wrapper = e.target.closest('.tooltip-wrapper');
    if (wrapper) {
      positionTooltip(wrapper); // Position before showing
      const popup = wrapper.querySelector('.tooltip-popup');
      if (popup) popup.setAttribute('aria-hidden', 'false');
    }
  });

  document.addEventListener('focusout', (e) => {
    const wrapper = e.target.closest('.tooltip-wrapper');
    if (wrapper && !wrapper.contains(e.relatedTarget)) {
      wrapper.classList.remove('active');
      const popup = wrapper.querySelector('.tooltip-popup');
      if (popup) popup.setAttribute('aria-hidden', 'true');
    }
  });
});
