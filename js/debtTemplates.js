/**
 * debtTemplates.js
 * Predefined debt templates and estimation helpers for simplified debt input
 */

// ===========================
// DEBT TEMPLATES & HELPERS
// ===========================

/**
 * Predefined debt templates with common defaults
 * @type {Object}
 */
const DEBT_TEMPLATES = {
  CREDIT_CARD: {
    category: 'CREDIT_CARD',
    name: 'Credit Card',
    icon: '💳',
    defaultRate: 18.5,
    defaultTerm: 60,
    rateRange: { min: 14, max: 29.99 },
    termRange: { min: 12, max: 120 },
    description: 'Credit card balance',
    tips: [
      'Look for APR on your statement (typically 14-25%)',
      'Default payoff plan: 5 years (60 months)',
      'Balance is on front of statement'
    ]
  },
  STUDENT: {
    category: 'STUDENT',
    name: 'Student Loan',
    icon: '🎓',
    defaultRate: 5.5,
    defaultTerm: 120,
    rateRange: { min: 2.5, max: 12 },
    termRange: { min: 60, max: 360 },
    description: 'Federal or private student loans',
    tips: [
      'Federal loans: typically 3-7% APR',
      'Private loans: typically 5-12% APR',
      'Standard repayment: 10 years (120 months)'
    ]
  },
  AUTO: {
    category: 'AUTO',
    name: 'Auto Loan',
    icon: '🚗',
    defaultRate: 6.5,
    defaultTerm: 60,
    rateRange: { min: 2, max: 15 },
    termRange: { min: 24, max: 84 },
    description: 'Car loan or lease',
    tips: [
      'New car loans: typically 3-6% APR',
      'Used car loans: typically 5-10% APR',
      'Common terms: 48, 60, or 72 months'
    ]
  },
  MORTGAGE: {
    category: 'MORTGAGE',
    name: 'Mortgage',
    icon: '🏠',
    defaultRate: 7.0,
    defaultTerm: 360,
    rateRange: { min: 3, max: 10 },
    termRange: { min: 180, max: 360 },
    description: 'Home mortgage or HELOC',
    tips: [
      'Fixed-rate mortgages: typically 6-8% (as of 2025)',
      'Standard term: 30 years (360 months)',
      'Check your mortgage statement for exact rate'
    ]
  },
  MEDICAL: {
    category: 'MEDICAL',
    name: 'Medical Debt',
    icon: '🏥',
    defaultRate: 0,
    defaultTerm: 36,
    rateRange: { min: 0, max: 10 },
    termRange: { min: 12, max: 60 },
    description: 'Medical bills or payment plans',
    tips: [
      'Many medical payment plans are 0% interest',
      'Hospital plans: usually 12-36 months',
      'Consider negotiating before agreeing to terms'
    ]
  },
  PERSONAL: {
    category: 'OTHER',
    name: 'Personal Loan',
    icon: '💵',
    defaultRate: 10.0,
    defaultTerm: 36,
    rateRange: { min: 5, max: 25 },
    termRange: { min: 12, max: 60 },
    description: 'Personal loan or other debt',
    tips: [
      'Personal loans: typically 6-15% APR (depending on credit)',
      'Common terms: 24, 36, or 48 months',
      'High-interest options (payday loans) should be avoided'
    ]
  }
};

/**
 * Create a debt object from template
 * @param {string} templateKey - Template identifier
 * @param {number} balance - Debt balance
 * @param {number} rate - Interest rate (optional, uses default if not provided)
 * @param {number} term - Term in months (optional, uses default if not provided)
 * @returns {Object} Debt object
 */
function createDebtFromTemplate(templateKey, balance, rate = null, term = null) {
  const template = DEBT_TEMPLATES[templateKey];

  if (!template) {
    throw new Error('Unknown debt template: ' + templateKey);
  }

  return {
    category: template.category,
    label: template.name,
    balance: balance,
    interestRate: rate !== null ? rate : template.defaultRate,
    termMonths: term !== null ? term : template.defaultTerm,
    minPayment: 0
  };
}

/**
 * Parse debt information from pasted statement text
 * Uses regex to extract balance and interest rate
 * @param {string} text - Pasted statement text
 * @returns {Object|null} { balance, rate } or null if not found
 */
