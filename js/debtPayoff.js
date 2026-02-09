/**
 * debtPayoff.js
 * Debt Payoff Calculator - Avalanche vs Snowball comparison
 *
 * DISCLAIMER: This tool provides estimates for educational purposes only.
 * Actual results may vary. Consult a qualified financial advisor for
 * personalized debt management advice.
 */

// ===========================
// DEBT PAYOFF CALCULATOR
// ===========================

// Security limits
const MAX_DEBT_ARRAY_LENGTH = 100;
const MAX_SAFE_BALANCE = 1e15; // $1 quadrillion cap
const VALID_CATEGORIES = ['CREDIT_CARD', 'MEDICAL', 'STUDENT', 'AUTO', 'MORTGAGE', 'OTHER'];

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
 * Calculate minimum monthly payment for a debt using PMT formula
 * @param {Object} debt - Debt object with balance, interestRate, termMonths
 * @returns {number} Monthly payment amount
 */
function calculateDebtMinPayment(debt) {
  if (!debt || debt.balance <= 0) return 0;

  // Use existing calculateMonthlyPayment if termMonths provided
  if (debt.termMonths && debt.termMonths > 0 && typeof calculateMonthlyPayment === 'function') {
    return calculateMonthlyPayment(debt.balance, debt.interestRate, debt.termMonths);
  }

  // Fallback: 2% of balance or $25, whichever is greater
  return Math.max(debt.balance * 0.02, 25);
}

/**
 * Simulate debt payoff month-by-month
 * @param {Array} sortedDebts - Debts sorted by priority (avalanche or snowball)
 * @param {number} monthlyExtraCashFlow - Extra cash for debt payoff
 * @param {string} method - 'avalanche' or 'snowball'
 * @returns {Object} Complete payoff simulation
 */
function simulatePayoff(sortedDebts, monthlyExtraCashFlow, method) {
  // Validate array input
  if (!Array.isArray(sortedDebts) || sortedDebts.length === 0) {
    return {
      method: method,
      totalInterestPaid: 0,
      monthsToPayoff: 0,
      debtFreeDate: new Date(),
      timeline: [],
      paidOffMilestones: [],
      finalDebts: [],
      reachedMaxMonths: false
    };
  }

  // Security: Limit array length to prevent DoS
  let debtArray = sortedDebts;
  if (sortedDebts.length > MAX_DEBT_ARRAY_LENGTH) {
    console.warn(`Debt array exceeds safe limit of ${MAX_DEBT_ARRAY_LENGTH}. Truncating.`);
    debtArray = sortedDebts.slice(0, MAX_DEBT_ARRAY_LENGTH);
  }

  // Validate inputs
  const extraCash = Math.max(0, Number(monthlyExtraCashFlow) || 0);

  // Initialize debt tracking with cloned data and security bounds
  const debts = debtArray.map(d => {
    // Validate category against whitelist
    const sanitizedCategory = VALID_CATEGORIES.includes(d.category) ? d.category : 'OTHER';
    // Clamp balance to safe maximum
    const clampedBalance = Math.max(0, Math.min(MAX_SAFE_BALANCE, Number(d.balance) || 0));

    return {
      category: sanitizedCategory,
      label: d.label || sanitizedCategory || 'Debt',
      originalBalance: clampedBalance,
      remainingBalance: clampedBalance,
      interestRate: Math.max(0, Math.min(100, Number(d.interestRate) || 0)),
      termMonths: Math.max(1, Number(d.termMonths) || 60),
      totalInterestPaid: 0,
      monthlyPayment: 0
    };
  });

  // Calculate minimum payments for each debt
  debts.forEach(debt => {
    debt.monthlyPayment = calculateDebtMinPayment({
      balance: debt.originalBalance,
      interestRate: debt.interestRate,
      termMonths: debt.termMonths
    });
  });

  const timeline = [];
  let month = 0;
  let totalInterestPaid = 0;
  const paidOffMilestones = [];
  const maxMonths = 600; // Safety limit: 50 years

  // Run simulation until all debts paid or max reached
  while (debts.some(d => d.remainingBalance > 0.01) && month < maxMonths) {
    month++;

    // Total cash available for debt payments this month
    // (extraCash = take-home minus living expenses)
    let availableCash = extraCash;

    // STEP 1: Apply minimum payments to ALL debts first
    // This ensures all debts receive at least their minimum payment each month
    for (let i = 0; i < debts.length; i++) {
      const debt = debts[i];
      if (debt.remainingBalance <= 0.01) continue;

      // Calculate monthly interest
      const monthlyInterest = (debt.remainingBalance * (debt.interestRate / 100)) / 12;

      // Apply minimum payment (or remaining balance if less, or available cash if less)
      const minPayment = Math.min(debt.monthlyPayment, debt.remainingBalance + monthlyInterest, availableCash);

      // Apply payment - interest first, then principal
      const interestPayment = Math.min(monthlyInterest, minPayment);
      const principalPayment = Math.max(0, minPayment - interestPayment);

      debt.totalInterestPaid += interestPayment;
      totalInterestPaid += interestPayment;
      debt.remainingBalance = Math.max(0, debt.remainingBalance - principalPayment);

      // Subtract from available cash
      availableCash -= minPayment;
    }

    // STEP 2: Apply remaining cash to the TARGET debt (first debt with balance in priority order)
    // This is where avalanche vs snowball differ - the priority order determines which debt gets extra
    for (let i = 0; i < debts.length; i++) {
      const debt = debts[i];
      if (debt.remainingBalance <= 0.01 || availableCash <= 0) continue;

      // Apply extra payment to this debt (the highest priority one with balance)
      const extraPayment = Math.min(availableCash, debt.remainingBalance);
      debt.remainingBalance = Math.max(0, debt.remainingBalance - extraPayment);
      availableCash -= extraPayment;

      // Only apply extra to the first debt with balance (the target)
      break;
    }

    // STEP 3: Check for newly paid off debts
    for (let i = 0; i < debts.length; i++) {
      const debt = debts[i];
      if (debt.remainingBalance <= 0.01 && !paidOffMilestones.some(m => m.debtName === debt.category)) {
        paidOffMilestones.push({
          month: month,
          debtName: debt.category,
          debtLabel: debt.label,
          balance: debt.originalBalance,
          freedMonthlyPayment: debt.monthlyPayment,
        });
      }
    }

    // Record this month's snapshot
    timeline.push({
      month: month,
      debts: debts.map(d => ({
        category: d.category,
        label: d.label,
        remainingBalance: Math.max(0, d.remainingBalance),
        interestPaid: d.totalInterestPaid
      })),
      totalRemaining: debts.reduce((sum, d) => sum + Math.max(0, d.remainingBalance), 0)
    });
  }

  // Calculate debt-free date
  const now = new Date();
  const debtFreeDate = new Date(now.getFullYear(), now.getMonth() + month, now.getDate());

  return {
    method: method,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    monthsToPayoff: month,
    debtFreeDate: debtFreeDate,
    timeline: timeline,
    paidOffMilestones: paidOffMilestones,
    finalDebts: debts,
    reachedMaxMonths: month >= maxMonths
  };
}

