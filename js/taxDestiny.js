/**
 * taxDestiny.js
 * Core calculation engine for the "Choose Your Destiny" tax optimization feature
 *
 * DISCLAIMER: This provides educational guidance only, not tax advice.
 * Financial GPS does not provide tax, legal, or investment advice.
 * Users should consult a qualified tax professional for their specific situation.
 */

// Valid filing status values (whitelist for security)
const VALID_FILING_STATUSES = ['single', 'married', 'head_of_household'];
const VALID_HSA_COVERAGES = ['individual', 'family', 'none'];

/**
 * Get IRS contribution limits based on age, filing status, and HSA coverage
 * @param {number} age - User's age
 * @param {string} filingStatus - Filing status
 * @param {string} hsaCoverage - HSA coverage type
 * @returns {Object} Contribution limits
 */
function getContributionLimits(age, filingStatus, hsaCoverage) {
  const catchUp = age >= 50;
  const status = VALID_FILING_STATUSES.includes(filingStatus) ? filingStatus : 'single';
  const coverage = VALID_HSA_COVERAGES.includes(hsaCoverage) ? hsaCoverage : 'individual';

  const baseHsa = coverage === 'family'
    ? CONTRIBUTION_LIMITS_2025['hsa_family']
    : CONTRIBUTION_LIMITS_2025['hsa_individual'];

  return {
    fourOhOneK: CONTRIBUTION_LIMITS_2025['401k'] + (catchUp ? CONTRIBUTION_LIMITS_2025['catch_up_50_401k'] : 0),
    hsa: coverage === 'none' ? 0 : baseHsa + (catchUp ? CONTRIBUTION_LIMITS_2025['catch_up_50_hsa'] : 0),
    ira: CONTRIBUTION_LIMITS_2025['ira'] + (catchUp ? CONTRIBUTION_LIMITS_2025['catch_up_50_ira'] : 0),
    rothIra: CONTRIBUTION_LIMITS_2025['ira'] + (catchUp ? CONTRIBUTION_LIMITS_2025['catch_up_50_ira'] : 0),
    five29: 18000, // 529 annual gift tax exclusion limit per beneficiary (2025)
    taxLossHarvest: 3000, // Max ordinary income offset
    // Roth IRA income phaseout
    rothPhaseout: ROTH_IRA_LIMITS_2025[status] || ROTH_IRA_LIMITS_2025.single,
    // Standard deduction for reference
    standardDeduction: STANDARD_DEDUCTION_2025[status] || STANDARD_DEDUCTION_2025.single,
    catchUpEligible: catchUp,
  };
}

/**
 * Calculate tax for a given scenario (income minus deductions)
 * @param {number} annualIncome - Gross annual income
 * @param {Object} deductions - Pre-tax deductions breakdown
 * @param {string} filingStatus - Filing status
 * @param {string} msa - MSA location string
 * @returns {Object} Tax calculation result
 */
