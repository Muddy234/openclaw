/**
 * strategy.js
 * FIRE strategy logic and calculations
 */

// Helper: Get total assets from investments
function getTotalAssets(snapshot) {
  const inv = snapshot.investments;
  return (
    inv.savings +
    inv.ira +
    inv.rothIra +
    inv.stocksBonds +
    inv.fourOhOneK +
    inv.realEstate +
    inv.carValue +
    inv.other
  );
}

// Helper: Get total debts
function getTotalDebts(snapshot) {
  return snapshot.debts.reduce((sum, d) => sum + d.balance, 0);
}

// Helper: Estimate monthly payment for a debt based on balance, rate, and type
function estimateMonthlyPayment(balance, interestRate, category) {
  if (balance <= 0) return 0;

  const monthlyRate = (interestRate / 100) / 12;

  // For mortgages, use standard 30-year amortization formula
  if (category === 'MORTGAGE') {
    if (monthlyRate === 0) return balance / 360; // 0% interest
    const n = 360; // 30-year mortgage
    const payment = balance * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    return payment;
  }

  // For auto loans, use 5-year amortization
  if (category === 'AUTO') {
    if (monthlyRate === 0) return balance / 60;
    const n = 60; // 5-year loan
    const payment = balance * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    return payment;
  }

  // For other debts (credit cards, medical, student), use minimum payment estimate
  // Credit cards: typically 1-3% of balance or $25 minimum
  // Using: higher of 2% of balance or interest + 1% principal
  const monthlyInterest = balance * monthlyRate;
  const minPayment = Math.max(balance * 0.02, monthlyInterest + (balance * 0.01), 25);
  return minPayment;
}

// Helper: Get total monthly debt payments
function getMonthlyDebtPayments(snapshot) {
  return snapshot.debts.reduce((sum, d) => {
    return sum + estimateMonthlyPayment(d.balance, d.interestRate, d.category);
  }, 0);
}

// Helper: Get debts by interest rate threshold
function getDebtsByRate(debts, minRate, maxRate) {
  return debts.filter(d => {
    if (d.category === 'MORTGAGE') return false;
    if (d.balance === 0) return false;
    if (maxRate !== undefined) {
      return d.interestRate >= minRate && d.interestRate < maxRate;
    }
    return d.interestRate >= minRate;
  });
}

// Helper: Calculate fragility rating
function calculateFragilityRating(emergencyMonths) {
  if (emergencyMonths < 3) return 'FRAGILE';
  if (emergencyMonths < 6) return 'MODERATE';
  return 'SOLID';
}

// Calculate all metrics
function calculateMetrics(snapshot) {
  const totalAssets = getTotalAssets(snapshot);
  const totalDebts = getTotalDebts(snapshot);
  const netWorth = totalAssets - totalDebts;

  // Debt-to-Income: (monthly debt payments / monthly gross income) * 100
  const monthlyDebtPayments = getMonthlyDebtPayments(snapshot);
  const monthlyGrossIncome = snapshot.general.annualIncome / 12;
  const debtToIncome = monthlyGrossIncome > 0
    ? Math.round((monthlyDebtPayments / monthlyGrossIncome) * 100)
    : 0;

  // Emergency months coverage
  const monthlyExpense = snapshot.general.monthlyExpense || 1;
  const emergencyMonths = snapshot.investments.savings / monthlyExpense;

  const fragility = calculateFragilityRating(emergencyMonths);

  // Savings rate
  const monthlySavings = snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense;
  const savingsRate = snapshot.general.monthlyTakeHome > 0
    ? Math.round((monthlySavings / snapshot.general.monthlyTakeHome) * 100)
    : 0;

  return {
    debtToIncome,
    netWorth,
    fragility,
    monthlyDebtPayments: Math.round(monthlyDebtPayments),
    totalAssets,
    totalDebts,
    emergencyMonths: Math.round(emergencyMonths * 10) / 10,
    savingsRate,
    monthlySavings,
  };
}

