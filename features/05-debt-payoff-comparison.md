# Feature 5: Debt Payoff Comparison (Avalanche vs. Snowball)

## Vision

Users with multiple debts face a critical question: "Should I pay off high-interest debts first (avalanche) or small balances first (snowball) for psychological wins?" Financial GPS should answer this with hard numbers, showing exactly how much interest they'll save and how much faster they'll be debt-free with each strategy.

## Goal

Create a debt payoff comparison tool that:
- Calculates both avalanche (highest interest first) and snowball (smallest balance first) strategies
- Shows side-by-side comparison: total interest paid, debt-free date, monthly cash flow timeline
- Visualizes the difference with charts and clear metrics
- Helps users make an informed, personalized decision

## Success Metrics

**What Success Looks Like:**
- Users understand the financial trade-off between strategies
- Clear recommendation based on user's situation (aggressive savers → avalanche, need motivation → snowball)
- Increased confidence in debt payoff plan
- Users can make informed decision: "I'll save $3,200 in interest with avalanche method"

**Acceptance Criteria:**
- [ ] Comparison appears when user has 2+ active debts
- [ ] Shows total interest paid for each strategy
- [ ] Shows debt-free date for each strategy
- [ ] Displays month-by-month waterfall visualization
- [ ] Highlights recommended strategy based on user profile
- [ ] Allows toggling between avalanche and snowball view
- [ ] Shows "quick wins" timeline for snowball method
- [ ] Updates in real-time as user changes debt values

---

## Implementation Plan

### 1. Create Debt Payoff Calculator

**File:** `js/debtPayoff.js` (new file)

**Purpose:** Calculate avalanche and snowball debt payoff scenarios

**Full Code:**

