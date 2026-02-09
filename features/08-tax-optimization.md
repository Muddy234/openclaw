# Feature 8: Tax Optimization Guidance

## Vision

Most people overpay taxes by thousands of dollars annually because they don't optimize their use of tax-advantaged accounts. Financial GPS should identify specific, actionable tax-saving opportunities based on the user's income, current contributions, and financial situation - turning tax complexity into simple, money-saving actions.

## Goal

Create a tax optimization advisor that:
- Calculates current effective tax rate and potential savings
- Recommends specific account contribution amounts (401k, IRA, HSA)
- Shows tax bracket implications of income changes
- Estimates tax savings from recommended actions
- Provides year-end tax planning checklist

## Success Metrics

**What Success Looks Like:**
- Users discover $2,000+ in annual tax savings opportunities
- Clear understanding of tax-advantaged account benefits
- Actionable recommendations: "Contribute $X more to 401(k) to save $Y in taxes"
- Increased usage of tax-advantaged accounts
- Users share tax savings calculations with friends/family

**Acceptance Criteria:**
- [ ] Calculates current effective tax rate (federal + state estimate)
- [ ] Shows marginal tax bracket
- [ ] Recommends 401(k) contribution to reduce taxable income
- [ ] Recommends Traditional IRA vs. Roth IRA based on income
- [ ] Recommends HSA max-out (if eligible)
- [ ] Shows estimated annual tax savings from recommendations
- [ ] Provides "Tax Moves to Make" checklist
- [ ] Updates dynamically as income/contributions change
- [ ] Includes disclaimer about consulting tax professional

---

## Implementation Plan

### 1. Create Tax Calculator

**File:** `js/taxCalculator.js` (new file)

**Purpose:** Calculate tax liability and optimization opportunities

**Full Code:**

