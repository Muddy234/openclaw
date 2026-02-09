/**
 * constants.js
 * Default values, debt categories, and FIRE step definitions
 */

// PMT formula - calculates monthly payment for a loan (like Excel's PMT function)
// Returns the fixed monthly payment required to fully amortize a loan
// pv = present value (loan balance)
// rate = annual interest rate (as percentage, e.g., 7 for 7%)
// nper = number of periods (months)
function calculateMonthlyPayment(pv, rate, nper) {
  if (pv <= 0 || nper <= 0) return 0;
  if (rate <= 0) return pv / nper; // 0% interest = simple division

  const monthlyRate = (rate / 100) / 12;
  // PMT = PV * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const payment = pv * (monthlyRate * Math.pow(1 + monthlyRate, nper)) / (Math.pow(1 + monthlyRate, nper) - 1);
  return payment;
}

// Calculate interest portion of a payment given current balance and rate
function calculateInterestPortion(balance, rate) {
  if (balance <= 0 || rate <= 0) return 0;
  return balance * (rate / 100) / 12;
}

// Calculate principal portion of a payment
function calculatePrincipalPortion(payment, interestPortion) {
  return Math.max(0, payment - interestPortion);
}

// Default debt entries (fixed 6 categories)
// termMonths: remaining months until debt is paid off (used for amortization)
// minPayment: calculated monthly payment based on balance, rate, and term
const DEFAULT_DEBTS = [
  { category: 'CREDIT_CARD', label: 'Credit Card', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 },
  { category: 'MEDICAL', label: 'Medical', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 },
  { category: 'STUDENT', label: 'Student', balance: 0, interestRate: 0, termMonths: 120, minPayment: 0 },
  { category: 'AUTO', label: 'Car', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 },
  { category: 'MORTGAGE', label: 'Mortgage', balance: 0, interestRate: 0, termMonths: 360, minPayment: 0 },
  { category: 'OTHER', label: 'Other', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 },
];

// FIRE Strategy Rankings (linear progression)
// Lower numbers = higher priority
const FIRE_RANKINGS = {
  BUDGET_ESSENTIALS: 1,
  STARTER_EMERGENCY_FUND: 2,
  EMPLOYER_MATCH: 3,
  HIGH_INTEREST_DEBT: 4,
  HSA_ROTH: 5,
  FULL_EMERGENCY_FUND: 6,
  MODERATE_INTEREST_DEBT: 7,
  MAX_RETIREMENT: 8,
  TAXABLE_INVESTING: 9,
  LOW_INTEREST_DEBT: 10,
};

// Step metadata for display
const STEP_METADATA = {
  BUDGET_ESSENTIALS: {
    title: 'Cover Your Essentials',
    description: 'Cover basic survival costs before any investing - food, utilities, shelter, transportation.',
  },
  STARTER_EMERGENCY_FUND: {
    title: 'Starter Emergency Fund',
    description: 'Save 1 month of living expenses as a buffer against unexpected costs.',
  },
  EMPLOYER_MATCH: {
    title: 'Get Your Employer Match',
    description: "Contribute enough to get 100% of the employer 401k match - it's free money.",
  },
  HIGH_INTEREST_DEBT: {
    title: 'Eliminate High-Interest Debt',
    description: 'Destroy any debt with interest rate above 7% (toxic debt) using the avalanche method.',
  },
  HSA_ROTH: {
    title: 'Max HSA & Roth IRA',
    description: 'Max out your HSA (triple tax advantage) and Roth IRA for tax-free growth.',
  },
  FULL_EMERGENCY_FUND: {
    title: 'Full Emergency Fund',
    description: 'Build 3-6 months of liquid cash reserves (adjust based on job stability).',
  },
  MODERATE_INTEREST_DEBT: {
    title: 'Moderate Interest Debt',
    description: 'Optional: Pay off 4-7% debt only if it helps you sleep at night.',
  },
  MAX_RETIREMENT: {
    title: 'Max All Retirement Accounts',
    description: 'Maximize all tax-advantaged retirement space (401k, 403b, etc.).',
  },
  TAXABLE_INVESTING: {
    title: 'Taxable Brokerage Investing',
    description: 'Hyper-accumulate in taxable accounts for early retirement bridge.',
  },
  LOW_INTEREST_DEBT: {
    title: 'Low-Interest Debt',
    description: 'Never pay extra on debt below 4% - invest the difference instead.',
  },
};

