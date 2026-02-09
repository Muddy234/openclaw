# Feature 6: Scenario Comparison

## Vision

Users constantly wonder "what if?" - What if I get a raise? What if I cut my expenses by $500/month? What if I max out my 401(k)? Financial GPS should let users create and compare alternative scenarios side-by-side, showing exactly how different decisions impact their FIRE timeline and net worth.

## Goal

Create a scenario comparison tool that:
- Allows users to save their current plan as "Baseline"
- Create 2-3 alternative scenarios with different assumptions
- Compare scenarios side-by-side: FIRE date, net worth at 65, total investments
- Visualize impact with overlapping projection charts
- Help users make informed decisions about life changes (career moves, expense reductions, etc.)

## Success Metrics

**What Success Looks Like:**
- Users can answer "what if" questions with confidence
- Clear visualization of how changes impact long-term outcomes
- Increased engagement: users spend 5+ minutes exploring scenarios
- Users make better decisions: "If I increase savings by 10%, I'll retire 3 years earlier"

**Acceptance Criteria:**
- [ ] Users can save current state as "Baseline" scenario
- [ ] Users can create up to 3 alternative scenarios
- [ ] Each scenario has editable name and description
- [ ] Scenarios show comparison table: FIRE date, net worth, monthly savings
- [ ] Overlay chart shows all scenarios on one graph
- [ ] Quick scenario templates: "+$10K income", "-$500 expenses", "Max 401(k)"
- [ ] Users can switch between scenarios easily
- [ ] Scenarios persist in localStorage

---

## Implementation Plan

### 1. Create Scenario Management System

**File:** `js/scenarios.js` (new file)

**Purpose:** Manage multiple financial scenarios and comparisons

**Full Code:**

