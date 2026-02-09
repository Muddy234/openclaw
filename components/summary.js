/**
 * summary.js
 * Executive financial summary tab — read-only overview of entire financial picture.
 * Aggregates data from all tabs into 8 sections.
 */

// Chart instances for cleanup
let _healthGaugeChart = null;
let _efficiencyGaugeChart = null;

// Sensitivity cache
let _sensitivityCache = null;
let _sensitivityHash = '';

// ===========================
// UTILITY HELPERS
// ===========================

const _sumFmt = (n) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(n);

const _sumFmtShort = (n) => {
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n.toLocaleString();
};

const _sumPct = (n) => Math.round(n) + '%';

function _getGradeFromScore(score, max) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 90) return 'A';
  if (pct >= 75) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= 30) return 'D';
  return 'F';
}

function _getGradeColor(grade) {
  switch (grade) {
    case 'A': return 'text-success';
    case 'B': return 'text-success';
    case 'C': return 'text-gold';
    case 'D': return 'text-danger';
    case 'F': return 'text-danger';
    default: return 'text-secondary';
  }
}

function _getScoreColor(score) {
  if (score >= 70) return 'var(--success)';
  if (score >= 40) return 'var(--gold)';
  return 'var(--danger)';
}

// Simple snapshot hash for cache invalidation
function _snapshotHash(snapshot) {
  const g = snapshot.general;
  const inv = snapshot.investments;
  const dSum = snapshot.debts.reduce((s, d) => s + d.balance, 0);
  return `${g.age}-${g.annualIncome}-${g.monthlyTakeHome}-${g.monthlyExpense}-${inv.savings}-${inv.fourOhOneK}-${inv.rothIra}-${dSum}`;
}

// ===========================
// SECTION 1: HEALTH SCORE
// ===========================

function _calculateHealthScores(snapshot, metrics) {
  // Emergency Fund (0-25)
  let efScore = 5;
  if (metrics.emergencyMonths >= 6) efScore = 25;
  else if (metrics.emergencyMonths >= 3) efScore = 20;
  else if (metrics.emergencyMonths >= 1) efScore = 10;

  // Debt Health (0-25)
  let debtScore = 5;
  if (metrics.debtToIncome === 0) debtScore = 25;
  else if (metrics.debtToIncome <= 20) debtScore = 20;
  else if (metrics.debtToIncome <= 36) debtScore = 12;

  // Savings Rate (0-25)
  let savingsScore = 0;
  if (metrics.savingsRate >= 25) savingsScore = 25;
  else if (metrics.savingsRate >= 15) savingsScore = 20;
  else if (metrics.savingsRate >= 10) savingsScore = 14;
  else if (metrics.savingsRate > 0) savingsScore = 8;

  // FIRE Progress (0-25)
  let fireProgress = 0;
  if (typeof calculateFireStatus === 'function') {
    fireProgress = calculateFireStatus(snapshot).value || 0;
  }
  const fireScore = Math.round(Math.min(25, (fireProgress / 100) * 25));

  const total = efScore + debtScore + savingsScore + fireScore;

  return {
    total,
    grade: _getGradeFromScore(total, 100),
    categories: [
      { label: 'Emergency Fund', score: efScore, max: 25, grade: _getGradeFromScore(efScore, 25) },
      { label: 'Debt Health', score: debtScore, max: 25, grade: _getGradeFromScore(debtScore, 25) },
      { label: 'Savings Rate', score: savingsScore, max: 25, grade: _getGradeFromScore(savingsScore, 25) },
      { label: 'FIRE Progress', score: fireScore, max: 25, grade: _getGradeFromScore(fireScore, 25) },
    ]
  };
}