// Generate financial summary/debrief
function generateFinancialSummary(snapshot, metrics) {
  const strengths = [];
  const weaknesses = [];
  const insights = [];

  // Analyze Emergency Fund
  if (metrics.emergencyMonths >= 6) {
    strengths.push(`Strong emergency fund covering ${metrics.emergencyMonths} months of expenses - you're well protected against unexpected events.`);
  } else if (metrics.emergencyMonths >= 3) {
    insights.push(`Your emergency fund covers ${metrics.emergencyMonths} months. Consider building to 6 months for full security.`);
  } else if (metrics.emergencyMonths > 0) {
    weaknesses.push(`Emergency fund only covers ${metrics.emergencyMonths} months of expenses. Aim for 3-6 months minimum.`);
  } else {
    weaknesses.push(`No emergency fund detected. This is your most urgent priority - aim for 1 month of expenses first.`);
  }

  // Analyze Debt-to-Income
  if (metrics.debtToIncome === 0) {
    strengths.push(`Zero debt payments - you have maximum flexibility with your income.`);
  } else if (metrics.debtToIncome <= 20) {
    strengths.push(`Healthy debt-to-income ratio of ${metrics.debtToIncome}% - well below the recommended 36% threshold.`);
  } else if (metrics.debtToIncome <= 36) {
    insights.push(`Debt-to-income of ${metrics.debtToIncome}% is manageable but approaching the 36% caution zone.`);
  } else {
    weaknesses.push(`High debt-to-income ratio of ${metrics.debtToIncome}% exceeds the 36% threshold. Debt reduction should be prioritized.`);
  }

  // Analyze Savings Rate
  if (metrics.savingsRate >= 25) {
    strengths.push(`Excellent savings rate of ${metrics.savingsRate}% - you're on track for early financial independence.`);
  } else if (metrics.savingsRate >= 15) {
    insights.push(`Savings rate of ${metrics.savingsRate}% is solid. Increasing to 25%+ would accelerate your FIRE timeline.`);
  } else if (metrics.savingsRate > 0) {
    weaknesses.push(`Savings rate of ${metrics.savingsRate}% is below the 15% minimum recommended for retirement. Look for ways to increase income or reduce expenses.`);
  } else {
    weaknesses.push(`Negative or zero cash flow - you're spending more than you earn. This needs immediate attention.`);
  }

  // Analyze Net Worth
  if (metrics.netWorth > snapshot.general.annualIncome * 2) {
    strengths.push(`Net worth of ${formatCurrencyShort(metrics.netWorth)} is over 2x your annual income - strong wealth accumulation.`);
  } else if (metrics.netWorth > 0) {
    insights.push(`Positive net worth of ${formatCurrencyShort(metrics.netWorth)}. Continue building assets while managing debt.`);
  } else {
    weaknesses.push(`Negative net worth means debts exceed assets. Focus on debt reduction and asset building.`);
  }

  // Analyze High-Interest Debt
  const highInterestDebts = getDebtsByRate(snapshot.debts, 7);
  const highInterestTotal = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
  if (highInterestTotal > 0) {
    const debtNames = highInterestDebts.map(d => d.label).join(', ');
    weaknesses.push(`${formatCurrencyShort(highInterestTotal)} in high-interest debt (${debtNames}) is costing you significantly. Prioritize paying this off.`);
  }

  // Analyze Employer Match
  if (snapshot.fireSettings && snapshot.fireSettings.isGettingMatch) {
    strengths.push(`Capturing your employer match - that's free money you're not leaving on the table.`);
  } else if (snapshot.fireSettings && snapshot.fireSettings.hasEmployerMatch && !snapshot.fireSettings.isGettingMatch) {
    weaknesses.push(`You have an employer match available but aren't capturing it. This is free money - prioritize contributing enough to get the full match.`);
  }

  // Analyze Retirement Accounts
  const totalRetirement = snapshot.investments.fourOhOneK + snapshot.investments.ira + snapshot.investments.rothIra;
  if (totalRetirement > 0) {
    const yearsToRetirement = snapshot.general.targetRetirement - snapshot.general.age;
    if (yearsToRetirement > 0) {
      insights.push(`${formatCurrencyShort(totalRetirement)} in retirement accounts with ${yearsToRetirement} years until target retirement age.`);
    }
  }

  return { strengths, weaknesses, insights };
}

// Helper for short currency format
function formatCurrencyShort(n) {
  if (Math.abs(n) >= 1000000) {
    return '$' + (n / 1000000).toFixed(1) + 'M';
  } else if (Math.abs(n) >= 1000) {
    return '$' + (n / 1000).toFixed(0) + 'K';
  }
  return '$' + n.toLocaleString();
}