```javascript
// ===========================
// SCENARIO MANAGEMENT SYSTEM
// ===========================

const SCENARIO_STORAGE_KEY = 'financial-gps-scenarios';

/**
 * Scenario structure:
 * {
 *   id: string (uuid),
 *   name: string,
 *   description: string,
 *   snapshot: Object (full financial snapshot),
 *   createdAt: Date,
 *   isBaseline: boolean
 * }
 */

/**
 * Get all saved scenarios
 * @returns {Array} Array of scenarios
 */
function getScenarios() {
  const stored = localStorage.getItem(SCENARIO_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse scenarios:', e);
    return [];
  }
}

/**
 * Save scenarios to localStorage
 * @param {Array} scenarios - Array of scenarios
 */
function saveScenarios(scenarios) {
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenarios));
  } catch (e) {
    console.error('Failed to save scenarios:', e);
  }
}

/**
 * Create a new scenario from current snapshot
 * @param {string} name - Scenario name
 * @param {string} description - Scenario description
 * @param {Object} snapshot - Financial snapshot
 * @param {boolean} isBaseline - Whether this is the baseline scenario
 * @returns {Object} New scenario
 */
function createScenario(name, description, snapshot, isBaseline = false) {
  return {
    id: generateUUID(),
    name: name,
    description: description,
    snapshot: JSON.parse(JSON.stringify(snapshot)), // Deep copy
    createdAt: new Date().toISOString(),
    isBaseline: isBaseline
  };
}

/**
 * Add a scenario
 * @param {Object} scenario - Scenario to add
 */
function addScenario(scenario) {
  const scenarios = getScenarios();

  // If this is baseline, unmark any existing baseline
  if (scenario.isBaseline) {
    scenarios.forEach(s => s.isBaseline = false);
  }

  // Limit to 5 scenarios max
  if (scenarios.length >= 5) {
    scenarios.shift(); // Remove oldest
  }

  scenarios.push(scenario);
  saveScenarios(scenarios);
}

/**
 * Update a scenario
 * @param {string} scenarioId - ID of scenario to update
 * @param {Object} updates - Fields to update
 */
function updateScenario(scenarioId, updates) {
  const scenarios = getScenarios();
  const index = scenarios.findIndex(s => s.id === scenarioId);

  if (index !== -1) {
    scenarios[index] = { ...scenarios[index], ...updates };
    saveScenarios(scenarios);
  }
}

/**
 * Delete a scenario
 * @param {string} scenarioId - ID of scenario to delete
 */
function deleteScenario(scenarioId) {
  const scenarios = getScenarios();
  const filtered = scenarios.filter(s => s.id !== scenarioId);
  saveScenarios(filtered);
}

/**
 * Load a scenario into the current state
 * @param {string} scenarioId - ID of scenario to load
 */
function loadScenario(scenarioId) {
  const scenarios = getScenarios();
  const scenario = scenarios.find(s => s.id === scenarioId);

  if (scenario) {
    window.store.state.snapshot = JSON.parse(JSON.stringify(scenario.snapshot));
    window.store.recalculate();
    window.store.saveState();
    window.app.render();
  }
}

/**
 * Compare multiple scenarios
 * @param {Array} scenarioIds - IDs of scenarios to compare
 * @returns {Object} Comparison data
 */
function compareScenarios(scenarioIds) {
  const scenarios = getScenarios();
  const toCompare = scenarios.filter(s => scenarioIds.includes(s.id));

  if (toCompare.length === 0) {
    return null;
  }

  // Calculate projections for each scenario
  const comparisons = toCompare.map(scenario => {
    const projections = window.calculateProjections(scenario.snapshot);
    const metrics = window.calculateMetrics(scenario.snapshot);

    // Find FIRE date (25x annual expenses)
    const fireNumber = scenario.snapshot.general.monthlyExpense * 12 * 25;
    const fireMonth = projections.findIndex(p => p.netWorth >= fireNumber);
    const fireDate = fireMonth !== -1
      ? new Date(new Date().setMonth(new Date().getMonth() + fireMonth))
      : null;

    // Net worth at age 65
    const monthsTo65 = (65 - scenario.snapshot.general.age) * 12;
    const netWorthAt65 = projections[monthsTo65]?.netWorth || 0;

    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      isBaseline: scenario.isBaseline,
      metrics: {
        currentNetWorth: metrics.netWorth,
        savingsRate: metrics.savingsRate,
        dti: metrics.dti,
        fireDate: fireDate,
        fireAge: fireDate ? scenario.snapshot.general.age + (fireMonth / 12) : null,
        netWorthAt65: netWorthAt65,
        monthlyInvestments: scenario.snapshot.general.monthlyTakeHome - scenario.snapshot.general.monthlyExpense
      },
      projections: projections
    };
  });

  return comparisons;
}

/**
 * Generate scenario from template
 * @param {string} template - Template type
 * @param {Object} currentSnapshot - Current financial snapshot
 * @returns {Object} New scenario
 */
function createScenarioFromTemplate(template, currentSnapshot) {
  const snapshot = JSON.parse(JSON.stringify(currentSnapshot));

  switch (template) {
    case 'raise_10k':
      snapshot.general.annualIncome += 10000;
      snapshot.general.monthlyTakeHome += 600; // ~60% take-home after taxes
      return createScenario(
        '+$10K Raise',
        'What if you get a $10,000 annual raise?',
        snapshot
      );

    case 'reduce_expenses_500':
      snapshot.general.monthlyExpense = Math.max(0, snapshot.general.monthlyExpense - 500);
      return createScenario(
        'Cut Expenses $500',
        'What if you reduce monthly expenses by $500?',
        snapshot
      );

    case 'max_401k':
      const current401k = snapshot.investments.fourOhOneK || 0;
      const monthlyContribution = 1958; // $23,500 / 12 (2025 limit)
      // Reduce take-home by monthly contribution
      snapshot.general.monthlyTakeHome = Math.max(0, snapshot.general.monthlyTakeHome - monthlyContribution);
      return createScenario(
        'Max Out 401(k)',
        'What if you max out 401(k) contributions ($23,500/year)?',
        snapshot
      );

    case 'pay_off_high_interest':
      // Remove high-interest debts (>10%)
      snapshot.debts = snapshot.debts.map(d =>
        d.interestRate > 10 ? { ...d, balance: 0 } : d
      );
      return createScenario(
        'Eliminate High-Interest Debt',
        'What if you pay off all high-interest debt today?',
        snapshot
      );

    case 'side_hustle_1k':
      snapshot.general.monthlyTakeHome += 1000;
      return createScenario(
        'Side Hustle +$1K',
        'What if you earn $1,000/month from a side hustle?',
        snapshot
      );

    default:
      return null;
  }
}

/**
 * Generate a UUID (simple version)
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

---

### 2. Create Scenario Comparison Component

**File:** `components/scenarioComparison.js` (new file)

**Purpose:** Render scenario comparison UI

**Full Code:**

```javascript
// ===========================
// SCENARIO COMPARISON COMPONENT
// ===========================

