# Feature 4: Net Worth Chart Prominence

## Vision

Net worth is the single most important metric for tracking financial progress, yet it's currently buried at the bottom of the dashboard. Users often miss this valuable visualization. Moving it to the top creates an immediate "hero moment" where users see their projected wealth growth first thing—providing motivation and context for all other recommendations.

## Goal

Reposition the net worth projection chart as the dashboard hero element:
- Place chart immediately after metrics row (before financial summary)
- Make chart larger and more prominent
- Add key milestone annotations (debt-free date, FIRE date, millionaire date)
- Ensure chart is responsive and looks great on mobile

## Success Metrics

**What Success Looks Like:**
- Users see net worth projection within 2 seconds of viewing dashboard
- Increased engagement with chart (hover interactions, zooming)
- Positive feedback: "Wow, I'll be a millionaire by age 48!"
- Chart becomes the #1 shareablesection (users screenshot and share)

**Acceptance Criteria:**
- [ ] Net worth chart appears directly after metrics row
- [ ] Chart is larger (min height: 400px on desktop, 300px on mobile)
- [ ] Milestone annotations show key dates (debt-free, FIRE achieved, millionaire)
- [ ] Chart is fully responsive
- [ ] Chart loads within 500ms
- [ ] Hover tooltips show month/year and exact net worth value
- [ ] Color coding: negative = red, positive growing = gradient gold to green

---

## Implementation Plan

### 1. Modify Dashboard Layout

**File:** `components/dashboard.js`

**Changes:** Reorder sections to place net worth chart after metrics

**Current Layout (Before):**
```
1. Summary panels (General, Investments, Debts)
2. Metrics row (DTI, Net Worth, Fragility, Savings Rate)
3. Financial summary (Strengths, Weaknesses, Insights)
4. FIRE Journey
5. Net Worth Chart ← Currently here
```

**New Layout (After):**
```
1. Summary panels (General, Investments, Debts)
2. Metrics row (DTI, Net Worth, Fragility, Savings Rate)
3. Net Worth Chart ← MOVED HERE (hero position)
4. Financial summary (Strengths, Weaknesses, Insights)
5. FIRE Journey
```

**Implementation Steps:**

1. Locate the `renderDashboard()` function in `dashboard.js`

2. Move the net worth chart rendering code from bottom to top position:

```javascript
function renderDashboard() {
  const snapshot = window.store.state.snapshot;
  const metrics = window.calculateMetrics(snapshot);
  const summary = window.generateFinancialSummary(snapshot, metrics);

  return `
    <div class="dashboard">
      <!-- SECTION 1: Summary Panels -->
      ${renderSummaryPanels(snapshot)}

      <!-- SECTION 2: Metrics Row -->
      ${renderMetricsRow(metrics)}

      <!-- SECTION 3: NET WORTH CHART (MOVED UP!) -->
      <div class="chart-section hero-chart">
        <h2>📈 Your Net Worth Projection</h2>
        <p class="chart-subtitle">
          See your wealth grow over time as you follow your FIRE strategy
        </p>
        ${renderNetWorthChart(snapshot)}
      </div>

      <!-- SECTION 4: Financial Summary -->
      ${renderFinancialSummary(summary)}

      <!-- SECTION 5: FIRE Journey -->
      ${renderFireJourney()}
    </div>
  `;
}
```

---

### 2. Enhance Chart Rendering with Milestones

**File:** `components/dashboard.js` (or create new `components/netWorthChart.js`)

**Changes:** Add milestone annotations and improved styling

**Enhanced Chart Function:**