```javascript
// ===========================
// TAX CALCULATOR & OPTIMIZER
// ===========================

// 2025 Federal Tax Brackets (Single filer - can be extended for other statuses)
const TAX_BRACKETS_2025 = {
  single: [
    { rate: 0.10, min: 0, max: 11600 },
    { rate: 0.12, min: 11600, max: 47150 },
    { rate: 0.22, min: 47150, max: 100525 },
    { rate: 0.24, min: 100525, max: 191950 },
    { rate: 0.32, min: 191950, max: 243725 },
    { rate: 0.35, min: 243725, max: 609350 },
    { rate: 0.37, min: 609350, max: Infinity }
  ]
};

// Contribution limits for 2025
const CONTRIBUTION_LIMITS_2025 = {
  '401k': 23500,
  'ira': 7000,
  'hsa_individual': 4300,
  'hsa_family': 8550,
  'catch_up_50_401k': 7500,
  'catch_up_50_ira': 1000
};

/**
 * Calculate federal income tax
 * @param {number} taxableIncome - Annual taxable income
 * @param {string} filingStatus - 'single', 'married', 'head_of_household'
 * @returns {Object} { tax, effectiveRate, marginalRate }
 */
function calculateFederalTax(taxableIncome, filingStatus = 'single') {
  const brackets = TAX_BRACKETS_2025[filingStatus] || TAX_BRACKETS_2025.single;
  let totalTax = 0;
  let marginalRate = 0;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const incomeInBracket = Math.min(
      Math.max(taxableIncome - bracket.min, 0),
      bracket.max - bracket.min
    );

    if (incomeInBracket > 0) {
      totalTax += incomeInBracket * bracket.rate;
      marginalRate = bracket.rate;
    }

    if (taxableIncome <= bracket.max) {
      break;
    }
  }

  const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) : 0;

  return {
    tax: totalTax,
    effectiveRate: effectiveRate,
    marginalRate: marginalRate
  };
}

/**
 * Estimate state income tax (simplified - varies by state)
 * @param {number} income - Annual income
 * @param {string} state - State abbreviation (optional)
 * @returns {number} Estimated state tax
 */
function estimateStateTax(income, state = null) {
  // Simplified: assume 5% average state tax
  // In production, use actual state tax tables
  const averageStateRate = 0.05;
  return income * averageStateRate;
}

/**
 * Calculate comprehensive tax analysis
 * @param {Object} snapshot - Financial snapshot
 * @returns {Object} Tax analysis and recommendations
 */
function analyzeTaxSituation(snapshot) {
  const annualIncome = snapshot.general.annualIncome;
  const age = snapshot.general.age;

  // Estimate current 401(k) contribution from difference between gross and take-home
  const monthlyGross = annualIncome / 12;
  const monthlySocSec = monthlyGross * 0.062; // 6.2% Social Security
  const monthlyMedicare = monthlyGross * 0.0145; // 1.45% Medicare
  const monthlyPayrollTax = monthlySocSec + monthlyMedicare;

  // Estimate federal tax based on take-home
  const estimatedMonthlyTax = monthlyGross - snapshot.general.monthlyTakeHome - monthlyPayrollTax;
  const estimatedAnnualTax = estimatedMonthlyTax * 12;
  const estimatedTaxableIncome = annualIncome; // Simplified

  // Calculate actual federal tax on current income
  const federalTax = calculateFederalTax(estimatedTaxableIncome);
  const stateTax = estimateStateTax(estimatedTaxableIncome);

  // Current situation
  const currentSituation = {
    grossIncome: annualIncome,
    estimatedTaxableIncome: estimatedTaxableIncome,
    federalTax: federalTax.tax,
    stateTax: stateTax,
    totalTax: federalTax.tax + stateTax,
    effectiveRate: (federalTax.tax + stateTax) / annualIncome,
    marginalRate: federalTax.marginalRate
  };

  // Generate recommendations
  const recommendations = generateTaxRecommendations(snapshot, currentSituation, age);

  return {
    current: currentSituation,
    recommendations: recommendations,
    contributionLimits: CONTRIBUTION_LIMITS_2025
  };
}

/**
 * Generate tax optimization recommendations
 * @param {Object} snapshot - Financial snapshot
 * @param {Object} currentTax - Current tax situation
 * @param {number} age - User's age
 * @returns {Array} Array of recommendations
 */
function generateTaxRecommendations(snapshot, currentTax, age) {
  const recommendations = [];
  const annualIncome = snapshot.general.annualIncome;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome;

  // 1. 401(k) Recommendation
  const max401k = age >= 50
    ? CONTRIBUTION_LIMITS_2025['401k'] + CONTRIBUTION_LIMITS_2025['catch_up_50_401k']
    : CONTRIBUTION_LIMITS_2025['401k'];

  // Estimate current 401(k) contribution
  const estimatedCurrent401k = Math.max(0, (annualIncome - (monthlyTakeHome * 12)) - (annualIncome * 0.15)); // Rough estimate
  const additional401kRoom = Math.max(0, max401k - estimatedCurrent401k);

  if (additional401kRoom > 1000) {
    const taxSavings = additional401kRoom * currentTax.marginalRate;
    recommendations.push({
      priority: 'high',
      category: '401(k)',
      title: `Max out your 401(k) - $${additional401kRoom.toFixed(0)} more room`,
      description: `You can contribute up to $${max401k.toLocaleString()} in 2025. You have $${additional401kRoom.toFixed(0)} of unused space.`,
      action: `Increase 401(k) contribution by $${(additional401kRoom / 12).toFixed(0)}/month`,
      taxSavings: taxSavings,
      netCost: additional401kRoom - taxSavings
    });
  }

  // 2. IRA Recommendation (Traditional vs. Roth)
  const maxIRA = age >= 50
    ? CONTRIBUTION_LIMITS_2025['ira'] + CONTRIBUTION_LIMITS_2025['catch_up_50_ira']
    : CONTRIBUTION_LIMITS_2025['ira'];

  // Roth IRA income limits for 2025 (single): $150,000 - $165,000 phaseout
  const rothEligible = annualIncome < 150000;
  const iraType = currentTax.marginalRate >= 0.22 ? 'Traditional' : 'Roth';

  if (rothEligible || iraType === 'Traditional') {
    const iraTaxSavings = iraType === 'Traditional' ? maxIRA * currentTax.marginalRate : 0;
    recommendations.push({
      priority: 'high',
      category: 'IRA',
      title: `Contribute $${maxIRA.toLocaleString()} to ${iraType} IRA`,
      description: iraType === 'Traditional'
        ? `At your marginal tax rate (${(currentTax.marginalRate * 100).toFixed(0)}%), a Traditional IRA makes sense.`
        : `Your income qualifies for Roth IRA. Tax-free growth is valuable at your bracket.`,
      action: `Set up automatic $${(maxIRA / 12).toFixed(0)}/month contribution`,
      taxSavings: iraTaxSavings,
      netCost: maxIRA - iraTaxSavings
    });
  }

  // 3. HSA Recommendation
  // Assume user is eligible (this should be a form input in production)
  const hsaMax = CONTRIBUTION_LIMITS_2025['hsa_individual'];
  const hsaTaxSavings = hsaMax * currentTax.marginalRate;

  recommendations.push({
    priority: 'high',
    category: 'HSA',
    title: `Max out HSA - Triple tax advantage`,
    description: `If you have a high-deductible health plan, HSA is the best tax-advantaged account. Deductible contributions, tax-free growth, tax-free withdrawals for medical.`,
    action: `Contribute $${(hsaMax / 12).toFixed(0)}/month to HSA`,
    taxSavings: hsaTaxSavings,
    note: 'Only if you have a high-deductible health plan (HDHP)'
  });

  // 4. Tax-loss harvesting (if investments exist)
  const totalInvestments = snapshot.investments.stocksBonds + snapshot.investments.ira + snapshot.investments.rothIra;
  if (totalInvestments > 25000) {
    recommendations.push({
      priority: 'medium',
      category: 'Investing',
      title: 'Consider tax-loss harvesting',
      description: 'With significant investments, you can offset gains with losses to reduce taxes.',
      action: 'Review portfolio for unrealized losses to harvest before year-end',
      taxSavings: null,
      note: 'Potential savings vary based on portfolio performance'
    });
  }

  // 5. Charitable donations (if high income)
  if (annualIncome > 100000) {
    recommendations.push({
      priority: 'medium',
      category: 'Deductions',
      title: 'Bunch charitable donations',
      description: 'Donate multiple years of giving in one year to exceed standard deduction.',
      action: 'Consider donor-advised fund to bunch donations',
      taxSavings: null,
      note: 'Works best if you normally give $5K+ annually'
    });
  }

  return recommendations;
}

/**
 * Calculate tax impact of a hypothetical scenario
 * @param {number} currentIncome - Current annual income
 * @param {number} deduction - Amount to deduct (401k, IRA, etc.)
 * @returns {Object} Tax comparison
 */
function calculateTaxImpact(currentIncome, deduction) {
  const beforeTax = calculateFederalTax(currentIncome);
  const afterTax = calculateFederalTax(currentIncome - deduction);

  return {
    taxBefore: beforeTax.tax,
    taxAfter: afterTax.tax,
    savings: beforeTax.tax - afterTax.tax,
    netCost: deduction - (beforeTax.tax - afterTax.tax)
  };
}
```