/**
 * Compare avalanche and snowball methods
 * @param {Array} debts - Array of debt objects from store
 * @param {number} monthlyExtraCashFlow - Extra cash for debt payoff
 * @returns {Object|null} Comparison results or null if comparison not applicable
 */
function compareDebtStrategies(debts, monthlyExtraCashFlow) {
  // Validate inputs
  if (!debts || !Array.isArray(debts)) {
    return null;
  }

  // Filter active debts with positive balances
  const activeDebts = debts.filter(d => d && d.balance > 0);

  // Need at least 1 debt
  if (activeDebts.length === 0) {
    return null;
  }

  // Single debt: both methods produce identical results
  if (activeDebts.length === 1) {
    const cashFlow = Math.max(0, Number(monthlyExtraCashFlow) || 0);
    const single = calculateAvalanche(activeDebts, cashFlow);
    return {
      avalanche: single,
      snowball: single,
      comparison: {
        interestSavings: 0,
        monthsSaved: 0,
        recommendation: 'avalanche',
        reason: 'With a single debt, both methods produce identical results.',
        activeDebtCount: 1,
        totalDebt: activeDebts[0].balance,
      }
    };
  }

  // Ensure positive cash flow
  const cashFlow = Math.max(0, Number(monthlyExtraCashFlow) || 0);

  // Run both simulations
  const avalanche = calculateAvalanche(activeDebts, cashFlow);
  const snowball = calculateSnowball(activeDebts, cashFlow);

  // Calculate differences
  const interestSavings = Math.round((snowball.totalInterestPaid - avalanche.totalInterestPaid) * 100) / 100;
  const monthsSaved = snowball.monthsToPayoff - avalanche.monthsToPayoff;

  // Determine recommendation based on interest savings and debt profile
  let recommendation = 'avalanche';
  let reason = '';

  if (interestSavings > 1000) {
    recommendation = 'avalanche';
    reason = `This approach could potentially save approximately $${interestSavings.toLocaleString()} in interest charges compared to the snowball method.`;
  } else if (interestSavings < 100) {
    recommendation = 'snowball';
    reason = 'With minimal interest difference between methods, some people find that the psychological wins from paying off smaller debts first help maintain motivation.';
  } else {
    // Check for high-interest debt (above 15%)
    const hasHighInterestDebt = activeDebts.some(d => d.interestRate > 15);
    if (hasHighInterestDebt) {
      recommendation = 'avalanche';
      reason = 'With high-interest debt present, addressing higher rates first may help reduce total interest paid over time.';
    } else {
      recommendation = 'snowball';
      reason = 'Some people find that building momentum with quick wins helps maintain motivation throughout the debt payoff journey.';
    }
  }

  return {
    avalanche: avalanche,
    snowball: snowball,
    comparison: {
      interestSavings: interestSavings,
      monthsSaved: monthsSaved,
      recommendation: recommendation,
      reason: reason,
      activeDebtCount: activeDebts.length,
      totalDebt: activeDebts.reduce((sum, d) => sum + d.balance, 0)
    }
  };
}

/**
 * Calculate annual interest and principal payment breakdown for a specific debt
 * @param {Object} debt - Debt object with balance, interestRate, termMonths
 * @returns {Object} { monthlyPayment, annualInterest, annualPrincipal }
 */
function calculateDebtAnnualBreakdown(debt) {
  if (!debt || debt.balance <= 0) {
    return { monthlyPayment: 0, annualInterest: 0, annualPrincipal: 0 };
  }

  const monthlyPayment = calculateDebtMinPayment(debt);
  const monthlyInterest = calculateInterestPortion(debt.balance, debt.interestRate);
  const monthlyPrincipal = calculatePrincipalPortion(monthlyPayment, monthlyInterest);

  return {
    monthlyPayment: monthlyPayment,
    annualInterest: monthlyInterest * 12,
    annualPrincipal: monthlyPrincipal * 12,
  };
}

// Expose functions globally
window.calculateAvalanche = calculateAvalanche;
window.calculateSnowball = calculateSnowball;
window.compareDebtStrategies = compareDebtStrategies;
window.calculateDebtMinPayment = calculateDebtMinPayment;
window.calculateDebtAnnualBreakdown = calculateDebtAnnualBreakdown;