function calculateScenarioTax(annualIncome, deductions, filingStatus, msa) {
  const status = VALID_FILING_STATUSES.includes(filingStatus) ? filingStatus : 'single';
  const standardDeduction = STANDARD_DEDUCTION_2025[status] || STANDARD_DEDUCTION_2025.single;

  // Pre-tax deductions reduce AGI: 401k, HSA, Traditional IRA
  const preTaxTotal = (deductions.fourOhOneK || 0)
    + (deductions.hsa || 0)
    + (deductions.traditionalIra || 0);

  const agi = Math.max(0, annualIncome - preTaxTotal);

  // Determine if itemizing makes sense (charitable + standard compared)
  const charitableAmount = deductions.charitableAnnual || 0;
  // Simplified: charitable only helps if it exceeds standard deduction by itself
  // In reality, SALT + mortgage interest + charitable together vs. standard
  const deductionUsed = Math.max(standardDeduction, standardDeduction + charitableAmount);
  // The benefit of charitable is only the amount above standard deduction
  const charitableBenefit = charitableAmount > 0
    ? Math.max(0, charitableAmount) // Charitable deduction value
    : 0;

  // Taxable income after deductions
  let taxableIncome = Math.max(0, agi - standardDeduction);

  // If charitable giving pushes above standard deduction, reduce further
  // But only the amount of charitable above what standard already covers
  if (charitableAmount > 0) {
    // Simplified model: charitable reduces taxable income directly
    // In reality this only applies when itemizing
    taxableIncome = Math.max(0, taxableIncome - charitableAmount);
  }

  // Tax-loss harvesting offset (up to $3,000 against ordinary income)
  const taxLossOffset = Math.min(deductions.taxLossHarvest || 0, 3000);
  taxableIncome = Math.max(0, taxableIncome - taxLossOffset);

  // Calculate federal tax
  const federalResult = calculateFederalTax(taxableIncome, status);

  // Calculate state tax
  const stateResult = estimateStateTax(taxableIncome, msa || '');

  // FICA (not reduced by 401k/HSA - calculated on gross)
  const ssMax = 168600;
  const socialSecurity = Math.min(annualIncome, ssMax) * 0.062;
  const medicare = annualIncome * 0.0145;
  const fica = socialSecurity + medicare;

  return {
    grossIncome: annualIncome,
    preTaxDeductions: preTaxTotal,
    agi: agi,
    standardDeduction: standardDeduction,
    charitableDeduction: charitableAmount,
    taxLossOffset: taxLossOffset,
    taxableIncome: taxableIncome,
    federalTax: federalResult.tax,
    stateTax: stateResult.tax,
    stateInfo: stateResult,
    fica: fica,
    totalTax: federalResult.tax + stateResult.tax + fica,
    totalIncomeTax: federalResult.tax + stateResult.tax,
    effectiveRate: annualIncome > 0 ? (federalResult.tax + stateResult.tax) / annualIncome : 0,
    marginalRate: federalResult.marginalRate,
    bracketInfo: federalResult.bracketInfo,
  };
}

/**
 * Build per-card tax savings breakdown
 * @param {string} type - Card type identifier
 * @param {number} annualAmount - Annual contribution/strategy amount
 * @param {number} annualLimit - IRS annual limit
 * @param {number} marginalRate - User's marginal tax rate
 * @param {boolean} isPreTax - Whether this reduces taxable income
 * @returns {Object} Card breakdown data
 */
function buildCardBreakdown(type, annualAmount, annualLimit, marginalRate, isPreTax) {
  const capped = annualLimit > 0 ? Math.min(annualAmount, annualLimit) : annualAmount;
  const estimatedSavings = isPreTax ? Math.round(capped * marginalRate) : 0;

  return {
    type: type,
    annualAmount: capped,
    annualLimit: annualLimit,
    percentOfLimit: annualLimit > 0 ? Math.min(1, capped / annualLimit) : 0,
    overLimit: annualAmount > annualLimit && annualLimit > 0,
    estimatedAnnualSavings: estimatedSavings,
    estimatedMonthlySavings: Math.round(estimatedSavings / 12),
    isPreTax: isPreTax,
  };
}

/**
 * Validate all tax destiny allocations
 * @param {Object} snapshot - Full financial snapshot
 * @returns {Object} Validation result with warnings array
 */