---

### 2. Create Tax Optimization Component

**File:** `components/taxOptimization.js` (new file)

**Purpose:** Render tax analysis and recommendations

**Full Code:**

```javascript
// ===========================
// TAX OPTIMIZATION COMPONENT
// ===========================

/**
 * Render tax optimization section
 * @param {Object} snapshot - Financial snapshot
 * @returns {string} HTML
 */
function renderTaxOptimization(snapshot) {
  const taxAnalysis = window.analyzeTaxSituation(snapshot);

  return `
    <div class="tax-optimization-section">
      <h2>💼 Tax Optimization</h2>
      <p class="section-subtitle">
        Smart tax moves can save you thousands. Here's your personalized tax strategy.
      </p>

      <div class="tax-disclaimer">
        ⚖️ <strong>Disclaimer:</strong> This is educational guidance, not tax advice. Consult a tax professional for your specific situation.
      </div>

      <!-- Current Tax Situation -->
      <div class="current-tax-situation">
        <h3>Your Current Tax Situation</h3>
        ${renderCurrentTaxSituation(taxAnalysis.current)}
      </div>

      <!-- Tax Recommendations -->
      <div class="tax-recommendations">
        <h3>🎯 Tax-Saving Opportunities</h3>
        ${renderTaxRecommendations(taxAnalysis.recommendations)}
      </div>

      <!-- Year-End Checklist -->
      <div class="tax-checklist">
        <h3>📋 Year-End Tax Moves Checklist</h3>
        ${renderTaxChecklist(snapshot, taxAnalysis)}
      </div>
    </div>
  `;
}

/**
 * Render current tax situation summary
 * @param {Object} current - Current tax data
 * @returns {string} HTML
 */
function renderCurrentTaxSituation(current) {
  return `
    <div class="tax-summary-cards">
      <div class="tax-card">
        <div class="tax-card-label">Gross Income</div>
        <div class="tax-card-value">${formatCurrency(current.grossIncome)}</div>
      </div>

      <div class="tax-card">
        <div class="tax-card-label">Estimated Total Tax</div>
        <div class="tax-card-value danger">${formatCurrency(current.totalTax)}</div>
        <div class="tax-card-detail">Federal + State</div>
      </div>

      <div class="tax-card">
        <div class="tax-card-label">Effective Tax Rate</div>
        <div class="tax-card-value">${(current.effectiveRate * 100).toFixed(1)}%</div>
        <div class="tax-card-detail">Total tax ÷ Income</div>
      </div>

      <div class="tax-card">
        <div class="tax-card-label">Marginal Tax Rate</div>
        <div class="tax-card-value gold">${(current.marginalRate * 100).toFixed(0)}%</div>
        <div class="tax-card-detail">Your tax bracket</div>
      </div>
    </div>

    <div class="tax-explanation">
      <p>
        <strong>Your marginal rate is ${(current.marginalRate * 100).toFixed(0)}%:</strong>
        Every extra dollar you earn is taxed at this rate. Conversely, every dollar you
        contribute to pre-tax accounts (401k, Traditional IRA, HSA) saves you
        ${(current.marginalRate * 100).toFixed(0)}¢ in taxes.
      </p>
    </div>
  `;
}

/**
 * Render tax recommendations
 * @param {Array} recommendations - Tax recommendations
 * @returns {string} HTML
 */
function renderTaxRecommendations(recommendations) {
  const totalSavings = recommendations
    .filter(r => r.taxSavings)
    .reduce((sum, r) => sum + r.taxSavings, 0);

  return `
    ${totalSavings > 0 ? `
      <div class="total-savings-banner">
        <div class="savings-icon">💰</div>
        <div class="savings-content">
          <h4>Potential Annual Tax Savings</h4>
          <div class="savings-amount">${formatCurrency(totalSavings)}</div>
          <p>By implementing the recommendations below</p>
        </div>
      </div>
    ` : ''}

    <div class="tax-rec-list">
      ${recommendations.map(rec => `
        <div class="tax-rec-card tax-rec-${rec.priority}">
          <div class="rec-header">
            <span class="rec-category">${rec.category}</span>
            <span class="rec-priority">${rec.priority.toUpperCase()}</span>
          </div>

          <h4>${rec.title}</h4>
          <p class="rec-description">${rec.description}</p>

          <div class="rec-action">
            <strong>📝 Action:</strong> ${rec.action}
          </div>

          ${rec.taxSavings ? `
            <div class="rec-savings-breakdown">
              <div class="savings-row">
                <span>Annual tax savings:</span>
                <strong class="success">${formatCurrency(rec.taxSavings)}</strong>
              </div>
              ${rec.netCost ? `
                <div class="savings-row">
                  <span>Net cost to you:</span>
                  <strong>${formatCurrency(rec.netCost)}</strong>
                </div>
                <div class="savings-explanation">
                  (Contribution minus tax savings)
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${rec.note ? `
            <div class="rec-note">
              ℹ️ ${rec.note}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render year-end tax checklist
 * @param {Object} snapshot - Financial snapshot
 * @param {Object} taxAnalysis - Tax analysis data
 * @returns {string} HTML
 */
function renderTaxChecklist(snapshot, taxAnalysis) {
  const items = [
    {
      task: 'Max out 401(k) contributions',
      deadline: 'December 31',
      status: 'pending',
      description: `Contribute up to $${taxAnalysis.contributionLimits['401k'].toLocaleString()}`
    },
    {
      task: 'Make IRA contribution',
      deadline: 'April 15 (next year)',
      status: 'pending',
      description: `You have until tax day to contribute $${taxAnalysis.contributionLimits['ira'].toLocaleString()}`
    },
    {
      task: 'Max out HSA (if eligible)',
      deadline: 'December 31',
      status: 'pending',
      description: 'Triple tax advantage - best account available'
    },
    {
      task: 'Harvest tax losses',
      deadline: 'December 31',
      status: 'pending',
      description: 'Sell losing investments to offset gains'
    },
    {
      task: 'Bunch charitable donations',
      deadline: 'December 31',
      status: 'pending',
      description: 'Combine multiple years to exceed standard deduction'
    },
    {
      task: 'Review withholding',
      deadline: 'Year-round',
      status: 'pending',
      description: 'Adjust W-4 to avoid big refund or bill'
    }
  ];

  return `
    <div class="checklist">
      ${items.map(item => `
        <div class="checklist-item">
          <label class="checklist-label">
            <input type="checkbox" class="checklist-checkbox" />
            <div class="checklist-content">
              <div class="checklist-task">${item.task}</div>
              <div class="checklist-description">${item.description}</div>
              <div class="checklist-deadline">⏰ Deadline: ${item.deadline}</div>
            </div>
          </label>
        </div>
      `).join('')}
    </div>
  `;
}
```

---

### 3. Integrate into Dashboard

**File:** `components/dashboard.js`

```javascript
function renderDashboard() {
  // ... existing code ...

  const html = `
    <div class="dashboard">
      ${renderSummaryPanels(snapshot)}
      ${renderMetricsRow(metrics)}
      ${renderNetWorthChart(snapshot)}
      ${renderTaxOptimization(snapshot)}  <!-- ADD THIS -->
      ${renderCashFlowSection(snapshot)}
      ${renderScenarioComparison()}
      ${renderFinancialSummary(summary)}
      ${renderFireJourney()}
      ${renderDebtComparison(snapshot)}
    </div>
  `;

  return html;
}
```

---

### 4. Add CSS Styling

**File:** `css/styles.css`

```css
/* ===========================
   TAX OPTIMIZATION SECTION
   ========================== */

.tax-optimization-section {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}

.tax-disclaimer {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

/* Tax Summary Cards */
.tax-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.tax-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.tax-card-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.tax-card-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gold);
}

.tax-card-detail {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.tax-explanation {
  background: rgba(96, 165, 250, 0.1);
  border-left: 3px solid var(--accent);
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

/* Total Savings Banner */
.total-savings-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  border: 2px solid var(--success);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.savings-icon {
  font-size: 3rem;
}

.savings-amount {
  font-size: 2rem;
  font-weight: 700;
  color: var(--success);
  margin: 0.5rem 0;
}

/* Tax Recommendations */
.tax-rec-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.tax-rec-card {
  border-left: 4px solid;
  border-radius: 8px;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
}

.tax-rec-high {
  border-color: var(--gold);
}

.tax-rec-medium {
  border-color: var(--accent);
}

.rec-savings-breakdown {
  background: rgba(34, 197, 94, 0.1);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
}

.savings-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.savings-explanation {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 0.5rem;
}

.rec-note {
  background: rgba(96, 165, 250, 0.1);
  border-left: 3px solid var(--accent);
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.875rem;
}

/* Year-End Checklist */
.tax-checklist {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.checklist-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.checklist-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.checklist-label {
  display: flex;
  gap: 1rem;
  cursor: pointer;
  align-items: flex-start;
}

.checklist-checkbox {
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checklist-content {
  flex: 1;
}

.checklist-task {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.checklist-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.checklist-deadline {
  font-size: 0.8125rem;
  color: var(--gold);
}

/* Responsive */
@media (max-width: 768px) {
  .total-savings-banner {
    flex-direction: column;
    text-align: center;
  }

  .tax-summary-cards {
    grid-template-columns: 1fr;
  }
}
```

---

### 5. Update index.html

```html
<script src="js/taxCalculator.js"></script>  <!-- ADD THIS -->
<script src="components/taxOptimization.js"></script>  <!-- ADD THIS -->
```

---

## Testing & Edge Cases

### Test Cases

1. **Tax Calculation**
   - Various income levels show correct marginal brackets
   - Effective rate calculated correctly
   - State tax estimate reasonable

2. **Recommendations**
   - High income (>$100K) → Shows all recommendations
   - Low income (<$50K) → Focuses on Roth IRA, not Traditional
   - Age 50+ → Shows catch-up contribution opportunities

3. **Tax Savings**
   - Total savings banner shows sum of all recommendations
   - Individual recommendations show correct tax savings
   - Net cost calculated correctly (contribution - tax savings)

4. **Checklist**
   - All items displayed with correct deadlines
   - Checkboxes functional
   - Items remain checked on page refresh (if saved)

### Edge Cases

- **Very low income (<$20K):** Show Roth IRA only, skip Traditional
- **Very high income (>$165K):** Note Roth IRA phaseout
- **No income:** Don't show tax optimization section
- **Over 50:** Show catch-up contributions
- **HDHP eligibility unknown:** Show HSA with disclaimer

---

## Estimated Effort

**Development Time:** 8-10 hours

**Breakdown:**
- Tax calculation engine: 3-4 hours
- Recommendation logic: 2-3 hours
- UI components and styling: 2 hours
- Testing edge cases: 2-3 hours

**Priority:** P1 (High - High-value, differentiating feature)

**Dependencies:**
- Requires income and age data
- Should include filing status input (future enhancement)
- May need state-specific tax tables (future enhancement)
