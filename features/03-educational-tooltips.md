# Feature 3: Educational Tooltips

## Vision

Financial terminology and concepts (DTI, fragility, FIRE boxes) are confusing to users unfamiliar with personal finance. Educational tooltips provide contextual learning moments that build financial literacy while users interact with the tool, transforming Financial GPS from a calculator into an educational experience.

## Goal

Implement an interactive tooltip system that:
- Explains complex financial metrics in plain language
- Provides benchmarks and context for user's specific values
- Appears on hover (desktop) or tap (mobile) for key terms
- Educates users on FIRE strategy priorities and trade-offs

## Success Metrics

**What Success Looks Like:**
- Users understand what metrics mean without leaving the app
- Reduced confusion about FIRE box prioritization
- Increased engagement time (users exploring tooltips)
- Positive feedback: "Now I understand what DTI means!"

**Acceptance Criteria:**
- [ ] 12+ tooltips covering key metrics, inputs, and FIRE boxes
- [ ] Tooltips appear on hover (desktop) with 300ms delay
- [ ] Tooltips appear on tap (mobile) and dismiss on second tap or outside click
- [ ] Each tooltip includes: title, explanation, benchmarks, personalized context
- [ ] Tooltips use color-coded benchmarks (green = healthy, yellow = caution, red = concern)
- [ ] Smooth animations (fade in/out)
- [ ] Accessible via keyboard (focus state)
- [ ] Does not obstruct important UI elements

---

## Implementation Plan

### 1. Create Education Content Library

**File:** `js/education.js` (new file)

**Purpose:** Centralized educational content for all tooltips

**Full Code:**