```javascript
// ===========================
// DEBT PAYOFF CALCULATOR
// ===========================

/**
 * Calculate debt payoff using avalanche method (highest interest first)
 * @param {Array} debts - Array of debt objects
 * @param {number} monthlyExtraCashFlow - Extra cash available for debt payoff
 * @returns {Object} Payoff schedule and summary
 */
function calculateAvalanche(debts, monthlyExtraCashFlow) {
  // Sort debts by interest rate (highest first)
  const sortedDebts = [...debts]
    .filter(d => d.balance > 0)
    .sort((a, b) => b.interestRate - a.interestRate);

  return simulatePayoff(sortedDebts, monthlyExtraCashFlow, 'avalanche');
}

/**
 * Calculate debt payoff using snowball method (smallest balance first)
 * @param {Array} debts - Array of debt objects
 * @param {number} monthlyExtraCashFlow - Extra cash available for debt payoff
 * @returns {Object} Payoff schedule and summary
 */
function calculateSnowball(debts, monthlyExtraCashFlow) {
  // Sort debts by balance (smallest first)
  const sortedDebts = [...debts]
    .filter(d => d.balance > 0)
    .sort((a, b) => a.balance - b.balance);

  return simulatePayoff(sortedDebts, monthlyExtraCashFlow, 'snowball');
}

/**
 * Simulate debt payoff month-by-month
 * @param {Array} sortedDebts - Debts sorted by priority
 * @param {number} monthlyExtraCashFlow - Extra cash for debt payoff
 * @param {string} method - 'avalanche' or 'snowball'
 * @returns {Object} Complete payoff simulation
 */
function simulatePayoff(sortedDebts, monthlyExtraCashFlow, method) {
  const debts = sortedDebts.map(d => ({
    ...d,
    remainingBalance: d.balance,
    totalInterestPaid: 0,
    monthlyPayment: calculateMinimumPayment(d)
  }));

  const timeline = [];
  let month = 0;
  let totalInterestPaid = 0;
  const paidOffMilestones = [];

  while (debts.some(d => d.remainingBalance > 0) && month < 600) {
    month++;

    // Calculate minimum payments
    let totalMinimumPayment = 0;
    debts.forEach(d => {
      if (d.remainingBalance > 0) {
        totalMinimumPayment += d.monthlyPayment;
      }
    });

    // Total available for debt payoff
    const totalAvailable = totalMinimumPayment + monthlyExtraCashFlow;
    let remainingCash = totalAvailable;

    // Make minimum payments on all debts
    debts.forEach(debt => {
      if (debt.remainingBalance > 0) {
        const monthlyInterest = (debt.remainingBalance * (debt.interestRate / 100)) / 12;
        const principalPayment = Math.min(
          debt.monthlyPayment - monthlyInterest,
          debt.remainingBalance
        );

        debt.remainingBalance -= principalPayment;
        debt.totalInterestPaid += monthlyInterest;
        totalInterestPaid += monthlyInterest;
        remainingCash -= debt.monthlyPayment;

        if (debt.remainingBalance < 0) debt.remainingBalance = 0;
      }
    });

    // Apply extra cash flow to highest priority debt
    const targetDebt = debts.find(d => d.remainingBalance > 0);
    if (targetDebt && remainingCash > 0) {
      const extraPayment = Math.min(remainingCash, targetDebt.remainingBalance);
      targetDebt.remainingBalance -= extraPayment;
      remainingCash -= extraPayment;

      if (targetDebt.remainingBalance === 0) {
        paidOffMilestones.push({
          month: month,
          debtName: targetDebt.category,
          balance: targetDebt.balance
        });
      }
    }

    // Record this month's snapshot
    timeline.push({
      month: month,
      debts: debts.map(d => ({
        category: d.category,
        remainingBalance: d.remainingBalance,
        interestPaid: d.totalInterestPaid
      })),
      totalRemaining: debts.reduce((sum, d) => sum + d.remainingBalance, 0)
    });

    // Safety check
    if (month > 600) {
      console.warn('Debt payoff simulation exceeded 50 years');
      break;
    }
  }

  return {
    method: method,
    totalInterestPaid: totalInterestPaid,
    monthsToPayoff: month,
    debtFreeDate: new Date(new Date().setMonth(new Date().getMonth() + month)),
    timeline: timeline,
    paidOffMilestones: paidOffMilestones,
    finalDebts: debts
  };
}

/**
 * Calculate minimum monthly payment for a debt
 * @param {Object} debt - Debt object
 * @returns {number} Monthly payment
 */
function calculateMinimumPayment(debt) {
  if (debt.balance === 0) return 0;

  // If termMonths is provided, use PMT formula
  if (debt.termMonths && debt.termMonths > 0) {
    const monthlyRate = (debt.interestRate / 100) / 12;
    return window.calculateMonthlyPayment(debt.balance, monthlyRate, debt.termMonths);
  }

  // Otherwise, use 2% of balance or $25, whichever is greater
  return Math.max(debt.balance * 0.02, 25);
}

/**
 * Compare avalanche and snowball methods
 * @param {Array} debts - Array of debt objects
 * @param {number} monthlyExtraCashFlow - Extra cash for debt payoff
 * @returns {Object} Comparison results
 */
function compareDebtStrategies(debts, monthlyExtraCashFlow) {
  if (!debts || debts.length === 0) {
    return null;
  }

  const activeDebts = debts.filter(d => d.balance > 0);
  if (activeDebts.length < 2) {
    return null; // No comparison needed for single debt
  }

  const avalanche = calculateAvalanche(activeDebts, monthlyExtraCashFlow);
  const snowball = calculateSnowball(activeDebts, monthlyExtraCashFlow);

  const interestSavings = snowball.totalInterestPaid - avalanche.totalInterestPaid;
  const monthsSaved = snowball.monthsToPayoff - avalanche.monthsToPayoff;

  // Determine recommendation
  let recommendation = 'avalanche';
  let reason = '';

  if (interestSavings > 1000) {
    recommendation = 'avalanche';
    reason = `Save $${interestSavings.toFixed(0)} in interest charges`;
  } else if (interestSavings < 100) {
    recommendation = 'snowball';
    reason = 'Minimal interest difference - get psychological wins';
  } else {
    // Check if user has high-interest debt
    const hasHighInterestDebt = activeDebts.some(d => d.interestRate > 15);
    if (hasHighInterestDebt) {
      recommendation = 'avalanche';
      reason = 'High-interest debt is an emergency';
    } else {
      recommendation = 'snowball';
      reason = 'Build momentum with quick wins';
    }
  }

  return {
    avalanche: avalanche,
    snowball: snowball,
    comparison: {
      interestSavings: interestSavings,
      monthsSaved: monthsSaved,
      recommendation: recommendation,
      reason: reason
    }
  };
}
```

