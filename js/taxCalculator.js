/**
 * taxCalculator.js
 * Tax calculation engine and optimization recommendations
 *
 * DISCLAIMER: This provides educational guidance only, not tax advice.
 * Users should consult a qualified tax professional for their specific situation.
 */

// ===========================
// 2025 FEDERAL TAX BRACKETS
// ===========================

const TAX_BRACKETS_2025 = {
  single: [
    { rate: 0.10, min: 0, max: 11600 },
    { rate: 0.12, min: 11600, max: 47150 },
    { rate: 0.22, min: 47150, max: 100525 },
    { rate: 0.24, min: 100525, max: 191950 },
    { rate: 0.32, min: 191950, max: 243725 },
    { rate: 0.35, min: 243725, max: 609350 },
    { rate: 0.37, min: 609350, max: Infinity }
  ],
  married: [
    { rate: 0.10, min: 0, max: 23200 },
    { rate: 0.12, min: 23200, max: 94300 },
    { rate: 0.22, min: 94300, max: 201050 },
    { rate: 0.24, min: 201050, max: 383900 },
    { rate: 0.32, min: 383900, max: 487450 },
    { rate: 0.35, min: 487450, max: 731200 },
    { rate: 0.37, min: 731200, max: Infinity }
  ],
  head_of_household: [
    { rate: 0.10, min: 0, max: 16550 },
    { rate: 0.12, min: 16550, max: 63100 },
    { rate: 0.22, min: 63100, max: 100500 },
    { rate: 0.24, min: 100500, max: 191950 },
    { rate: 0.32, min: 191950, max: 243700 },
    { rate: 0.35, min: 243700, max: 609350 },
    { rate: 0.37, min: 609350, max: Infinity }
  ]
};

// Standard deductions for 2025
const STANDARD_DEDUCTION_2025 = {
  single: 14600,
  married: 29200,
  head_of_household: 21900
};

// Contribution limits for 2025
const CONTRIBUTION_LIMITS_2025 = {
  '401k': 23500,
  'ira': 7000,
  'hsa_individual': 4300,
  'hsa_family': 8550,
  'catch_up_50_401k': 7500,
  'catch_up_50_ira': 1000,
  'catch_up_50_hsa': 1000
};

// Roth IRA income limits for 2025
const ROTH_IRA_LIMITS_2025 = {
  single: { phaseout_start: 150000, phaseout_end: 165000 },
  married: { phaseout_start: 236000, phaseout_end: 246000 },
  head_of_household: { phaseout_start: 150000, phaseout_end: 165000 }
};

/**
 * Calculate federal income tax using progressive brackets
 * @param {number} taxableIncome - Annual taxable income after deductions
 * @param {string} filingStatus - 'single', 'married', 'head_of_household'
 * @returns {Object} { tax, effectiveRate, marginalRate, bracketInfo }
 */
function calculateFederalTax(taxableIncome, filingStatus) {
  const status = filingStatus || 'single';
  const brackets = TAX_BRACKETS_2025[status] || TAX_BRACKETS_2025.single;

  if (taxableIncome <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      marginalRate: brackets[0].rate,
      bracketInfo: brackets[0]
    };
  }

  let totalTax = 0;
  let marginalRate = 0;
  let currentBracket = null;

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const incomeInBracket = Math.min(
      Math.max(taxableIncome - bracket.min, 0),
      bracket.max - bracket.min
    );

    if (incomeInBracket > 0) {
      totalTax += incomeInBracket * bracket.rate;
      marginalRate = bracket.rate;
      currentBracket = bracket;
    }

    if (taxableIncome <= bracket.max) {
      break;
    }
  }

  const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) : 0;

  return {
    tax: Math.round(totalTax * 100) / 100,
    effectiveRate: effectiveRate,
    marginalRate: marginalRate,
    bracketInfo: currentBracket
  };
}

/**
 * Estimate state income tax based on MSA location
 * @param {number} income - Annual taxable income
 * @param {string} msa - MSA/city string (e.g., "Denver, CO")
 * @returns {Object} { tax, rate, state, stateName, note, isEstimate }
 */
