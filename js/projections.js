/**
 * projections.js
 * Forward projection calculations for net worth at retirement
 *
 * Access via browser console: window.projectionTable or getProjectionTable()
 */

// Growth rates (annual)
const GROWTH_RATES = {
  SAVINGS: 0.04,        // HYSA 4%
  INVESTMENTS: 0.07,    // Stocks/bonds 7%
  REAL_ESTATE: 0.05,    // Real estate 5%
  CAR: -0.20,           // Car depreciates 20%/year
  RETIREMENT: 0.07,     // 401k, IRA 7%
};

// Inflation rate for income and expenses (3% annual)
const INFLATION_RATE = 0.03;

// Contribution limits (2024) - must match fireJourney.js
const CONTRIBUTION_LIMITS = {
  ROTH_IRA: 7000,
  IRA: 7000,
  IRA_COMBINED: 7000,
  FOUR_OH_ONE_K: 23000,
  HSA_INDIVIDUAL: 4150,
};

// Default order for flexible boxes (matches fireJourney.js)
const PROJECTION_DEFAULT_FLEXIBLE_ORDER = ['highInterestDebt', 'hsaIra', 'moderateDebt', 'max401k', 'taxableInvesting'];

/**
 * Get flexible box order from localStorage (same as fireJourney.js)
 * This determines the priority order for cash flow allocation in projections
 */
function getProjectionFlexibleOrder() {
  try {
    const saved = localStorage.getItem('fireFlexibleOrder');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 5 &&
          PROJECTION_DEFAULT_FLEXIBLE_ORDER.every(key => parsed.includes(key))) {
        return parsed;
      }
    }
  } catch (e) {
    // Fall back to default
  }
  return [...PROJECTION_DEFAULT_FLEXIBLE_ORDER];
}

/**
 * Resolve the annual expenses used for FIRE target calculation.
 * If a custom fireAnnualExpenseTarget is set, use it.
 * Otherwise, fall back to current monthly expenses * 12.
 * @param {Object} snapshot - Current financial snapshot
 * @returns {number} Annual expenses for FIRE calculation
 */
function getFireAnnualExpenses(snapshot) {
  const customTarget = snapshot.fireSettings?.fireAnnualExpenseTarget;
  if (customTarget && customTarget > 0) {
    return customTarget;
  }
  return (snapshot.general.monthlyExpense || 0) * 12;
}

/**
 * Calculate month-by-month projection to retirement
 * Returns detailed projection table stored in window.projectionTable
 */
function calculateProjection(snapshot) {
  const currentAge = snapshot.general.age || 30;
  const retirementAge = snapshot.general.targetRetirement || 65;
  const monthsToRetirement = (retirementAge - currentAge) * 12;

  if (monthsToRetirement <= 0) {
    console.warn('Projection: Already at or past retirement age');
    return null;
  }

  const settings = snapshot.fireSettings || {};
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const monthlyCashFlow = monthlyTakeHome - monthlyExpense;

  // Annual contribution limits (split into monthly)
  const monthlyIRALimit = CONTRIBUTION_LIMITS.IRA_COMBINED / 12;
  const monthly401kLimit = CONTRIBUTION_LIMITS.FOUR_OH_ONE_K / 12;
  const monthlyHSALimit = CONTRIBUTION_LIMITS.HSA_INDIVIDUAL / 12;

  // Initial asset values
  let savings = snapshot.investments.savings || 0;
  let stocksBonds = snapshot.investments.stocksBonds || 0;
  let realEstate = snapshot.investments.realEstate || 0;
  let carValue = snapshot.investments.carValue || 0;
  let ira = snapshot.investments.ira || 0;
  let rothIra = snapshot.investments.rothIra || 0;
  let fourOhOneK = snapshot.investments.fourOhOneK || 0;
  let other = snapshot.investments.other || 0;

  // Initial debt values - with amortization data
  let debts = snapshot.debts.map(d => {
    const term = d.termMonths || 60;
    const minPayment = calculateMonthlyPayment(d.balance, d.interestRate, term);
    return {
      ...d,
      termMonths: term,
      remainingTerm: term,
      minPayment: minPayment,
      originalBalance: d.balance,
    };
  });

  // Track total minimum payments for freed cash flow calculation
  const totalMinPayments = debts.filter(d => d.balance > 0 && d.category !== 'MORTGAGE')
    .reduce((sum, d) => sum + d.minPayment, 0);

  // Track box completion states
  let starterEFComplete = savings >= 1000;
  let employerMatchComplete = !settings.hasEmployerMatch || settings.isGettingMatch;
  let highInterestDebtComplete = debts.filter(d => d.balance > 0 && d.interestRate > 10).length === 0;

  // For HSA: if contributing via payroll, it's complete
  let hsaComplete = !settings.hasHSA || settings.isContributingToHSA;

  // IRA: track annual contributions (resets each year)
  let iraYTDContributions = settings.iraContributionYTD || 0;
  let fourOhOneKYTD = settings.fourOhOneKContributionYTD || 0;

  // Emergency fund target (will be adjusted with inflation inside the loop)
  const efMonths = settings.emergencyFundMonths || 6;
  const baseEfExpense = monthlyExpense; // Store base for inflation

  // Projection table
  const projectionTable = [];

  // Monthly growth rates (convert annual to monthly)
  const monthlyGrowth = {
    savings: Math.pow(1 + GROWTH_RATES.SAVINGS, 1/12) - 1,
    investments: Math.pow(1 + GROWTH_RATES.INVESTMENTS, 1/12) - 1,
    realEstate: Math.pow(1 + GROWTH_RATES.REAL_ESTATE, 1/12) - 1,
    car: Math.pow(1 + GROWTH_RATES.CAR, 1/12) - 1,
    retirement: Math.pow(1 + GROWTH_RATES.RETIREMENT, 1/12) - 1,
  };

  for (let month = 0; month <= monthsToRetirement; month++) {
    const year = Math.floor(month / 12);
    const monthInYear = month % 12;
    const age = currentAge + (month / 12);

    // Apply inflation to EF target (3% annually)
    const inflationMultiplier = Math.pow(1 + INFLATION_RATE, year);
    const efTarget = baseEfExpense * inflationMultiplier * efMonths;

    // Reset YTD contributions at start of each year (except month 0)
    if (month > 0 && monthInYear === 0) {
      iraYTDContributions = 0;
      fourOhOneKYTD = 0;
    }

    // Calculate total debts
    const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);

    // Calculate net worth (ALL assets)
    const totalAssets = savings + stocksBonds + realEstate + carValue +
                        ira + rothIra + fourOhOneK + other;
    const netWorth = totalAssets - totalDebts;

    // Store snapshot for this month
    const monthSnapshot = {
      month,
      year,
      monthInYear,
      age: Math.round(age * 100) / 100,
      // Assets
      savings: Math.round(savings),
      stocksBonds: Math.round(stocksBonds),
      realEstate: Math.round(realEstate),
      carValue: Math.round(carValue),
      ira: Math.round(ira),
      rothIra: Math.round(rothIra),
      fourOhOneK: Math.round(fourOhOneK),
      other: Math.round(other),
      totalAssets: Math.round(totalAssets),
      // Debts
      totalDebts: Math.round(totalDebts),
      debtDetails: debts.map(d => ({ ...d, balance: Math.round(d.balance) })),
      // Net Worth
      netWorth: Math.round(netWorth),
      // Box status
      boxStatus: {
        starterEF: starterEFComplete,
        employerMatch: employerMatchComplete,
        highInterestDebt: highInterestDebtComplete,
        hsaComplete,
        iraYTD: iraYTDContributions,
        fullEF: savings >= efTarget + 1000,
        moderateDebt: debts.filter(d => d.balance > 0 && d.interestRate >= 5 && d.interestRate <= 9 && d.category !== 'MORTGAGE').length === 0,
        fourOhOneKYTD,
      },
    };

    projectionTable.push(monthSnapshot);

    // Skip cash flow allocation for final month
    if (month === monthsToRetirement) break;

    // Apply growth to assets (before adding contributions)
    savings *= (1 + monthlyGrowth.savings);
    stocksBonds *= (1 + monthlyGrowth.investments);
    realEstate *= (1 + monthlyGrowth.realEstate);
    carValue *= (1 + monthlyGrowth.car);
    carValue = Math.max(0, carValue); // Car can't go negative
    ira *= (1 + monthlyGrowth.retirement);
    rothIra *= (1 + monthlyGrowth.retirement);
    fourOhOneK *= (1 + monthlyGrowth.retirement);
    other *= (1 + monthlyGrowth.investments);

    // Apply debt amortization (minimum payments include interest + principal)
    debts = debts.map(d => {
      if (d.balance <= 0 || d.remainingTerm <= 0) {
        return { ...d, balance: 0, remainingTerm: 0 };
      }
      const interestPortion = calculateInterestPortion(d.balance, d.interestRate);
      const principalPortion = Math.min(d.minPayment - interestPortion, d.balance);
      const newBalance = Math.max(0, d.balance - principalPortion);
      return {
        ...d,
        balance: newBalance,
        remainingTerm: d.remainingTerm - 1,
      };
    });

    // Calculate freed cash flow from paid-off debts
    const currentMinPayments = debts.filter(d => d.balance > 0 && d.category !== 'MORTGAGE')
      .reduce((sum, d) => sum + d.minPayment, 0);
    const freedCashFlow = totalMinPayments - currentMinPayments;

    // Now allocate monthly cash flow through boxes sequentially
    // Base cash flow + any freed cash flow from paid-off debts
    let remainingCashFlow = monthlyCashFlow + freedCashFlow;

    // Box 1: Essentials - already covered by monthlyExpense subtraction
    // (If negative cash flow, nothing to allocate)
    if (remainingCashFlow <= 0) continue;

    // Box 2: Starter Emergency Fund ($1,000)
    if (!starterEFComplete) {
      const neededForStarterEF = Math.max(0, 1000 - savings);
      const allocateToStarterEF = Math.min(remainingCashFlow, neededForStarterEF);
      savings += allocateToStarterEF;
      remainingCashFlow -= allocateToStarterEF;
      starterEFComplete = savings >= 1000;
      if (remainingCashFlow <= 0) continue;
    }

    // Box 3: Employer Match
    // (Assuming already handled in take-home if getting match)
    // If not getting match, we'd need to contribute
    if (!employerMatchComplete && settings.hasEmployerMatch) {
      const matchPercent = settings.employerMatchPercent || 0;
      const monthlyGross = snapshot.general.annualIncome / 12;
      const neededForMatch = (matchPercent / 100) * monthlyGross;
      const allocateToMatch = Math.min(remainingCashFlow, neededForMatch);
      fourOhOneK += allocateToMatch;
      fourOhOneKYTD += allocateToMatch;
      remainingCashFlow -= allocateToMatch;
      // Mark complete once we've contributed enough
      employerMatchComplete = true;
      if (remainingCashFlow <= 0) continue;
    }

    // Box 4: Full Emergency Fund (3-6 months) - Moved before flexible section
    const fullEFComplete = savings >= (efTarget + 1000); // +1000 for starter EF
    if (!fullEFComplete) {
      const neededForFullEF = Math.max(0, (efTarget + 1000) - savings);
      const allocateToFullEF = Math.min(remainingCashFlow, neededForFullEF);
      savings += allocateToFullEF;
      remainingCashFlow -= allocateToFullEF;
      if (remainingCashFlow <= 0) continue;
    }

    // ===== FLEXIBLE SECTION (User-Defined Order) =====
    // Get user allocations and flexible box order
    const allocations = settings.allocations || {};
    const flexibleOrder = getProjectionFlexibleOrder();

    for (const boxKey of flexibleOrder) {
      if (remainingCashFlow <= 0) break;

      const userAllocation = allocations[boxKey];
      const useAllRemaining = userAllocation === null || userAllocation === undefined;

      switch (boxKey) {
        case 'highInterestDebt': {
          if (!highInterestDebtComplete) {
            const highInterestDebts = debts.filter(d => d.balance > 0 && d.interestRate > 10);
            const highInterestTotal = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
            if (highInterestTotal > 0) {
              const maxAlloc = useAllRemaining ? remainingCashFlow : Math.min(remainingCashFlow, userAllocation);
              const toAllocate = Math.min(maxAlloc, highInterestTotal);
              let toPayOff = toAllocate;
              for (let i = 0; i < highInterestDebts.length && toPayOff > 0; i++) {
                const debtIndex = debts.findIndex(d => d.category === highInterestDebts[i].category);
                const payoff = Math.min(toPayOff, debts[debtIndex].balance);
                debts[debtIndex].balance -= payoff;
                toPayOff -= payoff;
              }
              remainingCashFlow -= toAllocate;
            }
            highInterestDebtComplete = debts.filter(d => d.balance > 0 && d.interestRate > 10).length === 0;
          }
          break;
        }

        case 'hsaIra': {
          // Read monthly amounts from Tax Destiny allocations
          const taxAllocHsaIra = (snapshot.taxDestiny || {}).allocations || {};
          const hsaMonthlyFromTD = taxAllocHsaIra.hsa || 0;
          const tradIraMonthlyFromTD = taxAllocHsaIra.traditionalIra || 0;
          const rothIraMonthlyFromTD = taxAllocHsaIra.rothIra || 0;

          // HSA contribution
          if (hsaMonthlyFromTD > 0 && remainingCashFlow > 0) {
            const allocateToHSA = Math.min(remainingCashFlow, hsaMonthlyFromTD);
            stocksBonds += allocateToHSA; // HSA grows tax-free (tracked with investments)
            remainingCashFlow -= allocateToHSA;
          }

          // Traditional IRA contribution
          const iraCanContribute = CONTRIBUTION_LIMITS.IRA_COMBINED - iraYTDContributions;
          if (tradIraMonthlyFromTD > 0 && iraCanContribute > 0 && remainingCashFlow > 0) {
            const allocateToTradIra = Math.min(remainingCashFlow, tradIraMonthlyFromTD, iraCanContribute);
            ira += allocateToTradIra;
            iraYTDContributions += allocateToTradIra;
            remainingCashFlow -= allocateToTradIra;
          }

          // Roth IRA contribution
          const rothCanContribute = Math.max(0, CONTRIBUTION_LIMITS.IRA_COMBINED - iraYTDContributions);
          if (rothIraMonthlyFromTD > 0 && rothCanContribute > 0 && remainingCashFlow > 0) {
            const allocateToRothIra = Math.min(remainingCashFlow, rothIraMonthlyFromTD, rothCanContribute);
            rothIra += allocateToRothIra;
            iraYTDContributions += allocateToRothIra;
            remainingCashFlow -= allocateToRothIra;
          }
          break;
        }

        case 'moderateDebt': {
          const moderateDebts = debts.filter(d =>
            d.balance > 0 &&
            d.interestRate >= 5 &&
            d.interestRate <= 10 &&
            d.category !== 'MORTGAGE'
          );
          const moderateTotal = moderateDebts.reduce((sum, d) => sum + d.balance, 0);
          if (moderateTotal > 0) {
            const maxAlloc = useAllRemaining ? remainingCashFlow : Math.min(remainingCashFlow, userAllocation);
            const toAllocate = Math.min(maxAlloc, moderateTotal);
            let toPayOff = toAllocate;
            for (let i = 0; i < moderateDebts.length && toPayOff > 0; i++) {
              const debtIndex = debts.findIndex(d => d.category === moderateDebts[i].category);
              const payoff = Math.min(toPayOff, debts[debtIndex].balance);
              debts[debtIndex].balance -= payoff;
              toPayOff -= payoff;
            }
            remainingCashFlow -= toAllocate;
          }
          break;
        }

        case 'max401k': {
          // Read monthly 401k amount from Tax Destiny allocations
          const taxAlloc401k = (snapshot.taxDestiny || {}).allocations || {};
          const fourOhOneKMonthlyFromTD = taxAlloc401k.fourOhOneK || 0;
          const can401kContribute = CONTRIBUTION_LIMITS.FOUR_OH_ONE_K - fourOhOneKYTD;
          if (fourOhOneKMonthlyFromTD > 0 && can401kContribute > 0 && remainingCashFlow > 0) {
            const monthly401k = Math.min(remainingCashFlow, fourOhOneKMonthlyFromTD, can401kContribute);
            fourOhOneK += monthly401k;
            fourOhOneKYTD += monthly401k;
            remainingCashFlow -= monthly401k;
          }
          break;
        }

        case 'taxableInvesting': {
          if (remainingCashFlow > 0) {
            const toInvest = useAllRemaining ? remainingCashFlow : Math.min(remainingCashFlow, userAllocation);
            stocksBonds += toInvest;
            remainingCashFlow -= toInvest;
          }
          break;
        }
      }
    }
  }

  // Calculate 4% rule target (use custom FIRE expense target if set)
  const annualExpenses = getFireAnnualExpenses(snapshot);
  const fireTarget = annualExpenses * 25; // 4% rule

  // Get final values
  const finalMonth = projectionTable[projectionTable.length - 1];

  // Summary object
  const summary = {
    currentAge,
    retirementAge,
    monthsToRetirement,
    yearsToRetirement: retirementAge - currentAge,
    currentNetWorth: projectionTable[0].netWorth,
    projectedNetWorth: finalMonth.netWorth,
    fireTarget,
    annualExpenses,
    shortfall: fireTarget - finalMonth.netWorth,
    onTrack: finalMonth.netWorth >= fireTarget,
    growthRates: GROWTH_RATES,
    inflationRate: INFLATION_RATE,
  };

  // Store in window for console access
  window.projectionTable = projectionTable;
  window.projectionSummary = summary;

  return {
    table: projectionTable,
    summary,
  };
}