```javascript
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
      { range: '< 36%', label: 'Healthy', color: 'success', icon: '✓' },
      { range: '36-43%', label: 'Manageable', color: 'gold', icon: '⚠️' },
      { range: '> 43%', label: 'High Risk', color: 'danger', icon: '🔴' }
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
      { range: 'Age × Income ÷ 10', label: 'On Track', color: 'success', icon: '✓' },
      { range: 'Below formula', label: 'Behind', color: 'gold', icon: '⚠️' },
      { range: 'Negative', label: 'Action Needed', color: 'danger', icon: '🔴' }
    ],
    context: (value, age, income) => {
      const expectedNetWorth = (age * income) / 10;
      if (value >= expectedNetWorth) {
        return `Your net worth of ${formatCurrency(value)} is on track or ahead for your age and income. Keep building!`;
      } else if (value > 0) {
        return `Your net worth is ${formatCurrency(expectedNetWorth - value)} below the expected amount for your age and income. Focus on saving and investing more.`;
      } else {
        return `Your net worth is negative, meaning debts exceed assets. Prioritize building an emergency fund and paying down high-interest debt.`;
      }
    }
  },

  fragility: {
    title: 'Financial Fragility Score',
    explanation: 'Measures how vulnerable you are to financial shocks (job loss, medical emergency). Based on emergency fund coverage, debt burden, and savings rate.',
    benchmark: [
      { range: 'Low', label: '6+ months expenses saved', color: 'success', icon: '🛡️' },
      { range: 'Medium', label: '3-6 months expenses', color: 'gold', icon: '⚠️' },
      { range: 'High', label: '< 3 months expenses', color: 'danger', icon: '⚡' }
    ],
    context: (level) => {
      if (level === 'Low') {
        return 'You have a strong financial buffer. You could weather most emergencies without going into debt.';
      } else if (level === 'Medium') {
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
      { range: '< 10%', label: 'Slow Progress', color: 'danger', icon: '🐌' },
      { range: '10-20%', label: 'Good Start', color: 'gold', icon: '👍' },
      { range: '20-50%', label: 'Excellent', color: 'success', icon: '🚀' },
      { range: '> 50%', label: 'FIRE Fast Track', color: 'success', icon: '🔥' }
    ],
    context: (value) => {
      if (value < 10) {
        return 'Your savings rate is low. Small increases (even 1-2%) compound dramatically over time. Look for expense reduction opportunities.';
      } else if (value < 20) {
        return 'You\'re on the right track. Aim to increase this by 5% per year through raises or expense reduction.';
      } else if (value < 50) {
        return 'Excellent savings rate! You\'re building wealth at an above-average pace. Maintain this discipline.';
      } else {
        return 'Incredible savings rate! At this pace, you could reach financial independence in 10-15 years.';
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
    tip: 'Review 3 months of credit card and bank statements to get an accurate number. Most people underestimate this by 20-30%.'
  },

  targetRetirement: {
    title: 'Target Retirement Age',
    explanation: 'The age you want to achieve financial independence and have the option to stop working. This doesn\'t mean you will stop working, just that you could.',
    tip: 'Traditional retirement is 65, but FIRE enthusiasts often target 40-55. Be ambitious but realistic based on your savings rate.'
  },

  employerMatch: {
    title: '401(k) Employer Match',
    explanation: 'Free money from your employer matching your 401(k) contributions. Common match: 50% of contributions up to 6% of salary.',
    tip: 'ALWAYS capture the full match. It\'s an instant 50-100% return on investment. Check your benefits portal for details.'
  },

  // ============================================
  // FIRE BOX TOOLTIPS
  // ============================================

  essentialsBox: {
    title: 'Cover Essentials',
    explanation: 'Your foundation: rent, utilities, groceries, minimum debt payments. If you can\'t cover essentials, you need immediate income or expense action.',
    priority: 'Priority #1 - Non-negotiable',
    action: 'If you can\'t cover essentials, you\'re in crisis mode. Consider: second job, roommate, move to cheaper housing, food assistance programs.'
  },

  starterEFBox: {
    title: 'Starter Emergency Fund ($1,000)',
    explanation: 'A small buffer to prevent new debt when minor emergencies happen (car repair, medical bill). Keeps you from sliding backwards.',
    priority: 'Priority #2 - Critical foundation',
    action: 'Save $1,000 as fast as possible. Park it in a high-yield savings account. This is your "don\'t go into debt" insurance.'
  },

  employerMatchBox: {
    title: 'Employer 401(k) Match',
    explanation: 'Contribute enough to your 401(k) to get the full employer match. This is free money with a guaranteed 50-100% return.',
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

  hsaIRABox: {
    title: 'HSA & IRA Contributions',
    explanation: 'Tax-advantaged retirement accounts. HSA is triple tax-advantaged (deductible, grows tax-free, withdrawals tax-free for medical). IRA reduces current taxes.',
    priority: 'Flexible Priority - Often #6',
    action: 'Max HSA first ($4,300 individual, $8,550 family). Then Roth IRA if income allows ($7,000/year). Automate monthly contributions.'
  },

  moderateDebtBox: {
    title: 'Moderate-Interest Debt (3-7%)',
    explanation: 'Debt with moderate interest rates (student loans, auto loans, mortgage). Debatable whether to pay off aggressively or invest instead.',
    priority: 'Flexible Priority - Often #7',
    action: 'If rate < 5%, consider minimum payments and investing the difference. If rate > 5%, lean toward payoff for guaranteed return.'
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
 * Render a tooltip component
 * @param {string} topic - The topic key
 * @param {string} label - The visible label to attach tooltip to
 * @param {Object} userData - User's data for context
 * @returns {string} HTML for tooltip
 */
function renderTooltip(topic, label, userData = {}) {
  const content = getEducationContent(topic, userData);
  if (!content) {
    return label;
  }

  return `
    <span class="tooltip-wrapper">
      <span class="tooltip-trigger">${label} <span class="info-icon">ⓘ</span></span>
      <div class="tooltip-popup">
        <div class="tooltip-header">
          <strong>${content.title}</strong>
        </div>
        <div class="tooltip-body">
          <p>${content.explanation}</p>
          ${renderBenchmarks(content.benchmark)}
          ${content.personalizedContext ? `<p class="tooltip-context"><strong>Your Situation:</strong> ${content.personalizedContext}</p>` : ''}
          ${content.tip ? `<p class="tooltip-tip"><strong>💡 Tip:</strong> ${content.tip}</p>` : ''}
          ${content.action ? `<p class="tooltip-action"><strong>🎯 Action:</strong> ${content.action}</p>` : ''}
        </div>
      </div>
    </span>
  `;
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
        <div class="tooltip-benchmark tooltip-benchmark-${b.color}">
          <span class="benchmark-icon">${b.icon}</span>
          <span class="benchmark-range">${b.range}</span>
          <span class="benchmark-label">${b.label}</span>
        </div>
      `).join('')}
    </div>
  `;
}
```

---

### 2. Integrate Tooltips into Dashboard

**File:** `components/dashboard.js`

**Changes:** Add tooltips to metrics and key terms

**Implementation Steps:**

1. Update the metrics row to include tooltips:

```javascript
// Replace the existing metrics row with this version
<div class="metrics-row">
  <div class="metric-card">
    <div class="metric-label">
      ${renderTooltip('debtToIncome', 'Debt-to-Income', { value: metrics.dti })}
    </div>
    <div class="metric-value ${dtiClass}">${metrics.dti.toFixed(1)}%</div>
  </div>

  <div class="metric-card">
    <div class="metric-label">
      ${renderTooltip('netWorth', 'Net Worth', {
        value: metrics.netWorth,
        age: snapshot.general.age,
        income: snapshot.general.annualIncome
      })}
    </div>
    <div class="metric-value ${netWorthClass}">${formatCurrency(metrics.netWorth)}</div>
  </div>

  <div class="metric-card">
    <div class="metric-label">
      ${renderTooltip('fragility', 'Fragility', { value: metrics.fragility })}
    </div>
    <div class="metric-value ${fragilityClass}">${metrics.fragility}</div>
  </div>

  <div class="metric-card">
    <div class="metric-label">
      ${renderTooltip('savingsRate', 'Savings Rate', { value: metrics.savingsRate })}
    </div>
    <div class="metric-value ${savingsRateClass}">${metrics.savingsRate.toFixed(1)}%</div>
  </div>
</div>
```

