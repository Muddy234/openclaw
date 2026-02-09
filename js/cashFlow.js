// ===========================
// CASH FLOW ANALYSIS
// ===========================

/**
 * Calculate detailed cash flow breakdown
 * @param {Object} snapshot - Financial snapshot
 * @returns {Object} Cash flow breakdown
 */
function calculateCashFlow(snapshot) {
  // SECURITY: Validate and sanitize all numeric inputs
  const annualIncome = parseFloat(snapshot.general?.annualIncome) || 0;
  const monthlyTakeHome = parseFloat(snapshot.general?.monthlyTakeHome) || 0;
  const monthlyExpense = parseFloat(snapshot.general?.monthlyExpense) || 0;

  // SECURITY: Guard against division by zero and invalid inputs
  if (!isFinite(annualIncome) || annualIncome <= 0) {
    return getEmptyCashFlow();
  }

  const monthlyGrossIncome = annualIncome / 12;

  // Calculate taxes (gross - take home)
  const monthlyTaxes = Math.max(0, monthlyGrossIncome - monthlyTakeHome);

  // Calculate total debt payments
  const debtPayments = calculateTotalDebtPayments(snapshot.debts || []);

  // Calculate investments (take-home - expenses - debt)
  const availableForInvestments = monthlyTakeHome - monthlyExpense - debtPayments.total;

  // Current investment rate
  const currentMonthlyInvestments = availableForInvestments > 0 ? availableForInvestments : 0;

  // Build waterfall
  const waterfall = [
    {
      category: 'Gross Income',
      amount: monthlyGrossIncome,
      color: 'blue',
      description: 'Total income before any deductions'
    },
    {
      category: 'Taxes & Deductions',
      amount: -monthlyTaxes,
      color: 'gray',
      description: 'Federal, state, local taxes, 401(k), insurance'
    },
    {
      category: 'Take-Home Pay',
      amount: monthlyTakeHome,
      color: 'gold',
      description: 'Money that hits your bank account',
      isMilestone: true
    },
    {
      category: 'Living Expenses',
      amount: -monthlyExpense,
      color: 'yellow',
      description: 'Rent, utilities, groceries, transportation, etc.'
    },
    {
      category: 'Debt Payments (Principal)',
      amount: -debtPayments.principal,
      color: 'orange',
      description: 'Portion of debt payments going to principal'
    },
    {
      category: 'Debt Payments (Interest)',
      amount: -debtPayments.interest,
      color: 'danger',
      description: 'Portion of debt payments going to interest'
    },
    {
      category: 'Investments',
      amount: -currentMonthlyInvestments,
      color: 'success',
      description: 'Savings and investments building wealth'
    },
    {
      category: 'Leftover/Unallocated',
      amount: Math.max(0, monthlyTakeHome - monthlyExpense - debtPayments.total - currentMonthlyInvestments),
      color: 'gray',
      description: 'Unallocated cash (opportunity for optimization)'
    }
  ];

  // SECURITY: Safe percentage calculation with division guard
  waterfall.forEach(item => {
    item.percentage = monthlyGrossIncome > 0
      ? (Math.abs(item.amount) / monthlyGrossIncome) * 100
      : 0;
  });

  return {
    waterfall: waterfall,
    summary: {
      grossIncome: monthlyGrossIncome,
      takeHome: monthlyTakeHome,
      taxes: monthlyTaxes,
      expenses: monthlyExpense,
      debtPrincipal: debtPayments.principal,
      debtInterest: debtPayments.interest,
      investments: currentMonthlyInvestments,
      leftover: waterfall[waterfall.length - 1].amount
    },
    debtBreakdown: debtPayments.breakdown
  };
}

/**
 * Return empty cash flow object for invalid inputs
 * @returns {Object} Empty cash flow structure
 */
function getEmptyCashFlow() {
  return {
    waterfall: [],
    summary: {
      grossIncome: 0,
      takeHome: 0,
      taxes: 0,
      expenses: 0,
      debtPrincipal: 0,
      debtInterest: 0,
      investments: 0,
      leftover: 0
    },
    debtBreakdown: []
  };
}

/**
 * Calculate total monthly debt payments broken down by principal and interest
 * @param {Array} debts - Array of debt objects
 * @returns {Object} { total, principal, interest, breakdown }
 */