/**
 * Render scenario comparison section
 * @returns {string} HTML for scenario comparison
 */
function renderScenarioComparison() {
  const scenarios = window.getScenarios();
  const currentSnapshot = window.store.state.snapshot;

  return `
    <div class="scenario-section">
      <h2>🔮 What-If Scenarios</h2>
      <p class="section-subtitle">
        Explore how different decisions impact your path to financial independence
      </p>

      <!-- Action Buttons -->
      <div class="scenario-actions">
        <button class="btn-primary" onclick="saveCurrentAsBaseline()">
          💾 Save Current as Baseline
        </button>
        <button class="btn-secondary" onclick="showScenarioTemplates()">
          ⚡ Quick Scenarios
        </button>
        <button class="btn-secondary" onclick="showCreateCustomScenario()">
          ✏️ Create Custom
        </button>
      </div>

      <!-- Saved Scenarios -->
      ${scenarios.length > 0 ? renderSavedScenarios(scenarios) : renderEmptyState()}

      <!-- Comparison View (if 2+ scenarios exist) -->
      ${scenarios.length >= 2 ? renderComparison(scenarios) : ''}
    </div>
  `;
}

/**
 * Render saved scenarios list
 * @param {Array} scenarios - Array of scenarios
 * @returns {string} HTML
 */