2. Add tooltips to financial summary section:

```javascript
<div class="summary-section">
  <h3>💪 ${renderTooltip('strengths', 'Strengths', {})}</h3>
  <ul>
    ${summary.strengths.map(s => `<li>${s}</li>`).join('')}
  </ul>
</div>
```

---

### 3. Integrate Tooltips into Input Cards

**File:** `components/inputCards.js`

**Changes:** Add tooltips to complex input fields

**Example integrations:**

```javascript
// Monthly take-home field
<label for="monthlyTakeHome">
  ${renderTooltip('monthlyTakeHome', 'Monthly Take-Home Pay', {})}
</label>

// Monthly expenses field
<label for="monthlyExpense">
  ${renderTooltip('monthlyExpense', 'Monthly Expenses', {})}
</label>

// Target retirement age
<label for="targetRetirement">
  ${renderTooltip('targetRetirement', 'Target Retirement Age', {})}
</label>
```

---

### 4. Integrate Tooltips into FIRE Journey

**File:** `components/fireJourney.js`

**Changes:** Add tooltips to FIRE box headers

**Example integration:**

```javascript
function renderFireBox(step, index, draggable = false) {
  return `
    <div class="fire-box ${step.status}"
         draggable="${draggable}"
         data-step-id="${step.stepId}">
      <div class="fire-box-header">
        <h4>
          ${renderTooltip(`${step.stepId}Box`, step.title, {})}
        </h4>
        <span class="fire-box-status">${step.status}</span>
      </div>
      <div class="fire-box-body">
        <p>${step.reasoning}</p>
        ${step.monthlyAmount ? `<p class="fire-box-amount">${formatCurrency(step.monthlyAmount)}/mo</p>` : ''}
      </div>
    </div>
  `;
}
```

---

### 5. Add Tooltip CSS Styles

**File:** `css/styles.css`

**Add these styles:**

```css
/* ===========================
   TOOLTIP STYLES
   ========================== */

.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-trigger {
  cursor: help;
  border-bottom: 1px dotted var(--gold);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.info-icon {
  color: var(--gold);
  font-size: 0.9em;
  font-weight: bold;
}

/* Tooltip popup */
.tooltip-popup {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  width: 320px;
  max-width: 90vw;
  background: var(--card-bg);
  border: 1px solid var(--gold);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 1rem;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  pointer-events: none;
}

/* Show tooltip on hover */
.tooltip-wrapper:hover .tooltip-popup,
.tooltip-wrapper:focus-within .tooltip-popup {
  opacity: 1;
  visibility: visible;
}

/* Mobile: show on tap */
@media (hover: none) {
  .tooltip-trigger {
    cursor: pointer;
  }

  .tooltip-wrapper.active .tooltip-popup {
    opacity: 1;
    visibility: visible;
  }
}

/* Tooltip arrow */
.tooltip-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: var(--card-bg);
}

/* Tooltip header */
.tooltip-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
  color: var(--gold);
  font-size: 1rem;
}

/* Tooltip body */
.tooltip-body {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.tooltip-body p {
  margin-bottom: 0.75rem;
}

.tooltip-body p:last-child {
  margin-bottom: 0;
}

/* Benchmarks */
.tooltip-benchmarks {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tooltip-benchmark {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.tooltip-benchmark-success {
  background: rgba(34, 197, 94, 0.1);
  border-left: 3px solid var(--success);
}

.tooltip-benchmark-gold {
  background: rgba(212, 175, 55, 0.1);
  border-left: 3px solid var(--gold);
}

.tooltip-benchmark-danger {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid var(--danger);
}

.benchmark-icon {
  font-size: 1.125rem;
}

.benchmark-range {
  font-weight: 600;
  min-width: 80px;
}

.benchmark-label {
  color: var(--text-secondary);
}

/* Context and tips */
.tooltip-context {
  background: rgba(212, 175, 55, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid var(--gold);
  margin: 0.75rem 0;
  font-size: 0.875rem;
}

.tooltip-tip {
  background: rgba(96, 165, 250, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid var(--accent);
  margin: 0.75rem 0;
  font-size: 0.875rem;
}

.tooltip-action {
  background: rgba(34, 197, 94, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid var(--success);
  margin: 0.75rem 0;
  font-size: 0.875rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tooltip-popup {
    width: 280px;
    font-size: 0.8125rem;
  }

  .tooltip-header {
    font-size: 0.9rem;
  }

  .tooltip-body {
    font-size: 0.8125rem;
  }
}
```