function estimateStateTax(income, msa) {
  // Use MSA-based calculation if stateTaxRates.js is loaded
  if (typeof calculateStateTaxFromMsa === 'function') {
    return calculateStateTaxFromMsa(income, msa);
  }

  // Fallback: Legacy behavior with average estimate
  const averageStateRate = 0.05;
  const stateTax = income > 0 ? income * averageStateRate : 0;

  return {
    tax: Math.round(stateTax * 100) / 100,
    rate: averageStateRate,
    state: null,
    stateName: null,
    note: 'Using 5% national average estimate.',
    isEstimate: true
  };
}

/**
 * Calculate comprehensive tax analysis for a user
 * @param {Object} snapshot - Financial snapshot from store
 * @returns {Object} Complete tax analysis with recommendations
 */
function analyzeTaxSituation(snapshot) {
  if (!snapshot || !snapshot.general) {
    return null;
  }

  const annualIncome = snapshot.general.annualIncome || 0;
  const age = snapshot.general.age || 30;
  const filingStatus = snapshot.general.filingStatus || 'single';

  // Skip analysis if no income
  if (annualIncome <= 0) {
    return null;
  }

  // Get standard deduction
  const standardDeduction = STANDARD_DEDUCTION_2025[filingStatus] || STANDARD_DEDUCTION_2025.single;

  // Estimate current pre-tax contributions
  const monthlyGross = annualIncome / 12;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || monthlyGross * 0.7;

  // FICA taxes
  const socialSecurityMax = 168600;
  const socialSecurityTax = Math.min(annualIncome, socialSecurityMax) * 0.062;
  const medicareTax = annualIncome * 0.0145;
  const ficaTax = socialSecurityTax + medicareTax;

  // Estimate pre-tax contributions from difference
  const annualTakeHome = monthlyTakeHome * 12;
  const estimatedPreTaxContributions = Math.max(0,
    annualIncome - annualTakeHome - ficaTax - (annualIncome * 0.15)
  );

  // Calculate taxable income
  const taxableIncome = Math.max(0, annualIncome - standardDeduction - estimatedPreTaxContributions);

  // Calculate federal tax
  const federalTax = calculateFederalTax(taxableIncome, filingStatus);

  // Calculate state tax based on MSA
  const msa = snapshot.general.msa || '';
  const stateTax = estimateStateTax(taxableIncome, msa);

  // Build current situation summary
  const currentSituation = {
    grossIncome: annualIncome,
    standardDeduction: standardDeduction,
    estimatedPreTaxContributions: estimatedPreTaxContributions,
    taxableIncome: taxableIncome,
    federalTax: federalTax.tax,
    stateTax: stateTax.tax,
    stateTaxRate: stateTax.rate,
    stateAbbr: stateTax.state,
    stateName: stateTax.stateName,
    stateTaxNote: stateTax.note,
    stateTaxType: stateTax.type,
    stateTaxBrackets: stateTax.brackets,
    stateTaxIsEstimate: stateTax.isEstimate,
    ficaTax: ficaTax,
    totalTax: federalTax.tax + stateTax.tax + ficaTax,
    effectiveRate: annualIncome > 0 ? (federalTax.tax + stateTax.tax) / annualIncome : 0,
    marginalRate: federalTax.marginalRate,
    filingStatus: filingStatus
  };

  // Generate personalized recommendations
  const recommendations = generateTaxRecommendations(snapshot, currentSituation, age);

  // Calculate total potential savings
  const totalPotentialSavings = recommendations
    .filter(r => r.taxSavings && r.taxSavings > 0)
    .reduce((sum, r) => sum + r.taxSavings, 0);

  return {
    current: currentSituation,
    recommendations: recommendations,
    totalPotentialSavings: totalPotentialSavings,
    contributionLimits: CONTRIBUTION_LIMITS_2025,
    standardDeduction: standardDeduction
  };
}

/**
 * Generate personalized tax optimization recommendations
 * @param {Object} snapshot - Financial snapshot
 * @param {Object} currentTax - Current tax situation
 * @param {number} age - User's age
 * @returns {Array} Array of recommendation objects
 */
