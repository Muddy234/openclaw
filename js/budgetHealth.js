/**
 * budgetHealth.js
 * Calculation engine for Budget Health Score, 50/30/20 analysis,
 * expense category metadata, and waterfall chart data transformation.
 */

// ===========================
// EXPENSE CATEGORY METADATA
// ===========================

const EXPENSE_CATEGORIES = {
  housing:        { label: 'Housing',        icon: '\u{1F3E0}', budgetType: 'need' },
  food:           { label: 'Food & Groceries', icon: '\u{1F6D2}', budgetType: 'need' },
  transportation: { label: 'Transportation', icon: '\u{1F697}', budgetType: 'need' },
  utilities:      { label: 'Utilities',      icon: '\u{26A1}',  budgetType: 'need' },
  healthcare:     { label: 'Healthcare',     icon: '\u{2695}\u{FE0F}',  budgetType: 'need' },
  insurance:      { label: 'Insurance',      icon: '\u{1F6E1}\u{FE0F}', budgetType: 'need' },
  entertainment:  { label: 'Entertainment',  icon: '\u{1F3AC}', budgetType: 'want' },
  personal:       { label: 'Personal & Shopping', icon: '\u{1F6CD}\u{FE0F}', budgetType: 'want' },
  education:      { label: 'Education',      icon: '\u{1F4DA}', budgetType: 'want' },
  other:          { label: 'Other',          icon: '\u{1F4CB}', budgetType: 'want' },
};

// ===========================
// 50/30/20 RULE ANALYSIS
// ===========================

/**
 * Calculate 50/30/20 budget rule analysis
 * @param {Object} snapshot - Financial snapshot
 * @param {Object} metrics - From calculateMetrics()
 * @returns {Object} { needs, wants, savings } each with { amount, pct, target, diff }
 */
function calculate503020(snapshot, metrics) {
  const takeHome = snapshot.general.monthlyTakeHome || 0;
  const categories = snapshot.expenseCategories || {};

  let needsAmount = 0;
  let wantsAmount = 0;

  Object.entries(categories).forEach(([key, amount]) => {
    const meta = EXPENSE_CATEGORIES[key];
    if (!meta || !amount || amount <= 0) return;
    if (meta.budgetType === 'need') {
      needsAmount += amount;
    } else {
      wantsAmount += amount;
    }
  });

  const savingsAmount = metrics.monthlySavings || 0;

  const needsPct = takeHome > 0 ? Math.round((needsAmount / takeHome) * 100) : 0;
  const wantsPct = takeHome > 0 ? Math.round((wantsAmount / takeHome) * 100) : 0;
  const savingsPct = takeHome > 0 ? Math.round((savingsAmount / takeHome) * 100) : 0;

  return {
    needs:   { amount: needsAmount,   pct: needsPct,   target: 50, diff: needsPct - 50 },
    wants:   { amount: wantsAmount,   pct: wantsPct,   target: 30, diff: wantsPct - 30 },
    savings: { amount: savingsAmount, pct: savingsPct, target: 20, diff: savingsPct - 20 },
    hasData: needsAmount > 0 || wantsAmount > 0,
  };
}

// ===========================
// BUDGET HEALTH SCORE
// ===========================

/**
 * Calculate aggregate Budget Health Score (0-100) with grade and suggestions
 * @param {Object} snapshot - Financial snapshot
 * @param {Object} metrics - From calculateMetrics()
 * @returns {Object} { score, grade, gradeColor, components[], suggestions[] }
 */