function validateAllocations(snapshot) {
  const td = snapshot.taxDestiny || {};
  const alloc = td.allocations || {};
  const strat = td.strategies || {};
  const age = snapshot.general.age || 30;
  const filingStatus = td.filingStatus || 'single';
  const hsaCoverage = td.hsaCoverage || 'individual';
  const annualIncome = snapshot.general.annualIncome || 0;

  const limits = getContributionLimits(age, filingStatus, hsaCoverage);
  const warnings = [];

  // Monthly cash flow available
  const monthlyCashFlow = (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0);
  const totalMonthlyAllocations = (alloc.fourOhOneK || 0) + (alloc.hsa || 0)
    + (alloc.traditionalIra || 0) + (alloc.rothIra || 0) + (alloc.five29 || 0);

  if (totalMonthlyAllocations > monthlyCashFlow && monthlyCashFlow > 0) {
    warnings.push({
      type: 'cashflow',
      message: `Total monthly allocations ($${Math.round(totalMonthlyAllocations).toLocaleString()}) exceed available cash flow ($${Math.round(monthlyCashFlow).toLocaleString()}/mo)`,
      severity: 'error',
    });
  }

  // 401k annual limit check
  if ((alloc.fourOhOneK || 0) * 12 > limits.fourOhOneK) {
    warnings.push({
      type: '401k_limit',
      message: `401(k) contributions ($${Math.round((alloc.fourOhOneK || 0) * 12).toLocaleString()}/yr) exceed annual limit ($${limits.fourOhOneK.toLocaleString()})`,
      severity: 'warning',
      field: 'fourOhOneK',
    });
  }

  // HSA limit check
  if (hsaCoverage === 'none' && (alloc.hsa || 0) > 0) {
    warnings.push({
      type: 'hsa_ineligible',
      message: 'HSA contributions require enrollment in a High Deductible Health Plan (HDHP)',
      severity: 'error',
      field: 'hsa',
    });
  } else if ((alloc.hsa || 0) * 12 > limits.hsa) {
    warnings.push({
      type: 'hsa_limit',
      message: `HSA contributions ($${Math.round((alloc.hsa || 0) * 12).toLocaleString()}/yr) exceed annual limit ($${limits.hsa.toLocaleString()})`,
      severity: 'warning',
      field: 'hsa',
    });
  }

  // IRA combined limit check (Traditional + Roth share the same limit)
  const totalIraAnnual = ((alloc.traditionalIra || 0) + (alloc.rothIra || 0)) * 12;
  if (totalIraAnnual > limits.ira) {
    warnings.push({
      type: 'ira_limit',
      message: `Combined IRA contributions ($${Math.round(totalIraAnnual).toLocaleString()}/yr) exceed annual limit ($${limits.ira.toLocaleString()}). Traditional + Roth IRA share one limit.`,
      severity: 'warning',
      field: 'ira',
    });
  }

  // Roth IRA income eligibility
  const rothPhaseout = limits.rothPhaseout;
  if ((alloc.rothIra || 0) > 0 && annualIncome >= rothPhaseout.phaseout_end) {
    warnings.push({
      type: 'roth_income',
      message: `Your income ($${annualIncome.toLocaleString()}) exceeds the Roth IRA eligibility limit ($${rothPhaseout.phaseout_end.toLocaleString()}). Consider a Backdoor Roth strategy - consult a tax professional.`,
      severity: 'warning',
      field: 'rothIra',
    });
  } else if ((alloc.rothIra || 0) > 0 && annualIncome >= rothPhaseout.phaseout_start) {
    warnings.push({
      type: 'roth_phaseout',
      message: `Your income is in the Roth IRA phaseout range ($${rothPhaseout.phaseout_start.toLocaleString()}-$${rothPhaseout.phaseout_end.toLocaleString()}). Your contribution limit may be reduced.`,
      severity: 'info',
      field: 'rothIra',
    });
  }

  // 529 limit check
  if ((alloc.five29 || 0) * 12 > 18000) {
    warnings.push({
      type: '529_limit',
      message: 'Annual 529 contributions above $18,000 may trigger gift tax reporting requirements',
      severity: 'info',
      field: 'five29',
    });
  }

  return {
    valid: warnings.filter(w => w.severity === 'error').length === 0,
    warnings: warnings,
  };
}

/**
 * Get total monthly pre-tax allocations (used by FIRE Journey and projections)
 * Only includes accounts that reduce current taxable income
 * @param {Object} snapshot - Full financial snapshot
 * @returns {Object} Monthly pre-tax amounts by account type
 */
function getTotalPreTaxAllocations(snapshot) {
  const alloc = (snapshot.taxDestiny || {}).allocations || {};
  return {
    fourOhOneK: alloc.fourOhOneK || 0,
    hsa: alloc.hsa || 0,
    traditionalIra: alloc.traditionalIra || 0,
    rothIra: alloc.rothIra || 0,
    five29: alloc.five29 || 0,
    totalMonthly: (alloc.fourOhOneK || 0) + (alloc.hsa || 0)
      + (alloc.traditionalIra || 0) + (alloc.rothIra || 0) + (alloc.five29 || 0),
    totalPreTaxMonthly: (alloc.fourOhOneK || 0) + (alloc.hsa || 0) + (alloc.traditionalIra || 0),
  };
}

/**
 * Main orchestrator: Calculate complete tax destiny analysis
 * @param {Object} snapshot - Full financial snapshot
 * @returns {Object} Complete tax destiny analysis
 */