```javascript
/**
 * Render enhanced net worth chart with milestones
 * @param {Object} snapshot - Current financial snapshot
 * @returns {string} HTML for net worth chart
 */
function renderNetWorthChart(snapshot) {
  // Get projection data (assuming this exists in projections.js)
  const projections = window.calculateProjections(snapshot);

  // Calculate milestones
  const milestones = calculateMilestones(projections, snapshot);

  return `
    <div class="chart-container">
      <canvas id="netWorthChart" height="100"></canvas>
      ${renderMilestoneCards(milestones)}
    </div>
  `;
}

/**
 * Calculate key financial milestones from projections
 * @param {Array} projections - Month-by-month projection data
 * @param {Object} snapshot - Current financial snapshot
 * @returns {Object} Milestone dates and values
 */
function calculateMilestones(projections, snapshot) {
  const currentAge = snapshot.general.age;
  const milestones = {
    debtFree: null,
    positiveNetWorth: null,
    hundredK: null,
    millionaire: null,
    fireGoal: null
  };

  projections.forEach((month, index) => {
    const ageAtMonth = currentAge + (index / 12);

    // Debt-free milestone
    if (!milestones.debtFree && month.totalDebt === 0 && snapshot.debts.some(d => d.balance > 0)) {
      milestones.debtFree = {
        month: index,
        age: Math.floor(ageAtMonth),
        date: new Date(new Date().setMonth(new Date().getMonth() + index)),
        label: '🎉 Debt-Free!'
      };
    }

    // Positive net worth milestone
    if (!milestones.positiveNetWorth && month.netWorth > 0 && projections[0].netWorth <= 0) {
      milestones.positiveNetWorth = {
        month: index,
        age: Math.floor(ageAtMonth),
        date: new Date(new Date().setMonth(new Date().getMonth() + index)),
        label: '💚 Positive Net Worth'
      };
    }

    // $100K milestone
    if (!milestones.hundredK && month.netWorth >= 100000) {
      milestones.hundredK = {
        month: index,
        age: Math.floor(ageAtMonth),
        date: new Date(new Date().setMonth(new Date().getMonth() + index)),
        label: '💰 $100K Net Worth'
      };
    }

    // Millionaire milestone
    if (!milestones.millionaire && month.netWorth >= 1000000) {
      milestones.millionaire = {
        month: index,
        age: Math.floor(ageAtMonth),
        date: new Date(new Date().setMonth(new Date().getMonth() + index)),
        label: '🏆 Millionaire!'
      };
    }

    // FIRE milestone (25x annual expenses)
    const fireNumber = snapshot.general.monthlyExpense * 12 * 25;
    if (!milestones.fireGoal && month.netWorth >= fireNumber) {
      milestones.fireGoal = {
        month: index,
        age: Math.floor(ageAtMonth),
        date: new Date(new Date().setMonth(new Date().getMonth() + index)),
        label: '🔥 FIRE Achieved!',
        value: fireNumber
      };
    }
  });

  return milestones;
}

/**
 * Render milestone cards below chart
 * @param {Object} milestones - Calculated milestones
 * @returns {string} HTML for milestone cards
 */
function renderMilestoneCards(milestones) {
  const cards = [];

  if (milestones.debtFree) {
    cards.push({
      icon: '🎉',
      title: 'Debt-Free',
      date: milestones.debtFree.date,
      age: milestones.debtFree.age
    });
  }

  if (milestones.hundredK) {
    cards.push({
      icon: '💰',
      title: '$100K Net Worth',
      date: milestones.hundredK.date,
      age: milestones.hundredK.age
    });
  }

  if (milestones.millionaire) {
    cards.push({
      icon: '🏆',
      title: 'Millionaire',
      date: milestones.millionaire.date,
      age: milestones.millionaire.age
    });
  }

  if (milestones.fireGoal) {
    cards.push({
      icon: '🔥',
      title: 'FIRE Achieved',
      date: milestones.fireGoal.date,
      age: milestones.fireGoal.age
    });
  }

  if (cards.length === 0) {
    return '';
  }

  return `
    <div class="milestone-cards">
      ${cards.map(card => `
        <div class="milestone-card">
          <div class="milestone-icon">${card.icon}</div>
          <div class="milestone-info">
            <div class="milestone-title">${card.title}</div>
            <div class="milestone-date">
              ${card.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              <span class="milestone-age">(Age ${card.age})</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
```

---

### 3. Add Chart Styling (CSS)

**File:** `css/styles.css`

**Add these styles:**

```css
/* ===========================
   HERO NET WORTH CHART
   ========================== */

.hero-chart {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero-chart h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--gold) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chart-subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  margin-bottom: 2rem;
  text-align: center;
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 400px;
}

#netWorthChart {
  width: 100% !important;
  height: 400px !important;
  margin-bottom: 1.5rem;
}

/* Milestone cards */
.milestone-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.milestone-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.milestone-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
}

.milestone-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.milestone-info {
  flex: 1;
}

.milestone-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--gold);
  margin-bottom: 0.25rem;
}

.milestone-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.milestone-age {
  color: var(--accent);
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-chart {
    padding: 1.5rem 1rem;
  }

  .hero-chart h2 {
    font-size: 1.5rem;
  }

  .chart-subtitle {
    font-size: 1rem;
  }

  .chart-container {
    min-height: 300px;
  }

  #netWorthChart {
    height: 300px !important;
  }

  .milestone-cards {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .milestone-card {
    padding: 0.75rem;
  }

  .milestone-icon {
    font-size: 1.5rem;
  }

  .milestone-title {
    font-size: 0.9rem;
  }

  .milestone-date {
    font-size: 0.8125rem;
  }
}

/* Print view - ensure chart is visible */
@media print {
  .hero-chart {
    page-break-inside: avoid;
  }

  #netWorthChart {
    height: 300px !important;
  }
}
```

---

### 4. Update Chart.js Configuration (If using Chart.js)

**File:** `components/dashboard.js` or `js/chart-config.js`

**Purpose:** Configure chart with better visuals and milestone annotations

**Enhanced Chart Configuration:**

```javascript
/**
 * Initialize net worth chart with Chart.js
 * Called after DOM is rendered
 */
function initNetWorthChart() {
  const ctx = document.getElementById('netWorthChart');
  if (!ctx) return;

  const snapshot = window.store.state.snapshot;
  const projections = window.calculateProjections(snapshot);
  const milestones = calculateMilestones(projections, snapshot);

  // Prepare chart data
  const labels = projections.map((p, i) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + i);
    return monthDate;
  });

  const netWorthData = projections.map(p => p.netWorth);

  // Create milestone annotations
  const annotations = {};
  Object.entries(milestones).forEach(([key, milestone]) => {
    if (milestone) {
      annotations[key] = {
        type: 'line',
        xMin: milestone.month,
        xMax: milestone.month,
        borderColor: 'rgba(212, 175, 55, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        label: {
          content: milestone.label,
          enabled: true,
          position: 'top',
          backgroundColor: 'rgba(212, 175, 55, 0.9)',
          color: '#1a1a1a'
        }
      };
    }
  });

  // Create chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Net Worth',
        data: netWorthData,
        borderColor: (context) => {
          // Gradient from red (negative) to gold to green (positive)
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(212, 175, 55, 1)';

          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');   // Red at bottom
          gradient.addColorStop(0.5, 'rgba(212, 175, 55, 1)');  // Gold at middle
          gradient.addColorStop(1, 'rgba(34, 197, 94, 1)');     // Green at top
          return gradient;
        },
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'rgba(212, 175, 55, 0.1)';

          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.05)');
          gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.1)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.2)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(212, 175, 55, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
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
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          titleColor: '#d4af37',
          bodyColor: '#e0e0e0',
          borderColor: '#d4af37',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (tooltipItems) => {
              const date = tooltipItems[0].label;
              return new Date(date).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              });
            },
            label: (context) => {
              const value = context.parsed.y;
              return `Net Worth: ${formatCurrency(value)}`;
            }
          }
        },
        annotation: {
          annotations: annotations
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'year',
            displayFormats: {
              year: 'yyyy'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#999'
          }
        },
        y: {
          beginAtZero: false,
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

// Call this function after dashboard is rendered
window.addEventListener('DOMContentLoaded', () => {
  if (window.app && window.app.currentView === 'dashboard') {
    initNetWorthChart();
  }
});
```

---

### 5. Update Dashboard Render to Initialize Chart

**File:** `components/dashboard.js`

**Changes:** Ensure chart initializes after DOM renders

```javascript
function renderDashboard() {
  const snapshot = window.store.state.snapshot;
  const metrics = window.calculateMetrics(snapshot);
  const summary = window.generateFinancialSummary(snapshot, metrics);

  const html = `
    <div class="dashboard">
      ${renderSummaryPanels(snapshot)}
      ${renderMetricsRow(metrics)}

      <!-- Hero Chart Section -->
      <div class="chart-section hero-chart">
        <h2>📈 Your Net Worth Projection</h2>
        <p class="chart-subtitle">
          See your wealth grow over time as you follow your FIRE strategy
        </p>
        ${renderNetWorthChart(snapshot)}
      </div>

      ${renderFinancialSummary(summary)}
      ${renderFireJourney()}
    </div>
  `;

  // Initialize chart after DOM update
  setTimeout(() => {
    initNetWorthChart();
  }, 0);

  return html;
}
```

---

## Testing & Edge Cases

### Test Cases

1. **Chart Position**
   - Load dashboard → Net worth chart appears directly after metrics row
   - Chart is above financial summary section
   - Chart is visible without scrolling on desktop (1920x1080)

2. **Milestones Display**
   - User with $50K net worth → Shows milestones: $100K, Millionaire, FIRE
   - User with negative net worth → Shows: Positive Net Worth, $100K, etc.
   - User already debt-free → Does NOT show "Debt-Free" milestone
   - Each milestone shows correct month/year and age

3. **Chart Interactions**
   - Hover over line → Tooltip shows month/year and exact net worth
   - Hover over milestone annotation → Shows milestone label
   - Chart is responsive to window resize
   - Chart renders correctly on mobile (300px height)

4. **Visual Appearance**
   - Gradient coloring: red (negative) → gold → green (positive)
   - Milestone lines are dashed and gold-colored
   - Chart is smooth (tension: 0.4)
   - No data points visible (pointRadius: 0) except on hover

### Edge Cases

- **Very short timeline:** User retiring in 2 years → Chart should still render with proper spacing
- **Very long timeline:** User retiring in 40 years → X-axis should show reasonable year intervals (every 5-10 years)
- **Negative net worth throughout:** Chart should still render with red gradient
- **No milestones reached:** Milestone cards section should be hidden
- **All milestones reached:** Should show all 4-5 milestone cards
- **Print view:** Chart should render correctly when printing dashboard

---

## Estimated Effort

**Development Time:** 4-6 hours

**Breakdown:**
- Dashboard layout reordering: 1 hour
- Milestone calculation logic: 2 hours
- Chart.js configuration and styling: 1-2 hours
- CSS styling and responsiveness: 1 hour
- Testing and edge cases: 1-2 hours

**Priority:** P1 (High - Significant visual impact, easy win)

**Dependencies:**
- Requires projections.js to provide month-by-month data
- Requires Chart.js library (if not already included)
- Should be implemented after basic dashboard is stable