function renderSavedScenarios(scenarios) {
  return `
    <div class="saved-scenarios">
      <h3>Your Scenarios</h3>
      <div class="scenario-cards">
        ${scenarios.map(scenario => `
          <div class="scenario-card ${scenario.isBaseline ? 'baseline' : ''}">
            <div class="scenario-card-header">
              <h4>
                ${scenario.isBaseline ? '⭐ ' : ''}${scenario.name}
              </h4>
              <div class="scenario-card-actions">
                <button class="btn-icon" onclick="loadScenario('${scenario.id}')" title="Load this scenario">
                  📂
                </button>
                <button class="btn-icon" onclick="deleteScenario('${scenario.id}')" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
            <p class="scenario-description">${scenario.description}</p>
            <div class="scenario-quick-stats">
              ${renderScenarioQuickStats(scenario)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render quick stats for a scenario
 * @param {Object} scenario - Scenario object
 * @returns {string} HTML
 */
function renderScenarioQuickStats(scenario) {
  const metrics = window.calculateMetrics(scenario.snapshot);
  const projections = window.calculateProjections(scenario.snapshot);
  const fireNumber = scenario.snapshot.general.monthlyExpense * 12 * 25;
  const fireMonth = projections.findIndex(p => p.netWorth >= fireNumber);

  return `
    <div class="quick-stat">
      <span class="stat-label">Savings Rate:</span>
      <span class="stat-value">${metrics.savingsRate.toFixed(1)}%</span>
    </div>
    <div class="quick-stat">
      <span class="stat-label">FIRE Age:</span>
      <span class="stat-value">
        ${fireMonth !== -1 ? Math.floor(scenario.snapshot.general.age + fireMonth / 12) : 'N/A'}
      </span>
    </div>
  `;
}

/**
 * Render empty state when no scenarios exist
 * @returns {string} HTML
 */
function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-icon">💭</div>
      <h3>No scenarios yet</h3>
      <p>Save your current plan as a baseline, then create alternative scenarios to compare.</p>
    </div>
  `;
}

/**
 * Render scenario comparison table and chart
 * @param {Array} scenarios - Array of scenarios
 * @returns {string} HTML
 */
function renderComparison(scenarios) {
  const comparisons = window.compareScenarios(scenarios.map(s => s.id));

  if (!comparisons || comparisons.length < 2) {
    return '';
  }

  return `
    <div class="comparison-section">
      <h3>📊 Scenario Comparison</h3>

      <!-- Comparison Table -->
      <div class="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              ${comparisons.map(c => `
                <th>${c.isBaseline ? '⭐ ' : ''}${c.name}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Monthly Savings</td>
              ${comparisons.map(c => `
                <td>${formatCurrency(c.metrics.monthlyInvestments)}</td>
              `).join('')}
            </tr>
            <tr>
              <td>Savings Rate</td>
              ${comparisons.map(c => `
                <td>${c.metrics.savingsRate.toFixed(1)}%</td>
              `).join('')}
            </tr>
            <tr>
              <td>FIRE Age</td>
              ${comparisons.map(c => `
                <td class="${c.metrics.fireAge ? 'highlight' : ''}">
                  ${c.metrics.fireAge ? Math.floor(c.metrics.fireAge) : 'N/A'}
                </td>
              `).join('')}
            </tr>
            <tr>
              <td>Net Worth at 65</td>
              ${comparisons.map(c => `
                <td>${formatCurrency(c.metrics.netWorthAt65)}</td>
              `).join('')}
            </tr>
            <tr>
              <td>DTI Ratio</td>
              ${comparisons.map(c => `
                <td>${c.metrics.dti.toFixed(1)}%</td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Comparison Chart -->
      <div class="comparison-chart">
        <canvas id="scenarioComparisonChart" height="100"></canvas>
      </div>
    </div>
  `;
}

/**
 * Initialize scenario comparison chart
 */
function initScenarioComparisonChart() {
  const ctx = document.getElementById('scenarioComparisonChart');
  if (!ctx) return;

  const scenarios = window.getScenarios();
  const comparisons = window.compareScenarios(scenarios.map(s => s.id));

  if (!comparisons || comparisons.length < 2) return;

  // Color palette for scenarios
  const colors = [
    'rgba(212, 175, 55, 1)',   // Gold (baseline)
    'rgba(96, 165, 250, 1)',    // Blue
    'rgba(34, 197, 94, 1)',     // Green
    'rgba(168, 85, 247, 1)',    // Purple
    'rgba(251, 146, 60, 1)'     // Orange
  ];

  const datasets = comparisons.map((comp, index) => {
    const netWorthData = comp.projections.map(p => p.netWorth);
    const color = colors[index % colors.length];

    return {
      label: comp.name,
      data: netWorthData,
      borderColor: color,
      backgroundColor: color.replace('1)', '0.1)'),
      borderWidth: comp.isBaseline ? 3 : 2,
      borderDash: comp.isBaseline ? [] : [5, 5],
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6
    };
  });

  // Labels (months)
  const maxLength = Math.max(...comparisons.map(c => c.projections.length));
  const labels = Array.from({ length: maxLength }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    return date;
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
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
          padding: 12
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'year'
          },
          grid: { display: false },
          ticks: { color: '#999' }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#999',
            callback: (value) => formatCurrency(value)
          }
        }
      }
    }
  });
}

/**
 * Save current snapshot as baseline
 */
function saveCurrentAsBaseline() {
  const snapshot = window.store.state.snapshot;
  const scenario = window.createScenario(
    'Baseline',
    'Your current financial plan',
    snapshot,
    true
  );
  window.addScenario(scenario);
  window.app.render();
}

/**
 * Show scenario template selection modal
 */