function generateTaxRecommendations(snapshot, currentTax, age) {
  const recommendations = [];
  const annualIncome = currentTax.grossIncome;
  const marginalRate = currentTax.marginalRate;
  const filingStatus = currentTax.filingStatus || 'single';

  // Determine if catch-up contributions apply
  const catchUpEligible = age >= 50;

  // 1. 401(k) Recommendation
  const max401k = catchUpEligible
    ? CONTRIBUTION_LIMITS_2025['401k'] + CONTRIBUTION_LIMITS_2025['catch_up_50_401k']
    : CONTRIBUTION_LIMITS_2025['401k'];

  const estimated401kContribution = currentTax.estimatedPreTaxContributions * 0.8;
  const additional401kRoom = Math.max(0, max401k - estimated401kContribution);

  if (additional401kRoom > 500) {
    const taxSavings = additional401kRoom * marginalRate;
    const monthlyIncrease = additional401kRoom / 12;

    recommendations.push({
      id: '401k',
      priority: 'high',
      category: '401(k)',
      title: 'Maximize 401(k) Contributions',
      description: `You can contribute up to $${max401k.toLocaleString()} in 2025${catchUpEligible ? ' (includes $7,500 catch-up)' : ''}. Increasing contributions may reduce your taxable income, subject to IRS rules and contribution limits.`,
      action: `Increase 401(k) contribution by $${Math.round(monthlyIncrease).toLocaleString()}/month`,
      taxSavings: Math.round(taxSavings),
      netCost: Math.round(additional401kRoom - taxSavings),
      limit: max401k
    });
  }

  // 2. IRA Recommendation
  const maxIRA = catchUpEligible
    ? CONTRIBUTION_LIMITS_2025['ira'] + CONTRIBUTION_LIMITS_2025['catch_up_50_ira']
    : CONTRIBUTION_LIMITS_2025['ira'];

  const rothLimits = ROTH_IRA_LIMITS_2025[filingStatus] || ROTH_IRA_LIMITS_2025.single;
  const rothEligible = annualIncome < rothLimits.phaseout_end;
  const rothPartial = annualIncome >= rothLimits.phaseout_start && annualIncome < rothLimits.phaseout_end;

  const recommendTraditional = marginalRate >= 0.22;

  if (rothEligible || recommendTraditional) {
    const iraType = recommendTraditional ? 'Traditional' : 'Roth';
    const iraTaxSavings = iraType === 'Traditional' ? Math.round(maxIRA * marginalRate) : 0;

    let iraDescription = '';
    if (iraType === 'Traditional') {
      iraDescription = `At your ${Math.round(marginalRate * 100)}% marginal rate, a Traditional IRA may provide immediate tax savings. Contributions may reduce taxable income now, subject to IRS rules.`;
    } else if (rothPartial) {
      iraDescription = `Your income is in the Roth IRA phaseout range. You may be able to contribute a reduced amount. Some investors explore Backdoor Roth IRA strategies - consult a tax professional to determine if this is suitable for you.`;
    } else {
      iraDescription = `A Roth IRA offers tax-free growth and withdrawals in retirement. At your current bracket, tax-free growth may be beneficial for long-term savings.`;
    }

    recommendations.push({
      id: 'ira',
      priority: 'high',
      category: 'IRA',
      title: `Contribute to ${iraType} IRA`,
      description: iraDescription,
      action: `Contribute $${Math.round(maxIRA / 12).toLocaleString()}/month ($${maxIRA.toLocaleString()}/year)`,
      taxSavings: iraTaxSavings,
      netCost: iraTaxSavings > 0 ? Math.round(maxIRA - iraTaxSavings) : maxIRA,
      limit: maxIRA,
      note: iraType === 'Traditional'
        ? 'Deductibility may be limited if you have a workplace retirement plan'
        : rothPartial ? 'Contribution limit may be reduced due to income' : null
    });
  }

  // 3. HSA Recommendation
  const hsaMax = catchUpEligible
    ? CONTRIBUTION_LIMITS_2025['hsa_individual'] + CONTRIBUTION_LIMITS_2025['catch_up_50_hsa']
    : CONTRIBUTION_LIMITS_2025['hsa_individual'];

  const hsaTaxSavings = Math.round(hsaMax * marginalRate);

  recommendations.push({
    id: 'hsa',
    priority: 'high',
    category: 'HSA',
    title: 'Maximize HSA Contributions',
    description: 'The HSA offers a triple tax advantage: tax-deductible contributions, tax-free growth, and tax-free withdrawals for qualified medical expenses. Many financial professionals consider HSAs among the most tax-efficient accounts available.',
    action: `Contribute $${Math.round(hsaMax / 12).toLocaleString()}/month to HSA`,
    taxSavings: hsaTaxSavings,
    netCost: Math.round(hsaMax - hsaTaxSavings),
    limit: hsaMax,
    note: 'Requires enrollment in a High Deductible Health Plan (HDHP). Check with your employer for eligibility.',
    eligibilityRequired: true
  });

  // 4. Tax-Loss Harvesting
  const taxableInvestments = (snapshot.investments.stocksBonds || 0);

  if (taxableInvestments > 25000) {
    recommendations.push({
      id: 'tax_loss_harvest',
      priority: 'medium',
      category: 'Investing',
      title: 'Consider Tax-Loss Harvesting',
      description: 'With taxable investments, you can sell positions at a loss to offset capital gains. Up to $3,000 in net losses can offset ordinary income annually.',
      action: 'Review portfolio for unrealized losses before year-end',
      taxSavings: null,
      note: 'Potential savings vary based on your portfolio. Be aware of wash sale rules.'
    });
  }

  // 5. Charitable Giving Strategy
  if (annualIncome > 100000) {
    recommendations.push({
      id: 'charitable',
      priority: 'medium',
      category: 'Deductions',
      title: 'Bunch Charitable Donations',
      description: 'If you regularly give to charity, consider "bunching" multiple years of donations into one year to exceed the standard deduction and itemize.',
      action: 'Consider a donor-advised fund to bunch donations strategically',
      taxSavings: null,
      note: 'Works best if your typical itemized deductions are close to the standard deduction'
    });
  }

  // 6. Review Withholding
  recommendations.push({
    id: 'withholding',
    priority: 'low',
    category: 'Planning',
    title: 'Review Your Tax Withholding',
    description: 'Ensure your W-4 is set correctly to avoid a large refund (interest-free loan to government) or an unexpected tax bill.',
    action: 'Use IRS Tax Withholding Estimator to check your W-4',
    taxSavings: null,
    note: 'Adjust if you had a major life change (marriage, new job, new home)'
  });

  return recommendations;
}