function calculateTaxDestiny(snapshot) {
  if (!snapshot || !snapshot.general) return null;

  const annualIncome = snapshot.general.annualIncome || 0;
  if (annualIncome <= 0) return null;

  const td = snapshot.taxDestiny || {};
  const alloc = td.allocations || {};
  const strat = td.strategies || {};
  const age = snapshot.general.age || 30;
  const filingStatus = td.filingStatus || 'single';
  const hsaCoverage = td.hsaCoverage || 'individual';
  const msa = snapshot.general.msa || '';

  const limits = getContributionLimits(age, filingStatus, hsaCoverage);

  // Calculate annual amounts from monthly allocations (capped at limits)
  const annual401k = Math.min((alloc.fourOhOneK || 0) * 12, limits.fourOhOneK);
  const annualHsa = Math.min((alloc.hsa || 0) * 12, limits.hsa);
  const annualTradIra = Math.min((alloc.traditionalIra || 0) * 12, limits.ira);
  const annualRothIra = Math.min((alloc.rothIra || 0) * 12, limits.rothIra);
  // Traditional + Roth share the IRA limit
  const combinedIra = (alloc.traditionalIra || 0) * 12 + (alloc.rothIra || 0) * 12;
  const iraCapped = Math.min(combinedIra, limits.ira);

  // Baseline scenario: no contributions, just income and standard deduction
  const baseline = calculateScenarioTax(annualIncome, {}, filingStatus, msa);

  // With allocations scenario: all user-chosen contributions applied
  const withAllocations = calculateScenarioTax(annualIncome, {
    fourOhOneK: annual401k,
    hsa: annualHsa,
    traditionalIra: annualTradIra,
    // Roth IRA doesn't reduce current taxable income
    // 529 doesn't reduce federal taxable income (may reduce state in some states)
    charitableAnnual: strat.charitableAnnual || 0,
    taxLossHarvest: strat.taxLossHarvest || 0,
  }, filingStatus, msa);

  const annualSavings = baseline.totalIncomeTax - withAllocations.totalIncomeTax;

  // Build per-card breakdowns
  const marginalRate = baseline.marginalRate;
  const cards = {
    fourOhOneK: buildCardBreakdown('401(k)', annual401k, limits.fourOhOneK, marginalRate, true),
    hsa: buildCardBreakdown('HSA', annualHsa, limits.hsa, marginalRate, true),
    traditionalIra: buildCardBreakdown('Traditional IRA', annualTradIra, limits.ira, marginalRate, true),
    rothIra: buildCardBreakdown('Roth IRA', annualRothIra, limits.rothIra, 0, false),
    five29: buildCardBreakdown('529 Plan', (alloc.five29 || 0) * 12, 18000, 0, false),
    charitable: buildCardBreakdown('Charitable Giving', strat.charitableAnnual || 0, 0, marginalRate, true),
    taxLossHarvest: buildCardBreakdown('Tax-Loss Harvesting', strat.taxLossHarvest || 0, 3000, marginalRate, true),
  };

  // Monthly cash flow impact
  const totalMonthlyAllocations = (alloc.fourOhOneK || 0) + (alloc.hsa || 0)
    + (alloc.traditionalIra || 0) + (alloc.rothIra || 0) + (alloc.five29 || 0);
  const monthlyCashFlow = (snapshot.general.monthlyTakeHome || 0) - (snapshot.general.monthlyExpense || 0);
  const remainingCashFlow = monthlyCashFlow - totalMonthlyAllocations;

  // Validation
  const validation = validateAllocations(snapshot);

  return {
    filingStatus: filingStatus,
    hsaCoverage: hsaCoverage,
    limits: limits,
    baseline: baseline,
    withAllocations: withAllocations,
    annualSavings: Math.max(0, annualSavings),
    monthlySavings: Math.round(Math.max(0, annualSavings) / 12),
    cards: cards,
    totalMonthlyAllocations: totalMonthlyAllocations,
    monthlyCashFlow: monthlyCashFlow,
    remainingCashFlow: remainingCashFlow,
    validation: validation,
    advanced: td.advanced || {},
  };
}

// Export functions globally
window.calculateTaxDestiny = calculateTaxDestiny;
window.calculateScenarioTax = calculateScenarioTax;
window.getContributionLimits = getContributionLimits;
window.validateAllocations = validateAllocations;
window.getTotalPreTaxAllocations = getTotalPreTaxAllocations;
window.buildCardBreakdown = buildCardBreakdown;
window.VALID_FILING_STATUSES = VALID_FILING_STATUSES;
window.VALID_HSA_COVERAGES = VALID_HSA_COVERAGES;