---

### 2. Create Debt Comparison Component

**File:** `components/debtComparison.js` (new file)

**Purpose:** Render debt payoff comparison UI

**Full Code:**

```javascript
// ===========================
// DEBT COMPARISON COMPONENT
// ===========================

/**
 * Render debt payoff comparison section
 * @param {Object} snapshot - Current financial snapshot
 * @returns {string} HTML for debt comparison
 */
function renderDebtComparison(snapshot) {
  // Calculate extra cash flow available for debt payoff
  const monthlyExtraCashFlow = snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense;

  // Get comparison
  const comparison = window.compareDebtStrategies(snapshot.debts, monthlyExtraCashFlow);

  // If no comparison (0-1 debts), return empty
  if (!comparison) {
    return '';
  }

  const { avalanche, snowball, comparison: comp } = comparison;

  return `
    <div class="debt-comparison-section">
      <h2>💳 Debt Payoff Strategy Comparison</h2>
      <p class="section-subtitle">
        Which debt payoff method should you use? Let's compare the numbers.
      </p>

      <!-- Recommendation Banner -->
      <div class="recommendation-banner">
        <div class="recommendation-icon">
          ${comp.recommendation === 'avalanche' ? '🎯' : '⚡'}
        </div>
        <div class="recommendation-content">
          <h3>Recommended: ${comp.recommendation === 'avalanche' ? 'Avalanche' : 'Snowball'} Method</h3>
          <p>${comp.reason}</p>
        </div>
      </div>

      <!-- Side-by-side comparison -->
      <div class="strategy-comparison">
        <!-- Avalanche Column -->
        <div class="strategy-card ${comp.recommendation === 'avalanche' ? 'recommended' : ''}">
          <div class="strategy-header">
            <h3>🎯 Avalanche Method</h3>
            <p class="strategy-description">Pay highest interest rate first</p>
          </div>

          <div class="strategy-metrics">
            <div class="strategy-metric">
              <div class="metric-label">Total Interest Paid</div>
              <div class="metric-value">${formatCurrency(avalanche.totalInterestPaid)}</div>
            </div>

            <div class="strategy-metric">
              <div class="metric-label">Debt-Free Date</div>
              <div class="metric-value">
                ${avalanche.debtFreeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div class="metric-detail">${avalanche.monthsToPayoff} months</div>
            </div>

            <div class="strategy-metric">
              <div class="metric-label">Savings vs Snowball</div>
              <div class="metric-value savings">${formatCurrency(comp.interestSavings)}</div>
            </div>
          </div>

          <div class="strategy-payoff-order">
            <h4>Payoff Order:</h4>
            <ol>
              ${avalanche.paidOffMilestones.map(m => `
                <li>
                  ${getCategoryLabel(m.debtName)} - Month ${m.month}
                  <span class="debt-amount">(${formatCurrency(m.balance)})</span>
                </li>
              `).join('')}
            </ol>
          </div>
        </div>

        <!-- Snowball Column -->
        <div class="strategy-card ${comp.recommendation === 'snowball' ? 'recommended' : ''}">
          <div class="strategy-header">
            <h3>⚡ Snowball Method</h3>
            <p class="strategy-description">Pay smallest balance first</p>
          </div>

          <div class="strategy-metrics">
            <div class="strategy-metric">
              <div class="metric-label">Total Interest Paid</div>
              <div class="metric-value">${formatCurrency(snowball.totalInterestPaid)}</div>
            </div>

            <div class="strategy-metric">
              <div class="metric-label">Debt-Free Date</div>
              <div class="metric-value">
                ${snowball.debtFreeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div class="metric-detail">${snowball.monthsToPayoff} months</div>
            </div>

            <div class="strategy-metric">
              <div class="metric-label">Psychological Wins</div>
              <div class="metric-value">${snowball.paidOffMilestones.length}</div>
              <div class="metric-detail">debts eliminated</div>
            </div>
          </div>

          <div class="strategy-payoff-order">
            <h4>Payoff Order:</h4>
            <ol>
              ${snowball.paidOffMilestones.map(m => `
                <li>
                  ${getCategoryLabel(m.debtName)} - Month ${m.month}
                  <span class="debt-amount">(${formatCurrency(m.balance)})</span>
                </li>
              `).join('')}
            </ol>
          </div>
        </div>
      </div>

      <!-- Timeline visualization -->
      <div class="debt-timeline-section">
        <h3>📊 Debt Payoff Timeline</h3>
        <canvas id="debtPayoffChart" height="80"></canvas>
      </div>
    </div>
  `;
}

/**
 * Get friendly label for debt category
 * @param {string} category - Debt category code
 * @returns {string} Friendly label
 */
function getCategoryLabel(category) {
  const labels = {
    CREDIT_CARD: 'Credit Card',
    MEDICAL: 'Medical Debt',
    STUDENT: 'Student Loans',
    AUTO: 'Auto Loan',
    MORTGAGE: 'Mortgage',
    OTHER: 'Other Debt'
  };
  return labels[category] || category;
}

/**
 * Initialize debt payoff timeline chart
 * Called after DOM renders
 */
function initDebtPayoffChart() {
  const ctx = document.getElementById('debtPayoffChart');
  if (!ctx) return;

  const snapshot = window.store.state.snapshot;
  const monthlyExtraCashFlow = snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense;
  const comparison = window.compareDebtStrategies(snapshot.debts, monthlyExtraCashFlow);

  if (!comparison) return;

  const { avalanche, snowball } = comparison;

  // Prepare chart data
  const maxMonths = Math.max(avalanche.monthsToPayoff, snowball.monthsToPayoff);
  const labels = Array.from({ length: maxMonths }, (_, i) => i + 1);

  const avalancheData = avalanche.timeline.map(t => t.totalRemaining);
  const snowballData = snowball.timeline.map(t => t.totalRemaining);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Avalanche Method',
          data: avalancheData,
          borderColor: 'rgba(212, 175, 55, 1)',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: 'Snowball Method',
          data: snowballData,
          borderColor: 'rgba(96, 165, 250, 1)',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          borderWidth: 3,
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6
        }
      ]
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
            title: (tooltipItems) => {
              return `Month ${tooltipItems[0].label}`;
            },
            label: (context) => {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Months from Today',
            color: '#999'
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#999'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Total Debt Remaining',
            color: '#999'
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#999',
            callback: (value) => formatCurrency(value)
          }
        }
      }
    }
  });
}
```

---

### 3. Integrate into Dashboard

**File:** `components/dashboard.js`

**Changes:** Add debt comparison section after FIRE journey

```javascript
function renderDashboard() {
  const snapshot = window.store.state.snapshot;
  const metrics = window.calculateMetrics(snapshot);
  const summary = window.generateFinancialSummary(snapshot, metrics);

  const html = `
    <div class="dashboard">
      ${renderSummaryPanels(snapshot)}
      ${renderMetricsRow(metrics)}
      ${renderNetWorthChart(snapshot)}
      ${renderFinancialSummary(summary)}
      ${renderFireJourney()}
      ${renderDebtComparison(snapshot)}  <!-- ADD THIS -->
    </div>
  `;

  // Initialize charts
  setTimeout(() => {
    initNetWorthChart();
    initDebtPayoffChart();  // ADD THIS
  }, 0);

  return html;
}
```

---

### 4. Add CSS Styling

**File:** `css/styles.css`

**Add these styles:**

```css
/* ===========================
   DEBT COMPARISON SECTION
   ========================== */

.debt-comparison-section {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}

.debt-comparison-section h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Recommendation Banner */
.recommendation-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%);
  border: 2px solid var(--gold);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.recommendation-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.recommendation-content h3 {
  font-size: 1.25rem;
  color: var(--gold);
  margin-bottom: 0.5rem;
}

.recommendation-content p {
  color: var(--text-secondary);
  margin: 0;
}

/* Strategy Comparison Grid */
.strategy-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.strategy-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.strategy-card.recommended {
  border-color: var(--gold);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
  position: relative;
}

.strategy-card.recommended::before {
  content: '⭐ RECOMMENDED';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gold);
  color: var(--background);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.strategy-header h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.strategy-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

/* Strategy Metrics */
.strategy-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.strategy-metric {
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.75rem;
}

.strategy-metric:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gold);
}

.metric-value.savings {
  color: var(--success);
}

.metric-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Payoff Order */
.strategy-payoff-order h4 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: var(--gold);
}

.strategy-payoff-order ol {
  margin: 0;
  padding-left: 1.5rem;
}

.strategy-payoff-order li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.debt-amount {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Debt Timeline Chart */
.debt-timeline-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.debt-timeline-section h3 {
  margin-bottom: 1.5rem;
}

#debtPayoffChart {
  width: 100% !important;
  height: 300px !important;
}

/* Responsive */
@media (max-width: 768px) {
  .recommendation-banner {
    flex-direction: column;
    text-align: center;
  }

  .strategy-comparison {
    grid-template-columns: 1fr;
  }

  .strategy-card.recommended::before {
    top: -10px;
  }
}
```

---

### 5. Update index.html Script Loading

**File:** `index.html`

**Add debt payoff scripts:**

```html
<script src="js/constants.js"></script>
<script src="js/validation.js"></script>
<script src="js/education.js"></script>
<script src="js/debtPayoff.js"></script>  <!-- ADD THIS -->
<script src="js/store.js"></script>
<script src="js/strategy.js"></script>
<script src="js/projections.js"></script>
<script src="components/welcome.js"></script>
<script src="components/dashboard.js"></script>
<script src="components/inputCards.js"></script>
<script src="components/fireJourney.js"></script>
<script src="components/debtComparison.js"></script>  <!-- ADD THIS -->
<script src="js/app.js"></script>
```

---

## Testing & Edge Cases

### Test Cases

1. **Two Debts**
   - Credit card ($5K @ 18%) + Student loan ($25K @ 5.5%)
   - Avalanche: Pays credit card first
   - Snowball: Pays credit card first (same result - smallest balance AND highest rate)

2. **Multiple Debts**
   - 4 debts with varied balances and rates
   - Avalanche shows different order than snowball
   - Interest savings displayed correctly

3. **High Extra Cash Flow**
   - User has $2K/month extra cash
   - Both strategies complete quickly (< 24 months)
   - Chart shows rapid debt decline

4. **Low Extra Cash Flow**
   - User has $100/month extra cash
   - Strategies take years to complete
   - Chart shows gradual decline

5. **Recommendation Logic**
   - If interest savings > $1K → Recommends avalanche
   - If interest savings < $100 → Recommends snowball
   - If high-interest debt present (>15%) → Recommends avalanche

### Edge Cases

- **Single debt:** Comparison section doesn't render
- **No debts:** Comparison section doesn't render
- **Negative cash flow:** Should warn user they can't make progress
- **Very long payoff (>50 years):** Should show warning
- **Debts with no term months:** Use 2% minimum payment calculation
- **Equal balances or rates:** Handle ties gracefully

---

## Estimated Effort

**Development Time:** 10-12 hours

**Breakdown:**
- Debt payoff calculation logic: 4-5 hours
- Comparison component and UI: 3-4 hours
- Chart visualization: 2 hours
- CSS styling and responsiveness: 2 hours
- Testing and edge cases: 2-3 hours

**Priority:** P1 (High - High-value feature for users with debt)

**Dependencies:**
- Requires debt data structure from store.js
- Requires Chart.js for timeline visualization
- Should be implemented after basic debt tracking is stable