/**
 * Get the projection table (recalculates from current state)
 * Call from browser console: getProjectionTable()
 */
function getProjectionTable() {
  const { snapshot } = getState();
  return calculateProjection(snapshot);
}

/**
 * Get yearly snapshots (every 12 months) for cleaner view
 * Call from browser console: getYearlyProjection()
 */
function getYearlyProjection() {
  const { snapshot } = getState();
  const projection = calculateProjection(snapshot);

  if (!projection) return null;

  const yearly = projection.table.filter(m => m.monthInYear === 0 || m.month === projection.table.length - 1);

  console.log('=== YEARLY PROJECTION ===');
  console.table(yearly.map(y => ({
    Age: y.age,
    'Net Worth': '$' + y.netWorth.toLocaleString(),
    'Savings': '$' + y.savings.toLocaleString(),
    'Retirement': '$' + (y.ira + y.rothIra + y.fourOhOneK).toLocaleString(),
    'Investments': '$' + y.stocksBonds.toLocaleString(),
    'Real Estate': '$' + y.realEstate.toLocaleString(),
    'Debts': '$' + y.totalDebts.toLocaleString(),
  })));

  return yearly;
}

/**
 * Get box completion timeline
 * Call from browser console: getBoxTimeline()
 */
function getBoxTimeline() {
  const { snapshot } = getState();
  const projection = calculateProjection(snapshot);

  if (!projection) return null;

  const milestones = {
    starterEF: null,
    employerMatch: null,
    highInterestDebt: null,
    fullEF: null,
    moderateDebt: null,
  };

  for (const month of projection.table) {
    if (!milestones.starterEF && month.boxStatus.starterEF) {
      milestones.starterEF = { month: month.month, age: month.age };
    }
    if (!milestones.employerMatch && month.boxStatus.employerMatch) {
      milestones.employerMatch = { month: month.month, age: month.age };
    }
    if (!milestones.highInterestDebt && month.boxStatus.highInterestDebt) {
      milestones.highInterestDebt = { month: month.month, age: month.age };
    }
    if (!milestones.fullEF && month.boxStatus.fullEF) {
      milestones.fullEF = { month: month.month, age: month.age };
    }
    if (!milestones.moderateDebt && month.boxStatus.moderateDebt) {
      milestones.moderateDebt = { month: month.month, age: month.age };
    }
  }

  console.log('=== BOX COMPLETION TIMELINE ===');
  Object.entries(milestones).forEach(([box, data]) => {
    if (data) {
      console.log(`${box}: Month ${data.month} (Age ${data.age.toFixed(1)})`);
    } else {
      console.log(`${box}: Already complete or N/A`);
    }
  });

  return milestones;
}

/**
 * Print a formatted projection report
 * Call from browser console: printProjection()
 * Opens a new window with a printable table
 */