// Get detailed reasoning for each step
function getStepReasoning(action, snapshot, metrics) {
  const monthlyExpense = snapshot.general.monthlyExpense;
  const savings = snapshot.investments.savings;

  switch (action) {
    case 'BUDGET_ESSENTIALS':
      return {
        why: "Before any investing or debt payoff, you must ensure basic survival needs are covered. This creates the stable foundation everything else builds upon.",
        action: "Track your spending for one month to understand where your money goes. Ensure housing, utilities, food, and transportation are covered first.",
      };

    case 'STARTER_EMERGENCY_FUND':
      const starterTarget = monthlyExpense;
      const starterCurrent = Math.min(savings, starterTarget);
      return {
        why: "A starter emergency fund prevents you from going deeper into debt when unexpected expenses hit. Even a small buffer breaks the cycle of living paycheck to paycheck.",
        action: `Save ${formatCurrencyShort(starterTarget)} (1 month of expenses). You currently have ${formatCurrencyShort(starterCurrent)} toward this goal.`,
      };

    case 'EMPLOYER_MATCH':
      const matchPct = snapshot.fireSettings?.employerMatchPercent || 'your company\'s';
      return {
        why: "Employer matching is essentially free money - typically a 50-100% immediate benefit on your contribution. This is one of the most valuable financial benefits available.",
        action: `Contribute at least enough to your 401(k) to capture the full ${matchPct}% employer match. This comes before paying extra on any debt.`,
      };

    case 'HIGH_INTEREST_DEBT':
      const highDebts = getDebtsByRate(snapshot.debts, 7);
      const highTotal = highDebts.reduce((sum, d) => sum + d.balance, 0);
      const highestRate = Math.max(...highDebts.map(d => d.interestRate), 0);
      return {
        why: `Debt above 7% interest typically grows faster than investment returns. Every dollar paid toward ${highestRate}% debt saves ${highestRate}% in interest - a mathematically certain benefit.`,
        action: `Attack ${formatCurrencyShort(highTotal)} in high-interest debt using the avalanche method (highest rate first). This saves the most money over time.`,
      };

    case 'HSA_ROTH':
      const rothMax = 7000; // 2024 limit
      const hsaMax = 4150; // 2024 individual limit
      return {
        why: "HSA offers triple tax advantage (tax-free contributions, growth, AND withdrawals for medical). Roth IRA provides tax-free growth and withdrawals in retirement - powerful for early retirees who need flexibility.",
        action: `Max your HSA (${formatCurrencyShort(hsaMax)}/year) if eligible, then Roth IRA (${formatCurrencyShort(rothMax)}/year). These tax-advantaged accounts are use-it-or-lose-it annual opportunities.`,
      };

    case 'FULL_EMERGENCY_FUND':
      const fullTarget = monthlyExpense * 6;
      return {
        why: "A full 3-6 month emergency fund protects against job loss, major medical issues, or other significant disruptions. This is your financial shock absorber.",
        action: `Build savings to ${formatCurrencyShort(fullTarget)} (6 months of expenses). You currently have ${formatCurrencyShort(savings)}, covering ${metrics.emergencyMonths} months.`,
      };

    case 'MODERATE_INTEREST_DEBT':
      const modDebts = getDebtsByRate(snapshot.debts, 4, 7);
      const modTotal = modDebts.reduce((sum, d) => sum + d.balance, 0);
      return {
        why: "Debt in the 4-7% range is a judgment call. Mathematically, investing may win, but being debt-free provides psychological benefits and financial flexibility.",
        action: `Consider paying off ${formatCurrencyShort(modTotal)} in moderate-interest debt if the peace of mind matters to you. Otherwise, invest the difference.`,
      };

    case 'MAX_RETIREMENT':
      const max401k = 23000; // 2024 limit
      return {
        why: "Tax-advantaged space is limited and doesn't roll over. Maxing your 401(k) reduces your tax bill now while building wealth that compounds for decades.",
        action: `Increase 401(k) contributions toward the ${formatCurrencyShort(max401k)}/year limit. Your current balance is ${formatCurrencyShort(snapshot.investments.fourOhOneK)}.`,
      };

    case 'TAXABLE_INVESTING':
      return {
        why: "Once tax-advantaged accounts are maxed, taxable brokerage accounts provide flexibility for early retirement. You can access this money before age 59½ without penalties.",
        action: `Open a taxable brokerage account and invest in low-cost index funds. This becomes your "bridge" to access money before traditional retirement age.`,
      };

    case 'LOW_INTEREST_DEBT':
      return {
        why: "Debt below 4% (like many mortgages) costs less than typical investment returns. Mathematically, investing beats paying this off early.",
        action: `Keep making minimum payments on low-interest debt and invest the difference. The spread between investment returns and loan interest works in your favor.`,
      };

    default:
      return {
        why: "This step helps build your financial foundation.",
        action: "Review your current financial situation and take the next appropriate action.",
      };
  }
}