function parseDebtFromStatement(text) {
  // Sanitize input - remove potentially dangerous characters
  const sanitized = String(text || '').substring(0, 5000);

  const result = {
    balance: null,
    rate: null
  };

  // Try to find balance
  // Patterns: "$1,234.56", "$1234", "Balance: 1,234.56"
  const balancePatterns = [
    /(?:balance|amount\s+owed|current\s+balance)[\s:$]*([0-9,]+\.?\d{0,2})/i,
    /\$([0-9,]+\.?\d{0,2})/
  ];

  for (const pattern of balancePatterns) {
    const match = sanitized.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
        result.balance = parsed;
        break;
      }
    }
  }

  // Try to find interest rate
  // Patterns: "18.5%", "APR: 18.5", "Interest Rate 18.5%"
  const ratePatterns = [
    /(?:apr|interest\s+rate|rate)[\s:]*(\d+\.?\d{0,2})%?/i,
    /(\d+\.?\d{0,2})%/
  ];

  for (const pattern of ratePatterns) {
    const match = sanitized.match(pattern);
    if (match) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
        result.rate = parsed;
        break;
      }
    }
  }

  return result.balance || result.rate ? result : null;
}

/**
 * Estimate reasonable term based on balance and debt type
 * @param {string} category - Debt category
 * @param {number} balance - Debt balance
 * @returns {number} Estimated term in months
 */
function estimateTerm(category, balance) {
  const template = DEBT_TEMPLATES[category];
  if (!template) {
    return 60; // Default 5 years
  }

  // For credit cards, estimate based on balance
  if (category === 'CREDIT_CARD') {
    if (balance < 2000) return 24;      // 2 years
    if (balance < 5000) return 36;      // 3 years
    if (balance < 10000) return 60;     // 5 years
    return 84;                           // 7 years
  }

  // For student loans, estimate based on balance
  if (category === 'STUDENT') {
    if (balance < 10000) return 60;     // 5 years
    if (balance < 30000) return 120;    // 10 years
    return 180;                          // 15 years
  }

  // For auto loans, estimate based on balance
  if (category === 'AUTO') {
    if (balance < 15000) return 48;     // 4 years
    if (balance < 30000) return 60;     // 5 years
    return 72;                           // 6 years
  }

  // Otherwise use template default
  return template.defaultTerm;
}

/**
 * Validate debt inputs and provide warnings
 * @param {Object} debt - Debt object
 * @returns {Object} { valid, warnings, errors }
 */
function validateDebtInput(debt) {
  const template = DEBT_TEMPLATES[debt.category] || DEBT_TEMPLATES.PERSONAL;
  const result = {
    valid: true,
    warnings: [],
    errors: []
  };

  // Check balance
  if (typeof debt.balance !== 'number' || debt.balance <= 0) {
    result.errors.push('Balance must be greater than $0');
    result.valid = false;
  }

  if (debt.balance > 1000000) {
    result.warnings.push('Balance seems unusually high. Please verify.');
  }

  // Check interest rate
  if (typeof debt.interestRate !== 'number' || debt.interestRate < 0 || debt.interestRate > 50) {
    result.errors.push('Interest rate must be between 0% and 50%');
    result.valid = false;
  }

  if (template && debt.interestRate > template.rateRange.max) {
    result.warnings.push(
      'Interest rate (' + debt.interestRate + '%) is higher than typical market rates for ' + template.name + ' (usually up to ' + template.rateRange.max + '%). This does not mean your rate is incorrect - please verify your rate on your most recent statement.'
    );
  }

  // Check term
  if (typeof debt.termMonths !== 'number' || debt.termMonths < 1 || debt.termMonths > 600) {
    result.errors.push('Term must be between 1 and 600 months');
    result.valid = false;
  }

  if (template && debt.termMonths > template.termRange.max) {
    result.warnings.push(
      'Term (' + debt.termMonths + ' months) is longer than typical for ' + template.name + '. Consider refinancing.'
    );
  }

  return result;
}

// Expose functions globally
window.DEBT_TEMPLATES = DEBT_TEMPLATES;
window.createDebtFromTemplate = createDebtFromTemplate;
window.parseDebtFromStatement = parseDebtFromStatement;
window.estimateTerm = estimateTerm;
window.validateDebtInput = validateDebtInput;