function calculateTotalDebtPayments(debts) {
  let totalPayment = 0;
  let totalPrincipal = 0;
  let totalInterest = 0;
  const breakdown = [];

  // SECURITY: Validate debts array
  if (!Array.isArray(debts)) {
    return { total: 0, principal: 0, interest: 0, breakdown: [] };
  }

  debts.forEach(debt => {
    // SECURITY: Validate individual debt fields
    const balance = parseFloat(debt.balance) || 0;
    const interestRate = parseFloat(debt.interestRate) || 0;
    const termMonths = parseInt(debt.termMonths) || 60;

    if (balance <= 0 || !isFinite(balance)) return;
    if (interestRate < 0 || !isFinite(interestRate)) return;

    // Calculate monthly payment
    let monthlyPayment;
    if (termMonths > 0 && typeof window.calculateMonthlyPayment === 'function') {
      // Note: calculateMonthlyPayment expects rate as percentage (e.g., 7 for 7%)
      monthlyPayment = window.calculateMonthlyPayment(balance, interestRate, termMonths);
    } else {
      monthlyPayment = Math.max(balance * 0.02, 25);
    }

    // SECURITY: Guard against NaN/Infinity
    if (!isFinite(monthlyPayment)) {
      monthlyPayment = Math.max(balance * 0.02, 25);
    }

    // Calculate interest portion
    const monthlyInterest = (balance * (interestRate / 100)) / 12;
    const monthlyPrincipal = Math.max(0, monthlyPayment - monthlyInterest);

    totalPayment += monthlyPayment;
    totalPrincipal += monthlyPrincipal;
    totalInterest += monthlyInterest;

    breakdown.push({
      category: debt.category || 'OTHER',
      payment: monthlyPayment,
      principal: monthlyPrincipal,
      interest: monthlyInterest,
      interestRate: interestRate,
      balance: balance
    });
  });

  return {
    total: totalPayment,
    principal: totalPrincipal,
    interest: totalInterest,
    breakdown: breakdown
  };
}

/**
 * Generate cash flow optimization recommendations
 * COMPLIANCE: All recommendations use educational framing, not financial advice
 * @param {Object} cashFlow - Cash flow breakdown
 * @param {Object} snapshot - Financial snapshot
 * @returns {Array} Array of recommendations
 */
function generateCashFlowRecommendations(cashFlow, snapshot) {
  const recommendations = [];
  const { summary } = cashFlow;

  // SECURITY: Validate summary object
  if (!summary || !isFinite(summary.grossIncome) || summary.grossIncome <= 0) {
    return recommendations;
  }

  // 1. Leftover cash (unallocated)
  if (summary.leftover > 100) {
    recommendations.push({
      priority: 'medium',
      category: 'Investments',
      // COMPLIANCE: Educational framing
      title: `About $${Math.round(summary.leftover).toLocaleString()}/month appears unallocated`,
      description: 'Cash in checking accounts typically earns minimal interest. Some investors choose to put extra funds to work.',
      action: 'Educational Strategy: Some investors automate transfers to savings or investment accounts. Consult a financial advisor to determine if this approach fits your situation.',
      // COMPLIANCE: Display assumption, add disclaimer
      potentialGain: summary.leftover * 12 * 0.07,
      potentialGainDisclaimer: 'Assumes 7% annual return (historical average). Actual returns vary and may be negative.',
      disclaimer: 'This is not investment advice. Consult a financial professional.'
    });
  }

  // 3. Low savings rate observation
  // SECURITY: Guard against division by zero
  const savingsRate = summary.takeHome > 0
    ? (summary.investments / summary.takeHome) * 100
    : 0;
  if (isFinite(savingsRate) && savingsRate < 15) {
    recommendations.push({
      priority: 'high',
      category: 'Savings',
      // COMPLIANCE: Observation, not directive
      title: `Current savings rate is approximately ${savingsRate.toFixed(1)}%`,
      description: 'Many financial planners suggest aiming for a 15-20% savings rate, though individual circumstances vary.',
      action: 'Educational Strategy: Financial planners often suggest reviewing expense categories to identify potential areas for adjustment. A financial advisor can help create a personalized budget.',
      potentialImpact: 'Increasing savings rate may help progress toward financial goals',
      disclaimer: 'Individual results vary based on personal circumstances.'
    });
  }

  // 4. High expense ratio observation
  // SECURITY: Guard against division by zero
  const expenseRatio = summary.takeHome > 0
    ? (summary.expenses / summary.takeHome) * 100
    : 0;
  if (isFinite(expenseRatio) && expenseRatio > 70) {
    const targetExpenses = summary.takeHome * 0.6;
    const potentialSavings = Math.max(0, summary.expenses - targetExpenses);
    recommendations.push({
      priority: 'medium',
      category: 'Expenses',
      // COMPLIANCE: Observation framing
      title: `Expenses represent approximately ${Math.round(expenseRatio)}% of take-home pay`,
      description: 'Some financial educators suggest keeping expenses below 60% of take-home pay to allow for savings and debt repayment.',
      action: 'Educational Strategy: Common areas to review include dining out, subscriptions, and discretionary purchases. A financial advisor can help you prioritize.',
      potentialSavings: potentialSavings * 12,
      disclaimer: 'Estimate only. Individual circumstances vary.'
    });
  }

  // Sort by priority (debt and tax recommendations moved to their dedicated tabs)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 5); // Return top 5
}

// Expose functions globally
window.calculateCashFlow = calculateCashFlow;
window.calculateTotalDebtPayments = calculateTotalDebtPayments;
window.generateCashFlowRecommendations = generateCashFlowRecommendations;