// Create default snapshot
function createDefaultSnapshot() {
  return {
    general: {
      age: 30,
      targetRetirement: 45,
      annualIncome: 0,
      monthlyTakeHome: 0,
      monthlyExpense: 0,
      msa: '',
    },
    investments: {
      savings: 0,
      ira: 0,
      rothIra: 0,
      stocksBonds: 0,
      fourOhOneK: 0,
      realEstate: 0,
      carValue: 0,
      other: 0,
    },
    debts: DEFAULT_DEBTS.map(d => ({ ...d })), // Clone to avoid mutation
    // Debt paydown settings
    debtSettings: {
      aggressiveness: 100,              // 0-100, percentage of surplus cash flow for extra debt payments
      preferredStrategy: 'avalanche',   // 'avalanche' | 'snowball'
    },
    // Tax Destiny settings (Choose Your Destiny tab)
    taxDestiny: {
      filingStatus: 'single',       // 'single' | 'married' | 'head_of_household'
      hsaCoverage: 'individual',    // 'individual' | 'family' | 'none'
      // Monthly contribution allocations (user-controlled)
      allocations: {
        fourOhOneK: 0,              // Monthly 401k contribution
        hsa: 0,                     // Monthly HSA contribution
        traditionalIra: 0,          // Monthly Traditional IRA
        rothIra: 0,                 // Monthly Roth IRA
        five29: 0,                  // Monthly 529 plan
      },
      // Annual strategy amounts
      strategies: {
        charitableAnnual: 0,        // Annual charitable giving
        taxLossHarvest: 0,          // Estimated harvestable losses
      },
      // Advanced strategy toggles (informational, affects display)
      advanced: {
        backdoorRoth: false,        // Using backdoor Roth strategy
        megaBackdoorRoth: false,    // Using mega backdoor (employer plan allows)
        rothConversionLadder: false,// Planning Roth conversion ladder in retirement
      },
    },
    // FIRE Journey box settings
    fireSettings: {
      // Box 3: Employer Match (HSA and 401k)
      // HSA employer match
      hasHsaMatch: false,
      hsaMatchPercent: 4, // Default 4% of salary
      isGettingHsaMatch: false, // Already contributing via payroll
      // 401k employer match
      has401kMatch: false,
      fourOhOneKMatchPercent: 4, // Default 4% of salary
      isGetting401kMatch: false, // Already contributing via payroll
      // Box 5: HSA & Roth IRA (additional contributions beyond payroll)
      // Note: If getting HSA match via payroll, that amount is tracked separately
      // Box 6: Full Emergency Fund
      emergencyFundMonths: 6, // Toggle between 3 or 6
      // FIRE annual expense target (0 = use current monthly expenses * 12)
      fireAnnualExpenseTarget: 0,
      // Flexible box allocations (user-controlled monthly amounts)
      // null = use all remaining, 0 = minimum only, number = specific extra amount
      allocations: {
        highInterestDebt: null, // null = all remaining (aggressive paydown)
        hsaIra: null, // null = max annual limits
        moderateDebt: null, // null = all remaining (aggressive paydown)
        max401k: null, // null = max annual limits
        taxableInvesting: null, // null = all remaining (always last)
      },
    },
    // Expense category breakdown (monthly amounts for budget analysis)
    expenseCategories: {
      housing: 0,
      food: 0,
      transportation: 0,
      utilities: 0,
      healthcare: 0,
      insurance: 0,
      entertainment: 0,
      personal: 0,
      education: 0,
      other: 0,
    },
  };
}

// Expose functions globally
window.calculateMonthlyPayment = calculateMonthlyPayment;
window.calculateInterestPortion = calculateInterestPortion;
window.calculatePrincipalPortion = calculatePrincipalPortion;
window.createDefaultSnapshot = createDefaultSnapshot;
window.DEFAULT_DEBTS = DEFAULT_DEBTS;
window.FIRE_RANKINGS = FIRE_RANKINGS;
window.STEP_METADATA = STEP_METADATA;