---

### 6. Add Mobile Tap Handling (JavaScript)

**File:** `js/education.js` (add to bottom of file)

**Purpose:** Handle mobile tap-to-show-tooltip behavior

```javascript
// ===========================
// MOBILE TOOLTIP HANDLING
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  // Handle mobile tap to toggle tooltips
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.tooltip-trigger');

    if (trigger) {
      e.preventDefault();
      const wrapper = trigger.closest('.tooltip-wrapper');

      // Toggle active state
      const isActive = wrapper.classList.contains('active');

      // Close all other tooltips
      document.querySelectorAll('.tooltip-wrapper.active').forEach(w => {
        w.classList.remove('active');
      });

      // Toggle this tooltip
      if (!isActive) {
        wrapper.classList.add('active');
      }
    } else {
      // Click outside - close all tooltips
      const clickedInsidePopup = e.target.closest('.tooltip-popup');
      if (!clickedInsidePopup) {
        document.querySelectorAll('.tooltip-wrapper.active').forEach(w => {
          w.classList.remove('active');
        });
      }
    }
  });
});
```

---

### 7. Update index.html Script Loading

**File:** `index.html`

**Change:** Add education.js to script sequence

```html
<script src="js/constants.js"></script>
<script src="js/validation.js"></script>
<script src="js/education.js"></script>  <!-- ADD THIS LINE -->
<script src="js/store.js"></script>
<script src="js/strategy.js"></script>
<script src="js/projections.js"></script>
<script src="components/welcome.js"></script>
<script src="components/dashboard.js"></script>
<script src="components/inputCards.js"></script>
<script src="components/fireJourney.js"></script>
<script src="js/app.js"></script>
```

---

## Complete Tooltip Coverage (12 Topics)

### Metrics (4)
1. ✅ Debt-to-Income (DTI)
2. ✅ Net Worth
3. ✅ Fragility Score
4. ✅ Savings Rate

### Input Fields (4)
5. ✅ Monthly Take-Home Pay
6. ✅ Monthly Expenses
7. ✅ Target Retirement Age
8. ✅ Employer Match

### FIRE Boxes (9)
9. ✅ Cover Essentials
10. ✅ Starter Emergency Fund
11. ✅ Employer 401(k) Match
12. ✅ Full Emergency Fund
13. ✅ High-Interest Debt
14. ✅ HSA & IRA
15. ✅ Moderate-Interest Debt
16. ✅ Max Out 401(k)
17. ✅ Taxable Investing

**Total: 17 tooltips** (exceeds 12+ requirement)

---

## Testing & Edge Cases

### Test Cases

1. **Desktop Hover Behavior**
   - Hover over "Debt-to-Income ⓘ" → Tooltip appears after 300ms
   - Move mouse away → Tooltip fades out
   - Hover over multiple tooltips rapidly → Only one shows at a time

2. **Mobile Tap Behavior**
   - Tap "Net Worth ⓘ" → Tooltip appears
   - Tap same trigger again → Tooltip closes
   - Tap different trigger → First closes, second opens
   - Tap outside tooltip → All tooltips close

3. **Personalized Context**
   - DTI 25% → Shows "Your DTI is healthy..."
   - DTI 40% → Shows "Your DTI is manageable but approaching..."
   - DTI 50% → Shows "Your DTI is high..."

4. **Benchmarks Display**
   - Each metric shows color-coded benchmarks (green/yellow/red)
   - Icons appear correctly (✓, ⚠️, 🔴)

5. **Accessibility**
   - Keyboard focus shows tooltip
   - Screen readers announce tooltip content
   - Escape key closes active tooltip

### Edge Cases

- **Tooltip overflow:** If tooltip extends beyond viewport, it should reposition
- **Long content:** Tooltip should scroll if content is very long
- **No data:** Tooltips should still work with placeholder text
- **Rapid interactions:** Should handle rapid hover/tap without breaking
- **Print view:** Tooltips should be hidden when printing

---

## Estimated Effort

**Development Time:** 8-10 hours

**Breakdown:**
- Education content creation (17 tooltips): 4 hours
- Tooltip component and rendering logic: 2 hours
- CSS styling and animations: 2 hours
- Integration into dashboard/inputs/FIRE journey: 2 hours
- Mobile tap handling and accessibility: 1-2 hours
- Testing and edge cases: 1-2 hours

**Priority:** P1 (High - Significantly improves user education)

**Dependencies:**
- Requires dashboard.js, inputCards.js, fireJourney.js to be integrated
- Should be implemented after basic functionality is stable