function showScenarioTemplates() {
  const templates = [
    { id: 'raise_10k', label: '💰 +$10K Raise', description: 'Get a $10,000 annual raise' },
    { id: 'reduce_expenses_500', label: '✂️ Cut $500/month', description: 'Reduce monthly expenses by $500' },
    { id: 'max_401k', label: '📈 Max 401(k)', description: 'Max out 401(k) contributions' },
    { id: 'pay_off_high_interest', label: '🎯 Eliminate High-Interest Debt', description: 'Pay off all debts >10% APR' },
    { id: 'side_hustle_1k', label: '🚀 Side Hustle', description: 'Earn $1,000/month extra' }
  ];

  // Create modal (simplified - you'd want a proper modal component)
  const modal = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <h3>Choose a Scenario Template</h3>
        <div class="template-list">
          ${templates.map(t => `
            <button class="template-option" onclick="createFromTemplate('${t.id}')">
              <div class="template-label">${t.label}</div>
              <div class="template-description">${t.description}</div>
            </button>
          `).join('')}
        </div>
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

/**
 * Create scenario from template
 */
function createFromTemplate(templateId) {
  const currentSnapshot = window.store.state.snapshot;
  const scenario = window.createScenarioFromTemplate(templateId, currentSnapshot);

  if (scenario) {
    window.addScenario(scenario);
    closeModal();
    window.app.render();
  }
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}
```

---

### 3. Integrate into Dashboard

**File:** `components/dashboard.js`

**Add scenario section:**

```javascript
function renderDashboard() {
  // ... existing code ...

  const html = `
    <div class="dashboard">
      ${renderSummaryPanels(snapshot)}
      ${renderMetricsRow(metrics)}
      ${renderNetWorthChart(snapshot)}
      ${renderScenarioComparison()}  <!-- ADD THIS -->
      ${renderFinancialSummary(summary)}
      ${renderFireJourney()}
      ${renderDebtComparison(snapshot)}
    </div>
  `;

  setTimeout(() => {
    initNetWorthChart();
    initDebtPayoffChart();
    initScenarioComparisonChart();  // ADD THIS
  }, 0);

  return html;
}
```

---

### 4. Add CSS Styling

**File:** `css/styles.css`

```css
/* ===========================
   SCENARIO COMPARISON
   ========================== */

.scenario-section {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}

.scenario-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

/* Scenario cards */
.saved-scenarios {
  margin-bottom: 2rem;
}

.scenario-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.scenario-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.scenario-card.baseline {
  border-color: var(--gold);
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2);
}

.scenario-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.scenario-card h4 {
  font-size: 1.125rem;
  margin: 0;
}

.scenario-card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  padding: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.btn-icon:hover {
  opacity: 1;
}

.scenario-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.scenario-quick-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.quick-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  color: var(--gold);
  font-weight: 600;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
}

/* Comparison table */
.comparison-table {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.comparison-table th {
  background: rgba(255, 255, 255, 0.02);
  font-weight: 600;
}

.comparison-table td.highlight {
  color: var(--gold);
  font-weight: 600;
}

/* Comparison chart */
#scenarioComparisonChart {
  width: 100% !important;
  height: 400px !important;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.template-option {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-option:hover {
  border-color: var(--gold);
  background: rgba(212, 175, 55, 0.05);
}

.template-label {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.template-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

---

### 5. Update index.html

**Add scenario script:**

```html
<script src="js/scenarios.js"></script>  <!-- ADD THIS -->
<script src="components/scenarioComparison.js"></script>  <!-- ADD THIS -->
```

---

## Testing & Edge Cases

### Test Cases

1. **Save Baseline**
   - Click "Save Current as Baseline" → Scenario saved with ⭐
   - Baseline scenario shows current values correctly

2. **Quick Scenarios**
   - Create "+$10K Raise" → Income increases, projections update
   - Create "Cut $500/month" → Expenses decrease, FIRE date moves earlier
   - Create "Max 401(k)" → Take-home decreases, retirement savings increase

3. **Comparison**
   - 2+ scenarios → Comparison table and chart appear
   - Chart shows different trajectories
   - Table highlights differences clearly

4. **Load Scenario**
   - Click 📂 icon → Loads scenario into current state
   - Dashboard updates with scenario data

5. **Delete Scenario**
   - Click 🗑️ icon → Scenario removed
   - Comparison updates if < 2 scenarios remain

### Edge Cases

- **Max scenarios (5):** Oldest scenario removed when adding 6th
- **No scenarios:** Shows empty state with helpful guidance
- **Single scenario:** No comparison shown
- **Identical scenarios:** Chart lines overlap
- **Very different scenarios:** Chart scales appropriately

---

## Estimated Effort

**Development Time:** 10-12 hours

**Breakdown:**
- Scenario management system: 3-4 hours
- Comparison component and UI: 3-4 hours
- Chart visualization: 2 hours
- Template system and modal: 2 hours
- CSS styling: 2 hours
- Testing and edge cases: 2-3 hours

**Priority:** P1 (High - Powerful "what-if" analysis)

**Dependencies:**
- Requires projections.js for scenario calculations
- Requires Chart.js for comparison visualization
- Should be implemented after core features are stable
