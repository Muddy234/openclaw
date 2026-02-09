/**
 * investmentSavings.js
 * Investment & Savings tab component
 * Features: Asset Allocation Chart, Emergency Fund Status, Allocation Recommendations
 */

// Chart instance for cleanup on re-render
let investmentChartInstance = null;

/**
 * Render the Investment & Savings tab content
 * @param {Object} snapshot - Current financial snapshot
 * @returns {string} HTML string
 */
function renderInvestmentTab(snapshot) {
  const inv = snapshot.investments;
  const totalAssets = getTotalAssets(snapshot);
  const totalDebts = getTotalDebts(snapshot);
  const netWorth = totalAssets - totalDebts;
  const savingsRate = snapshot.general.monthlyTakeHome > 0
    ? Math.round(((snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense) / snapshot.general.monthlyTakeHome) * 100)
    : 0;

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(n);

  return `
    ${renderPortfolioMetrics(totalAssets, netWorth, savingsRate, formatCurrency)}
    ${renderChartAndFields(snapshot, inv, totalAssets, formatCurrency)}
    ${renderEmergencyFundStatus(snapshot, inv, formatCurrency)}
    ${renderAllocationRecommendations(snapshot, inv, totalAssets)}
  `;
}

// ===========================
// SECTION 1: PORTFOLIO METRICS
// ===========================

function renderPortfolioMetrics(totalAssets, netWorth, savingsRate, formatCurrency) {
  const netWorthClass = netWorth >= 0 ? 'text-success' : 'text-danger';
  const savingsClass = savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-gold' : 'text-danger';

  return `
    <div class="metrics-row">
      <div class="metric-card">
        <span class="metric-label">Total Assets</span>
        <span class="metric-value text-gold">${formatCurrency(totalAssets)}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Net Worth</span>
        <span class="metric-value ${netWorthClass}">${formatCurrency(netWorth)}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Savings Rate</span>
        <span class="metric-value ${savingsClass}">${savingsRate}%</span>
      </div>
    </div>
  `;
}

// ===========================
// SECTION 2: CHART + FIELDS
// ===========================