function printProjection() {
  const { snapshot } = getState();
  const projection = calculateProjection(snapshot);

  if (!projection) {
    alert('No projection data available');
    return;
  }

  const summary = projection.summary;
  const yearly = projection.table.filter(m => m.monthInYear === 0 || m.month === projection.table.length - 1);

  // Format currency helper
  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  // Build HTML content
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Financial GPS - Projection Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      color: #1a1a1a;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: #444; }
    .subtitle { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
    }
    .summary-card label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #666;
      display: block;
      margin-bottom: 0.25rem;
    }
    .summary-card .value {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .on-track { color: #22c55e; }
    .shortfall { color: #ef4444; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      margin-bottom: 2rem;
    }
    th, td {
      padding: 0.5rem 0.75rem;
      text-align: right;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      background: #f9f9f9;
      font-weight: 600;
      text-align: right;
    }
    th:first-child, td:first-child { text-align: left; }
    tr:hover { background: #fafafa; }
    .assumptions {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
    }
    .assumptions h3 {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .assumptions ul {
      margin-left: 1.5rem;
      color: #666;
    }
    .print-btn {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .print-btn:hover { background: #1d4ed8; }
    @media print {
      .print-btn { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>

  <h1>Financial GPS - Projection Report</h1>
  <p class="subtitle">Generated ${new Date().toLocaleDateString()}</p>

  <div class="summary-grid">
    <div class="summary-card">
      <label>Current Age</label>
      <div class="value">${summary.currentAge}</div>
    </div>
    <div class="summary-card">
      <label>Target Retirement</label>
      <div class="value">${summary.retirementAge}</div>
    </div>
    <div class="summary-card">
      <label>Years to Retirement</label>
      <div class="value">${summary.yearsToRetirement}</div>
    </div>
    <div class="summary-card">
      <label>Current Net Worth</label>
      <div class="value">${fmt(summary.currentNetWorth)}</div>
    </div>
    <div class="summary-card">
      <label>Projected Net Worth</label>
      <div class="value">${fmt(summary.projectedNetWorth)}</div>
    </div>
    <div class="summary-card">
      <label>FIRE Target (4% Rule)</label>
      <div class="value">${fmt(summary.fireTarget)}</div>
    </div>
    <div class="summary-card">
      <label>Status</label>
      <div class="value ${summary.onTrack ? 'on-track' : 'shortfall'}">
        ${summary.onTrack ? 'On Track ✓' : 'Shortfall: ' + fmt(summary.shortfall)}
      </div>
    </div>
  </div>

  <h2>Yearly Projection</h2>
  <table>
    <thead>
      <tr>
        <th>Age</th>
        <th>Net Worth</th>
        <th>Savings</th>
        <th>401k</th>
        <th>IRA</th>
        <th>Roth IRA</th>
        <th>Investments</th>
        <th>Real Estate</th>
        <th>Car</th>
        <th>Debts</th>
      </tr>
    </thead>
    <tbody>
      ${yearly.map(y => `
        <tr>
          <td>${Math.round(y.age)}</td>
          <td>${fmt(y.netWorth)}</td>
          <td>${fmt(y.savings)}</td>
          <td>${fmt(y.fourOhOneK)}</td>
          <td>${fmt(y.ira)}</td>
          <td>${fmt(y.rothIra)}</td>
          <td>${fmt(y.stocksBonds)}</td>
          <td>${fmt(y.realEstate)}</td>
          <td>${fmt(y.carValue)}</td>
          <td>${fmt(y.totalDebts)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="assumptions">
    <h3>Assumptions</h3>
    <ul>
      <li>Savings (HYSA): ${(GROWTH_RATES.SAVINGS * 100).toFixed(1)}% annual growth</li>
      <li>Investments & Retirement: ${(GROWTH_RATES.INVESTMENTS * 100).toFixed(1)}% annual growth</li>
      <li>Real Estate: ${(GROWTH_RATES.REAL_ESTATE * 100).toFixed(1)}% annual appreciation</li>
      <li>Car: ${(GROWTH_RATES.CAR * 100).toFixed(1)}% annual depreciation</li>
      <li>Inflation: ${(INFLATION_RATE * 100).toFixed(1)}%</li>
      <li>Monthly expenses: ${fmt(snapshot.general.monthlyExpense)}</li>
      <li>Monthly cash flow: ${fmt(snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense)}</li>
      <li>FIRE target based on 4% safe withdrawal rate (annual expenses × 25)</li>
    </ul>
  </div>
</body>
</html>
  `;

  // Open in new window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Calculate detailed cash flow waterfall showing how each box fills sequentially
 * Returns month-by-month breakdown of cash flow allocation to each box
 */
function calculateWaterfallProjection(snapshot) {
  const currentAge = snapshot.general.age || 30;
  const retirementAge = snapshot.general.targetRetirement || 65;
  const monthsToRetirement = (retirementAge - currentAge) * 12;

  if (monthsToRetirement <= 0) return null;

  const settings = snapshot.fireSettings || {};
  const monthlyExpense = snapshot.general.monthlyExpenseWaterfall || snapshot.general.monthlyExpense || 0;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const monthlyCashFlow = monthlyTakeHome - monthlyExpense;

  // Targets and limits (EF target will adjust with inflation)
  const starterEFTarget = 1000;
  const efMonths = settings.emergencyFundMonths || 6;
  const baseMonthlyExpense = monthlyExpense; // Store for inflation calculations

  // Initial balances
  let savings = snapshot.investments.savings || 0;

  // Debts with amortization data
  let debts = snapshot.debts.map(d => {
    const term = d.termMonths || 60;
    const minPayment = calculateMonthlyPayment(d.balance, d.interestRate, term);
    return {
      ...d,
      termMonths: term,
      remainingTerm: term,
      minPayment: minPayment,
      originalBalance: d.balance,
    };
  });

  // Track total minimum payments for freed cash flow calculation
  const totalMinPayments = debts.filter(d => d.balance > 0 && d.category !== 'MORTGAGE')
    .reduce((sum, d) => sum + d.minPayment, 0);

  // Initial full EF target (will be recalculated with inflation each year)
  const initialFullEFTarget = baseMonthlyExpense * efMonths + starterEFTarget;

  // Track cumulative allocations per box
  let box2Cumulative = Math.min(savings, starterEFTarget);
  let box3Complete = !settings.hasEmployerMatch || settings.isGettingMatch;
  let box5HSACumulative = 0;
  let box5IRACumulative = settings.iraContributionYTD || 0;
  let box6Cumulative = Math.max(0, Math.min(savings - starterEFTarget, initialFullEFTarget - starterEFTarget));
  let box8Cumulative = settings.fourOhOneKContributionYTD || 0;
  let box9Cumulative = 0;

  // YTD trackers (reset annually)
  let iraYTD = settings.iraContributionYTD || 0;
  let fourOhOneKYTD = settings.fourOhOneKContributionYTD || 0;
  let hsaYTD = 0;

  // Get user's flexible box order from localStorage
  const flexibleOrder = getProjectionFlexibleOrder();

  const waterfall = [];

  for (let month = 0; month <= monthsToRetirement; month++) {
    const year = Math.floor(month / 12);
    const monthInYear = month % 12;
    const age = currentAge + (month / 12);

    // Apply inflation to expenses (3% annually)
    const inflationMultiplier = Math.pow(1 + INFLATION_RATE, year);
    const inflatedMonthlyExpense = baseMonthlyExpense * inflationMultiplier;
    const fullEFTarget = inflatedMonthlyExpense * efMonths + starterEFTarget;

    // Reset YTD at start of each year
    if (month > 0 && monthInYear === 0) {
      iraYTD = 0;
      fourOhOneKYTD = 0;
      hsaYTD = 0;
    }

    // Apply debt amortization (minimum payments include interest + principal)
    if (month > 0) {
      debts = debts.map(d => {
        if (d.balance <= 0 || d.remainingTerm <= 0) {
          return { ...d, balance: 0, remainingTerm: 0 };
        }
        const interestPortion = calculateInterestPortion(d.balance, d.interestRate);
        const principalPortion = Math.min(d.minPayment - interestPortion, d.balance);
        const newBalance = Math.max(0, d.balance - principalPortion);
        return {
          ...d,
          balance: newBalance,
          remainingTerm: d.remainingTerm - 1,
        };
      });
    }

    // Calculate freed cash flow from paid-off debts
    const currentMinPayments = debts.filter(d => d.balance > 0 && d.category !== 'MORTGAGE')
      .reduce((sum, d) => sum + d.minPayment, 0);
    const freedCashFlow = totalMinPayments - currentMinPayments;

    // Track allocations this month (base cash flow + freed cash flow)
    let remaining = monthlyCashFlow + freedCashFlow;
    const allocation = {
      month,
      year,
      monthInYear,
      age: Math.round(age * 100) / 100,
      startingCashFlow: monthlyCashFlow + freedCashFlow,
      freedCashFlow: Math.round(freedCashFlow),
      box1: 'N/A',
      box2: 0,
      box2Status: '',
      box2Balance: 0,
      box2Target: starterEFTarget,
      box3: 0,
      box3Status: '',
      box4: 0,
      box4Status: '',
      box4Balance: 0,
      box5HSA: 0,
      box5IRA: 0,
      box5Status: '',
      box5HSABalance: 0,
      box5IRABalance: 0,
      box6: 0,
      box6Status: '',
      box6Balance: 0,
      box6Target: fullEFTarget,
      box7: 0,
      box7Status: '',
      box7Balance: 0,
      box8: 0,
      box8Status: '',
      box8Balance: 0,
      box9: 0,
      remainingCashFlow: 0,
      // Track the order used for this projection
      flexibleOrder: [...flexibleOrder],
    };

    if (remaining <= 0) {
      allocation.box1 = 'SHORTFALL';
      allocation.remainingCashFlow = remaining;
      waterfall.push(allocation);
      continue;
    }

    // ===== FOUNDATION SECTION (Fixed Order) =====

    // Box 2: Starter Emergency Fund ($1,000) - Always first
    const box2Needed = Math.max(0, starterEFTarget - box2Cumulative);
    if (box2Needed > 0) {
      const box2Alloc = Math.min(remaining, box2Needed);
      allocation.box2 = box2Alloc;
      box2Cumulative += box2Alloc;
      remaining -= box2Alloc;
      allocation.box2Status = box2Cumulative >= starterEFTarget ? 'COMPLETE' : 'FILLING';
    } else {
      allocation.box2Status = 'COMPLETE';
    }
    allocation.box2Balance = box2Cumulative;

    if (remaining <= 0) {
      allocation.remainingCashFlow = remaining;
      waterfall.push(allocation);
      continue;
    }

    // Box 3: Employer Match - Always second
    if (!box3Complete && settings.hasEmployerMatch) {
      const matchPercent = settings.employerMatchPercent || 0;
      const monthlyGross = snapshot.general.annualIncome / 12;
      const matchContribution = (matchPercent / 100) * monthlyGross;
      const box3Alloc = Math.min(remaining, matchContribution);
      allocation.box3 = box3Alloc;
      remaining -= box3Alloc;
      box3Complete = true;
      allocation.box3Status = 'COMPLETE';
    } else if (box3Complete) {
      allocation.box3Status = settings.hasEmployerMatch ? 'COMPLETE' : 'N/A';
    } else {
      allocation.box3Status = 'N/A';
    }

    if (remaining <= 0) {
      allocation.remainingCashFlow = remaining;
      waterfall.push(allocation);
      continue;
    }

    // Box 6: Full Emergency Fund - Always third (before flexible boxes)
    const box6Needed = Math.max(0, fullEFTarget - box2Cumulative - box6Cumulative);
    if (box6Needed > 0) {
      const box6Alloc = Math.min(remaining, box6Needed);
      allocation.box6 = box6Alloc;
      box6Cumulative += box6Alloc;
      remaining -= box6Alloc;
      allocation.box6Status = (box2Cumulative + box6Cumulative) >= fullEFTarget ? 'COMPLETE' : 'FILLING';
    } else {
      allocation.box6Status = 'COMPLETE';
    }
    allocation.box6Balance = box2Cumulative + box6Cumulative;

    if (remaining <= 0) {
      allocation.remainingCashFlow = remaining;
      waterfall.push(allocation);
      continue;
    }

    // ===== FLEXIBLE SECTION (User-Defined Order) =====
    // Process boxes in the order specified by the user via drag-and-drop
    // User can set custom allocation amounts (null = all remaining, number = specific amount)
    const allocations = settings.allocations || {};

    for (const boxKey of flexibleOrder) {
      if (remaining <= 0) break;

      // Get user's allocation setting for this box
      const userAllocation = allocations[boxKey];
      const useAllRemaining = userAllocation === null || userAllocation === undefined;

      switch (boxKey) {
        case 'highInterestDebt': {
          // Box 4: High-Interest Debt (>10%)
          const highInterestDebts = debts.filter(d => d.balance > 0 && d.interestRate > 10);
          const highInterestTotal = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
          if (highInterestTotal > 0) {
            // Determine allocation: all remaining OR user-specified amount
            let maxAlloc = useAllRemaining ? remaining : Math.min(remaining, userAllocation);
            const box4Alloc = Math.min(maxAlloc, highInterestTotal);
            allocation.box4 = box4Alloc;
            let toPayOff = box4Alloc;
            for (let i = 0; i < highInterestDebts.length && toPayOff > 0; i++) {
              const debtIndex = debts.findIndex(d => d.category === highInterestDebts[i].category);
              const payment = Math.min(toPayOff, debts[debtIndex].balance);
              debts[debtIndex].balance -= payment;
              toPayOff -= payment;
            }
            remaining -= box4Alloc;
            const newHighTotal = debts.filter(d => d.balance > 0 && d.interestRate > 10).reduce((sum, d) => sum + d.balance, 0);
            allocation.box4Status = newHighTotal <= 0 ? 'COMPLETE' : 'PAYING';
            allocation.box4Balance = newHighTotal;
          } else {
            allocation.box4Status = 'COMPLETE';
            allocation.box4Balance = 0;
          }
          break;
        }

        case 'hsaIra': {
          // Box 5: HSA & IRA
          const hasHSA = settings.hasHSA && !settings.isContributingToHSA;
          const hsaLimit = CONTRIBUTION_LIMITS.HSA_INDIVIDUAL;
          const hsaRemaining = hasHSA ? Math.max(0, hsaLimit - hsaYTD) : 0;

          const iraLimit = CONTRIBUTION_LIMITS.IRA_COMBINED;
          const iraRemaining = Math.max(0, iraLimit - iraYTD);

          // Calculate max possible contribution (capped by annual limits)
          const maxPossible = (hsaLimit / 12) + (iraLimit / 12);

          // Determine how much to allocate based on user setting
          let budgetForBox5 = useAllRemaining ? Math.min(remaining, maxPossible) : Math.min(remaining, userAllocation, maxPossible);

          if (hsaRemaining > 0 && budgetForBox5 > 0) {
            const hsaMonthly = Math.min(budgetForBox5, hsaLimit / 12, hsaRemaining);
            allocation.box5HSA = hsaMonthly;
            box5HSACumulative += hsaMonthly;
            hsaYTD += hsaMonthly;
            remaining -= hsaMonthly;
            budgetForBox5 -= hsaMonthly;
          }
          allocation.box5HSABalance = hsaYTD;

          if (iraRemaining > 0 && budgetForBox5 > 0) {
            const iraMonthly = Math.min(budgetForBox5, iraLimit / 12, iraRemaining);
            allocation.box5IRA = iraMonthly;
            box5IRACumulative += iraMonthly;
            iraYTD += iraMonthly;
            remaining -= iraMonthly;
          }
          allocation.box5IRABalance = iraYTD;

          const hsaComplete = !hasHSA || hsaYTD >= hsaLimit;
          const iraComplete = iraYTD >= iraLimit;
          allocation.box5Status = (hsaComplete && iraComplete) ? 'MAXED' : 'CONTRIBUTING';
          break;
        }

        case 'moderateDebt': {
          // Box 7: Moderate Interest Debt (5-10%)
          const currentModerateDebts = debts.filter(d => d.balance > 0 && d.interestRate >= 5 && d.interestRate <= 10 && d.category !== 'MORTGAGE');
          const currentModerateTotal = currentModerateDebts.reduce((sum, d) => sum + d.balance, 0);
          if (currentModerateTotal > 0) {
            // Determine allocation: all remaining OR user-specified amount
            let maxAlloc = useAllRemaining ? remaining : Math.min(remaining, userAllocation);
            const box7Alloc = Math.min(maxAlloc, currentModerateTotal);
            allocation.box7 = box7Alloc;
            let toPayOff = box7Alloc;
            for (let i = 0; i < currentModerateDebts.length && toPayOff > 0; i++) {
              const debtIndex = debts.findIndex(d => d.category === currentModerateDebts[i].category);
              const payment = Math.min(toPayOff, debts[debtIndex].balance);
              debts[debtIndex].balance -= payment;
              toPayOff -= payment;
            }
            remaining -= box7Alloc;
            const newModTotal = debts.filter(d => d.balance > 0 && d.interestRate >= 5 && d.interestRate <= 10 && d.category !== 'MORTGAGE').reduce((sum, d) => sum + d.balance, 0);
            allocation.box7Status = newModTotal <= 0 ? 'COMPLETE' : 'PAYING';
            allocation.box7Balance = newModTotal;
          } else {
            allocation.box7Status = 'COMPLETE';
            allocation.box7Balance = 0;
          }
          break;
        }

        case 'max401k': {
          // Box 8: Max 401k
          const fourOhOneKLimit = CONTRIBUTION_LIMITS.FOUR_OH_ONE_K;
          const fourOhOneKRemaining = Math.max(0, fourOhOneKLimit - fourOhOneKYTD);
          if (fourOhOneKRemaining > 0 && remaining > 0) {
            // Determine allocation: max annual limit OR user-specified amount
            const maxMonthly = fourOhOneKLimit / 12;
            let budgetFor401k = useAllRemaining ? Math.min(remaining, maxMonthly) : Math.min(remaining, userAllocation, maxMonthly);
            const box8Monthly = Math.min(budgetFor401k, fourOhOneKRemaining);
            allocation.box8 = box8Monthly;
            box8Cumulative += box8Monthly;
            fourOhOneKYTD += box8Monthly;
            remaining -= box8Monthly;
            allocation.box8Status = fourOhOneKYTD >= fourOhOneKLimit ? 'MAXED' : 'CONTRIBUTING';
          } else {
            allocation.box8Status = 'MAXED';
          }
          allocation.box8Balance = fourOhOneKYTD;
          break;
        }

        case 'taxableInvesting': {
          // Box 9: Taxable Investing
          if (remaining > 0) {
            // Determine allocation: all remaining OR user-specified amount
            const box9Alloc = useAllRemaining ? remaining : Math.min(remaining, userAllocation);
            allocation.box9 = box9Alloc;
            box9Cumulative += box9Alloc;
            remaining -= box9Alloc;
          }
          break;
        }
      }
    }

    allocation.remainingCashFlow = remaining;
    waterfall.push(allocation);
  }

  // Get the final EF target (with full inflation applied)
  const finalYear = Math.floor(monthsToRetirement / 12);
  const finalInflationMultiplier = Math.pow(1 + INFLATION_RATE, finalYear);
  const finalFullEFTarget = baseMonthlyExpense * finalInflationMultiplier * efMonths + starterEFTarget;

  return {
    waterfall,
    summary: {
      monthlyCashFlow,
      starterEFTarget,
      fullEFTarget: finalFullEFTarget, // Final inflation-adjusted target
      initialFullEFTarget: initialFullEFTarget, // Starting target
      totalToBox9: box9Cumulative,
      flexibleOrder: [...flexibleOrder],
    }
  };
}

/**
 * Print cash flow waterfall report
 * Call from browser console: printWaterfall()
 */
function printWaterfall() {
  const { snapshot } = getState();
  const result = calculateWaterfallProjection(snapshot);

  if (!result) {
    alert('No waterfall data available');
    return;
  }

  const { waterfall, summary } = result;
  const settings = snapshot.fireSettings || {};

  // Format currency helper
  const fmt = (n) => {
    if (n === 0) return '-';
    return '$' + Math.round(n).toLocaleString();
  };

  // Get box descriptions
  const boxDescriptions = {
    box2: `Starter EF (Target: ${fmt(summary.starterEFTarget)})`,
    box3: `Employer Match (${settings.employerMatchPercent || 0}%)`,
    box4: 'High-Interest Debt (>10%)',
    box5: `HSA ($${CONTRIBUTION_LIMITS.HSA_INDIVIDUAL.toLocaleString()}/yr) + IRA ($${CONTRIBUTION_LIMITS.IRA_COMBINED.toLocaleString()}/yr)`,
    box6: `Full EF (Target: ${fmt(summary.fullEFTarget)})`,
    box7: 'Moderate Debt (5-9%)',
    box8: `Max 401k ($${CONTRIBUTION_LIMITS.FOUR_OH_ONE_K.toLocaleString()}/yr)`,
    box9: 'Taxable Investing',
  };

  // Build HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Financial GPS - Cash Flow Waterfall</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 1.5rem;
      color: #1a1a1a;
      font-size: 11px;
    }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    h2 { font-size: 1rem; margin: 1rem 0 0.5rem; color: #444; }
    .subtitle { color: #666; font-size: 0.75rem; margin-bottom: 1rem; }
    .summary-row {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 6px;
      flex-wrap: wrap;
    }
    .summary-item { }
    .summary-item label { font-size: 0.65rem; color: #666; text-transform: uppercase; display: block; }
    .summary-item .value { font-size: 1rem; font-weight: 600; }
    .box-legend {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.7rem;
    }
    .box-legend-item {
      padding: 0.5rem;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .box-legend-item strong { color: #2563eb; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.65rem;
    }
    th, td {
      padding: 0.35rem 0.5rem;
      text-align: right;
      border-bottom: 1px solid #e5e5e5;
      white-space: nowrap;
    }
    th {
      background: #f0f0f0;
      font-weight: 600;
      position: sticky;
      top: 0;
    }
    th:first-child, td:first-child { text-align: center; }
    td:nth-child(2) { text-align: center; }
    tr:hover { background: #fafafa; }
    .complete { color: #22c55e; font-weight: 500; }
    .filling { color: #f59e0b; }
    .paying { color: #ef4444; }
    .na { color: #9ca3af; }
    .print-btn {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
    }
    .print-btn:hover { background: #1d4ed8; }
    @media print {
      .print-btn { display: none; }
      body { padding: 0.5rem; font-size: 9px; }
      table { font-size: 0.55rem; }
      th, td { padding: 0.2rem 0.3rem; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>

  <h1>Cash Flow Waterfall</h1>
  <p class="subtitle">Month-by-month allocation through FIRE boxes | Generated ${new Date().toLocaleDateString()}</p>

  <div class="summary-row">
    <div class="summary-item">
      <label>Monthly Cash Flow</label>
      <div class="value">${fmt(summary.monthlyCashFlow)}</div>
    </div>
    <div class="summary-item">
      <label>Starter EF Target</label>
      <div class="value">${fmt(summary.starterEFTarget)}</div>
    </div>
    <div class="summary-item">
      <label>Full EF Target</label>
      <div class="value">${fmt(summary.fullEFTarget)}</div>
    </div>
    <div class="summary-item">
      <label>Total to Taxable</label>
      <div class="value">${fmt(summary.totalToBox9)}</div>
    </div>
  </div>

  <div class="box-legend">
    <div class="box-legend-item"><strong>Box 1:</strong> Essentials (covered by expenses)</div>
    <div class="box-legend-item"><strong>Box 2:</strong> ${boxDescriptions.box2}</div>
    <div class="box-legend-item"><strong>Box 3:</strong> ${boxDescriptions.box3}</div>
    <div class="box-legend-item"><strong>Box 4:</strong> ${boxDescriptions.box4}</div>
    <div class="box-legend-item"><strong>Box 5:</strong> ${boxDescriptions.box5}</div>
    <div class="box-legend-item"><strong>Box 6:</strong> ${boxDescriptions.box6}</div>
    <div class="box-legend-item"><strong>Box 7:</strong> ${boxDescriptions.box7}</div>
    <div class="box-legend-item"><strong>Box 8:</strong> ${boxDescriptions.box8}</div>
    <div class="box-legend-item"><strong>Box 9:</strong> ${boxDescriptions.box9}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Mo</th>
        <th>Age</th>
        <th>Cash Flow</th>
        <th>Box 2<br>Starter EF</th>
        <th>Box 2<br>Balance</th>
        <th>Box 3<br>Match</th>
        <th>Box 4<br>High Debt</th>
        <th>Box 4<br>Balance</th>
        <th>Box 5<br>HSA</th>
        <th>Box 5<br>IRA</th>
        <th>Box 6<br>Full EF</th>
        <th>Box 6<br>Balance</th>
        <th>Box 7<br>Mod Debt</th>
        <th>Box 7<br>Balance</th>
        <th>Box 8<br>401k</th>
        <th>Box 8<br>YTD</th>
        <th>Box 9<br>Taxable</th>
      </tr>
    </thead>
    <tbody>
      ${waterfall.map(w => {
        const statusClass = (status) => {
          if (status === 'COMPLETE' || status === 'MAXED') return 'complete';
          if (status === 'FILLING' || status === 'CONTRIBUTING') return 'filling';
          if (status === 'PAYING') return 'paying';
          if (status === 'N/A') return 'na';
          return '';
        };
        return `
          <tr>
            <td>${w.month}</td>
            <td>${w.age.toFixed(1)}</td>
            <td>${fmt(w.startingCashFlow)}</td>
            <td class="${statusClass(w.box2Status)}">${w.box2 > 0 ? fmt(w.box2) : (w.box2Status === 'COMPLETE' ? '✓' : '-')}</td>
            <td>${fmt(w.box2Balance)}</td>
            <td class="${statusClass(w.box3Status)}">${w.box3 > 0 ? fmt(w.box3) : (w.box3Status === 'COMPLETE' ? '✓' : w.box3Status === 'N/A' ? '-' : '-')}</td>
            <td class="${statusClass(w.box4Status)}">${w.box4 > 0 ? fmt(w.box4) : (w.box4Status === 'COMPLETE' ? '✓' : '-')}</td>
            <td>${w.box4Balance > 0 ? fmt(w.box4Balance) : '-'}</td>
            <td class="${statusClass(w.box5Status)}">${w.box5HSA > 0 ? fmt(w.box5HSA) : '-'}</td>
            <td class="${statusClass(w.box5Status)}">${w.box5IRA > 0 ? fmt(w.box5IRA) : '-'}</td>
            <td class="${statusClass(w.box6Status)}">${w.box6 > 0 ? fmt(w.box6) : (w.box6Status === 'COMPLETE' ? '✓' : '-')}</td>
            <td>${fmt(w.box6Balance)}</td>
            <td class="${statusClass(w.box7Status)}">${w.box7 > 0 ? fmt(w.box7) : (w.box7Status === 'COMPLETE' ? '✓' : '-')}</td>
            <td>${w.box7Balance > 0 ? fmt(w.box7Balance) : '-'}</td>
            <td class="${statusClass(w.box8Status)}">${w.box8 > 0 ? fmt(w.box8) : (w.box8Status === 'MAXED' ? '✓' : '-')}</td>
            <td>${fmt(w.box8Balance)}</td>
            <td>${w.box9 > 0 ? fmt(w.box9) : '-'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export waterfall to CSV
 * Call from browser console: exportWaterfallCSV()
 * Reflects the user's current priority order from the FIRE Journey settings
 */
function exportWaterfallCSV() {
  const { snapshot } = getState();
  const result = calculateWaterfallProjection(snapshot);

  if (!result) {
    alert('No waterfall data available');
    return;
  }

  // Map box keys to friendly names for the header comment
  const boxNames = {
    'highInterestDebt': 'High-Interest Debt (>10%)',
    'hsaIra': 'HSA & IRA',
    'moderateDebt': 'Moderate Debt (5-9%)',
    'max401k': 'Max 401k',
    'taxableInvesting': 'Taxable Investing'
  };

  // Build priority order comment
  const priorityOrder = result.summary.flexibleOrder
    .map((key, idx) => `${idx + 1}. ${boxNames[key] || key}`)
    .join(' | ');

  const headers = [
    'Month', 'Age', 'Cash Flow',
    'Box2 Alloc', 'Box2 Balance', 'Box2 Status',
    'Box3 Alloc', 'Box3 Status',
    'Box4 Alloc', 'Box4 Balance', 'Box4 Status',
    'Box5 HSA', 'Box5 IRA', 'Box5 Status',
    'Box6 Alloc', 'Box6 Balance', 'Box6 Status',
    'Box7 Alloc', 'Box7 Balance', 'Box7 Status',
    'Box8 Alloc', 'Box8 YTD', 'Box8 Status',
    'Box9 Taxable'
  ];

  const rows = result.waterfall.map(w => [
    w.month, w.age.toFixed(2), w.startingCashFlow,
    w.box2, w.box2Balance, w.box2Status,
    w.box3, w.box3Status,
    w.box4, w.box4Balance, w.box4Status,
    w.box5HSA, w.box5IRA, w.box5Status,
    w.box6, w.box6Balance, w.box6Status,
    w.box7, w.box7Balance, w.box7Status,
    w.box8, w.box8Balance, w.box8Status,
    w.box9
  ]);

  // Include priority order info at the top of the CSV
  const csvContent = [
    `# Cash Flow Waterfall - Priority Order: ${priorityOrder}`,
    `# Foundation: 1. Starter EF ($1000) | 2. Employer Match | 3. Full EF`,
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `cash-flow-waterfall-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  console.log('Waterfall CSV exported successfully!');
  console.log('Priority order used:', priorityOrder);
}

/**
 * Export projection to CSV
 * Call from browser console: exportProjectionCSV()
 * Downloads a CSV file
 */
function exportProjectionCSV() {
  const { snapshot } = getState();
  const projection = calculateProjection(snapshot);

  if (!projection) {
    alert('No projection data available');
    return;
  }

  // CSV header
  const headers = [
    'Month', 'Age', 'Net Worth', 'Savings', '401k', 'IRA', 'Roth IRA',
    'Stocks/Bonds', 'Real Estate', 'Car', 'Other', 'Total Assets', 'Total Debts'
  ];

  // CSV rows
  const rows = projection.table.map(m => [
    m.month,
    m.age.toFixed(2),
    m.netWorth,
    m.savings,
    m.fourOhOneK,
    m.ira,
    m.rothIra,
    m.stocksBonds,
    m.realEstate,
    m.carValue,
    m.other,
    m.totalAssets,
    m.totalDebts
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `financial-projection-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  console.log('CSV exported successfully!');
}

/**
 * Calculate Net Worth projection with 6 buckets
 * Tracks month-by-month changes for charting
 *
 * Buckets:
 * 1. Savings - EF contributions + 4% growth
 * 2. Investment Accounts - Roth/IRA + 401k + Stocks/Bonds + HSA + Other (5%) + 7% growth
 * 3. Real Estate - Property value (5% appreciation)
 * 4. Car - 20% annual depreciation (floor at 0)
 * 5. High Interest Debt - Balance + interest - waterfall payments (negative)
 * 6. Moderate Debt - Balance + interest - waterfall payments (negative)
 *
 * Mortgage is tracked separately as it reduces from Real Estate value
 *
 * Call from console: getNetWorthProjection() or printNetWorthChart()
 */
function calculateNetWorthProjection(snapshot) {
  const currentAge = snapshot.general.age || 30;
  const retirementAge = snapshot.general.targetRetirement || 65;
  const monthsToRetirement = (retirementAge - currentAge) * 12;

  if (monthsToRetirement <= 0) return null;

  const settings = snapshot.fireSettings || {};
  const monthlyExpense = snapshot.general.monthlyExpense || 0;
  const monthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const monthlyCashFlow = monthlyTakeHome - monthlyExpense;

  // Monthly growth rates (convert annual to monthly)
  const monthlyGrowth = {
    savings: Math.pow(1 + GROWTH_RATES.SAVINGS, 1/12) - 1,         // 4%
    investments: Math.pow(1 + GROWTH_RATES.INVESTMENTS, 1/12) - 1, // 7%
    other: Math.pow(1 + 0.05, 1/12) - 1,                           // 5% for Other
    realEstate: Math.pow(1 + GROWTH_RATES.REAL_ESTATE, 1/12) - 1,  // 5%
    car: Math.pow(1 + GROWTH_RATES.CAR, 1/12) - 1,                 // -20%
  };

  // Initial bucket values
  let savings = snapshot.investments.savings || 0;

  // Investment accounts (consolidated)
  let investments = (snapshot.investments.ira || 0) +
                    (snapshot.investments.rothIra || 0) +
                    (snapshot.investments.fourOhOneK || 0) +
                    (snapshot.investments.stocksBonds || 0);
  let other = snapshot.investments.other || 0; // Tracked separately for 5% growth

  let realEstateValue = snapshot.investments.realEstate || 0;

  // Car: Fixed depreciation from original value (not compounding)
  const originalCarValue = snapshot.investments.carValue || 0;

  // Debts - categorize by interest rate
  // Each debt now has: balance, interestRate, termMonths, minPayment (calculated)
  let debts = snapshot.debts.map(d => {
    const term = d.termMonths || 60; // Default 5 years if not set
    const minPayment = calculateMonthlyPayment(d.balance, d.interestRate, term);
    return {
      ...d,
      termMonths: term,
      remainingTerm: term, // Track remaining months
      minPayment: minPayment, // Fixed monthly payment
      originalBalance: d.balance, // Store for reference
    };
  });

  // Find mortgage for amortization
  const mortgageDebt = debts.find(d => d.category === 'MORTGAGE');
  let mortgageBalance = mortgageDebt ? mortgageDebt.balance : 0;
  const mortgageRate = mortgageDebt ? mortgageDebt.interestRate : 0;
  const mortgageTerm = mortgageDebt?.termMonths || 360;

  // Calculate fixed monthly mortgage payment using user's term
  let monthlyMortgagePayment = 0;
  if (mortgageBalance > 0 && mortgageRate > 0) {
    monthlyMortgagePayment = calculateMonthlyPayment(mortgageBalance, mortgageRate, mortgageTerm);
  } else if (mortgageBalance > 0) {
    monthlyMortgagePayment = mortgageBalance / mortgageTerm;
  }

  // High interest debts (>10%, excluding mortgage) - with amortization data
  let highInterestDebts = debts.filter(d =>
    d.category !== 'MORTGAGE' && d.balance > 0 && d.interestRate > 10
  );

  // Moderate interest debts (5-10%, excluding mortgage) - with amortization data
  let moderateDebts = debts.filter(d =>
    d.category !== 'MORTGAGE' && d.balance > 0 && d.interestRate >= 5 && d.interestRate <= 10
  );

  // Track total minimum payments (for cash flow freed up when debts paid off)
  const totalMinPayments = highInterestDebts.reduce((sum, d) => sum + d.minPayment, 0) +
                          moderateDebts.reduce((sum, d) => sum + d.minPayment, 0);

  // Targets for waterfall (EF target will adjust with inflation)
  const starterEFTarget = 1000;
  const efMonths = settings.emergencyFundMonths || 6;
  const baseMonthlyExpense = monthlyExpense; // Store for inflation calculations

  // Track box completion
  let box2Complete = savings >= starterEFTarget;
  let box3Complete = !settings.hasEmployerMatch || settings.isGettingMatch;
  let box4Complete = highInterestDebts.reduce((sum, d) => sum + d.balance, 0) === 0;
  let box6Complete = false; // Will check with inflated target
  let box7Complete = moderateDebts.reduce((sum, d) => sum + d.balance, 0) === 0;

  // YTD contribution trackers (reset annually)
  let iraYTD = settings.iraContributionYTD || 0;
  let fourOhOneKYTD = settings.fourOhOneKContributionYTD || 0;
  let hsaYTD = 0;

  const projection = [];

  for (let month = 0; month <= monthsToRetirement; month++) {
    const year = Math.floor(month / 12);
    const monthInYear = month % 12;
    const age = currentAge + (month / 12);

    // Apply inflation to expenses (3% annually)
    const inflationMultiplier = Math.pow(1 + INFLATION_RATE, year);
    const inflatedMonthlyExpense = baseMonthlyExpense * inflationMultiplier;

    // Full EF target adjusts with inflation to maintain purchasing power
    const fullEFTarget = inflatedMonthlyExpense * efMonths + starterEFTarget;
    box6Complete = savings >= fullEFTarget;

    // Reset YTD at start of each year
    if (month > 0 && monthInYear === 0) {
      iraYTD = 0;
      fourOhOneKYTD = 0;
      hsaYTD = 0;
    }

    // CAR: Fixed 20% annual depreciation from ORIGINAL value
    // Year 0: 100%, Year 1: 80%, Year 2: 60%, Year 3: 40%, Year 4: 20%, Year 5+: 0
    const yearsElapsed = month / 12;
    const carDepreciationPercent = Math.max(0, 1 - (0.20 * yearsElapsed));
    const carValue = originalCarValue * carDepreciationPercent;

    // Calculate current totals
    const highInterestTotal = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
    const moderateTotal = moderateDebts.reduce((sum, d) => sum + d.balance, 0);

    // Real estate equity = property value - mortgage
    const realEstateEquity = realEstateValue - mortgageBalance;

    // Net worth = assets - debts
    const totalAssets = savings + investments + other + realEstateValue + carValue;
    const totalDebts = mortgageBalance + highInterestTotal + moderateTotal;
    const netWorth = totalAssets - totalDebts;

    // Store snapshot
    projection.push({
      month,
      year,
      monthInYear,
      age: Math.round(age * 100) / 100,
      // 6 Buckets for chart
      savings: Math.round(savings),
      investments: Math.round(investments + other), // Combined for display
      realEstateEquity: Math.round(realEstateEquity),
      car: Math.round(carValue),
      highInterestDebt: Math.round(-highInterestTotal), // Negative for chart
      moderateDebt: Math.round(-moderateTotal), // Negative for chart
      // Additional detail
      realEstateValue: Math.round(realEstateValue),
      mortgageBalance: Math.round(mortgageBalance),
      other: Math.round(other),
      // Totals
      totalAssets: Math.round(totalAssets),
      totalDebts: Math.round(totalDebts),
      netWorth: Math.round(netWorth),
    });

    // Skip calculations for final month
    if (month === monthsToRetirement) break;

    // === APPLY GROWTH ===

    // Savings: 4% annual growth
    savings *= (1 + monthlyGrowth.savings);

    // Investments: 7% annual growth
    investments *= (1 + monthlyGrowth.investments);

    // Other: 5% annual growth
    other *= (1 + monthlyGrowth.other);

    // Real Estate: 5% appreciation
    realEstateValue *= (1 + monthlyGrowth.realEstate);

    // Car: Fixed depreciation handled at start of loop (no action needed here)

    // === APPLY DEBT AMORTIZATION (Interest + Principal from minimum payments) ===

    // Mortgage: Standard amortization with fixed payment
    if (mortgageBalance > 0) {
      const interestPayment = calculateInterestPortion(mortgageBalance, mortgageRate);
      const principalPayment = Math.min(monthlyMortgagePayment - interestPayment, mortgageBalance);
      mortgageBalance = Math.max(0, mortgageBalance - principalPayment);
    }

    // High interest debt: Apply minimum payment (interest + principal)
    // This is the key fix - debts amortize down, not grow forever
    highInterestDebts = highInterestDebts.map(d => {
      if (d.balance <= 0 || d.remainingTerm <= 0) {
        return { ...d, balance: 0, remainingTerm: 0 };
      }
      const interestPortion = calculateInterestPortion(d.balance, d.interestRate);
      const principalPortion = Math.min(d.minPayment - interestPortion, d.balance);
      const newBalance = Math.max(0, d.balance - principalPortion);
      return {
        ...d,
        balance: newBalance,
        remainingTerm: d.remainingTerm - 1,
      };
    });

    // Moderate debt: Apply minimum payment (interest + principal)
    moderateDebts = moderateDebts.map(d => {
      if (d.balance <= 0 || d.remainingTerm <= 0) {
        return { ...d, balance: 0, remainingTerm: 0 };
      }
      const interestPortion = calculateInterestPortion(d.balance, d.interestRate);
      const principalPortion = Math.min(d.minPayment - interestPortion, d.balance);
      const newBalance = Math.max(0, d.balance - principalPortion);
      return {
        ...d,
        balance: newBalance,
        remainingTerm: d.remainingTerm - 1,
      };
    });

    // Calculate freed cash flow from paid-off debts
    // This is the minimum payments that are no longer needed
    const currentHighMinPayments = highInterestDebts.filter(d => d.balance > 0).reduce((sum, d) => sum + d.minPayment, 0);
    const currentModMinPayments = moderateDebts.filter(d => d.balance > 0).reduce((sum, d) => sum + d.minPayment, 0);
    const freedCashFlow = totalMinPayments - currentHighMinPayments - currentModMinPayments;

    // === ALLOCATE CASH FLOW (WATERFALL) ===
    // Base cash flow + any freed cash flow from paid-off debts
    let remaining = monthlyCashFlow + freedCashFlow;
    if (remaining <= 0) continue;

    // Box 2: Starter Emergency Fund ($1,000)
    if (!box2Complete) {
      const needed = Math.max(0, starterEFTarget - savings);
      const alloc = Math.min(remaining, needed);
      savings += alloc;
      remaining -= alloc;
      box2Complete = savings >= starterEFTarget;
      if (remaining <= 0) continue;
    }

    // Box 3: Employer Match (contribution to 401k)
    if (!box3Complete && settings.hasEmployerMatch) {
      const matchPercent = settings.employerMatchPercent || 0;
      const monthlyGross = snapshot.general.annualIncome / 12;
      const matchContribution = (matchPercent / 100) * monthlyGross;
      const alloc = Math.min(remaining, matchContribution);
      investments += alloc; // 401k goes to investments
      fourOhOneKYTD += alloc;
      remaining -= alloc;
      box3Complete = true;
      if (remaining <= 0) continue;
    }

    // Box 4 (Foundation): Full Emergency Fund
    if (!box6Complete) {
      const needed = Math.max(0, fullEFTarget - savings);
      const alloc = Math.min(remaining, needed);
      savings += alloc;
      remaining -= alloc;
      box6Complete = savings >= fullEFTarget;
      if (remaining <= 0) continue;
    }

    // === FLEXIBLE BOXES (Dynamic order based on user preferences) ===
    // Get the user's preferred order from localStorage
    const flexibleOrder = getProjectionFlexibleOrder();

    // Process each flexible box in the user's preferred order
    for (const boxKey of flexibleOrder) {
      if (remaining <= 0) break;

      switch (boxKey) {
        case 'highInterestDebt':
          // High Interest Debt (>10%)
          if (!box4Complete) {
            const totalHigh = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
            if (totalHigh > 0) {
              const alloc = Math.min(remaining, totalHigh);
              let toPayOff = alloc;
              for (let i = 0; i < highInterestDebts.length && toPayOff > 0; i++) {
                const payment = Math.min(toPayOff, highInterestDebts[i].balance);
                highInterestDebts[i].balance -= payment;
                toPayOff -= payment;
              }
              remaining -= alloc;
            }
            box4Complete = highInterestDebts.reduce((sum, d) => sum + d.balance, 0) === 0;
          }
          break;

        case 'hsaIra':
          // HSA & IRA
          const hasHSA = settings.hasHSA && !settings.isContributingToHSA;
          if (hasHSA) {
            const hsaLimit = CONTRIBUTION_LIMITS.HSA_INDIVIDUAL;
            const hsaRemaining = Math.max(0, hsaLimit - hsaYTD);
            if (hsaRemaining > 0 && remaining > 0) {
              const hsaMonthly = Math.min(remaining, hsaLimit / 12, hsaRemaining);
              investments += hsaMonthly;
              hsaYTD += hsaMonthly;
              remaining -= hsaMonthly;
            }
          }
          const iraLimit = CONTRIBUTION_LIMITS.IRA_COMBINED;
          const iraRemaining = Math.max(0, iraLimit - iraYTD);
          if (iraRemaining > 0 && remaining > 0) {
            const iraMonthly = Math.min(remaining, iraLimit / 12, iraRemaining);
            investments += iraMonthly;
            iraYTD += iraMonthly;
            remaining -= iraMonthly;
          }
          break;

        case 'moderateDebt':
          // Moderate Interest Debt (5-10%)
          if (!box7Complete) {
            const totalMod = moderateDebts.reduce((sum, d) => sum + d.balance, 0);
            if (totalMod > 0) {
              const alloc = Math.min(remaining, totalMod);
              let toPayOff = alloc;
              for (let i = 0; i < moderateDebts.length && toPayOff > 0; i++) {
                const payment = Math.min(toPayOff, moderateDebts[i].balance);
                moderateDebts[i].balance -= payment;
                toPayOff -= payment;
              }
              remaining -= alloc;
            }
            box7Complete = moderateDebts.reduce((sum, d) => sum + d.balance, 0) === 0;
          }
          break;

        case 'max401k':
          // Max 401k
          const fourOhOneKLimit = CONTRIBUTION_LIMITS.FOUR_OH_ONE_K;
          const fourOhOneKRemaining = Math.max(0, fourOhOneKLimit - fourOhOneKYTD);
          if (fourOhOneKRemaining > 0 && remaining > 0) {
            const alloc = Math.min(remaining, fourOhOneKLimit / 12, fourOhOneKRemaining);
            investments += alloc;
            fourOhOneKYTD += alloc;
            remaining -= alloc;
          }
          break;

        case 'taxableInvesting':
          // Taxable Investing (all remaining cash flow)
          if (remaining > 0) {
            investments += remaining;
            remaining = 0;
          }
          break;
      }
    }
  }

  // Calculate summary
  const finalMonth = projection[projection.length - 1];
  const annualExpenses = getFireAnnualExpenses(snapshot);
  const fireTarget = annualExpenses * 25;

  const summary = {
    currentAge,
    retirementAge,
    monthsToRetirement,
    yearsToRetirement: retirementAge - currentAge,
    startingNetWorth: projection[0].netWorth,
    endingNetWorth: finalMonth.netWorth,
    fireTarget,
    onTrack: finalMonth.netWorth >= fireTarget,
    shortfall: fireTarget - finalMonth.netWorth,
    // Bucket summaries at retirement
    endingSavings: finalMonth.savings,
    endingInvestments: finalMonth.investments,
    endingRealEstateEquity: finalMonth.realEstateEquity,
    endingCar: finalMonth.car,
  };

  // Store in window for console access
  window.netWorthProjection = projection;
  window.netWorthSummary = summary;

  console.log('=== NET WORTH PROJECTION ===');
  console.log(`Starting Net Worth: $${summary.startingNetWorth.toLocaleString()}`);
  console.log(`Ending Net Worth at ${retirementAge}: $${summary.endingNetWorth.toLocaleString()}`);
  console.log(`FIRE Target: $${summary.fireTarget.toLocaleString()}`);
  console.log(`Status: ${summary.onTrack ? 'ON TRACK' : 'Shortfall: $' + summary.shortfall.toLocaleString()}`);
  console.log('');
  console.log('Access via: window.netWorthProjection, getNetWorthProjection()');

  return { projection, summary };
}

/**
 * Get net worth projection (recalculates from current state)
 * Call from console: getNetWorthProjection()
 */
function getNetWorthProjection() {
  const { snapshot } = getState();
  return calculateNetWorthProjection(snapshot);
}

/**
 * Get yearly net worth snapshots for cleaner view
 * Call from console: getYearlyNetWorth()
 */
function getYearlyNetWorth() {
  const { snapshot } = getState();
  const result = calculateNetWorthProjection(snapshot);
  if (!result) return null;

  const yearly = result.projection.filter(m => m.monthInYear === 0 || m.month === result.projection.length - 1);

  console.log('=== YEARLY NET WORTH ===');
  console.table(yearly.map(y => ({
    Age: Math.round(y.age),
    'Net Worth': '$' + y.netWorth.toLocaleString(),
    'Savings': '$' + y.savings.toLocaleString(),
    'Investments': '$' + y.investments.toLocaleString(),
    'RE Equity': '$' + y.realEstateEquity.toLocaleString(),
    'Car': '$' + y.car.toLocaleString(),
    'High Debt': '$' + y.highInterestDebt.toLocaleString(),
    'Mod Debt': '$' + y.moderateDebt.toLocaleString(),
  })));

  return yearly;
}

/**
 * Print net worth chart data as HTML report
 * Call from console: printNetWorthChart()
 */
function printNetWorthChart() {
  const { snapshot } = getState();
  const result = calculateNetWorthProjection(snapshot);

  if (!result) {
    alert('No projection data available');
    return;
  }

  const { projection, summary } = result;
  const yearly = projection.filter(m => m.monthInYear === 0 || m.month === projection.length - 1);

  const fmt = (n) => '$' + Math.round(n).toLocaleString();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Financial GPS - Net Worth Projection</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      color: #1a1a1a;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
    }
    .summary-card label {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #666;
      display: block;
      margin-bottom: 0.25rem;
    }
    .summary-card .value { font-size: 1.125rem; font-weight: 600; }
    .on-track { color: #22c55e; }
    .shortfall { color: #ef4444; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: #444; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th, td {
      padding: 0.5rem;
      text-align: right;
      border-bottom: 1px solid #e5e5e5;
    }
    th { background: #f9f9f9; font-weight: 600; }
    th:first-child, td:first-child { text-align: left; }
    tr:hover { background: #fafafa; }
    .negative { color: #ef4444; }
    .bucket-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.8rem;
    }
    .bucket-legend span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .bucket-legend .dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }
    .print-btn {
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>

  <h1>Net Worth Projection</h1>
  <p class="subtitle">6-Bucket Breakdown | Generated ${new Date().toLocaleDateString()}</p>

  <div class="summary-grid">
    <div class="summary-card">
      <label>Current Age</label>
      <div class="value">${summary.currentAge}</div>
    </div>
    <div class="summary-card">
      <label>Retirement Age</label>
      <div class="value">${summary.retirementAge}</div>
    </div>
    <div class="summary-card">
      <label>Starting Net Worth</label>
      <div class="value">${fmt(summary.startingNetWorth)}</div>
    </div>
    <div class="summary-card">
      <label>Ending Net Worth</label>
      <div class="value">${fmt(summary.endingNetWorth)}</div>
    </div>
    <div class="summary-card">
      <label>FIRE Target</label>
      <div class="value">${fmt(summary.fireTarget)}</div>
    </div>
    <div class="summary-card">
      <label>Status</label>
      <div class="value ${summary.onTrack ? 'on-track' : 'shortfall'}">
        ${summary.onTrack ? 'On Track' : 'Shortfall: ' + fmt(summary.shortfall)}
      </div>
    </div>
  </div>

  <div class="bucket-legend">
    <span><span class="dot" style="background: #22c55e;"></span> Savings</span>
    <span><span class="dot" style="background: #3b82f6;"></span> Investments</span>
    <span><span class="dot" style="background: #8b5cf6;"></span> Real Estate Equity</span>
    <span><span class="dot" style="background: #f59e0b;"></span> Car</span>
    <span><span class="dot" style="background: #ef4444;"></span> High Interest Debt</span>
    <span><span class="dot" style="background: #f97316;"></span> Moderate Debt</span>
  </div>

  <h2>Yearly Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Age</th>
        <th>Net Worth</th>
        <th>Savings</th>
        <th>Investments</th>
        <th>RE Equity</th>
        <th>Car</th>
        <th>High Debt</th>
        <th>Mod Debt</th>
      </tr>
    </thead>
    <tbody>
      ${yearly.map(y => `
        <tr>
          <td>${Math.round(y.age)}</td>
          <td>${fmt(y.netWorth)}</td>
          <td>${fmt(y.savings)}</td>
          <td>${fmt(y.investments)}</td>
          <td>${fmt(y.realEstateEquity)}</td>
          <td>${fmt(y.car)}</td>
          <td class="${y.highInterestDebt < 0 ? 'negative' : ''}">${fmt(y.highInterestDebt)}</td>
          <td class="${y.moderateDebt < 0 ? 'negative' : ''}">${fmt(y.moderateDebt)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Assumptions</h2>
  <ul style="margin-left: 1.5rem; font-size: 0.8rem; color: #666;">
    <li>Savings: 4% annual growth (HYSA)</li>
    <li>Investments: 7% annual growth</li>
    <li>Other Assets: 5% annual growth</li>
    <li>Real Estate: 5% annual appreciation</li>
    <li>Car: 20% annual depreciation</li>
    <li>Mortgage: 30-year amortization</li>
    <li>Monthly cash flow: ${fmt(snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense)}</li>
  </ul>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export net worth projection to CSV
 * Call from console: exportNetWorthCSV()
 */
function exportNetWorthCSV() {
  const { snapshot } = getState();
  const result = calculateNetWorthProjection(snapshot);

  if (!result) {
    alert('No projection data available');
    return;
  }

  const headers = [
    'Month', 'Age', 'Net Worth',
    'Savings', 'Investments', 'RE Equity', 'Car',
    'High Interest Debt', 'Moderate Debt',
    'RE Value', 'Mortgage Balance', 'Total Assets', 'Total Debts'
  ];

  const rows = result.projection.map(p => [
    p.month, p.age.toFixed(2), p.netWorth,
    p.savings, p.investments, p.realEstateEquity, p.car,
    p.highInterestDebt, p.moderateDebt,
    p.realEstateValue, p.mortgageBalance, p.totalAssets, p.totalDebts
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `net-worth-projection-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  console.log('Net worth CSV exported successfully!');
}

/**
 * COMBINED VERIFICATION PROJECTION
 * Shows waterfall allocations AND net worth changes in one table
 * Use this to verify all math is correct
 *
 * Car depreciation: Fixed 20% annual from ORIGINAL value (not compounding)
 *   Year 0: 100% of original
 *   Year 1: 80% of original
 *   Year 2: 60% of original
 *   Year 3: 40% of original
 *   Year 4: 20% of original
 *   Year 5+: 0
 *
 * Call from console: getVerificationTable() or printVerificationTable()
 */
function calculateVerificationProjection(snapshot) {
  const currentAge = snapshot.general.age || 30;
  const retirementAge = snapshot.general.targetRetirement || 65;
  const monthsToRetirement = (retirementAge - currentAge) * 12;

  if (monthsToRetirement <= 0) return null;

  const settings = snapshot.fireSettings || {};

  // Base income/expenses (will inflate annually)
  const baseMonthlyExpense = snapshot.general.monthlyExpense || 0;
  const baseMonthlyTakeHome = snapshot.general.monthlyTakeHome || 0;
  const baseAnnualIncome = snapshot.general.annualIncome || 0;

  // Monthly growth rates
  const monthlyGrowth = {
    savings: Math.pow(1 + GROWTH_RATES.SAVINGS, 1/12) - 1,
    investments: Math.pow(1 + GROWTH_RATES.INVESTMENTS, 1/12) - 1,
    other: Math.pow(1 + 0.05, 1/12) - 1,
    realEstate: Math.pow(1 + GROWTH_RATES.REAL_ESTATE, 1/12) - 1,
  };

  // Initial values - SPLIT retirement vs non-retirement
  let savings = snapshot.investments.savings || 0;

  // Retirement accounts (401k, IRA, Roth IRA) - typically not accessible before 59.5
  let retirementAccounts = (snapshot.investments.ira || 0) +
                           (snapshot.investments.rothIra || 0) +
                           (snapshot.investments.fourOhOneK || 0);

  // Taxable/non-retirement accounts (stocks/bonds, HSA, Box 9 contributions)
  let taxableAccounts = snapshot.investments.stocksBonds || 0;

  let other = snapshot.investments.other || 0;
  let realEstateValue = snapshot.investments.realEstate || 0;

  // Car: Fixed depreciation from original value
  const originalCarValue = snapshot.investments.carValue || 0;

  // Debts - with amortization data
  let debts = snapshot.debts.map(d => {
    const term = d.termMonths || 60;
    const minPayment = calculateMonthlyPayment(d.balance, d.interestRate, term);
    return {
      ...d,
      termMonths: term,
      remainingTerm: term,
      minPayment: minPayment,
      originalBalance: d.balance,
    };
  });

  const mortgageDebt = debts.find(d => d.category === 'MORTGAGE');
  let mortgageBalance = mortgageDebt ? mortgageDebt.balance : 0;
  const mortgageRate = mortgageDebt ? mortgageDebt.interestRate : 0;
  const mortgageTerm = mortgageDebt?.termMonths || 360;

  // Mortgage payment using user's term
  let monthlyMortgagePayment = 0;
  if (mortgageBalance > 0 && mortgageRate > 0) {
    monthlyMortgagePayment = calculateMonthlyPayment(mortgageBalance, mortgageRate, mortgageTerm);
  } else if (mortgageBalance > 0) {
    monthlyMortgagePayment = mortgageBalance / mortgageTerm;
  }

  let highInterestDebts = debts.filter(d => d.category !== 'MORTGAGE' && d.balance > 0 && d.interestRate > 10);
  let moderateDebts = debts.filter(d => d.category !== 'MORTGAGE' && d.balance > 0 && d.interestRate >= 5 && d.interestRate <= 10);

  // Track total minimum payments for freed cash flow calculation
  const totalMinPayments = highInterestDebts.reduce((sum, d) => sum + d.minPayment, 0) +
                          moderateDebts.reduce((sum, d) => sum + d.minPayment, 0);

  // Targets (starter EF is fixed, full EF recalculated with inflation)
  const starterEFTarget = 1000;
  const efMonths = settings.emergencyFundMonths || 6;

  // Box completion tracking
  let box2Complete = savings >= starterEFTarget;
  let box3Complete = !settings.hasEmployerMatch || settings.isGettingMatch;
  let box4Complete = highInterestDebts.reduce((sum, d) => sum + d.balance, 0) === 0;
  let box6Complete = false; // Will check with inflated expenses
  let box7Complete = moderateDebts.reduce((sum, d) => sum + d.balance, 0) === 0;

  // YTD trackers
  let iraYTD = settings.iraContributionYTD || 0;
  let fourOhOneKYTD = settings.fourOhOneKContributionYTD || 0;
  let hsaYTD = 0;

  const projection = [];

  for (let month = 0; month <= monthsToRetirement; month++) {
    const year = Math.floor(month / 12);
    const monthInYear = month % 12;
    const age = currentAge + (month / 12);

    // Apply 3% annual inflation to income and expenses
    const inflationMultiplier = Math.pow(1 + INFLATION_RATE, year);
    const monthlyTakeHome = baseMonthlyTakeHome * inflationMultiplier;
    const monthlyExpense = baseMonthlyExpense * inflationMultiplier;
    const annualIncome = baseAnnualIncome * inflationMultiplier;
    const monthlyCashFlow = monthlyTakeHome - monthlyExpense;

    // Full EF target adjusts with inflation
    const fullEFTarget = monthlyExpense * efMonths + starterEFTarget;

    // Reset YTD at start of each year
    if (month > 0 && monthInYear === 0) {
      iraYTD = 0;
      fourOhOneKYTD = 0;
      hsaYTD = 0;
    }

    // CAR: Fixed 20% annual depreciation from ORIGINAL value
    // Each year loses 20% of original, floor at 0
    const yearsElapsed = month / 12;
    const carDepreciationPercent = Math.max(0, 1 - (0.20 * yearsElapsed));
    const carValue = originalCarValue * carDepreciationPercent;

    // Current debt totals
    const highInterestTotal = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
    const moderateTotal = moderateDebts.reduce((sum, d) => sum + d.balance, 0);
    const realEstateEquity = realEstateValue - mortgageBalance;

    // Net worth - using split retirement/taxable accounts
    const totalAssets = savings + retirementAccounts + taxableAccounts + other + realEstateValue + carValue;
    const totalDebts = mortgageBalance + highInterestTotal + moderateTotal;
    const netWorth = totalAssets - totalDebts;

    // Previous month for delta calculations
    const prevMonth = projection.length > 0 ? projection[projection.length - 1] : null;

    // Store snapshot WITH waterfall allocations for this month
    const row = {
      month,
      year,
      monthInYear,
      age: Math.round(age * 100) / 100,

      // Income/expense with inflation
      monthlyTakeHome: Math.round(monthlyTakeHome),
      monthlyExpense: Math.round(monthlyExpense),
      cashFlow: Math.round(monthlyCashFlow),

      // Waterfall allocations (will be filled below)
      box2Alloc: 0,
      box3Alloc: 0,
      box4Alloc: 0,
      box5HSA: 0,
      box5IRA: 0,
      box6Alloc: 0,
      box7Alloc: 0,
      box8Alloc: 0,
      box9Alloc: 0,

      // Growth/interest (will be filled below)
      savingsGrowth: 0,
      retirementGrowth: 0,
      taxableGrowth: 0,
      otherGrowth: 0,
      realEstateGrowth: 0,
      carDepreciation: 0,
      mortgagePrincipal: 0,
      highDebtInterest: 0,
      modDebtInterest: 0,

      // Ending balances - SPLIT retirement vs taxable
      savings: Math.round(savings),
      retirementAccounts: Math.round(retirementAccounts),  // 401k, IRA, Roth - locked until 59.5
      taxableAccounts: Math.round(taxableAccounts + other), // Stocks/bonds, HSA, Other - accessible anytime
      realEstateValue: Math.round(realEstateValue),
      realEstateEquity: Math.round(realEstateEquity),
      mortgageBalance: Math.round(mortgageBalance),
      car: Math.round(carValue),
      highInterestDebt: Math.round(highInterestTotal),
      moderateDebt: Math.round(moderateTotal),

      // Totals
      totalAssets: Math.round(totalAssets),
      totalDebts: Math.round(totalDebts),
      netWorth: Math.round(netWorth),
      netWorthDelta: prevMonth ? Math.round(netWorth - prevMonth.netWorth) : 0,
    };

    projection.push(row);

    // Skip calculations for final month
    if (month === monthsToRetirement) break;

    // === TRACK GROWTH BEFORE APPLYING ===
    const savingsGrowth = savings * monthlyGrowth.savings;
    const retirementGrowth = retirementAccounts * monthlyGrowth.investments;
    const taxableGrowth = taxableAccounts * monthlyGrowth.investments;
    const otherGrowth = other * monthlyGrowth.other;
    const realEstateGrowth = realEstateValue * monthlyGrowth.realEstate;

    // Car depreciation delta (for next month)
    const nextYearsElapsed = (month + 1) / 12;
    const nextCarPercent = Math.max(0, 1 - (0.20 * nextYearsElapsed));
    const carDepreciation = (originalCarValue * carDepreciationPercent) - (originalCarValue * nextCarPercent);

    // === APPLY GROWTH ===
    savings += savingsGrowth;
    retirementAccounts += retirementGrowth;
    taxableAccounts += taxableGrowth;
    other += otherGrowth;
    realEstateValue += realEstateGrowth;

    // === MORTGAGE AMORTIZATION ===
    let mortgagePrincipal = 0;
    if (mortgageBalance > 0) {
      const interestPayment = calculateInterestPortion(mortgageBalance, mortgageRate);
      mortgagePrincipal = Math.min(monthlyMortgagePayment - interestPayment, mortgageBalance);
      mortgageBalance = Math.max(0, mortgageBalance - mortgagePrincipal);
    }

    // === DEBT AMORTIZATION (using PMT formula) ===
    // High interest debts: Apply minimum payment (interest + principal)
    let highDebtInterest = 0;
    highInterestDebts = highInterestDebts.map(d => {
      if (d.balance <= 0 || d.remainingTerm <= 0) {
        return { ...d, balance: 0, remainingTerm: 0 };
      }
      const interestPortion = calculateInterestPortion(d.balance, d.interestRate);
      highDebtInterest += interestPortion;
      const principalPortion = Math.min(d.minPayment - interestPortion, d.balance);
      const newBalance = Math.max(0, d.balance - principalPortion);
      return {
        ...d,
        balance: newBalance,
        remainingTerm: d.remainingTerm - 1,
      };
    });

    // Moderate debts: Apply minimum payment (interest + principal)
    let modDebtInterest = 0;
    moderateDebts = moderateDebts.map(d => {
      if (d.balance <= 0 || d.remainingTerm <= 0) {
        return { ...d, balance: 0, remainingTerm: 0 };
      }
      const interestPortion = calculateInterestPortion(d.balance, d.interestRate);
      modDebtInterest += interestPortion;
      const principalPortion = Math.min(d.minPayment - interestPortion, d.balance);
      const newBalance = Math.max(0, d.balance - principalPortion);
      return {
        ...d,
        balance: newBalance,
        remainingTerm: d.remainingTerm - 1,
      };
    });

    // Calculate freed cash flow from paid-off debts
    const currentHighMinPayments = highInterestDebts.filter(d => d.balance > 0).reduce((sum, d) => sum + d.minPayment, 0);
    const currentModMinPayments = moderateDebts.filter(d => d.balance > 0).reduce((sum, d) => sum + d.minPayment, 0);
    const freedCashFlow = totalMinPayments - currentHighMinPayments - currentModMinPayments;

    // === WATERFALL ALLOCATIONS ===
    // Get user's flexible box order from localStorage
    const flexibleOrder = getProjectionFlexibleOrder();

    // Base cash flow + any freed cash flow from paid-off debts
    let remaining = monthlyCashFlow + freedCashFlow;
    let box2Alloc = 0, box3Alloc = 0, box4Alloc = 0;
    let box5HSA = 0, box5IRA = 0;
    let box6Alloc = 0, box7Alloc = 0, box8Alloc = 0, box9Alloc = 0;

    if (remaining > 0) {
      // ===== FOUNDATION SECTION (Fixed Order) =====

      // Box 2: Starter Emergency Fund - Always first
      if (!box2Complete) {
        const needed = Math.max(0, starterEFTarget - savings);
        box2Alloc = Math.min(remaining, needed);
        savings += box2Alloc;
        remaining -= box2Alloc;
        box2Complete = savings >= starterEFTarget;
      }

      // Box 3: Employer Match (uses inflated income) - goes to RETIREMENT (401k) - Always second
      if (remaining > 0 && !box3Complete && settings.hasEmployerMatch) {
        const matchPercent = settings.employerMatchPercent || 0;
        const monthlyGross = annualIncome / 12;
        const matchContribution = (matchPercent / 100) * monthlyGross;
        box3Alloc = Math.min(remaining, matchContribution);
        retirementAccounts += box3Alloc;
        fourOhOneKYTD += box3Alloc;
        remaining -= box3Alloc;
        box3Complete = true;
      }

      // Box 6: Full Emergency Fund - Always third (before flexible boxes)
      if (remaining > 0 && !box6Complete) {
        const needed = Math.max(0, fullEFTarget - savings);
        box6Alloc = Math.min(remaining, needed);
        savings += box6Alloc;
        remaining -= box6Alloc;
        box6Complete = savings >= fullEFTarget;
      }

      // ===== FLEXIBLE SECTION (User-Defined Order) =====
      // Process boxes in the order specified by the user via drag-and-drop

      for (const boxKey of flexibleOrder) {
        if (remaining <= 0) break;

        switch (boxKey) {
          case 'highInterestDebt': {
            // Box 4: High Interest Debt
            if (!box4Complete) {
              const totalHigh = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
              if (totalHigh > 0) {
                box4Alloc = Math.min(remaining, totalHigh);
                let toPayOff = box4Alloc;
                for (let i = 0; i < highInterestDebts.length && toPayOff > 0; i++) {
                  const payment = Math.min(toPayOff, highInterestDebts[i].balance);
                  highInterestDebts[i].balance -= payment;
                  toPayOff -= payment;
                }
                remaining -= box4Alloc;
              }
              box4Complete = highInterestDebts.reduce((sum, d) => sum + d.balance, 0) === 0;
            }
            break;
          }

          case 'hsaIra': {
            // Box 5: HSA & IRA
            // HSA goes to TAXABLE (accessible anytime for medical, or after 65 for anything)
            const hasHSA = settings.hasHSA && !settings.isContributingToHSA;
            if (hasHSA && remaining > 0) {
              const hsaLimit = CONTRIBUTION_LIMITS.HSA_INDIVIDUAL;
              const hsaRemaining = Math.max(0, hsaLimit - hsaYTD);
              if (hsaRemaining > 0) {
                box5HSA = Math.min(remaining, hsaLimit / 12, hsaRemaining);
                taxableAccounts += box5HSA;
                hsaYTD += box5HSA;
                remaining -= box5HSA;
              }
            }

            // IRA goes to RETIREMENT (locked until 59.5)
            if (remaining > 0) {
              const iraLimit = CONTRIBUTION_LIMITS.IRA_COMBINED;
              const iraRemaining = Math.max(0, iraLimit - iraYTD);
              if (iraRemaining > 0) {
                box5IRA = Math.min(remaining, iraLimit / 12, iraRemaining);
                retirementAccounts += box5IRA;
                iraYTD += box5IRA;
                remaining -= box5IRA;
              }
            }
            break;
          }

          case 'moderateDebt': {
            // Box 7: Moderate Interest Debt
            if (!box7Complete) {
              const totalMod = moderateDebts.reduce((sum, d) => sum + d.balance, 0);
              if (totalMod > 0) {
                box7Alloc = Math.min(remaining, totalMod);
                let toPayOff = box7Alloc;
                for (let i = 0; i < moderateDebts.length && toPayOff > 0; i++) {
                  const payment = Math.min(toPayOff, moderateDebts[i].balance);
                  moderateDebts[i].balance -= payment;
                  toPayOff -= payment;
                }
                remaining -= box7Alloc;
              }
              box7Complete = moderateDebts.reduce((sum, d) => sum + d.balance, 0) === 0;
            }
            break;
          }

          case 'max401k': {
            // Box 8: Max 401k - goes to RETIREMENT (locked until 59.5)
            const fourOhOneKLimit = CONTRIBUTION_LIMITS.FOUR_OH_ONE_K;
            const fourOhOneKRemaining = Math.max(0, fourOhOneKLimit - fourOhOneKYTD);
            if (fourOhOneKRemaining > 0 && remaining > 0) {
              box8Alloc = Math.min(remaining, fourOhOneKLimit / 12, fourOhOneKRemaining);
              retirementAccounts += box8Alloc;
              fourOhOneKYTD += box8Alloc;
              remaining -= box8Alloc;
            }
            break;
          }

          case 'taxableInvesting': {
            // Box 9: Taxable Investing - goes to TAXABLE (accessible anytime)
            if (remaining > 0) {
              box9Alloc = remaining;
              taxableAccounts += box9Alloc;
              remaining = 0;
            }
            break;
          }
        }
      }
    }

    // Update the NEXT month's row with this month's allocations/growth
    // (We'll store in current row for display, representing what happened this month)
    row.box2Alloc = Math.round(box2Alloc);
    row.box3Alloc = Math.round(box3Alloc);
    row.box4Alloc = Math.round(box4Alloc);
    row.box5HSA = Math.round(box5HSA);
    row.box5IRA = Math.round(box5IRA);
    row.box6Alloc = Math.round(box6Alloc);
    row.box7Alloc = Math.round(box7Alloc);
    row.box8Alloc = Math.round(box8Alloc);
    row.box9Alloc = Math.round(box9Alloc);
    row.savingsGrowth = Math.round(savingsGrowth);
    row.retirementGrowth = Math.round(retirementGrowth);
    row.taxableGrowth = Math.round(taxableGrowth);
    row.otherGrowth = Math.round(otherGrowth);
    row.realEstateGrowth = Math.round(realEstateGrowth);
    row.carDepreciation = Math.round(carDepreciation);
    row.mortgagePrincipal = Math.round(mortgagePrincipal);
    row.highDebtInterest = Math.round(highDebtInterest);
    row.modDebtInterest = Math.round(modDebtInterest);
  }

  // Summary
  const finalMonth = projection[projection.length - 1];
  // Use custom FIRE expense target (inflation-adjusted) or ending inflated expenses
  const customFireExpenses = snapshot.fireSettings?.fireAnnualExpenseTarget;
  let endingAnnualExpenses;
  if (customFireExpenses && customFireExpenses > 0) {
    const yearsToRetirement = retirementAge - currentAge;
    endingAnnualExpenses = customFireExpenses * Math.pow(1 + INFLATION_RATE, yearsToRetirement);
  } else {
    endingAnnualExpenses = finalMonth.monthlyExpense * 12;
  }
  const fireTarget = endingAnnualExpenses * 25;

  const summary = {
    currentAge,
    retirementAge,
    monthsToRetirement,
    inflationRate: INFLATION_RATE,
    // Starting values (Year 0)
    startingMonthlyTakeHome: Math.round(baseMonthlyTakeHome),
    startingMonthlyExpense: Math.round(baseMonthlyExpense),
    startingMonthlyCashFlow: Math.round(baseMonthlyTakeHome - baseMonthlyExpense),
    // Ending values (with inflation)
    endingMonthlyTakeHome: finalMonth.monthlyTakeHome,
    endingMonthlyExpense: finalMonth.monthlyExpense,
    endingMonthlyCashFlow: finalMonth.cashFlow,
    starterEFTarget,
    endingFullEFTarget: Math.round(finalMonth.monthlyExpense * efMonths + starterEFTarget),
    originalCarValue,
    monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
    startingNetWorth: projection[0].netWorth,
    endingNetWorth: finalMonth.netWorth,
    fireTarget: Math.round(fireTarget),
    onTrack: finalMonth.netWorth >= fireTarget,
  };

  window.verificationProjection = projection;
  window.verificationSummary = summary;

  return { projection, summary };
}

/**
 * Get verification table (recalculates)
 * Call from console: getVerificationTable()
 */
function getVerificationTable() {
  const { snapshot } = getState();
  const result = calculateVerificationProjection(snapshot);
  if (!result) return null;

  console.log('=== VERIFICATION SUMMARY ===');
  console.log(`Inflation Rate: ${(result.summary.inflationRate * 100).toFixed(0)}% annually`);
  console.log('');
  console.log('Starting (Year 0):');
  console.log('  Monthly Take-Home: $' + result.summary.startingMonthlyTakeHome.toLocaleString());
  console.log('  Monthly Expense: $' + result.summary.startingMonthlyExpense.toLocaleString());
  console.log('  Monthly Cash Flow: $' + result.summary.startingMonthlyCashFlow.toLocaleString());
  console.log('  Net Worth: $' + result.summary.startingNetWorth.toLocaleString());
  console.log('');
  console.log(`Ending (Age ${result.summary.retirementAge}):`);
  console.log('  Monthly Take-Home: $' + result.summary.endingMonthlyTakeHome.toLocaleString());
  console.log('  Monthly Expense: $' + result.summary.endingMonthlyExpense.toLocaleString());
  console.log('  Monthly Cash Flow: $' + result.summary.endingMonthlyCashFlow.toLocaleString());
  console.log('  Net Worth: $' + result.summary.endingNetWorth.toLocaleString());
  console.log('    - Retirement (locked): $' + result.projection[result.projection.length-1].retirementAccounts.toLocaleString());
  console.log('    - Taxable (accessible): $' + result.projection[result.projection.length-1].taxableAccounts.toLocaleString());
  console.log('');
  console.log('FIRE Target (4% rule): $' + result.summary.fireTarget.toLocaleString());
  console.log('');
  console.log('First 12 months with waterfall + growth breakdown:');
  console.table(result.projection.slice(0, 13).map(p => ({
    Mo: p.month,
    'NW': '$' + p.netWorth.toLocaleString(),
    'Delta': '$' + p.netWorthDelta.toLocaleString(),
    'Retire': '$' + p.retirementAccounts.toLocaleString(),
    'Taxable': '$' + p.taxableAccounts.toLocaleString(),
    'B2': p.box2Alloc,
    'B3': p.box3Alloc,
    'B4': p.box4Alloc,
    'B5H': p.box5HSA,
    'B5I': p.box5IRA,
    'B6': p.box6Alloc,
    'B7': p.box7Alloc,
    'B8': p.box8Alloc,
    'B9': p.box9Alloc,
  })));
  console.log('');
  console.log('Export functions:');
  console.log('  printVerificationTable() - Open printable HTML table in new window');
  console.log('  exportVerificationCSV() - Download CSV file');

  return result;
}

/**
 * Print detailed verification table
 * Call from console: printVerificationTable()
 */
function printVerificationTable() {
  const { snapshot } = getState();
  const result = calculateVerificationProjection(snapshot);

  if (!result) {
    alert('No projection data available');
    return;
  }

  const { projection, summary } = result;
  const fmt = (n) => '$' + Math.round(n).toLocaleString();
  const fmtDelta = (n) => (n >= 0 ? '+' : '') + '$' + Math.round(n).toLocaleString();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Financial GPS - Verification Table</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      padding: 1rem;
      font-size: 10px;
      color: #1a1a1a;
    }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 6px;
    }
    .summary-item { }
    .summary-item label { font-size: 9px; color: #666; text-transform: uppercase; }
    .summary-item .value { font-size: 12px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 3px 4px; text-align: right; border: 1px solid #ddd; white-space: nowrap; }
    th { background: #f0f0f0; font-weight: 600; font-size: 9px; position: sticky; top: 0; }
    td:first-child, th:first-child { text-align: center; }
    tr:nth-child(12n+1) { background: #f9f9f9; }
    tr:hover { background: #fffbeb; }
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
    .section-header { background: #e0e0e0 !important; font-weight: bold; }
    .print-btn {
      position: fixed; top: 1rem; right: 1rem;
      padding: 0.5rem 1rem; background: #2563eb; color: white;
      border: none; border-radius: 6px; cursor: pointer;
    }
    @media print { .print-btn { display: none; } body { font-size: 8px; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>

  <h1>Verification Table - Waterfall + Net Worth</h1>
  <p class="subtitle">All allocations and growth tracked | ${(summary.inflationRate * 100).toFixed(0)}% annual inflation | Generated ${new Date().toLocaleDateString()}</p>

  <div class="summary">
    <div class="summary-item"><label>Inflation Rate</label><div class="value">${(summary.inflationRate * 100).toFixed(0)}%/yr</div></div>
    <div class="summary-item"><label>Start Cash Flow</label><div class="value">${fmt(summary.startingMonthlyCashFlow)}</div></div>
    <div class="summary-item"><label>End Cash Flow</label><div class="value">${fmt(summary.endingMonthlyCashFlow)}</div></div>
    <div class="summary-item"><label>Start Expense</label><div class="value">${fmt(summary.startingMonthlyExpense)}</div></div>
    <div class="summary-item"><label>End Expense</label><div class="value">${fmt(summary.endingMonthlyExpense)}</div></div>
    <div class="summary-item"><label>Starter EF</label><div class="value">${fmt(summary.starterEFTarget)}</div></div>
    <div class="summary-item"><label>End Full EF</label><div class="value">${fmt(summary.endingFullEFTarget)}</div></div>
    <div class="summary-item"><label>Mortgage Pmt</label><div class="value">${fmt(summary.monthlyMortgagePayment)}</div></div>
    <div class="summary-item"><label>Start Net Worth</label><div class="value">${fmt(summary.startingNetWorth)}</div></div>
    <div class="summary-item"><label>End Net Worth</label><div class="value">${fmt(summary.endingNetWorth)}</div></div>
    <div class="summary-item"><label>FIRE Target</label><div class="value">${fmt(summary.fireTarget)}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Mo</th>
        <th>Age</th>
        <th colspan="3" style="background:#f0e8ff;">Income/Expense</th>
        <th colspan="9" style="background:#e8f4ff;">Waterfall Allocations</th>
        <th colspan="8" style="background:#fff4e8;">Growth/Changes</th>
        <th colspan="7" style="background:#e8ffe8;">Ending Balances</th>
        <th colspan="2" style="background:#ffe8ff;">Net Worth</th>
      </tr>
      <tr>
        <th></th>
        <th></th>
        <th>Inc</th><th>Exp</th><th>CF</th>
        <th>B2</th><th>B3</th><th>B4</th><th>B5-H</th><th>B5-I</th><th>B6</th><th>B7</th><th>B8</th><th>B9</th>
        <th>Sav+</th><th>Ret+</th><th>Tax+</th><th>Oth+</th><th>RE+</th><th>Car-</th><th>MtgP</th><th>Debt+</th>
        <th>Sav</th><th>Retire</th><th>Taxable</th><th>RE Eq</th><th>Car</th><th>HiDbt</th><th>ModDbt</th>
        <th>NW</th><th>Delta</th>
      </tr>
    </thead>
    <tbody>
      ${projection.map(p => `
        <tr>
          <td>${p.month}</td>
          <td>${p.age.toFixed(1)}</td>
          <td>${fmt(p.monthlyTakeHome)}</td>
          <td>${fmt(p.monthlyExpense)}</td>
          <td>${fmt(p.cashFlow)}</td>
          <td>${p.box2Alloc || '-'}</td>
          <td>${p.box3Alloc || '-'}</td>
          <td>${p.box4Alloc || '-'}</td>
          <td>${p.box5HSA || '-'}</td>
          <td>${p.box5IRA || '-'}</td>
          <td>${p.box6Alloc || '-'}</td>
          <td>${p.box7Alloc || '-'}</td>
          <td>${p.box8Alloc || '-'}</td>
          <td>${p.box9Alloc || '-'}</td>
          <td class="positive">${p.savingsGrowth || '-'}</td>
          <td class="positive">${p.retirementGrowth || '-'}</td>
          <td class="positive">${p.taxableGrowth || '-'}</td>
          <td class="positive">${p.otherGrowth || '-'}</td>
          <td class="positive">${p.realEstateGrowth || '-'}</td>
          <td class="negative">${p.carDepreciation ? -p.carDepreciation : '-'}</td>
          <td class="positive">${p.mortgagePrincipal || '-'}</td>
          <td class="negative">${(p.highDebtInterest + p.modDebtInterest) ? -(p.highDebtInterest + p.modDebtInterest) : '-'}</td>
          <td>${fmt(p.savings)}</td>
          <td style="background:#fff0f0;">${fmt(p.retirementAccounts)}</td>
          <td style="background:#f0fff0;">${fmt(p.taxableAccounts)}</td>
          <td>${fmt(p.realEstateEquity)}</td>
          <td>${fmt(p.car)}</td>
          <td class="${p.highInterestDebt > 0 ? 'negative' : ''}">${p.highInterestDebt ? fmt(p.highInterestDebt) : '-'}</td>
          <td class="${p.moderateDebt > 0 ? 'negative' : ''}">${p.moderateDebt ? fmt(p.moderateDebt) : '-'}</td>
          <td><strong>${fmt(p.netWorth)}</strong></td>
          <td class="${p.netWorthDelta >= 0 ? 'positive' : 'negative'}">${fmtDelta(p.netWorthDelta)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top:1rem; padding:1rem; background:#f9f9f9; border-radius:6px;">
    <strong>Legend:</strong><br>
    B2=Starter EF, B3=Employer Match, B4=High Debt, B5-H=HSA, B5-I=IRA, B6=Full EF, B7=Mod Debt, B8=Max 401k, B9=Taxable<br>
    Sav+=Savings growth, Ret+=Retirement growth (locked until 59.5), Tax+=Taxable growth (accessible anytime), RE+=Real Estate appreciation, Car-=Car depreciation, MtgP=Mortgage principal, Debt+=Interest accrued<br>
    <span style="background:#fff0f0;padding:2px 6px;">Retire</span> = 401k + IRA + Roth (locked until 59.5) &nbsp;|&nbsp; <span style="background:#f0fff0;padding:2px 6px;">Taxable</span> = Stocks/Bonds + HSA + Other (accessible anytime)
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export verification table to CSV
 * Call from console: exportVerificationCSV()
 */
function exportVerificationCSV() {
  const { snapshot } = getState();
  const result = calculateVerificationProjection(snapshot);

  if (!result) {
    alert('No projection data available');
    return;
  }

  const headers = [
    'Month', 'Age',
    'Take_Home', 'Expense', 'Cash_Flow',
    'Box2', 'Box3', 'Box4', 'Box5_HSA', 'Box5_IRA', 'Box6', 'Box7', 'Box8', 'Box9',
    'Savings_Growth', 'Retirement_Growth', 'Taxable_Growth', 'Other_Growth', 'RE_Growth', 'Car_Depreciation',
    'Mortgage_Principal', 'High_Debt_Interest', 'Mod_Debt_Interest',
    'Savings', 'Retirement_Accounts', 'Taxable_Accounts', 'RE_Value', 'RE_Equity', 'Mortgage', 'Car',
    'High_Interest_Debt', 'Moderate_Debt',
    'Total_Assets', 'Total_Debts', 'Net_Worth', 'Net_Worth_Delta'
  ];

  const rows = result.projection.map(p => [
    p.month, p.age.toFixed(2),
    p.monthlyTakeHome, p.monthlyExpense, p.cashFlow,
    p.box2Alloc, p.box3Alloc, p.box4Alloc, p.box5HSA, p.box5IRA, p.box6Alloc, p.box7Alloc, p.box8Alloc, p.box9Alloc,
    p.savingsGrowth, p.retirementGrowth, p.taxableGrowth, p.otherGrowth, p.realEstateGrowth, p.carDepreciation,
    p.mortgagePrincipal, p.highDebtInterest, p.modDebtInterest,
    p.savings, p.retirementAccounts, p.taxableAccounts, p.realEstateValue, p.realEstateEquity, p.mortgageBalance, p.car,
    p.highInterestDebt, p.moderateDebt,
    p.totalAssets, p.totalDebts, p.netWorth, p.netWorthDelta
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `verification-projection-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  console.log('Verification CSV exported successfully!');
}

/**
 * Security utility: Validate calculated age is within reasonable bounds
 * @param {number} age - Calculated age value
 * @returns {number|null} Validated age or null if invalid
 */
function validateCalculatedAge(age) {
  if (!Number.isFinite(age) || age < 0 || age > 150) {
    console.warn('Invalid age calculation:', age);
    return null;
  }
  return Math.floor(age);
}

/**
 * Security utility: Safe date calculation for future projections
 * Avoids Date object mutation issues
 * @param {number} monthsFromNow - Number of months in future
 * @returns {Date} Calculated future date
 */
function calculateFutureDate(monthsFromNow) {
  const baseDate = new Date();
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + monthsFromNow, 1);
}

/**
 * Calculate key financial milestones from projection data
 * @param {Array} projection - Month-by-month projection data
 * @param {Object} snapshot - Current financial snapshot
 * @returns {Object} Milestone dates and values
 */
function calculateMilestones(projection, snapshot) {
  const currentAge = snapshot.general.age || 30;
  const fireNumber = getFireAnnualExpenses(snapshot) * 25; // 25x annual expenses
  const startingNetWorth = projection[0]?.netWorth || 0;
  const hasDebts = snapshot.debts.some(d => d.balance > 0 && d.category !== 'MORTGAGE');

  const milestones = {
    debtFree: null,
    positiveNetWorth: null,
    hundredK: null,
    millionaire: null,
    fireGoal: null
  };

  for (let i = 0; i < projection.length; i++) {
    const month = projection[i];
    const ageAtMonth = currentAge + (i / 12);
    const validatedAge = validateCalculatedAge(ageAtMonth);

    // Skip if age calculation is invalid
    if (validatedAge === null) continue;

    // Use safe date calculation
    const projectedDate = calculateFutureDate(i);

    // Debt-free milestone (non-mortgage debts only)
    // COMPLIANCE: Use "Projected" prefix per regulatory requirements
    if (!milestones.debtFree && hasDebts) {
      const nonMortgageDebt = (month.highInterestDebt || 0) + (month.moderateDebt || 0);
      if (nonMortgageDebt === 0) {
        milestones.debtFree = {
          month: i,
          age: validatedAge,
          date: projectedDate,
          label: 'Projected Debt-Free*',
          icon: 'check-circle'
        };
      }
    }

    // Positive net worth milestone (only if starting negative)
    if (!milestones.positiveNetWorth && startingNetWorth <= 0 && month.netWorth > 0) {
      milestones.positiveNetWorth = {
        month: i,
        age: validatedAge,
        date: projectedDate,
        label: 'Est. Positive Net Worth*',
        icon: 'trending-up'
      };
    }

    // $100K milestone
    if (!milestones.hundredK && month.netWorth >= 100000) {
      milestones.hundredK = {
        month: i,
        age: validatedAge,
        date: projectedDate,
        label: 'Projected $100K Net Worth*',
        icon: 'dollar-sign'
      };
    }

    // Millionaire milestone
    if (!milestones.millionaire && month.netWorth >= 1000000) {
      milestones.millionaire = {
        month: i,
        age: validatedAge,
        date: projectedDate,
        label: 'Est. $1M Net Worth*',
        icon: 'award'
      };
    }

    // FIRE milestone
    if (!milestones.fireGoal && fireNumber > 0 && month.netWorth >= fireNumber) {
      milestones.fireGoal = {
        month: i,
        age: validatedAge,
        date: projectedDate,
        label: 'Projected FIRE Target*',
        value: fireNumber,
        icon: 'target'
      };
    }
  }

  return milestones;
}

/**
 * Security utility: Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Render milestone cards below the chart
 * @param {Object} milestones - Calculated milestones
 * @returns {string} HTML for milestone cards
 */
function renderMilestoneCards(milestones) {
  const cards = [];

  // Icon map (using text symbols for simplicity, no external dependencies)
  const iconMap = {
    'check-circle': '\u2714',
    'trending-up': '\u2197',
    'dollar-sign': '$',
    'award': '\u2605',
    'target': '\u25CE'
  };

  if (milestones.debtFree) {
    cards.push({
      icon: iconMap[milestones.debtFree.icon],
      title: milestones.debtFree.label,
      date: milestones.debtFree.date,
      age: milestones.debtFree.age,
      colorClass: 'milestone-success'
    });
  }

  if (milestones.positiveNetWorth) {
    cards.push({
      icon: iconMap[milestones.positiveNetWorth.icon],
      title: milestones.positiveNetWorth.label,
      date: milestones.positiveNetWorth.date,
      age: milestones.positiveNetWorth.age,
      colorClass: 'milestone-success'
    });
  }

  if (milestones.hundredK) {
    cards.push({
      icon: iconMap[milestones.hundredK.icon],
      title: milestones.hundredK.label,
      date: milestones.hundredK.date,
      age: milestones.hundredK.age,
      colorClass: 'milestone-gold'
    });
  }

  if (milestones.millionaire) {
    cards.push({
      icon: iconMap[milestones.millionaire.icon],
      title: milestones.millionaire.label,
      date: milestones.millionaire.date,
      age: milestones.millionaire.age,
      colorClass: 'milestone-gold'
    });
  }

  if (milestones.fireGoal) {
    cards.push({
      icon: iconMap[milestones.fireGoal.icon],
      title: milestones.fireGoal.label,
      date: milestones.fireGoal.date,
      age: milestones.fireGoal.age,
      colorClass: 'milestone-fire'
    });
  }

  if (cards.length === 0) {
    return '';
  }

  // Use HTML escaping for all text content to prevent XSS
  return `
    <div class="milestone-cards" role="list" aria-label="Projected financial milestones">
      ${cards.map(card => `
        <div class="milestone-card ${escapeHtml(card.colorClass)}" role="listitem"
             title="Estimate based on assumed market returns. Actual date may vary.">
          <div class="milestone-icon" aria-hidden="true">${escapeHtml(card.icon)}</div>
          <div class="milestone-info">
            <div class="milestone-title">${escapeHtml(card.title)}</div>
            <div class="milestone-date">
              ${card.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              <span class="milestone-age">(Age ${card.age})</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="milestone-disclaimer" role="note" aria-label="Important disclaimer about projections">
      <p>
        <strong>* Milestone dates are estimates only</strong> based on current inputs and
        assumed 7% average annual returns. Actual timing may vary significantly due to
        market conditions, life changes, or unexpected expenses. These projections are
        for <strong>educational purposes only</strong> and should not be used as the
        sole basis for financial decisions.
      </p>
    </div>
  `;
}

/**
 * Render Net Worth Chart for dashboard
 * Returns HTML string for the diverging bar chart with milestone cards
 */
function renderNetWorthChart(snapshot) {
  const result = calculateVerificationProjection(snapshot);
  if (!result || !result.projection || result.projection.length === 0) {
    // Note: This content is placed inside a hero-chart wrapper by dashboard.js
    // Do NOT add another hero-chart wrapper here to avoid nesting issues
    return `
      <div class="nw-chart-container">
        <p class="text-secondary text-center">Enter your financial data to see projections</p>
      </div>
    `;
  }

  const { projection, summary } = result;

  // Calculate milestones
  const milestones = calculateMilestones(projection, snapshot);

  // Get yearly data points (every 12 months)
  const yearlyData = projection.filter((p, i) => i === 0 || p.monthInYear === 0 || i === projection.length - 1);

  // Calculate max values for scaling
  const maxAssets = Math.max(...yearlyData.map(p => p.totalAssets));
  const maxDebt = Math.max(...yearlyData.map(p => p.totalDebts));

  // Format currency for display
  const fmtShort = (n) => {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
  };

  const fmtFull = (n) => '$' + Math.round(n).toLocaleString();

  // Y-axis labels
  const assetLabels = [maxAssets, maxAssets * 0.5, 0].map(v => fmtShort(v));
  const debtLabels = [0, maxDebt * 0.5, maxDebt].map(v => v > 0 ? fmtShort(v) : '');

  // Generate unique chart ID for tooltip positioning
  const chartId = 'nw-chart-' + Math.random().toString(36).substr(2, 9);

  return `
    <div class="nw-chart-container nw-chart-segmented" id="${chartId}">
      <div class="nw-chart-header">
        <h3 class="nw-chart-title">Net Worth Projection</h3>
        <div class="nw-chart-legend nw-chart-legend-multi">
          <div class="nw-chart-legend-group">
            <span class="nw-chart-legend-label">Assets:</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-real-estate);"></span>Real Estate</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-retirement);"></span>Retirement</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-savings);"></span>Savings</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-brokerage);"></span>Brokerage</span>
          </div>
          <div class="nw-chart-legend-group">
            <span class="nw-chart-legend-label">Debts:</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-mortgage);"></span>Mortgage</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-high-debt);"></span>High Interest</span>
            <span class="nw-chart-legend-item"><span class="nw-chart-legend-dot" style="background: var(--chart-mod-debt);"></span>Moderate</span>
          </div>
        </div>
      </div>

      <div class="nw-chart-summary">
        <div class="nw-chart-stat">
          <span class="nw-chart-stat-label">Today</span>
          <span class="nw-chart-stat-value">${fmtShort(summary.startingNetWorth)}</span>
        </div>
        <div class="nw-chart-stat">
          <span class="nw-chart-stat-label">Age ${summary.retirementAge}</span>
          <span class="nw-chart-stat-value">${fmtShort(summary.endingNetWorth)}</span>
        </div>
        <div class="nw-chart-stat">
          <span class="nw-chart-stat-label">FIRE Target</span>
          <span class="nw-chart-stat-value ${summary.onTrack ? 'text-success' : 'text-danger'}">${fmtShort(summary.fireTarget)}</span>
        </div>
      </div>

      <div class="nw-chart-wrapper nw-chart-wrapper-tall">
        <div class="nw-chart-y-axis nw-chart-y-axis-top">
          ${assetLabels.map(l => `<span>${l}</span>`).join('')}
        </div>

        <div class="nw-chart">
          <div class="nw-chart-asset-area nw-chart-asset-area-tall">
            <div class="nw-chart-bars nw-chart-bars-wide">
              ${yearlyData.map((p, i) => {
                const totalAssets = p.totalAssets || 1;
                const assetPct = maxAssets > 0 ? (p.totalAssets / maxAssets) * 100 : 0;

                // Calculate segment percentages of the bar height
                const realEstatePct = p.realEstateValue > 0 ? (p.realEstateValue / totalAssets) * assetPct : 0;
                const retirementPct = p.retirementAccounts > 0 ? (p.retirementAccounts / totalAssets) * assetPct : 0;
                const savingsPct = p.savings > 0 ? (p.savings / totalAssets) * assetPct : 0;
                const brokeragePct = p.taxableAccounts > 0 ? (p.taxableAccounts / totalAssets) * assetPct : 0;

                // Tooltip data
                const tooltipData = JSON.stringify({
                  age: Math.round(p.age),
                  total: p.totalAssets,
                  realEstate: p.realEstateValue,
                  retirement: p.retirementAccounts,
                  savings: p.savings,
                  brokerage: p.taxableAccounts
                }).replace(/"/g, '&quot;');

                return `
                  <div class="nw-chart-bar-col nw-chart-bar-col-wide">
                    <div class="nw-chart-asset-bar nw-chart-asset-bar-stacked"
                         style="height: ${assetPct}%;"
                         data-tooltip="${tooltipData}"
                         onmouseenter="showNetWorthTooltip(event, 'asset')"
                         onmouseleave="hideNetWorthTooltip()">
                      <div class="nw-chart-segment nw-chart-seg-brokerage" style="height: ${brokeragePct > 0 ? (p.taxableAccounts / totalAssets) * 100 : 0}%;"></div>
                      <div class="nw-chart-segment nw-chart-seg-savings" style="height: ${savingsPct > 0 ? (p.savings / totalAssets) * 100 : 0}%;"></div>
                      <div class="nw-chart-segment nw-chart-seg-retirement" style="height: ${retirementPct > 0 ? (p.retirementAccounts / totalAssets) * 100 : 0}%;"></div>
                      <div class="nw-chart-segment nw-chart-seg-real-estate" style="height: ${realEstatePct > 0 ? (p.realEstateValue / totalAssets) * 100 : 0}%;"></div>
                      ${i === 0 || i === yearlyData.length - 1 ? `<span class="nw-chart-bar-value">${fmtShort(p.totalAssets)}</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="nw-chart-zero-line">
            <div class="nw-chart-x-labels">
              ${yearlyData.map((p, i) => `<span>${Math.round(p.age)}</span>`).join('')}
            </div>
          </div>

          <div class="nw-chart-debt-area nw-chart-debt-area-tall">
            <div class="nw-chart-bars nw-chart-bars-wide">
              ${yearlyData.map((p, i) => {
                const totalDebts = p.totalDebts || 1;
                const debtPct = maxDebt > 0 ? (p.totalDebts / maxDebt) * 100 : 0;

                // Calculate segment percentages of the bar height
                const mortgagePct = p.mortgageBalance > 0 ? (p.mortgageBalance / totalDebts) * debtPct : 0;
                const highDebtPct = p.highInterestDebt > 0 ? (p.highInterestDebt / totalDebts) * debtPct : 0;
                const modDebtPct = p.moderateDebt > 0 ? (p.moderateDebt / totalDebts) * debtPct : 0;

                // Tooltip data
                const tooltipData = JSON.stringify({
                  age: Math.round(p.age),
                  total: p.totalDebts,
                  mortgage: p.mortgageBalance,
                  highInterest: p.highInterestDebt,
                  moderate: p.moderateDebt
                }).replace(/"/g, '&quot;');

                return `
                  <div class="nw-chart-bar-col nw-chart-bar-col-wide">
                    <div class="nw-chart-debt-bar nw-chart-debt-bar-stacked"
                         style="height: ${debtPct}%;"
                         data-tooltip="${tooltipData}"
                         onmouseenter="showNetWorthTooltip(event, 'debt')"
                         onmouseleave="hideNetWorthTooltip()">
                      <div class="nw-chart-segment nw-chart-seg-mortgage" style="height: ${mortgagePct > 0 ? (p.mortgageBalance / totalDebts) * 100 : 0}%;"></div>
                      <div class="nw-chart-segment nw-chart-seg-high-debt" style="height: ${highDebtPct > 0 ? (p.highInterestDebt / totalDebts) * 100 : 0}%;"></div>
                      <div class="nw-chart-segment nw-chart-seg-mod-debt" style="height: ${modDebtPct > 0 ? (p.moderateDebt / totalDebts) * 100 : 0}%;"></div>
                      ${(i === 0 || i === yearlyData.length - 1) && p.totalDebts > 0 ? `<span class="nw-chart-bar-value">${fmtShort(p.totalDebts)}</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="nw-chart-y-axis nw-chart-y-axis-bottom">
          ${debtLabels.map(l => `<span>${l}</span>`).join('')}
        </div>
      </div>

      <p class="nw-chart-footer">Age</p>

      <!-- Tooltip element (hidden by default) -->
      <div id="nw-chart-tooltip" class="nw-chart-tooltip"></div>
    </div>

    <!-- Milestone Cards -->
    ${renderMilestoneCards(milestones)}
  `;
}

// Tooltip functions for Net Worth chart
function showNetWorthTooltip(event, type) {
  const bar = event.currentTarget;
  const data = JSON.parse(bar.dataset.tooltip);
  const tooltip = document.getElementById('nw-chart-tooltip');

  if (!tooltip) return;

  const fmtFull = (n) => '$' + Math.round(n).toLocaleString();

  let content = '';
  if (type === 'asset') {
    content = `
      <div class="nw-tooltip-header">Age ${data.age} - Assets</div>
      <div class="nw-tooltip-total">${fmtFull(data.total)}</div>
      <div class="nw-tooltip-breakdown">
        ${data.realEstate > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-real-estate);"></span>Real Estate: ${fmtFull(data.realEstate)}</div>` : ''}
        ${data.retirement > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-retirement);"></span>Retirement: ${fmtFull(data.retirement)}</div>` : ''}
        ${data.savings > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-savings);"></span>Savings: ${fmtFull(data.savings)}</div>` : ''}
        ${data.brokerage > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-brokerage);"></span>Brokerage: ${fmtFull(data.brokerage)}</div>` : ''}
      </div>
    `;
  } else {
    content = `
      <div class="nw-tooltip-header">Age ${data.age} - Debts</div>
      <div class="nw-tooltip-total nw-tooltip-debt">${fmtFull(data.total)}</div>
      <div class="nw-tooltip-breakdown">
        ${data.mortgage > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-mortgage);"></span>Mortgage: ${fmtFull(data.mortgage)}</div>` : ''}
        ${data.highInterest > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-high-debt);"></span>High Interest: ${fmtFull(data.highInterest)}</div>` : ''}
        ${data.moderate > 0 ? `<div class="nw-tooltip-row"><span class="nw-tooltip-dot" style="background: var(--chart-mod-debt);"></span>Moderate: ${fmtFull(data.moderate)}</div>` : ''}
      </div>
    `;
  }

  tooltip.innerHTML = content;
  tooltip.classList.add('nw-tooltip-visible');

  // Position tooltip near the bar
  const barRect = bar.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const chartContainer = bar.closest('.nw-chart-container');
  const containerRect = chartContainer.getBoundingClientRect();

  // Position above/below the bar, centered horizontally
  let left = barRect.left + (barRect.width / 2) - (tooltipRect.width / 2) - containerRect.left;
  let top;

  if (type === 'asset') {
    top = barRect.top - tooltipRect.height - 8 - containerRect.top;
  } else {
    top = barRect.bottom + 8 - containerRect.top;
  }

  // Keep tooltip within container bounds
  left = Math.max(0, Math.min(left, containerRect.width - tooltipRect.width));

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function hideNetWorthTooltip() {
  const tooltip = document.getElementById('nw-chart-tooltip');
  if (tooltip) {
    tooltip.classList.remove('nw-tooltip-visible');
  }
}

/**
 * Render Cash Flow Sankey/Flow Diagram
 * Shows how monthly cash flow splits and flows through the 9 boxes
 */
function renderCashFlowSankey(snapshot) {
  const waterfall = calculateCashFlowWaterfall(snapshot);

  if (!waterfall || waterfall.initialCashFlow <= 0) {
    return `
      <div class="cf-sankey-container">
        <h3 class="cf-chart-title">Cash Flow Allocation</h3>
        <p class="text-secondary text-center">Positive cash flow required to see allocation</p>
      </div>
    `;
  }

  const { initialCashFlow, boxes } = waterfall;

  // Filter to boxes that have allocations or are relevant
  const activeBoxes = boxes.filter(b =>
    b.allocated > 0 || b.status === 'COMPLETED' || b.status === 'IN_PROGRESS'
  );

  // Format currency
  const fmtShort = (n) => {
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + Math.round(n);
  };

  // Calculate cumulative flow for sankey paths
  let remainingFlow = initialCashFlow;
  const flowData = [];

  for (const box of boxes) {
    if (box.allocated > 0) {
      flowData.push({
        id: box.id,
        title: box.title,
        allocated: box.allocated,
        flowBefore: remainingFlow,
        flowAfter: remainingFlow - box.allocated,
        pctOfTotal: (box.allocated / initialCashFlow) * 100,
        status: box.status,
      });
      remainingFlow -= box.allocated;
    } else if (box.status === 'COMPLETED') {
      flowData.push({
        id: box.id,
        title: box.title,
        allocated: 0,
        flowBefore: remainingFlow,
        flowAfter: remainingFlow,
        pctOfTotal: 0,
        status: 'COMPLETED',
      });
    }
  }

  // Build the sankey visualization
  const totalHeight = 300;
  const nodeWidth = 120;
  const flowWidth = initialCashFlow > 0 ? 60 : 0; // Width of the main flow line

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'var(--success)';
      case 'IN_PROGRESS': return 'var(--gold)';
      default: return 'var(--border)';
    }
  };

  return `
    <div class="cf-sankey-container">
      <div class="cf-chart-header">
        <h3 class="cf-chart-title">Cash Flow Allocation (Sankey)</h3>
        <div class="cf-chart-badge">
          Monthly: <strong>${fmtShort(initialCashFlow)}</strong>
        </div>
      </div>

      <div class="cf-sankey-wrapper">
        <!-- Source: Monthly Cash Flow -->
        <div class="cf-sankey-source">
          <div class="cf-sankey-source-label">Monthly Cash Flow</div>
          <div class="cf-sankey-source-amount">${fmtShort(initialCashFlow)}</div>
        </div>

        <!-- Flow visualization -->
        <div class="cf-sankey-flow">
          ${flowData.map((item, i) => {
            const widthPct = Math.max(item.pctOfTotal, 2); // Min 2% width for visibility
            const isAllocated = item.allocated > 0;

            return `
              <div class="cf-sankey-row ${isAllocated ? 'cf-sankey-row-active' : 'cf-sankey-row-complete'}">
                <div class="cf-sankey-flow-line" style="flex: ${100 - item.pctOfTotal};">
                  <div class="cf-sankey-flow-inner" style="background: var(--gold); opacity: ${0.3 + (item.flowAfter / initialCashFlow) * 0.7};"></div>
                </div>
                <div class="cf-sankey-branch" style="flex: ${widthPct}; background: ${getStatusColor(item.status)};">
                  ${isAllocated ? `<span class="cf-sankey-branch-amount">${fmtShort(item.allocated)}</span>` : ''}
                </div>
                <div class="cf-sankey-node" style="border-color: ${getStatusColor(item.status)};">
                  <span class="cf-sankey-node-num">${item.id}</span>
                  <span class="cf-sankey-node-title">${item.title}</span>
                  ${item.status === 'COMPLETED' ? '<span class="cf-sankey-node-check">✓</span>' : ''}
                </div>
              </div>
            `;
          }).join('')}

          <!-- Remaining flow to Box 9 -->
          ${remainingFlow > 0 ? `
            <div class="cf-sankey-row cf-sankey-row-final">
              <div class="cf-sankey-flow-line" style="flex: 0;">
              </div>
              <div class="cf-sankey-branch cf-sankey-branch-final" style="flex: ${(remainingFlow / initialCashFlow) * 100}; background: var(--success);">
                <span class="cf-sankey-branch-amount">${fmtShort(remainingFlow)}</span>
              </div>
              <div class="cf-sankey-node cf-sankey-node-final" style="border-color: var(--success);">
                <span class="cf-sankey-node-num">9</span>
                <span class="cf-sankey-node-title">Taxable Investing</span>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="cf-chart-legend">
        <div class="cf-legend-item">
          <div class="cf-legend-dot" style="background: var(--success);"></div>
          <span>Completed</span>
        </div>
        <div class="cf-legend-item">
          <div class="cf-legend-dot" style="background: var(--gold);"></div>
          <span>Allocating</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Cash Flow Waterfall Chart
 * Horizontal bars showing allocation to each box in priority order
 */
function renderCashFlowWaterfall(snapshot) {
  const waterfall = calculateCashFlowWaterfall(snapshot);

  if (!waterfall || waterfall.initialCashFlow <= 0) {
    return `
      <div class="cf-waterfall-container">
        <h3 class="cf-chart-title">Cash Flow Allocation</h3>
        <p class="text-secondary text-center">Positive cash flow required to see allocation</p>
      </div>
    `;
  }

  const { initialCashFlow, boxes, remainingCashFlow } = waterfall;

  // Format currency
  const fmtShort = (n) => {
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + Math.round(n);
  };

  // Calculate bar widths as percentage of initial cash flow
  const maxAllocation = Math.max(...boxes.map(b => b.allocated), remainingCashFlow);

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'cf-bar-completed';
      case 'IN_PROGRESS': return 'cf-bar-progress';
      case 'NOT_APPLICABLE': return 'cf-bar-na';
      default: return 'cf-bar-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'NOT_APPLICABLE': return '—';
      default: return '→';
    }
  };

  // Build bars HTML - only show boxes with allocations or completed status
  const barsHtml = boxes.map(box => {
    const widthPct = initialCashFlow > 0 ? (box.allocated / initialCashFlow) * 100 : 0;
    const hasAllocation = box.allocated > 0;
    const isRelevant = hasAllocation || box.status === 'COMPLETED' || box.status === 'IN_PROGRESS';

    if (!isRelevant && box.status !== 'NOT_APPLICABLE') return '';

    return `
      <div class="cf-waterfall-row ${getStatusClass(box.status)}">
        <div class="cf-waterfall-label">
          <span class="cf-waterfall-num">${box.id}</span>
          <span class="cf-waterfall-title">${box.title}</span>
        </div>
        <div class="cf-waterfall-bar-container">
          ${hasAllocation ? `
            <div class="cf-waterfall-bar" style="width: ${Math.max(widthPct, 3)}%;">
              <span class="cf-waterfall-amount">${fmtShort(box.allocated)}/mo</span>
            </div>
          ` : `
            <div class="cf-waterfall-status">
              <span class="cf-waterfall-icon">${getStatusIcon(box.status)}</span>
              <span>${box.status === 'COMPLETED' ? 'Complete' : box.status === 'NOT_APPLICABLE' ? 'N/A' : 'Pending'}</span>
            </div>
          `}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  // Calculate totals
  const totalAllocated = boxes.reduce((sum, b) => sum + b.allocated, 0);

  return `
    <div class="cf-waterfall-container">
      <div class="cf-chart-header">
        <h3 class="cf-chart-title">Cash Flow Allocation (Waterfall)</h3>
        <div class="cf-chart-badge">
          Monthly: <strong>${fmtShort(initialCashFlow)}</strong>
        </div>
      </div>

      <div class="cf-waterfall-summary">
        <div class="cf-waterfall-stat">
          <span class="cf-waterfall-stat-label">Total Allocated</span>
          <span class="cf-waterfall-stat-value">${fmtShort(totalAllocated)}</span>
        </div>
        <div class="cf-waterfall-stat">
          <span class="cf-waterfall-stat-label">Remaining</span>
          <span class="cf-waterfall-stat-value text-success">${fmtShort(remainingCashFlow)}</span>
        </div>
      </div>

      <div class="cf-waterfall-chart">
        ${barsHtml}
      </div>

      <div class="cf-chart-legend">
        <div class="cf-legend-item">
          <div class="cf-legend-dot" style="background: var(--success);"></div>
          <span>Complete</span>
        </div>
        <div class="cf-legend-item">
          <div class="cf-legend-dot" style="background: var(--gold);"></div>
          <span>Allocating</span>
        </div>
        <div class="cf-legend-item">
          <div class="cf-legend-dot" style="background: var(--border);"></div>
          <span>Pending</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Calculate projections for scenario comparison
 * Wrapper function that returns projection array with net worth data
 * @param {Object} snapshot - Financial snapshot
 * @returns {Array} Array of monthly projection data with netWorth property
 */
function calculateProjections(snapshot) {
  const result = calculateVerificationProjection(snapshot);
  if (!result || !result.projection) {
    return [];
  }
  return result.projection;
}

// Expose functions to window for global access
if (typeof window !== 'undefined') {
  window.getFireAnnualExpenses = getFireAnnualExpenses;
  window.calculateProjections = calculateProjections;
  window.calculateProjection = calculateProjection;
  window.calculateVerificationProjection = calculateVerificationProjection;
  window.calculateNetWorthProjection = calculateNetWorthProjection;
  window.calculateWaterfallProjection = calculateWaterfallProjection;
  window.renderNetWorthChart = renderNetWorthChart;
  window.showNetWorthTooltip = showNetWorthTooltip;
  window.hideNetWorthTooltip = hideNetWorthTooltip;
}