/**
 * Calculate tax impact of a specific contribution
 * @param {number} currentIncome - Current annual income
 * @param {number} contribution - Pre-tax contribution amount
 * @param {string} filingStatus - Filing status
 * @returns {Object} Tax comparison before/after
 */
function calculateContributionImpact(currentIncome, contribution, filingStatus) {
  const status = filingStatus || 'single';
  const standardDeduction = STANDARD_DEDUCTION_2025[status];

  const taxableIncomeBefore = Math.max(0, currentIncome - standardDeduction);
  const taxableIncomeAfter = Math.max(0, currentIncome - standardDeduction - contribution);

  const beforeTax = calculateFederalTax(taxableIncomeBefore, status);
  const afterTax = calculateFederalTax(taxableIncomeAfter, status);

  const taxSavings = beforeTax.tax - afterTax.tax;

  return {
    taxableIncomeBefore: taxableIncomeBefore,
    taxableIncomeAfter: taxableIncomeAfter,
    taxBefore: beforeTax.tax,
    taxAfter: afterTax.tax,
    savings: Math.round(taxSavings * 100) / 100,
    netCost: Math.round((contribution - taxSavings) * 100) / 100,
    effectiveContributionCost: contribution > 0 ? (contribution - taxSavings) / contribution : 0
  };
}

// Export functions for global access
window.calculateFederalTax = calculateFederalTax;
window.estimateStateTax = estimateStateTax;
window.analyzeTaxSituation = analyzeTaxSituation;
window.generateTaxRecommendations = generateTaxRecommendations;
window.calculateContributionImpact = calculateContributionImpact;
window.TAX_BRACKETS_2025 = TAX_BRACKETS_2025;
window.CONTRIBUTION_LIMITS_2025 = CONTRIBUTION_LIMITS_2025;
window.STANDARD_DEDUCTION_2025 = STANDARD_DEDUCTION_2025;