function calculateBudgetHealthScore(snapshot, metrics) {
  const components = [];
  const suggestions = [];

  // 1. Savings Rate (30% weight)
  const savingsRate = metrics.savingsRate || 0;
  const savingsScore = Math.min(100, Math.max(0, (savingsRate / 25) * 100));
  components.push({
    label: 'Savings Rate',
    score: Math.round(savingsScore),
    weight: 30,
    detail: `${savingsRate}% of take-home`,
    ideal: '25%+',
  });
  if (savingsScore < 100) {
    const targetRate = 25;
    const currentRate = Math.max(0, savingsRate);
    const gap = targetRate - currentRate;
    const pointGain = Math.round(((gap / 25) * 100) * 0.30);
    if (pointGain > 0) {
      suggestions.push({
        text: `Increase savings rate from ${currentRate}% to ${targetRate}%`,
        points: pointGain,
        tabLink: null,
      });
    }
  }

  // 2. Emergency Fund (20% weight)
  const efMonths = metrics.emergencyMonths || 0;
  const efScore = Math.min(100, Math.max(0, (efMonths / 6) * 100));
  components.push({
    label: 'Emergency Fund',
    score: Math.round(efScore),
    weight: 20,
    detail: `${efMonths} months covered`,
    ideal: '6 months',
  });
  if (efScore < 100) {
    const monthsNeeded = Math.max(0, 6 - efMonths);
    const pointGain = Math.round(((monthsNeeded / 6) * 100) * 0.20);
    if (pointGain > 0) {
      const monthlyExpense = snapshot.general.monthlyExpense || 0;
      const amountNeeded = Math.round(monthsNeeded * monthlyExpense);
      suggestions.push({
        text: amountNeeded > 0
          ? `Build emergency fund by $${amountNeeded.toLocaleString()} (${monthsNeeded.toFixed(1)} more months)`
          : `Build emergency fund to 6 months of expenses`,
        points: pointGain,
        tabLink: 'investments',
      });
    }
  }

  // 3. Debt-to-Income (20% weight)
  const dti = metrics.debtToIncome || 0;
  const dtiScore = Math.max(0, Math.min(100, (1 - dti / 50) * 100));
  components.push({
    label: 'Debt-to-Income',
    score: Math.round(dtiScore),
    weight: 20,
    detail: `${dti}% DTI ratio`,
    ideal: '< 20%',
  });
  if (dtiScore < 100 && dti > 0) {
    const pointGain = Math.round(((dti / 50) * 100) * 0.20);
    if (pointGain > 0) {
      suggestions.push({
        text: dti > 36
          ? `Reduce debt-to-income ratio from ${dti}% (target: below 36%)`
          : `Continue reducing debt-to-income ratio from ${dti}% toward 0%`,
        points: Math.min(pointGain, 20),
        tabLink: 'debts',
      });
    }
  }

  // 4. Budget Balance — 50/30/20 adherence (15% weight)
  const rule = calculate503020(snapshot, metrics);
  let budgetScore = 100;
  if (rule.hasData) {
    // Total percentage deviation from ideal
    const totalDeviation = Math.abs(rule.needs.diff) + Math.abs(rule.wants.diff) + Math.abs(rule.savings.diff);
    budgetScore = Math.max(0, Math.min(100, 100 - totalDeviation * 2));
  }
  components.push({
    label: 'Budget Balance',
    score: Math.round(budgetScore),
    weight: 15,
    detail: rule.hasData ? `${rule.needs.pct}/${rule.wants.pct}/${rule.savings.pct} split` : 'Set expense categories',
    ideal: '50/30/20',
  });
  if (budgetScore < 100 && rule.hasData) {
    const pointGain = Math.round(((100 - budgetScore) / 100) * 15);
    if (pointGain > 0) {
      let suggestion = 'Adjust spending to align with the 50/30/20 guideline';
      if (rule.needs.diff > 10) suggestion = `Reduce needs spending (currently ${rule.needs.pct}%, target ~50%)`;
      else if (rule.wants.diff > 10) suggestion = `Reduce wants spending (currently ${rule.wants.pct}%, target ~30%)`;
      else if (rule.savings.diff < -10) suggestion = `Increase savings (currently ${rule.savings.pct}%, target ~20%)`;
      suggestions.push({ text: suggestion, points: pointGain, tabLink: null });
    }
  }

  // 5. Wealth Building (15% weight)
  const netWorth = metrics.netWorth || 0;
  const age = snapshot.general.age || 30;
  const income = snapshot.general.annualIncome || 0;
  const expectedNW = income > 0 ? (age * income) / 10 : 0;
  let wealthScore = 0;
  if (expectedNW > 0) {
    wealthScore = Math.min(100, Math.max(0, (netWorth / expectedNW) * 100));
  } else if (netWorth > 0) {
    wealthScore = 50; // Positive NW but no income benchmark
  }
  components.push({
    label: 'Wealth Building',
    score: Math.round(wealthScore),
    weight: 15,
    detail: netWorth >= 0
      ? `$${Math.abs(netWorth).toLocaleString()} net worth`
      : `-$${Math.abs(netWorth).toLocaleString()} net worth`,
    ideal: expectedNW > 0 ? `$${Math.round(expectedNW).toLocaleString()}` : 'Positive NW',
  });
  if (wealthScore < 100 && expectedNW > 0) {
    const gap = expectedNW - netWorth;
    const pointGain = Math.round(((100 - wealthScore) / 100) * 15);
    if (pointGain > 0 && gap > 0) {
      suggestions.push({
        text: `Grow net worth by $${Math.round(gap).toLocaleString()} toward age-based benchmark`,
        points: pointGain,
        tabLink: 'investments',
      });
    }
  }

  // Calculate weighted total
  const totalScore = Math.round(
    components.reduce((sum, c) => sum + (c.score * c.weight / 100), 0)
  );

  // Determine grade
  let grade, gradeColor;
  if (totalScore >= 90) { grade = 'A'; gradeColor = '#30D158'; }
  else if (totalScore >= 80) { grade = 'B'; gradeColor = '#E5A823'; }
  else if (totalScore >= 70) { grade = 'C'; gradeColor = '#F59E0B'; }
  else if (totalScore >= 60) { grade = 'D'; gradeColor = '#F97316'; }
  else { grade = 'F'; gradeColor = '#FF453A'; }

  // Sort suggestions by point impact (highest first)
  suggestions.sort((a, b) => b.points - a.points);

  return {
    score: totalScore,
    grade,
    gradeColor,
    components,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
  };
}