function _renderHealthScore(snapshot, metrics) {
  const health = _calculateHealthScores(snapshot, metrics);

  return `
    <div class="card">
      <h3 class="panel-header">Financial Health Score</h3>
      <div class="summary-section-grid">
        <div class="summary-health-gauge">
          <canvas id="summaryHealthGauge" aria-label="Financial health score: ${health.total} out of 100"></canvas>
        </div>
        <div class="summary-sub-scores">
          ${health.categories.map(cat => `
            <div class="summary-sub-score">
              <span class="summary-grade ${_getGradeColor(cat.grade)}">${cat.grade}</span>
              <span class="summary-sub-label">${cat.label}</span>
              <span class="summary-sub-detail">${cat.score}/${cat.max}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ===========================
// SECTION 2: ACTION ITEMS
// ===========================

function _renderActionItems(snapshot, metrics) {
  const actions = [];
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const cashFlow = monthlyTakeHome - monthlyExpense;

  // CRITICAL: Negative cash flow
  if (cashFlow < 0) {
    actions.push({
      priority: 'CRITICAL',
      description: 'Spending exceeds income by ' + _sumFmt(Math.abs(cashFlow)) + '/month',
      impact: _sumFmt(Math.abs(cashFlow) * 12) + '/year',
      tab: 'overview',
      tabLabel: 'Monthly Budget'
    });
  }

  // CRITICAL: No emergency fund
  if (metrics.emergencyMonths < 1 && monthlyExpense > 0) {
    actions.push({
      priority: 'CRITICAL',
      description: 'No emergency fund — one unexpected expense could create a debt spiral',
      impact: _sumFmt(monthlyExpense * 3) + ' target (3 months)',
      tab: 'investments',
      tabLabel: 'Investments'
    });
  }

  // CRITICAL: High-interest debt (>10%)
  const highInterestDebts = snapshot.debts.filter(d => d.interestRate > 10 && d.balance > 0);
  if (highInterestDebts.length > 0) {
    const totalHigh = highInterestDebts.reduce((s, d) => s + d.balance, 0);
    const annualInterest = highInterestDebts.reduce((s, d) => s + (d.balance * d.interestRate / 100), 0);
    actions.push({
      priority: 'CRITICAL',
      description: _sumFmt(totalHigh) + ' in high-interest debt (>' + '10% APR) eroding your wealth',
      impact: _sumFmt(annualInterest) + '/year in interest',
      tab: 'debts',
      tabLabel: 'Debts'
    });
  }

  // IMPORTANT: Missing employer match
  const fs = snapshot.fireSettings || {};
  if (fs.hasEmployerMatch && !fs.isGettingMatch) {
    const matchValue = fs.employerMatchPercent
      ? Math.round((snapshot.general.annualIncome * (fs.employerMatchPercent / 100)))
      : 0;
    actions.push({
      priority: 'IMPORTANT',
      description: 'Not capturing employer 401(k) match — this is free money',
      impact: matchValue > 0 ? _sumFmt(matchValue) + '/year potential' : 'Free money left on the table',
      tab: 'fire',
      tabLabel: 'FIRE Journey'
    });
  }

  // IMPORTANT: Low savings rate
  if (metrics.savingsRate > 0 && metrics.savingsRate < 15 && cashFlow >= 0) {
    const gap = Math.round((0.15 - metrics.savingsRate / 100) * monthlyTakeHome);
    actions.push({
      priority: 'IMPORTANT',
      description: 'Savings rate of ' + metrics.savingsRate + '% is below the 15% minimum for retirement',
      impact: '+' + _sumFmt(gap) + '/mo needed to reach 15%',
      tab: 'overview',
      tabLabel: 'Monthly Budget'
    });
  }

  // IMPORTANT: Emergency fund < 3 months
  if (metrics.emergencyMonths >= 1 && metrics.emergencyMonths < 3 && monthlyExpense > 0) {
    const shortfall = (monthlyExpense * 3) - snapshot.investments.savings;
    actions.push({
      priority: 'IMPORTANT',
      description: 'Emergency fund covers only ' + metrics.emergencyMonths + ' months — aim for 3-6',
      impact: _sumFmt(shortfall) + ' shortfall to 3 months',
      tab: 'investments',
      tabLabel: 'Investments'
    });
  }

  // OPTIMIZE: Unused tax optimization
  if (typeof calculateTaxDestiny === 'function') {
    try {
      const taxResult = calculateTaxDestiny(snapshot);
      if (taxResult && taxResult.annualSavings > 500) {
        actions.push({
          priority: 'OPTIMIZE',
          description: 'Tax optimization could save ' + _sumFmt(taxResult.annualSavings) + ' annually',
          impact: _sumFmt(taxResult.annualSavings) + '/year in tax savings',
          tab: 'taxes',
          tabLabel: 'Taxes'
        });
      }
    } catch (e) { /* ignore */ }
  }

  // OPTIMIZE: FIRE behind schedule
  if (typeof calculateFireStatus === 'function') {
    const fireStatus = calculateFireStatus(snapshot);
    if (fireStatus.value > 0 && fireStatus.value < 80) {
      actions.push({
        priority: 'OPTIMIZE',
        description: 'FIRE progress at ' + fireStatus.value + '% — currently behind target',
        impact: fireStatus.description,
        tab: 'fire',
        tabLabel: 'FIRE Journey'
      });
    }
  }

  // Sort: CRITICAL first, then IMPORTANT, then OPTIMIZE
  const priorityOrder = { CRITICAL: 0, IMPORTANT: 1, OPTIMIZE: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const topActions = actions.slice(0, 5);

  if (topActions.length === 0) {
    return `
      <div class="card">
        <h3 class="panel-header">Action Items</h3>
        <div class="summary-empty-state">
          <span class="text-success">No critical issues found.</span> Your financial foundation looks solid. Keep monitoring your progress on the other tabs.
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <h3 class="panel-header">Critical Action Items</h3>
      <div class="summary-actions">
        ${topActions.map(a => `
          <div class="summary-action-card summary-action-card--${a.priority.toLowerCase()}">
            <div class="summary-action-header">
              <span class="summary-action-priority summary-action-priority--${a.priority.toLowerCase()}">${a.priority}</span>
            </div>
            <p class="summary-action-desc">${a.description}</p>
            <div class="summary-action-footer">
              <span class="summary-action-impact">${a.impact}</span>
              <button class="summary-action-link" onclick="if(typeof DashboardTabs!=='undefined')DashboardTabs.switchTab('${a.tab}')">Go to ${a.tabLabel}</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===========================
// SECTION 3: FIRE ROADMAP
// ===========================

function _renderFireRoadmap(snapshot, metrics, projection) {
  const currentAge = snapshot.general.age || 30;
  const targetRetirement = snapshot.general.targetRetirement || 65;
  const annualExpenses = typeof getFireAnnualExpenses === 'function'
    ? getFireAnnualExpenses(snapshot) : (snapshot.general.monthlyExpense || 0) * 12;
  const fireTarget = annualExpenses * 25;

  if (fireTarget <= 0 || currentAge >= targetRetirement) {
    return `
      <div class="card">
        <h3 class="panel-header">FIRE Feasibility Roadmap</h3>
        <div class="summary-empty-state">Set your age, target retirement, and expenses to see your FIRE roadmap.</div>
      </div>
    `;
  }

  const totalYears = targetRetirement - currentAge;

  // Find projected FIRE age from projection table
  let projectedFireAge = null;
  if (projection && projection.table) {
    for (let i = 0; i < projection.table.length; i++) {
      if (projection.table[i].netWorth >= fireTarget) {
        projectedFireAge = currentAge + Math.floor(i / 12);
        break;
      }
    }
  }

  // Debt-free age
  let debtFreeAge = null;
  const activeDebts = snapshot.debts.filter(d => d.balance > 0 && d.category !== 'MORTGAGE');
  if (activeDebts.length > 0 && typeof compareDebtStrategies === 'function') {
    const cashFlow = metrics.monthlySavings || 0;
    const debtResult = compareDebtStrategies(snapshot.debts, Math.max(0, cashFlow));
    if (debtResult && debtResult.avalanche && debtResult.avalanche.monthsToPayoff) {
      debtFreeAge = currentAge + Math.ceil(debtResult.avalanche.monthsToPayoff / 12);
      if (debtFreeAge >= targetRetirement) debtFreeAge = null; // skip if beyond timeline
    }
  } else if (activeDebts.length === 0) {
    debtFreeAge = currentAge; // Already debt-free
  }

  // Emergency fund age
  let efAge = null;
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const savings = snapshot.investments.savings || 0;
  const monthlySavings = metrics.monthlySavings || 0;
  if (savings >= monthlyExpense * 6) {
    efAge = currentAge; // Already done
  } else if (monthlySavings > 0 && monthlyExpense > 0) {
    const monthsNeeded = Math.ceil((monthlyExpense * 6 - savings) / monthlySavings);
    efAge = currentAge + Math.ceil(monthsNeeded / 12);
    if (efAge >= targetRetirement) efAge = null;
  }

  // Coast FIRE age (50% of target)
  let coastFireAge = null;
  if (projection && projection.table) {
    const coastTarget = fireTarget * 0.5;
    for (let i = 0; i < projection.table.length; i++) {
      if (projection.table[i].netWorth >= coastTarget) {
        coastFireAge = currentAge + Math.floor(i / 12);
        break;
      }
    }
  }

  // Build milestones
  const milestones = [];
  if (debtFreeAge !== null && debtFreeAge > currentAge) {
    milestones.push({ age: debtFreeAge, label: 'Debt Free', icon: 'debt' });
  }
  if (efAge !== null && efAge > currentAge) {
    milestones.push({ age: efAge, label: 'EF Complete', icon: 'shield' });
  }
  if (coastFireAge !== null && coastFireAge > currentAge) {
    milestones.push({ age: coastFireAge, label: 'Coast FIRE', icon: 'coast' });
  }
  if (projectedFireAge !== null) {
    milestones.push({ age: projectedFireAge, label: 'FIRE', icon: 'fire' });
  }

  milestones.sort((a, b) => a.age - b.age);

  // Gap analysis
  const isOnTrack = projectedFireAge !== null && projectedFireAge <= targetRetirement;
  const yearsGap = projectedFireAge ? projectedFireAge - targetRetirement : null;

  const gapHtml = projectedFireAge === null
    ? `<div class="summary-timeline-gap summary-timeline-gap--danger">
        <strong>Unable to project FIRE</strong> — Increase savings or reduce expenses to build toward financial independence.
        <button class="summary-action-link" onclick="if(typeof DashboardTabs!=='undefined')DashboardTabs.switchTab('fire')">Go to FIRE Journey</button>
      </div>`
    : isOnTrack
      ? `<div class="summary-timeline-gap summary-timeline-gap--success">
          On Track — Projected to reach FIRE by age ${projectedFireAge}${projectedFireAge < targetRetirement ? ' (' + (targetRetirement - projectedFireAge) + ' years early!)' : ''}.
        </div>`
      : `<div class="summary-timeline-gap summary-timeline-gap--danger">
          <strong>${yearsGap} year${yearsGap !== 1 ? 's' : ''} behind</strong> — Projected FIRE at age ${projectedFireAge} vs target ${targetRetirement}.
          <button class="summary-action-link" onclick="if(typeof DashboardTabs!=='undefined')DashboardTabs.switchTab('fire')">Go to FIRE Journey</button>
        </div>`;

  return `
    <div class="card">
      <h3 class="panel-header">FIRE Feasibility Roadmap</h3>
      <div class="summary-timeline">
        <div class="summary-timeline-labels">
          <span>Age ${currentAge}</span>
          <span>Age ${targetRetirement}</span>
        </div>
        <div class="summary-timeline-bar">
          <div class="summary-timeline-progress" style="width: ${Math.min(100, (metrics.netWorth / fireTarget) * 100)}%"></div>
          ${milestones.map(m => {
            const position = Math.min(98, Math.max(2, ((m.age - currentAge) / totalYears) * 100));
            return `
              <div class="summary-timeline-marker" style="left: ${position}%" title="${m.label} (Age ${m.age})">
                <div class="summary-timeline-dot summary-timeline-dot--${m.icon}"></div>
                <div class="summary-timeline-label">${m.label}<br><small>${m.age}</small></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ${gapHtml}
    </div>
  `;
}

// ===========================
// SECTION 4: CASH FLOW WATERFALL
// ===========================

function _renderCashFlowWaterfall(snapshot, metrics) {
  const annualIncome = snapshot.general.annualIncome || 0;
  const grossMonthly = annualIncome / 12;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const monthlyExpense = snapshot.general.monthlyExpense || 0;

  if (grossMonthly <= 0) {
    return `
      <div class="card">
        <h3 class="panel-header">Cash Flow Waterfall</h3>
        <div class="summary-empty-state">Add your income to see how your money flows.</div>
      </div>
    `;
  }

  // Estimate taxes
  let monthlyTaxes = grossMonthly - monthlyTakeHome;
  if (monthlyTaxes < 0) monthlyTaxes = 0;

  const debtPayments = metrics.monthlyDebtPayments || 0;
  const savingsInvesting = Math.max(0, metrics.monthlySavings - debtPayments);
  const remaining = Math.max(0, monthlyTakeHome - monthlyExpense - debtPayments);

  const bars = [
    { label: 'Gross Income', amount: grossMonthly, color: '#FAFAFA', pct: 100 },
    { label: 'Taxes & Withholding', amount: monthlyTaxes, color: '#6B7280', pct: (monthlyTaxes / grossMonthly) * 100 },
    { label: 'Living Expenses', amount: monthlyExpense, color: '#3B82F6', pct: (monthlyExpense / grossMonthly) * 100 },
  ];

  if (debtPayments > 0) {
    bars.push({ label: 'Debt Payments', amount: debtPayments, color: '#EF4444', pct: (debtPayments / grossMonthly) * 100 });
  }

  if (savingsInvesting > 0) {
    bars.push({ label: 'Savings & Investments', amount: savingsInvesting, color: '#22C55E', pct: (savingsInvesting / grossMonthly) * 100 });
  }

  if (remaining > 0 && remaining !== savingsInvesting) {
    bars.push({ label: 'Unallocated', amount: remaining, color: 'var(--gold)', pct: (remaining / grossMonthly) * 100 });
  }

  const investPct = grossMonthly > 0 ? Math.round((savingsInvesting / grossMonthly) * 100) : 0;

  return `
    <div class="card">
      <h3 class="panel-header">Cash Flow Waterfall</h3>
      <div class="summary-waterfall">
        ${bars.map(bar => `
          <div class="summary-waterfall-row">
            <div class="summary-waterfall-label">
              <span class="summary-waterfall-name">${bar.label}</span>
              <span class="summary-waterfall-amount">${_sumFmt(bar.amount)}</span>
            </div>
            <div class="summary-waterfall-track">
              <div class="summary-waterfall-fill" style="width: ${Math.max(1, bar.pct)}%; background: ${bar.color};"></div>
            </div>
            <span class="summary-waterfall-pct">${_sumPct(bar.pct)}</span>
          </div>
        `).join('')}
      </div>
      <p class="summary-waterfall-summary">
        <strong>${investPct}%</strong> of your gross income reaches savings &amp; investments.
      </p>
    </div>
  `;
}

// ===========================
// SECTION 5: RISK MATRIX
// ===========================

function _renderRiskMatrix(snapshot, metrics) {
  const risks = [];
  const monthlyExpense = snapshot.general.monthlyExpense || 0;

  // 1. Job Loss
  let jobMitigation = 'exposed';
  let jobLikelihood = 'High';
  if (metrics.emergencyMonths >= 6) { jobMitigation = 'covered'; jobLikelihood = 'Low'; }
  else if (metrics.emergencyMonths >= 3) { jobMitigation = 'partial'; jobLikelihood = 'Med'; }
  risks.push({
    name: 'Job Loss',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    likelihood: jobLikelihood,
    impact: 'High',
    mitigation: jobMitigation,
    recommendation: metrics.emergencyMonths < 6
      ? 'Build emergency fund to 6 months of expenses'
      : 'Emergency fund provides strong protection',
    tab: 'investments',
    tabLabel: 'Investments'
  });

  // 2. Market Downturn
  const totalAssets = metrics.totalAssets || 0;
  const growthAssets = (snapshot.investments.stocksBonds || 0) + (snapshot.investments.fourOhOneK || 0) +
                       (snapshot.investments.ira || 0) + (snapshot.investments.rothIra || 0);
  const growthPct = totalAssets > 0 ? (growthAssets / totalAssets) * 100 : 0;
  const age = snapshot.general.age || 30;
  const recommendedGrowth = Math.max(30, Math.min(90, 110 - age));
  const deviation = Math.abs(growthPct - recommendedGrowth);
  let marketMitigation = 'covered';
  if (deviation > 25) marketMitigation = 'exposed';
  else if (deviation > 10) marketMitigation = 'partial';
  risks.push({
    name: 'Market Downturn',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>',
    likelihood: 'Med',
    impact: totalAssets > 0 ? 'Med' : 'Low',
    mitigation: marketMitigation,
    recommendation: deviation > 10
      ? 'Review asset allocation — currently ' + Math.round(growthPct) + '% growth vs ' + recommendedGrowth + '% recommended'
      : 'Age-appropriate allocation provides good diversification',
    tab: 'investments',
    tabLabel: 'Investments'
  });

  // 3. Health Emergency
  const hasHsa = snapshot.taxDestiny && snapshot.taxDestiny.allocations &&
                 snapshot.taxDestiny.allocations.hsa > 0;
  const hsaCoverage = snapshot.taxDestiny && snapshot.taxDestiny.hsaCoverage;
  let healthMitigation = 'exposed';
  if (hasHsa) healthMitigation = 'covered';
  else if (hsaCoverage && hsaCoverage !== 'none') healthMitigation = 'partial';
  risks.push({
    name: 'Health Emergency',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    likelihood: 'Med',
    impact: 'High',
    mitigation: healthMitigation,
    recommendation: hasHsa
      ? 'HSA provides tax-advantaged medical savings'
      : 'Consider funding an HSA for medical emergencies',
    tab: 'taxes',
    tabLabel: 'Taxes'
  });

  // 4. Debt Spiral
  const highDebtTotal = snapshot.debts.filter(d => d.interestRate > 7 && d.balance > 0)
    .reduce((s, d) => s + d.balance, 0);
  let debtMitigation = 'covered';
  let debtLikelihood = 'Low';
  if (highDebtTotal > 10000) { debtMitigation = 'exposed'; debtLikelihood = 'High'; }
  else if (highDebtTotal > 0) { debtMitigation = 'partial'; debtLikelihood = 'Med'; }
  if (metrics.debtToIncome > 36) debtLikelihood = 'High';
  risks.push({
    name: 'Debt Spiral',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    likelihood: debtLikelihood,
    impact: highDebtTotal > 0 ? 'High' : 'Low',
    mitigation: debtMitigation,
    recommendation: highDebtTotal > 0
      ? 'Prioritize paying off ' + _sumFmtShort(highDebtTotal) + ' in high-interest debt'
      : 'No high-interest debt — well managed',
    tab: 'debts',
    tabLabel: 'Debts'
  });

  // 5. Retirement Shortfall
  let retireMitigation = 'exposed';
  let retireLikelihood = 'High';
  const fireStatus = typeof calculateFireStatus === 'function' ? calculateFireStatus(snapshot) : { value: 0 };
  if (fireStatus.value >= 100) { retireMitigation = 'covered'; retireLikelihood = 'Low'; }
  else if (fireStatus.value >= 80) { retireMitigation = 'partial'; retireLikelihood = 'Med'; }
  risks.push({
    name: 'Retirement Shortfall',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    likelihood: retireLikelihood,
    impact: 'High',
    mitigation: retireMitigation,
    recommendation: fireStatus.value >= 100
      ? 'On track to reach FIRE target'
      : 'FIRE progress at ' + fireStatus.value + '% — increase savings rate',
    tab: 'fire',
    tabLabel: 'FIRE Journey'
  });

  const mitigationLabel = { covered: 'Covered', partial: 'Partial', exposed: 'Exposed' };
  const mitigationBadge = { covered: 'success', partial: 'warning', exposed: 'danger' };
  const likelihoodColor = { Low: 'text-success', Med: 'text-gold', High: 'text-danger' };

  return `
    <div class="card">
      <h3 class="panel-header">Risk Exposure</h3>
      <div class="summary-risk-grid">
        ${risks.map(r => `
          <div class="summary-risk-card summary-risk-card--${r.mitigation}">
            <div class="summary-risk-header">
              <span class="summary-risk-icon">${r.icon}</span>
              <span class="summary-risk-name">${r.name}</span>
            </div>
            <div class="summary-risk-indicators">
              <span class="summary-risk-indicator">
                <span class="${likelihoodColor[r.likelihood]}">&#9679;</span> ${r.likelihood} likelihood
              </span>
              <span class="summary-risk-indicator">
                <span class="${likelihoodColor[r.impact]}">&#9679;</span> ${r.impact} impact
              </span>
            </div>
            <span class="status-badge status-badge--${mitigationBadge[r.mitigation]}">${mitigationLabel[r.mitigation]}</span>
            <p class="summary-risk-rec">${r.recommendation}</p>
            <button class="summary-action-link" onclick="if(typeof DashboardTabs!=='undefined')DashboardTabs.switchTab('${r.tab}')">Go to ${r.tabLabel}</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===========================
// SECTION 6: EFFICIENCY SCORE
// ===========================

function _renderEfficiencyScore(snapshot, metrics) {
  const grossMonthly = (snapshot.general.annualIncome || 0) / 12;
  const efficiency = grossMonthly > 0 ? Math.max(0, Math.round((metrics.monthlySavings / grossMonthly) * 100)) : 0;

  // Opportunity 1: Debt interest
  const annualInterest = snapshot.debts
    .filter(d => d.balance > 0 && d.interestRate > 5)
    .reduce((s, d) => s + (d.balance * d.interestRate / 100), 0);

  // Opportunity 2: Tax-advantaged space
  let unusedTaxSpace = 0;
  if (typeof calculateTaxDestiny === 'function') {
    try {
      const taxResult = calculateTaxDestiny(snapshot);
      if (taxResult && taxResult.limits) {
        const allocs = snapshot.taxDestiny?.allocations || {};
        const monthlyAllocsTotal = (allocs.fourOhOneK || 0) + (allocs.hsa || 0) + (allocs.traditionalIra || 0) + (allocs.rothIra || 0);
        const annualAllocs = monthlyAllocsTotal * 12;
        const annualLimits = (taxResult.limits.fourOhOneK || 0) + (taxResult.limits.hsa || 0) + (taxResult.limits.ira || 0);
        unusedTaxSpace = Math.max(0, annualLimits - annualAllocs);
      }
    } catch (e) { /* ignore */ }
  }

  // Opportunity 3: Expense reduction
  const expenseGap = metrics.savingsRate < 25 && snapshot.general.monthlyTakeHome > 0
    ? Math.round((0.25 - metrics.savingsRate / 100) * snapshot.general.monthlyTakeHome)
    : 0;

  const opportunities = [];
  if (annualInterest > 100) {
    opportunities.push({ label: 'Reduce debt interest', amount: _sumFmt(annualInterest) + '/yr', desc: 'Paying off high-rate debt' });
  }
  if (unusedTaxSpace > 500) {
    opportunities.push({ label: 'Use tax-advantaged space', amount: _sumFmt(unusedTaxSpace) + '/yr available', desc: 'Max 401k, HSA, IRA' });
  }
  if (expenseGap > 50) {
    opportunities.push({ label: 'Optimize expenses', amount: '+' + _sumFmt(expenseGap) + '/mo', desc: 'Reach 25% savings rate' });
  }

  return `
    <div class="card">
      <h3 class="panel-header">Wealth-Building Efficiency</h3>
      <div class="summary-section-grid">
        <div class="summary-efficiency-gauge">
          <canvas id="summaryEfficiencyGauge" aria-label="Wealth building efficiency: ${efficiency}%"></canvas>
        </div>
        <div class="summary-opportunity-cards">
          ${opportunities.length > 0 ? opportunities.map(o => `
            <div class="summary-opportunity-card">
              <span class="summary-opportunity-label">${o.label}</span>
              <span class="summary-opportunity-amount text-gold">${o.amount}</span>
              <span class="summary-opportunity-desc">${o.desc}</span>
            </div>
          `).join('') : '<div class="summary-empty-state">Great job! No major efficiency gaps identified.</div>'}
        </div>
      </div>
    </div>
  `;
}

// ===========================
// SECTION 7: SENSITIVITY GRID
// ===========================

function _computeSensitivity(snapshot) {
  const hash = _snapshotHash(snapshot);
  if (_sensitivityCache && _sensitivityHash === hash) return _sensitivityCache;

  if (typeof calculateProjection !== 'function') return null;

  const fireTarget = (typeof getFireAnnualExpenses === 'function'
    ? getFireAnnualExpenses(snapshot) : (snapshot.general.monthlyExpense || 0) * 12) * 25;

  if (fireTarget <= 0) return null;

  // Baseline
  let baseline;
  try { baseline = calculateProjection(snapshot); } catch (e) { return null; }
  if (!baseline || !baseline.table) return null;

  const baselineFireMonth = _findFireMonth(baseline.table, fireTarget);
  const baselineEndNW = baseline.summary.projectedNetWorth || 0;
  const baselineCashFlow = (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0);

  const scenarios = [
    {
      label: '+10% Income',
      modify: (s) => {
        s.general.annualIncome = Math.round(s.general.annualIncome * 1.1);
        s.general.monthlyTakeHome = Math.round(s.general.monthlyTakeHome * 1.1);
      }
    },
    {
      label: '-20% Expenses',
      modify: (s) => { s.general.monthlyExpense = Math.round(s.general.monthlyExpense * 0.8); }
    },
    {
      label: 'Pay Off High-Rate Debt',
      modify: (s) => { s.debts = s.debts.map(d => d.interestRate > 7 ? { ...d, balance: 0 } : d); }
    },
    {
      label: 'Max 401(k)',
      modify: (s) => {
        // This simulates maxing 401k by reducing take-home to account for contributions
        const current401k = (s.taxDestiny?.allocations?.fourOhOneK || 0) * 12;
        const max401k = 23500;
        const additional = Math.max(0, max401k - current401k);
        s.general.monthlyTakeHome = Math.max(0, s.general.monthlyTakeHome - Math.round(additional / 12));
      }
    },
    {
      label: '+$500/mo Savings',
      modify: (s) => { s.general.monthlyExpense = Math.max(0, s.general.monthlyExpense - 500); }
    }
  ];

  const results = scenarios.map(scenario => {
    const cloned = JSON.parse(JSON.stringify(snapshot));
    scenario.modify(cloned);
    const newCashFlow = (cloned.general.monthlyTakeHome || 0) - (cloned.general.monthlyExpense || 0);

    let proj;
    try { proj = calculateProjection(cloned); } catch (e) { return null; }
    if (!proj || !proj.table) return null;

    const scenarioFireMonth = _findFireMonth(proj.table, fireTarget);
    const scenarioEndNW = proj.summary.projectedNetWorth || 0;

    // FIRE years difference
    let fireYearsDiff = null;
    if (baselineFireMonth !== null && scenarioFireMonth !== null) {
      fireYearsDiff = -Math.round((scenarioFireMonth - baselineFireMonth) / 12 * 10) / 10;
    } else if (baselineFireMonth === null && scenarioFireMonth !== null) {
      fireYearsDiff = 'Now possible';
    }

    return {
      label: scenario.label,
      fireYears: fireYearsDiff,
      endNWDiff: scenarioEndNW - baselineEndNW,
      cashFlowDiff: newCashFlow - baselineCashFlow,
    };
  }).filter(Boolean);

  _sensitivityCache = results;
  _sensitivityHash = hash;
  return results;
}

function _findFireMonth(table, target) {
  for (let i = 0; i < table.length; i++) {
    if (table[i].netWorth >= target) return i;
  }
  return null;
}

function _renderSensitivityGrid(snapshot) {
  const results = _computeSensitivity(snapshot);

  if (!results || results.length === 0) {
    return `
      <div class="card">
        <h3 class="panel-header">Scenario Sensitivity</h3>
        <div class="summary-empty-state">Add income, expenses, and age to see how changes impact your FIRE timeline.</div>
      </div>
    `;
  }

  // Find quick win (biggest positive FIRE years impact)
  let quickWinIdx = -1;
  let bestFireImpact = 0;
  results.forEach((r, i) => {
    if (typeof r.fireYears === 'number' && r.fireYears > bestFireImpact) {
      bestFireImpact = r.fireYears;
      quickWinIdx = i;
    }
  });

  return `
    <div class="card">
      <h3 class="panel-header">Scenario Sensitivity</h3>
      <p class="summary-sensitivity-subtitle">How sensitive is your FIRE timeline to these changes?</p>
      <div class="summary-sensitivity-table-wrap">
        <table class="summary-sensitivity-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>FIRE Timeline</th>
              <th>Net Worth at Retirement</th>
              <th>Monthly Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((r, i) => `
              <tr class="${i === quickWinIdx ? 'summary-sensitivity-highlight' : ''}">
                <td class="summary-sensitivity-label">${i === quickWinIdx ? '<span class="summary-quick-win" title="Highest impact">&#9733;</span> ' : ''}${r.label}</td>
                <td class="summary-sensitivity-cell ${typeof r.fireYears === 'number' ? (r.fireYears > 0 ? 'summary-cell--positive' : r.fireYears < 0 ? 'summary-cell--negative' : '') : 'summary-cell--positive'}">
                  ${typeof r.fireYears === 'number' ? (r.fireYears > 0 ? '+' : '') + r.fireYears + ' yrs' : r.fireYears || '—'}
                </td>
                <td class="summary-sensitivity-cell ${r.endNWDiff > 0 ? 'summary-cell--positive' : r.endNWDiff < 0 ? 'summary-cell--negative' : ''}">
                  ${r.endNWDiff > 0 ? '+' : ''}${_sumFmtShort(r.endNWDiff)}
                </td>
                <td class="summary-sensitivity-cell ${r.cashFlowDiff > 0 ? 'summary-cell--positive' : r.cashFlowDiff < 0 ? 'summary-cell--negative' : ''}">
                  ${r.cashFlowDiff > 0 ? '+' : ''}${_sumFmt(r.cashFlowDiff)}/mo
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="summary-sensitivity-note">
        ${quickWinIdx >= 0 ? '<strong>Quick Win:</strong> "' + results[quickWinIdx].label + '" has the biggest impact on your FIRE timeline.' : ''}
      </p>
    </div>
  `;
}

// ===========================
// SECTION 8: MILESTONES
// ===========================

function _renderMilestones(snapshot, metrics) {
  const monthlyExpense = snapshot.general.monthlyExpense || 1;
  const savings = snapshot.investments.savings || 0;
  const netWorth = metrics.netWorth || 0;
  const fireTarget = (typeof getFireAnnualExpenses === 'function'
    ? getFireAnnualExpenses(snapshot) : monthlyExpense * 12) * 25;

  const milestones = [];

  // 1. Emergency Fund 3mo
  const ef3Target = monthlyExpense * 3;
  milestones.push({
    name: 'Emergency Fund (3 months)',
    progress: Math.min(100, Math.round((savings / ef3Target) * 100)),
    current: savings,
    target: ef3Target,
  });

  // 2. Emergency Fund 6mo
  const ef6Target = monthlyExpense * 6;
  milestones.push({
    name: 'Emergency Fund (6 months)',
    progress: Math.min(100, Math.round((savings / ef6Target) * 100)),
    current: savings,
    target: ef6Target,
  });

  // 3. High-Interest Debt Free
  const highDebts = snapshot.debts.filter(d => d.interestRate > 7 && d.balance > 0);
  const highDebtTotal = highDebts.reduce((s, d) => s + d.balance, 0);
  const hasHighDebt = snapshot.debts.some(d => d.interestRate > 7);
  milestones.push({
    name: 'High-Interest Debt Free',
    progress: hasHighDebt ? (highDebtTotal === 0 ? 100 : Math.max(0, Math.min(99, 100 - Math.round((highDebtTotal / (highDebtTotal + 1000)) * 100)))) : 100,
    current: hasHighDebt ? highDebtTotal : 0,
    target: 0,
    isDebt: true,
    noHighDebt: !hasHighDebt,
  });

  // 4. Positive Net Worth
  milestones.push({
    name: 'Positive Net Worth',
    progress: netWorth >= 0 ? 100 : Math.min(99, Math.max(0, Math.round((metrics.totalAssets / Math.max(1, metrics.totalDebts)) * 100))),
    current: netWorth,
    target: 0,
    isNetWorth: true,
  });

  // 5. Tax Optimization
  let taxProgress = 0;
  if (typeof calculateTaxDestiny === 'function') {
    try {
      const taxResult = calculateTaxDestiny(snapshot);
      if (taxResult && taxResult.limits) {
        const allocs = snapshot.taxDestiny?.allocations || {};
        const used = ((allocs.fourOhOneK || 0) + (allocs.hsa || 0) + (allocs.traditionalIra || 0) + (allocs.rothIra || 0)) * 12;
        const limit = (taxResult.limits.fourOhOneK || 0) + (taxResult.limits.hsa || 0) + (taxResult.limits.ira || 0);
        taxProgress = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
      }
    } catch (e) { /* ignore */ }
  }
  milestones.push({
    name: 'Tax Optimization',
    progress: taxProgress,
    isTax: true,
  });

  // 6. Coast FIRE (50% of target)
  const coastTarget = fireTarget * 0.5;
  milestones.push({
    name: 'Coast FIRE',
    progress: coastTarget > 0 ? Math.min(100, Math.round((netWorth / coastTarget) * 100)) : 0,
    current: netWorth,
    target: coastTarget,
  });

  // 7. Full FIRE
  milestones.push({
    name: 'Full FIRE',
    progress: fireTarget > 0 ? Math.min(100, Math.round((netWorth / fireTarget) * 100)) : 0,
    current: netWorth,
    target: fireTarget,
  });

  // Sort: completed first, then by progress desc
  milestones.sort((a, b) => {
    if (a.progress >= 100 && b.progress < 100) return -1;
    if (a.progress < 100 && b.progress >= 100) return 1;
    return b.progress - a.progress;
  });

  // Find first non-complete milestone for highlighting
  const nextMilestoneIdx = milestones.findIndex(m => m.progress < 100);

  return `
    <div class="card">
      <h3 class="panel-header">Financial Milestones</h3>
      <div class="summary-milestones">
        ${milestones.map((m, i) => {
          const isComplete = m.progress >= 100;
          const isNext = i === nextMilestoneIdx;
          const fillClass = isComplete ? 'progress-fill--success progress-fill--static'
            : m.progress >= 50 ? '' : 'progress-fill--danger';

          let valueDisplay = '';
          if (m.isDebt) {
            valueDisplay = m.noHighDebt ? 'No high-interest debt' : _sumFmt(m.current) + ' remaining';
          } else if (m.isNetWorth) {
            valueDisplay = _sumFmt(m.current) + ' net worth';
          } else if (m.isTax) {
            valueDisplay = m.progress + '% of limits used';
          } else if (m.target > 0) {
            valueDisplay = _sumFmtShort(m.current) + ' / ' + _sumFmtShort(m.target);
          }

          return `
            <div class="summary-milestone-row ${isComplete ? 'summary-milestone-complete' : ''} ${isNext ? 'summary-milestone-active' : ''}">
              <div class="summary-milestone-header">
                <span class="summary-milestone-icon">${isComplete ? '<span class="text-success">&#10003;</span>' : '<span class="text-secondary">&#9675;</span>'}</span>
                <span class="summary-milestone-name">${m.name}</span>
                <span class="summary-milestone-pct ${isComplete ? 'text-success' : m.progress >= 50 ? 'text-gold' : 'text-danger'}">${m.progress}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill ${fillClass}" style="width: ${m.progress}%"></div>
              </div>
              ${valueDisplay ? `<span class="summary-milestone-value">${valueDisplay}</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ===========================
// MAIN RENDER FUNCTION
// ===========================

function renderSummaryTab(snapshot) {
  if (!snapshot || !snapshot.general || !snapshot.general.monthlyTakeHome) {
    return `
      <div class="summary-empty-state card">
        <h3>Welcome to Financial GPS</h3>
        <p>Add your income, expenses, and financial data to see a comprehensive summary of your financial health.</p>
        <button class="summary-action-link" onclick="if(typeof DashboardTabs!=='undefined')DashboardTabs.switchTab('overview')">Go to Monthly Budget</button>
      </div>
    `;
  }

  const metrics = typeof calculateMetrics === 'function' ? calculateMetrics(snapshot) : {};

  // Run projection once, pass to sections that need it
  let projection = null;
  if (typeof calculateProjection === 'function') {
    try { projection = calculateProjection(snapshot); } catch (e) { /* ignore */ }
  }

  return `
    <div class="stagger-fade-in">
      ${_renderHealthScore(snapshot, metrics)}
      ${_renderActionItems(snapshot, metrics)}
      ${_renderFireRoadmap(snapshot, metrics, projection)}
      ${_renderCashFlowWaterfall(snapshot, metrics)}
      ${_renderRiskMatrix(snapshot, metrics)}
      ${_renderEfficiencyScore(snapshot, metrics)}
      ${_renderSensitivityGrid(snapshot)}
      ${_renderMilestones(snapshot, metrics)}

      <div class="summary-disclaimer">
        <p>This summary is for <strong>educational purposes only</strong> and does not constitute financial,
        investment, or tax advice. Projections are hypothetical and actual results will vary.
        Consult a qualified financial advisor for personalized guidance.</p>
      </div>
    </div>
  `;
}

// ===========================
// CHART INITIALIZATION
// ===========================

function initSummaryCharts() {
  _initHealthGauge();
  _initEfficiencyGauge();
}

function _initHealthGauge() {
  const canvas = document.getElementById('summaryHealthGauge');
  if (!canvas) return;

  if (_healthGaugeChart) {
    _healthGaugeChart.destroy();
    _healthGaugeChart = null;
  }

  const snapshot = typeof getState === 'function' ? getState().snapshot : null;
  if (!snapshot) return;

  const metrics = typeof calculateMetrics === 'function' ? calculateMetrics(snapshot) : {};
  const health = _calculateHealthScores(snapshot, metrics);
  const scoreColor = _getScoreColor(health.total);

  const ctx = canvas.getContext('2d');
  _healthGaugeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [health.total, 100 - health.total],
        backgroundColor: [scoreColor, 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
    plugins: [{
      id: 'healthCenterText',
      afterDraw(chart) {
        const { ctx: c, chartArea } = chart;
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2 + 10;

        c.save();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = scoreColor;
        c.font = 'bold 2rem Inter, sans-serif';
        c.fillText(health.total, cx, cy - 10);
        c.fillStyle = '#e0e0e0';
        c.font = '600 0.875rem Inter, sans-serif';
        c.fillText('Grade: ' + health.grade, cx, cy + 20);
        c.restore();
      }
    }]
  });
}

function _initEfficiencyGauge() {
  const canvas = document.getElementById('summaryEfficiencyGauge');
  if (!canvas) return;

  if (_efficiencyGaugeChart) {
    _efficiencyGaugeChart.destroy();
    _efficiencyGaugeChart = null;
  }

  const snapshot = typeof getState === 'function' ? getState().snapshot : null;
  if (!snapshot) return;

  const grossMonthly = (snapshot.general.annualIncome || 0) / 12;
  const monthlySavings = (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0);
  const efficiency = grossMonthly > 0 ? Math.max(0, Math.min(100, Math.round((monthlySavings / grossMonthly) * 100))) : 0;
  const color = efficiency >= 25 ? 'var(--success)' : efficiency >= 10 ? 'var(--gold)' : 'var(--danger)';

  const ctx = canvas.getContext('2d');
  _efficiencyGaugeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [efficiency, 100 - efficiency],
        backgroundColor: [color, 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
    plugins: [{
      id: 'efficiencyCenterText',
      afterDraw(chart) {
        const { ctx: c, chartArea } = chart;
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2 + 10;

        c.save();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = color;
        c.font = 'bold 2rem Inter, sans-serif';
        c.fillText(efficiency + '%', cx, cy - 10);
        c.fillStyle = '#e0e0e0';
        c.font = '600 0.875rem Inter, sans-serif';
        c.fillText('Efficiency', cx, cy + 20);
        c.restore();
      }
    }]
  });
}

// ===========================
// EXPOSE GLOBALLY
// ===========================
window.renderSummaryTab = renderSummaryTab;
window.initSummaryCharts = initSummaryCharts;