// Get step status
function getStepStatus(action, snapshot) {
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const savings = snapshot.investments.savings || 0;

  const highInterestDebt = getDebtsByRate(snapshot.debts, 7)
    .reduce((sum, d) => sum + d.balance, 0);
  const moderateInterestDebt = getDebtsByRate(snapshot.debts, 4, 7)
    .reduce((sum, d) => sum + d.balance, 0);

  switch (action) {
    case 'BUDGET_ESSENTIALS':
      return snapshot.general.annualIncome > 0 && snapshot.general.monthlyExpense > 0
        ? 'COMPLETED'
        : 'IN_PROGRESS';

    case 'STARTER_EMERGENCY_FUND':
      if (monthlyExpense > 0 && savings >= monthlyExpense) return 'COMPLETED';
      if (savings > 0) return 'IN_PROGRESS';
      return 'NOT_STARTED';

    case 'EMPLOYER_MATCH':
      if (!snapshot.fireSettings || !snapshot.fireSettings.hasEmployerMatch) return 'NOT_APPLICABLE';
      return snapshot.fireSettings.isGettingMatch ? 'COMPLETED' : 'IN_PROGRESS';

    case 'HIGH_INTEREST_DEBT':
      if (highInterestDebt === 0) return 'COMPLETED';
      return 'IN_PROGRESS';

    case 'HSA_ROTH':
      // Check if previous steps are complete first
      if (highInterestDebt > 0) return 'NOT_STARTED';
      const retirementFunded = snapshot.investments.rothIra > 0 ||
                               snapshot.investments.ira > 0 ||
                               snapshot.investments.fourOhOneK > 0;
      return retirementFunded ? 'IN_PROGRESS' : 'NOT_STARTED';

    case 'FULL_EMERGENCY_FUND':
      if (highInterestDebt > 0) return 'NOT_STARTED';
      if (monthlyExpense > 0 && savings >= monthlyExpense * 6) return 'COMPLETED';
      if (monthlyExpense > 0 && savings >= monthlyExpense * 3) return 'IN_PROGRESS';
      return 'NOT_STARTED';

    case 'MODERATE_INTEREST_DEBT':
      // Only start after full emergency fund
      if (monthlyExpense === 0 || savings < monthlyExpense * 6) return 'NOT_STARTED';
      if (moderateInterestDebt === 0) return 'COMPLETED';
      return 'IN_PROGRESS';

    case 'MAX_RETIREMENT':
      // Only start after full emergency fund
      if (monthlyExpense === 0 || savings < monthlyExpense * 6) return 'NOT_STARTED';
      return 'IN_PROGRESS';

    case 'TAXABLE_INVESTING':
      // Only start after full emergency fund
      if (monthlyExpense === 0 || savings < monthlyExpense * 6) return 'NOT_STARTED';
      return snapshot.investments.stocksBonds > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    case 'LOW_INTEREST_DEBT':
      return 'NOT_APPLICABLE';

    default:
      return 'NOT_STARTED';
  }
}

// Get step amounts for progress calculation
function getStepAmounts(action, snapshot) {
  const monthlyExpense = snapshot.general.monthlyExpense;
  const savings = snapshot.investments.savings;

  switch (action) {
    case 'STARTER_EMERGENCY_FUND':
      return {
        targetAmount: monthlyExpense,
        currentAmount: Math.min(savings, monthlyExpense),
      };
    case 'FULL_EMERGENCY_FUND':
      return {
        targetAmount: monthlyExpense * 6,
        currentAmount: savings,
      };
    case 'HIGH_INTEREST_DEBT':
      const highDebt = getDebtsByRate(snapshot.debts, 7)
        .reduce((sum, d) => sum + d.balance, 0);
      return {
        targetAmount: highDebt,
        currentAmount: 0,
      };
    default:
      return {};
  }
}

// Get all steps with their status
function getSteps(snapshot) {
  const actions = Object.keys(FIRE_RANKINGS);
  const metrics = calculateMetrics(snapshot);

  const steps = actions.map(action => {
    const status = getStepStatus(action, snapshot);
    const metadata = STEP_METADATA[action];
    const amounts = getStepAmounts(action, snapshot);
    const reasoning = getStepReasoning(action, snapshot, metrics);

    let progress;
    if (amounts.targetAmount && amounts.currentAmount !== undefined && amounts.targetAmount > 0) {
      progress = Math.min(100, Math.round((amounts.currentAmount / amounts.targetAmount) * 100));
    }

    return {
      action,
      rank: FIRE_RANKINGS[action],
      title: metadata.title,
      description: metadata.description,
      status,
      progress,
      targetAmount: amounts.targetAmount,
      currentAmount: amounts.currentAmount,
      reasoning,
    };
  });

  return steps.sort((a, b) => a.rank - b.rank);
}

// Get the next step to work on
function getNextStep(snapshot) {
  const steps = getSteps(snapshot);
  return steps.find(s => s.status === 'IN_PROGRESS' || s.status === 'NOT_STARTED') || null;
}

// Expose functions to window for global access
if (typeof window !== 'undefined') {
  window.calculateMetrics = calculateMetrics;
  window.generateFinancialSummary = generateFinancialSummary;
  window.getSteps = getSteps;
  window.getNextStep = getNextStep;
  window.getTotalAssets = getTotalAssets;
  window.getTotalDebts = getTotalDebts;
}