function renderChartAndFields(snapshot, inv, totalAssets, formatCurrency) {
  // Group investments for chart
  const retirement = inv.fourOhOneK + inv.ira + inv.rothIra;
  const liquid = inv.savings + inv.stocksBonds;
  const property = inv.realEstate + inv.carValue;
  const other = inv.other;

  // Build chart data description for screen readers
  const groups = [];
  if (retirement > 0) groups.push(`Retirement: ${formatCurrency(retirement)}`);
  if (liquid > 0) groups.push(`Liquid: ${formatCurrency(liquid)}`);
  if (property > 0) groups.push(`Property: ${formatCurrency(property)}`);
  if (other > 0) groups.push(`Other: ${formatCurrency(other)}`);
  const chartDescription = totalAssets > 0
    ? `Asset allocation: ${groups.join(', ')}`
    : 'No assets entered yet.';

  return `
    <div class="invest-tab-grid">
      <div class="card">
        <h3 class="panel-header">Asset Allocation</h3>
        ${totalAssets > 0 ? `
          <div class="invest-chart-container" role="img" aria-label="${chartDescription}">
            <canvas id="assetAllocationChart"></canvas>
          </div>
        ` : `
          <div class="invest-empty-state">
            <p>Enter your investment balances to see your asset allocation breakdown.</p>
          </div>
        `}
      </div>

      <div class="card">
        <h3 class="panel-header">Your Portfolio</h3>
        <div class="panel-grid summary-grid">
          ${typeof renderEditableField === 'function'
            ? renderEditableField('savings', 'Savings', inv.savings)
            : `<div class="panel-row"><span class="panel-label">Savings</span><span class="panel-value">${inv.savings.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('ira', 'IRA', inv.ira)
            : `<div class="panel-row"><span class="panel-label">IRA</span><span class="panel-value">${inv.ira.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('rothIra', 'Roth IRA', inv.rothIra)
            : `<div class="panel-row"><span class="panel-label">Roth IRA</span><span class="panel-value">${inv.rothIra.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('stocksBonds', 'Stocks / Bonds', inv.stocksBonds)
            : `<div class="panel-row"><span class="panel-label">Stocks / Bonds</span><span class="panel-value">${inv.stocksBonds.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('fourOhOneK', '401k', inv.fourOhOneK)
            : `<div class="panel-row"><span class="panel-label">401k</span><span class="panel-value">${inv.fourOhOneK.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('realEstate', 'Real Estate', inv.realEstate)
            : `<div class="panel-row"><span class="panel-label">Real Estate</span><span class="panel-value">${inv.realEstate.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('carValue', 'Car', inv.carValue)
            : `<div class="panel-row"><span class="panel-label">Car</span><span class="panel-value">${inv.carValue.toLocaleString()}</span></div>`}
          ${typeof renderEditableField === 'function'
            ? renderEditableField('otherInvestments', 'Other', inv.other)
            : `<div class="panel-row"><span class="panel-label">Other</span><span class="panel-value">${inv.other.toLocaleString()}</span></div>`}
        </div>
      </div>
    </div>
  `;
}

// ===========================
// SECTION 3: EMERGENCY FUND
// ===========================

function renderEmergencyFundStatus(snapshot, inv, formatCurrency) {
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const efTarget = snapshot.fireSettings ? (snapshot.fireSettings.emergencyFundMonths || 6) : 6;
  const savings = inv.savings || 0;

  if (monthlyExpense <= 0) {
    return `
      <div class="card">
        <h3 class="panel-header">Emergency Fund Status</h3>
        <div class="invest-empty-state">
          <p>Enter your monthly expenses on the Monthly Budget tab to see your emergency fund status.</p>
        </div>
      </div>
    `;
  }

  const monthsCovered = savings / monthlyExpense;
  const targetAmount = monthlyExpense * efTarget;
  const progress = Math.min(100, (savings / targetAmount) * 100);
  const shortfall = Math.max(0, targetAmount - savings);

  // Determine status
  let progressClass = 'progress-fill--danger';
  let badgeClass = 'status-badge--danger';
  let badgeLabel = 'Needs Attention';
  if (monthsCovered >= efTarget) {
    progressClass = 'progress-fill--success progress-fill--static';
    badgeClass = 'status-badge--success';
    badgeLabel = 'Fully Funded';
  } else if (monthsCovered >= 3) {
    progressClass = '';  // default gold
    badgeClass = 'status-badge--warning';
    badgeLabel = 'Building';
  }

  return `
    <div class="card">
      <h3 class="panel-header">Emergency Fund Status</h3>
      <div class="invest-ef-header">
        <span class="invest-ef-months">${monthsCovered.toFixed(1)} months covered</span>
        <span class="status-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="progress-bar-container" style="margin: 1rem 0;">
        <div class="progress-track" role="progressbar"
             aria-valuenow="${Math.round(progress)}"
             aria-valuemin="0" aria-valuemax="100"
             aria-label="Emergency fund progress: ${monthsCovered.toFixed(1)} of ${efTarget} months">
          <div class="progress-fill ${progressClass}" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="invest-ef-amounts">
        <div class="invest-ef-amount">
          <span class="invest-ef-amount-label">Current</span>
          <span class="invest-ef-amount-value">${formatCurrency(savings)}</span>
        </div>
        <div class="invest-ef-amount">
          <span class="invest-ef-amount-label">Target (${efTarget} mo)</span>
          <span class="invest-ef-amount-value">${formatCurrency(targetAmount)}</span>
        </div>
        ${shortfall > 0 ? `
          <div class="invest-ef-amount">
            <span class="invest-ef-amount-label">Shortfall</span>
            <span class="invest-ef-amount-value text-danger">${formatCurrency(shortfall)}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ===========================
// SECTION 4: ALLOCATION RECS
// ===========================

function renderAllocationRecommendations(snapshot, inv, totalAssets) {
  const age = snapshot.general.age || 30;

  if (totalAssets <= 0) {
    return `
      <div class="card">
        <h3 class="panel-header">Allocation Recommendations</h3>
        <div class="invest-empty-state">
          <p>Enter your investment balances to see personalized allocation recommendations.</p>
        </div>
      </div>
    `;
  }

  // Age-based recommended allocation (glide path)
  const recGrowth = Math.max(30, Math.min(90, 110 - age));
  const recConservative = Math.max(5, Math.min(40, age - 10));
  const recRealAssets = 100 - recGrowth - recConservative;

  // Current allocation
  const growth = inv.stocksBonds + inv.fourOhOneK + inv.ira + inv.rothIra;
  const conservative = inv.savings;
  const realAssets = inv.realEstate + inv.carValue + inv.other;

  const curGrowth = Math.round((growth / totalAssets) * 100);
  const curConservative = Math.round((conservative / totalAssets) * 100);
  const curRealAssets = 100 - curGrowth - curConservative;

  const buckets = [
    { label: 'Growth', detail: '401k, IRA, Roth, Stocks', current: curGrowth, recommended: recGrowth, color: '#8B5CF6' },
    { label: 'Conservative', detail: 'Savings, Cash', current: curConservative, recommended: recConservative, color: '#22C55E' },
    { label: 'Real Assets', detail: 'Real Estate, Auto, Other', current: curRealAssets, recommended: recRealAssets, color: '#6366F1' },
  ];

  return `
    <div class="card">
      <h3 class="panel-header">Allocation Recommendations</h3>
      <p class="invest-alloc-subtitle">Based on age ${age}, here's how your portfolio compares to general guidance:</p>

      <div class="invest-alloc-legend">
        <span class="invest-alloc-legend-item">
          <span class="invest-alloc-legend-dot" style="background: var(--gold);"></span> Your Allocation
        </span>
        <span class="invest-alloc-legend-item">
          <span class="invest-alloc-legend-dot" style="background: rgba(255,255,255,0.2);"></span> Recommended
        </span>
      </div>

      ${buckets.map(b => {
        const diff = b.current - b.recommended;
        const diffLabel = diff > 0 ? `+${diff}%` : `${diff}%`;
        const diffClass = Math.abs(diff) <= 5 ? 'text-success' : Math.abs(diff) <= 15 ? 'text-gold' : 'text-danger';
        return `
          <div class="invest-alloc-row">
            <div class="invest-alloc-label">
              <span class="invest-alloc-name">${b.label}</span>
              <span class="invest-alloc-detail">${b.detail}</span>
            </div>
            <div class="invest-alloc-bars-wrapper">
              <div class="invest-alloc-bars">
                <div class="invest-alloc-bar invest-alloc-bar--current" style="width: ${Math.max(2, b.current)}%; background: var(--gold);"></div>
                <div class="invest-alloc-bar invest-alloc-bar--recommended" style="width: ${Math.max(2, b.recommended)}%; background: rgba(255,255,255,0.15);"></div>
              </div>
              <div class="invest-alloc-values">
                <span>${b.current}%</span>
                <span class="invest-alloc-vs">vs</span>
                <span>${b.recommended}%</span>
                <span class="${diffClass}">(${diffLabel})</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <div class="invest-disclaimer">
        <p>These are general guidelines for educational purposes only. Individual circumstances vary.
        Consult a qualified financial advisor for personalized investment advice.</p>
      </div>
    </div>
  `;
}

// ===========================
// CHART INITIALIZATION
// ===========================

/**
 * Initialize the asset allocation doughnut chart
 * Called when the investments tab becomes visible
 */
function initInvestmentCharts() {
  const canvas = document.getElementById('assetAllocationChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Destroy previous instance
  if (investmentChartInstance) {
    investmentChartInstance.destroy();
    investmentChartInstance = null;
  }

  // Get current data
  const { snapshot } = getState();
  const inv = snapshot.investments;

  const retirement = inv.fourOhOneK + inv.ira + inv.rothIra;
  const liquid = inv.savings + inv.stocksBonds;
  const property = inv.realEstate + inv.carValue;
  const other = inv.other;
  const total = retirement + liquid + property + other;

  if (total <= 0) return;

  // Build data arrays, only include non-zero groups
  const labels = [];
  const data = [];
  const colors = [];

  if (retirement > 0) {
    labels.push('Retirement');
    data.push(retirement);
    colors.push('#8B5CF6');
  }
  if (liquid > 0) {
    labels.push('Liquid');
    data.push(liquid);
    colors.push('#22C55E');
  }
  if (property > 0) {
    labels.push('Property');
    data.push(property);
    colors.push('#6366F1');
  }
  if (other > 0) {
    labels.push('Other');
    data.push(other);
    colors.push('#06B6D4');
  }

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(n);

  // Center text plugin
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { width, height, ctx: drawCtx } = chart;
      drawCtx.save();

      // Total value
      drawCtx.font = 'bold 18px Inter, sans-serif';
      drawCtx.fillStyle = '#e0e0e0';
      drawCtx.textAlign = 'center';
      drawCtx.textBaseline = 'middle';
      drawCtx.fillText(formatCurrency(total), width / 2, height / 2 - 8);

      // Label
      drawCtx.font = '11px Inter, sans-serif';
      drawCtx.fillStyle = '#999';
      drawCtx.fillText('Total Portfolio', width / 2, height / 2 + 14);

      drawCtx.restore();
    }
  };

  investmentChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#141416',
        borderWidth: 2,
        hoverBorderColor: '#e0e0e0',
        hoverBorderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#e0e0e0',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { size: 12, family: 'Inter, sans-serif' }
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
            label: function(context) {
              const value = context.raw;
              const pct = ((value / total) * 100).toFixed(1);
              return ` ${context.label}: ${formatCurrency(value)} (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [centerTextPlugin]
  });
}

// Expose globally
window.renderInvestmentTab = renderInvestmentTab;
window.initInvestmentCharts = initInvestmentCharts;