// ===========================
// WATERFALL CHART DATA
// ===========================

/**
 * Transform cashFlow waterfall data into Chart.js floating bar format
 * @param {Object} cashFlowResult - From calculateCashFlow()
 * @returns {Object} { labels, data, colors, tooltipData }
 */
function buildWaterfallChartData(cashFlowResult) {
  if (!cashFlowResult || !cashFlowResult.waterfall || cashFlowResult.waterfall.length === 0) {
    return null;
  }

  const { summary } = cashFlowResult;
  const gross = summary.grossIncome || 0;

  if (gross <= 0) return null;

  // Build simplified waterfall items (combine debt principal + interest)
  const totalDebt = (summary.debtPrincipal || 0) + (summary.debtInterest || 0);
  const items = [
    { label: 'Gross Income',   amount: gross,                color: '#6366F1', isPositive: true },
    { label: 'Taxes',          amount: summary.taxes || 0,   color: '#6B7280', isPositive: false },
    { label: 'Take-Home',      amount: summary.takeHome || 0, color: '#E5A823', isPositive: true, isMilestone: true },
    { label: 'Expenses',       amount: summary.expenses || 0, color: '#F59E0B', isPositive: false },
    { label: 'Debt Payments',  amount: totalDebt,             color: '#F97316', isPositive: false },
    { label: 'Investments',    amount: summary.investments || 0, color: '#30D158', isPositive: false },
    { label: 'Leftover',       amount: summary.leftover || 0, color: '#48484A', isPositive: true },
  ];

  // Build floating bar data: [bottom, top] pairs
  // Running total tracks the "waterfall" effect
  const labels = [];
  const data = [];
  const colors = [];
  const tooltipData = [];

  let runningTotal = 0;

  items.forEach(item => {
    labels.push(item.label);
    colors.push(item.color);

    const pct = gross > 0 ? Math.round((item.amount / gross) * 100) : 0;
    tooltipData.push({
      amount: item.amount,
      percentage: pct,
      isPositive: item.isPositive,
    });

    if (item.isMilestone) {
      // Milestone bars start from 0
      data.push([0, item.amount]);
      runningTotal = item.amount;
    } else if (item.isPositive && labels.indexOf(item.label) === 0) {
      // First bar (gross income) starts from 0
      data.push([0, item.amount]);
      runningTotal = item.amount;
    } else if (item.isPositive) {
      // Positive leftover
      data.push([0, item.amount]);
    } else {
      // Deductions: float down from running total
      const top = runningTotal;
      runningTotal -= item.amount;
      data.push([Math.max(0, runningTotal), top]);
    }
  });

  return { labels, data, colors, tooltipData };
}

// Expose globally
window.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
window.calculate503020 = calculate503020;
window.calculateBudgetHealthScore = calculateBudgetHealthScore;
window.buildWaterfallChartData = buildWaterfallChartData;
