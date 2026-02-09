/**
 * dashboard.js
 * Renders the dashboard view with tabbed navigation for simplified UX
 */

function renderDashboard() {
  const { snapshot, currentSteps, nextStep } = getState();
  const metrics = calculateMetrics(snapshot);
  const summary = generateFinancialSummary(snapshot, metrics);
  const cashFlow = snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense;

  // Calculate overall progress
  const completedSteps = currentSteps.filter(s => s.status === 'COMPLETED').length;
  const applicableSteps = currentSteps.filter(s => s.status !== 'NOT_APPLICABLE').length;
  const overallProgress = applicableSteps > 0 ? Math.round((completedSteps / applicableSteps) * 100) : 0;

  // Fragility helpers
  const getFragilityColor = (fragility) => {
    switch (fragility) {
      case 'SOLID': return 'text-success';
      case 'MODERATE': return 'text-gold';
      case 'FRAGILE': return 'text-danger';
      default: return 'text-secondary';
    }
  };

  const getFragilityLabel = (fragility) => {
    switch (fragility) {
      case 'SOLID': return 'Solid';
      case 'MODERATE': return 'Moderate';
      case 'FRAGILE': return 'Fragile';
      default: return '-';
    }
  };

  // Format currency
  const formatCurrency = (n) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  };

  // Filter applicable steps for flowchart
  const flowchartSteps = currentSteps.filter(s => s.status !== 'NOT_APPLICABLE');

  // Tab definitions
  const tabs = [
    { id: 'summary', label: 'Summary', icon: 'summary' },
    { id: 'overview', label: 'Monthly Budget', icon: 'overview' },
    { id: 'investments', label: 'Investment & Savings', icon: 'investments' },
    { id: 'projections', label: 'Projections', icon: 'projections' },
    { id: 'fire', label: 'FIRE Journey', icon: 'fire' },
    { id: 'debts', label: 'Debts', icon: 'debts' },
    { id: 'taxes', label: 'Taxes', icon: 'taxes' },
    { id: 'scenarios', label: 'Scenarios', icon: 'scenarios' }
  ];

  return `
    <div class="dashboard-layout">
      <!-- Left Sidebar Navigation -->
      <aside class="dashboard-sidebar" role="navigation" aria-label="Dashboard sections">
        <div class="sidebar-header">
          <h1 class="sidebar-title">Financial GPS</h1>
        </div>
        <nav class="dashboard-nav" role="tablist" aria-label="Dashboard tabs">
          ${tabs.map((tab, index) => `
            <button
              class="dashboard-tab"
              data-tab="${tab.id}"
              role="tab"
              aria-selected="${index === 0 ? 'true' : 'false'}"
              aria-controls="panel-${tab.id}"
              tabindex="${index === 0 ? '0' : '-1'}"
            >
              ${typeof getTabIcon === 'function' ? getTabIcon(tab.icon) : ''}
              <span class="tab-label">${tab.label}</span>
            </button>
          `).join('')}
        </nav>
        <!-- Sidebar Status Indicators -->
        <div class="sidebar-footer">
          ${typeof renderSidebarStatus === 'function' ? renderSidebarStatus(snapshot) : ''}
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="dashboard-content">
        <!-- Mobile Header -->
        <div class="mobile-header">
          <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 class="mobile-title">Financial GPS</h1>
          <button onclick="showInput()" class="btn btn-ghost btn-sm">
            Edit
          </button>
        </div>

        <div class="dashboard-panels">
          <!-- Tab Panel: Summary -->
          <div class="dashboard-panel" data-panel="summary" id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
            <div class="panel-content">
              <h2 class="panel-title">Financial Summary</h2>
              ${typeof renderSummaryTab === 'function' ? renderSummaryTab(snapshot) : ''}
            </div>
          </div>

          <!-- Tab Panel: Monthly Budget -->
          <div class="dashboard-panel" data-panel="overview" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">Monthly Budget</h2>

              <!-- Budget Health Score -->
              ${typeof renderBudgetHealthScore === 'function' ? renderBudgetHealthScore(snapshot, metrics) : ''}

              <!-- Key Metrics Row -->
              <div class="metrics-row">
                <div class="metric-card">
                  <span class="metric-label">
                    ${typeof renderTooltip === 'function'
                      ? renderTooltip('netWorth', 'Net Worth', {
                          value: metrics.netWorth,
                          age: snapshot.general.age,
                          income: snapshot.general.annualIncome
                        })
                      : 'Net Worth'}
                  </span>
                  <span class="metric-value ${metrics.netWorth >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(metrics.netWorth)}
                  </span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">
                    ${typeof renderTooltip === 'function'
                      ? renderTooltip('debtToIncome', 'Debt to Income', { value: metrics.debtToIncome })
                      : 'Debt to Income'}
                  </span>
                  <span class="metric-value text-gold">${metrics.debtToIncome}%</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">
                    ${typeof renderTooltip === 'function'
                      ? renderTooltip('fragility', 'Fragility', { value: metrics.fragility })
                      : 'Fragility'}
                  </span>
                  <span class="metric-value ${getFragilityColor(metrics.fragility)}">
                    ${getFragilityLabel(metrics.fragility)}
                  </span>
                </div>
              </div>

              <!-- Cash Flow Waterfall -->
              ${typeof renderBudgetWaterfall === 'function' ? renderBudgetWaterfall(snapshot) : ''}

              <!-- Budget Details -->
              <div class="card">
                <h3 class="panel-header">Income & Expenses</h3>
                <div class="panel-grid summary-grid">
                  ${typeof renderEditableField === 'function'
                    ? renderEditableField('age', 'Age', snapshot.general.age)
                    : `<div class="panel-row"><span class="panel-label">Age</span><span class="panel-value">${snapshot.general.age}</span></div>`}
                  ${typeof renderEditableField === 'function'
                    ? renderEditableField('targetRetirement', 'Target Retirement', snapshot.general.targetRetirement)
                    : `<div class="panel-row"><span class="panel-label">Target Retirement</span><span class="panel-value">${snapshot.general.targetRetirement}</span></div>`}
                  ${typeof renderEditableField === 'function'
                    ? renderEditableField('annualIncome', 'Annual Income', snapshot.general.annualIncome)
                    : `<div class="panel-row"><span class="panel-label">Annual Income</span><span class="panel-value">${snapshot.general.annualIncome.toLocaleString()}</span></div>`}
                  ${typeof renderEditableField === 'function'
                    ? renderEditableField('monthlyTakeHome', 'Monthly Take-home', snapshot.general.monthlyTakeHome)
                    : `<div class="panel-row"><span class="panel-label">Monthly Take-home</span><span class="panel-value">${snapshot.general.monthlyTakeHome.toLocaleString()}</span></div>`}
                  ${typeof renderEditableField === 'function'
                    ? renderEditableField('monthlyExpense', 'Monthly Expense', snapshot.general.monthlyExpense)
                    : `<div class="panel-row"><span class="panel-label">Monthly Expense</span><span class="panel-value">${snapshot.general.monthlyExpense.toLocaleString()}</span></div>`}
                  <div class="panel-row panel-row--readonly">
                    <span class="panel-label">Monthly Cash Flow</span>
                    <span class="panel-value">${cashFlow.toLocaleString()}</span>
                  </div>
                  ${typeof renderEditableField === 'function'
                    ? renderEditableField('msa', 'MSA', snapshot.general.msa)
                    : `<div class="panel-row"><span class="panel-label">MSA</span><span class="panel-value">${snapshot.general.msa || '-'}</span></div>`}
                </div>
              </div>

              <!-- Expense Category Breakdown -->
              ${typeof renderExpenseCategoryEstimator === 'function' ? renderExpenseCategoryEstimator(snapshot) : ''}

              <!-- 50/30/20 Rule Analyzer -->
              ${typeof render503020Analyzer === 'function' ? render503020Analyzer(snapshot, metrics) : ''}

              <!-- Financial Summary / Debrief -->
              <div class="card">
                <h3 class="panel-header">Your Financial Snapshot</h3>

                ${summary.strengths.length > 0 ? `
                  <div class="summary-section">
                    <h4 class="summary-heading text-success">Strengths</h4>
                    <ul class="summary-list">
                      ${summary.strengths.map(s => `<li class="summary-item">${s}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${summary.weaknesses.length > 0 ? `
                  <div class="summary-section">
                    <h4 class="summary-heading text-danger">Areas for Improvement</h4>
                    <ul class="summary-list">
                      ${summary.weaknesses.map(w => `<li class="summary-item">${w}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${summary.insights.length > 0 ? `
                  <div class="summary-section">
                    <h4 class="summary-heading text-gold">Insights</h4>
                    <ul class="summary-list">
                      ${summary.insights.map(i => `<li class="summary-item">${i}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Tab Panel: Investment & Savings -->
          <div class="dashboard-panel" data-panel="investments" id="panel-investments" role="tabpanel" aria-labelledby="tab-investments" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">Investment & Savings</h2>
              ${typeof renderInvestmentTab === 'function' ? renderInvestmentTab(snapshot) : ''}
            </div>
          </div>

          <!-- Tab Panel: Projections -->
          <div class="dashboard-panel" data-panel="projections" id="panel-projections" role="tabpanel" aria-labelledby="tab-projections" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">Net Worth Projections</h2>

              <!-- HERO: Net Worth Projection Chart -->
              <div class="hero-chart">
                <p class="hero-chart-subtitle">See your wealth grow over time as you follow your financial strategy</p>

                <!-- COMPLIANCE: Projection disclaimer -->
                <div class="projection-disclaimer" role="alert" aria-live="polite">
                  <p class="disclaimer-text">
                    <strong>Important:</strong> These projections are hypothetical illustrations
                    for <strong>educational purposes only</strong>. Actual results will vary based on
                    market performance, life events, and other factors.
                    This tool does not constitute financial, investment, or tax advice.
                  </p>
                  <details class="assumption-details">
                    <summary>View Projection Assumptions</summary>
                    <ul>
                      <li>Investment growth: 7% annually (historical average, not guaranteed)</li>
                      <li>Savings interest: 4% annually</li>
                      <li>Real estate appreciation: 5% annually</li>
                      <li>Inflation: 3% annually</li>
                      <li>Consistent monthly contributions maintained</li>
                    </ul>
                    <p class="past-performance-warning">
                      <em>Past performance does not guarantee future results.</em>
                    </p>
                  </details>
                </div>

                ${typeof renderNetWorthChart === 'function' ? renderNetWorthChart(snapshot) : ''}
              </div>
            </div>
          </div>

          <!-- Tab Panel: FIRE Journey -->
          <div class="dashboard-panel" data-panel="fire" id="panel-fire" role="tabpanel" aria-labelledby="tab-fire" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">FIRE Journey Progress</h2>
              ${renderFireJourney(snapshot)}
            </div>
          </div>

          <!-- Tab Panel: Debts -->
          <div class="dashboard-panel" data-panel="debts" id="panel-debts" role="tabpanel" aria-labelledby="tab-debts" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">Debt Payoff Strategy</h2>
              ${typeof renderDebtTab === 'function' ? renderDebtTab(snapshot) : ''}
            </div>
          </div>

          <!-- Tab Panel: Taxes -->
          <div class="dashboard-panel" data-panel="taxes" id="panel-taxes" role="tabpanel" aria-labelledby="tab-taxes" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">Tax Optimization</h2>
              ${typeof renderTaxOptimization === 'function' ? renderTaxOptimization(snapshot) : ''}
            </div>
          </div>

          <!-- Tab Panel: Scenarios -->
          <div class="dashboard-panel" data-panel="scenarios" id="panel-scenarios" role="tabpanel" aria-labelledby="tab-scenarios" hidden aria-hidden="true">
            <div class="panel-content">
              <h2 class="panel-title">Scenario Comparison</h2>
              ${typeof renderScenarioComparison === 'function' ? renderScenarioComparison() : ''}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <p class="text-center text-dim text-sm mt-8 dashboard-footer">
          Data stored locally in your browser
        </p>
      </main>

    </div>
  `;
}
