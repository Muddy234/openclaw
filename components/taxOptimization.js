/**
 * taxOptimization.js
 * "Choose Your Destiny" - Interactive tax optimization UI
 * Renders tax profile, destiny cards, impact summary, and year-end checklist
 *
 * IMPORTANT: This provides educational guidance only, not tax advice.
 * Financial GPS does not provide tax, legal, or investment advice.
 * We are not tax professionals, CPAs, or financial advisors.
 */

/**
 * Format a number as USD currency
 */
function formatTaxCurrency(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Format a decimal as percentage
 */
function formatTaxPercent(n) {
  return (n * 100).toFixed(1) + '%';
}

/**
 * Render the complete tax optimization section
 * @param {Object} snapshot - Financial snapshot from store
 * @returns {string} HTML string
 */
function renderTaxOptimization(snapshot) {
  const destiny = window.calculateTaxDestiny(snapshot);

  if (!destiny) {
    return `
      <div class="tax-optimization-section" id="tax-optimization">
        <div class="tax-header">
          <h2 class="tax-title">Choose Your Tax Destiny</h2>
          <p class="tax-subtitle">Enter your income to see personalized tax optimization strategies.</p>
        </div>
      </div>
    `;
  }

  // Also get the legacy analysis for the checklist section
  const taxAnalysis = window.analyzeTaxSituation ? window.analyzeTaxSituation(snapshot) : null;

  // Schedule checklist and input restoration after render
  setTimeout(restoreTaxChecklistState, 0);
  setTimeout(restoreTaxDestinyInputs, 0);

  return `
    <div class="tax-optimization-section" id="tax-optimization">
      <div class="tax-header">
        <h2 class="tax-title">Choose Your Tax Destiny</h2>
        <p class="tax-subtitle">
          Allocate your monthly cash flow into tax-advantaged accounts and strategies.
          See how each choice may impact your estimated annual tax bill.
        </p>
      </div>

      <div class="tax-disclaimer">
        <strong>Disclaimer:</strong> This is educational guidance only, not tax advice.
        Tax laws are complex and change frequently. Financial GPS does not provide tax, legal,
        or investment advice. Please consult a qualified tax professional for advice specific
        to your situation before making any tax-related decisions.
      </div>

      <!-- Section A: Tax Profile -->
      ${renderTaxProfile(destiny, snapshot)}

      <!-- Assumptions Disclosure -->
      <div class="tax-assumptions">
        <details>
          <summary class="tax-assumptions-toggle">View Calculation Assumptions</summary>
          <div class="tax-assumptions-content">
            <ul>
              <li>Based on 2025 federal tax brackets and standard deduction</li>
              <li>State tax rate based on your MSA location</li>
              <li>FICA taxes assume W-2 employment income</li>
              <li>IRA deductibility may be limited if you have a workplace retirement plan</li>
              <li>Charitable deductions shown as direct offset (simplified model)</li>
              <li>Does not account for: itemized deduction thresholds, tax credits, AMT, or local taxes</li>
            </ul>
            <p class="tax-assumptions-warning">
              <strong>These are educational estimates only. Your actual tax situation may differ significantly.</strong>
            </p>
          </div>
        </details>
      </div>

      <!-- Section B: Destiny Cards -->
      <div class="tax-destiny-section">
        <h3 class="tax-section-header">Your Tax-Advantaged Strategies</h3>
        <p class="tax-section-description">
          Set monthly contribution amounts for each account. Your marginal tax rate is
          <strong>${Math.round(destiny.baseline.marginalRate * 100)}%</strong> &mdash;
          every dollar contributed to pre-tax accounts may save you approximately
          ${Math.round(destiny.baseline.marginalRate * 100)} cents in federal taxes.
        </p>
        ${renderDestinyCards(destiny, snapshot)}
      </div>

      <!-- Section C: Impact Summary -->
      ${renderImpactSummary(destiny)}

      <!-- Advanced Strategies -->
      <div class="tax-destiny-section">
        <h3 class="tax-section-header">Advanced Strategies</h3>
        <p class="tax-section-description">
          These strategies may offer additional tax benefits. Toggle any that apply to your situation.
          Consult a tax professional before implementing these strategies.
        </p>
        ${renderAdvancedStrategies(destiny, snapshot)}
      </div>

      <!-- Year-End Checklist -->
      ${taxAnalysis ? `
        <div class="tax-checklist-section">
          <h3 class="tax-section-header">Year-End Tax Moves Checklist</h3>
          ${renderTaxChecklist(taxAnalysis)}
        </div>
      ` : ''}

      <div class="tax-footer-disclaimer">
        <p>
          <strong>Important:</strong> Tax laws and brackets are subject to change.
          This analysis is based on 2025 tax law as of the date shown.
          Visit <a href="https://www.irs.gov" target="_blank" rel="noopener noreferrer">IRS.gov</a>
          or consult a tax professional for current information.
        </p>
      </div>
    </div>
  `;
}

/**
 * Section A: Tax Profile bar with filing status, HSA coverage, and summary cards
 */
function renderTaxProfile(destiny, snapshot) {
  const td = snapshot.taxDestiny || {};
  const baseline = destiny.baseline;

  // Build state tax display
  const stateInfo = baseline.stateInfo || {};
  const hasStateInfo = stateInfo.state && stateInfo.stateName;
  const stateLabel = hasStateInfo
    ? `Est. ${stateInfo.state} State Tax`
    : 'Est. State Tax';

  return `
    <div class="tax-destiny-profile">
      <div class="tax-destiny-profile__controls">
        <div class="tax-destiny-profile__control">
          <label class="tax-destiny-profile__label" for="td-filing-status">Filing Status</label>
          <select id="td-filing-status"
                  class="tax-destiny-profile__select"
                  aria-label="Tax filing status"
                  onchange="updateTaxDestiny({ filingStatus: this.value })">
            <option value="single" ${td.filingStatus === 'single' ? 'selected' : ''}>Single</option>
            <option value="married" ${td.filingStatus === 'married' ? 'selected' : ''}>Married Filing Jointly</option>
            <option value="head_of_household" ${td.filingStatus === 'head_of_household' ? 'selected' : ''}>Head of Household</option>
          </select>
        </div>
        <div class="tax-destiny-profile__control">
          <label class="tax-destiny-profile__label" for="td-hsa-coverage">HSA Coverage</label>
          <select id="td-hsa-coverage"
                  class="tax-destiny-profile__select"
                  aria-label="HSA coverage type"
                  onchange="updateTaxDestiny({ hsaCoverage: this.value })">
            <option value="individual" ${td.hsaCoverage === 'individual' ? 'selected' : ''}>Individual</option>
            <option value="family" ${td.hsaCoverage === 'family' ? 'selected' : ''}>Family</option>
            <option value="none" ${td.hsaCoverage === 'none' ? 'selected' : ''}>No HDHP / Not Eligible</option>
          </select>
        </div>
      </div>

      <div class="tax-summary-cards">
        <div class="tax-card">
          <div class="tax-card-label">Gross Income</div>
          <div class="tax-card-value">${formatTaxCurrency(baseline.grossIncome)}</div>
        </div>
        <div class="tax-card">
          <div class="tax-card-label">Est. Federal Tax</div>
          <div class="tax-card-value tax-card-danger">${formatTaxCurrency(destiny.withAllocations.federalTax)}</div>
          <div class="tax-card-detail">Estimate only</div>
        </div>
        <div class="tax-card">
          <div class="tax-card-label">${sanitizeText(stateLabel)}</div>
          <div class="tax-card-value ${destiny.withAllocations.stateTax === 0 ? 'tax-card-good' : 'tax-card-warning'}">${formatTaxCurrency(destiny.withAllocations.stateTax)}</div>
        </div>
        <div class="tax-card">
          <div class="tax-card-label">Effective Rate</div>
          <div class="tax-card-value">${formatTaxPercent(destiny.withAllocations.effectiveRate)}</div>
          <div class="tax-card-detail">Fed + State / Income</div>
        </div>
        <div class="tax-card">
          <div class="tax-card-label">Marginal Rate</div>
          <div class="tax-card-value tax-card-gold">${formatTaxPercent(destiny.withAllocations.marginalRate)}</div>
          <div class="tax-card-detail">Your bracket</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Section B: Interactive Destiny Cards grid
 */
function renderDestinyCards(destiny, snapshot) {
  const alloc = (snapshot.taxDestiny || {}).allocations || {};
  const strat = (snapshot.taxDestiny || {}).strategies || {};
  const validation = destiny.validation;
  const limits = destiny.limits;

  // Helper to find warnings for a specific field
  const getWarnings = (field) => validation.warnings.filter(w => w.field === field);

  // Cash flow remaining indicator
  const cashFlowClass = destiny.remainingCashFlow < 0 ? 'tax-destiny-remaining--negative' :
                         destiny.remainingCashFlow === 0 ? 'tax-destiny-remaining--zero' : '';
  const cashFlowWarning = validation.warnings.find(w => w.type === 'cashflow');

  const cardsHtml = `
    <div class="tax-destiny-cards">
      ${renderContributionCard({
        id: 'fourOhOneK',
        title: '401(k)',
        description: 'Pre-tax contributions reduce your taxable income. Tax-deferred growth until withdrawal in retirement.',
        monthlyValue: alloc.fourOhOneK || 0,
        annualLimit: limits.fourOhOneK,
        cardData: destiny.cards.fourOhOneK,
        warnings: getWarnings('fourOhOneK'),
        onchange: 'updateTaxAllocations({ fourOhOneK: Math.max(0, Number(this.value) || 0) })',
        note: limits.catchUpEligible ? 'Includes $7,500 catch-up contribution' : null,
      })}

      ${renderContributionCard({
        id: 'hsa',
        title: 'HSA',
        description: 'Triple tax advantage: tax-deductible contributions, tax-free growth, tax-free withdrawals for medical expenses.',
        monthlyValue: alloc.hsa || 0,
        annualLimit: limits.hsa,
        cardData: destiny.cards.hsa,
        warnings: getWarnings('hsa'),
        onchange: 'updateTaxAllocations({ hsa: Math.max(0, Number(this.value) || 0) })',
        note: snapshot.taxDestiny.hsaCoverage === 'none' ? 'Requires HDHP enrollment' : null,
        disabled: snapshot.taxDestiny.hsaCoverage === 'none',
      })}

      ${renderContributionCard({
        id: 'traditionalIra',
        title: 'Traditional IRA',
        description: 'Pre-tax contributions may reduce taxable income now. Taxes paid on withdrawals in retirement.',
        monthlyValue: alloc.traditionalIra || 0,
        annualLimit: limits.ira,
        cardData: destiny.cards.traditionalIra,
        warnings: getWarnings('ira'),
        onchange: 'updateTaxAllocations({ traditionalIra: Math.max(0, Number(this.value) || 0) })',
        note: 'Deductibility may be limited with workplace retirement plan',
        sharedLimitLabel: 'Shares limit with Roth IRA',
      })}

      ${renderContributionCard({
        id: 'rothIra',
        title: 'Roth IRA',
        description: 'Post-tax contributions. No current tax benefit, but tax-free growth and tax-free withdrawals in retirement.',
        monthlyValue: alloc.rothIra || 0,
        annualLimit: limits.rothIra,
        cardData: destiny.cards.rothIra,
        warnings: getWarnings('rothIra'),
        onchange: 'updateTaxAllocations({ rothIra: Math.max(0, Number(this.value) || 0) })',
        note: 'No current tax savings - benefit is tax-free growth',
        sharedLimitLabel: 'Shares limit with Traditional IRA',
        isPostTax: true,
      })}

      ${renderContributionCard({
        id: 'five29',
        title: '529 Plan',
        description: 'Tax-free growth for education expenses. Some states offer a state tax deduction for contributions.',
        monthlyValue: alloc.five29 || 0,
        annualLimit: 18000,
        cardData: destiny.cards.five29,
        warnings: getWarnings('five29'),
        onchange: 'updateTaxAllocations({ five29: Math.max(0, Number(this.value) || 0) })',
        note: 'No federal tax deduction. State deductions vary.',
        isPostTax: true,
      })}

      ${renderStrategyCard({
        id: 'charitable',
        title: 'Charitable Giving',
        description: 'Donations to qualified charities may be tax-deductible if you itemize deductions.',
        annualValue: strat.charitableAnnual || 0,
        cardData: destiny.cards.charitable,
        onchange: 'updateTaxStrategies({ charitableAnnual: Math.max(0, Number(this.value) || 0) })',
        note: 'Benefit depends on whether you itemize. Consider bunching donations or using a donor-advised fund.',
        inputLabel: 'Annual amount',
      })}

      ${renderStrategyCard({
        id: 'taxLossHarvest',
        title: 'Tax-Loss Harvesting',
        description: 'Sell investments at a loss to offset capital gains. Up to $3,000 in net losses can offset ordinary income.',
        annualValue: strat.taxLossHarvest || 0,
        cardData: destiny.cards.taxLossHarvest,
        onchange: 'updateTaxStrategies({ taxLossHarvest: Math.max(0, Number(this.value) || 0) })',
        note: 'Be aware of wash sale rules (30-day window). Actual harvestable losses depend on your portfolio.',
        inputLabel: 'Est. annual losses',
        annualLimit: 3000,
      })}
    </div>

    <div class="tax-destiny-remaining ${cashFlowClass}" aria-live="polite">
      <div class="tax-destiny-remaining__label">Monthly Cash Flow After Allocations</div>
      <div class="tax-destiny-remaining__value">${formatTaxCurrency(destiny.remainingCashFlow)}/mo</div>
      <div class="tax-destiny-remaining__detail">
        ${formatTaxCurrency(destiny.monthlyCashFlow)}/mo available &minus; ${formatTaxCurrency(destiny.totalMonthlyAllocations)}/mo allocated
      </div>
      ${cashFlowWarning ? `<div class="tax-destiny-remaining__warning">${sanitizeText(cashFlowWarning.message)}</div>` : ''}
      <div class="tax-destiny-remaining__note">Remaining cash flow feeds into your FIRE Journey priorities</div>
    </div>
  `;

  return cardsHtml;
}

/**
 * Render a single contribution card (monthly input + limit bar)
 */
function renderContributionCard(opts) {
  const { id, title, description, monthlyValue, annualLimit, cardData, warnings, onchange, note, disabled, sharedLimitLabel, isPostTax } = opts;
  const annualAmount = monthlyValue * 12;
  const percentOfLimit = annualLimit > 0 ? Math.min(1, annualAmount / annualLimit) : 0;
  const overLimit = annualAmount > annualLimit && annualLimit > 0;
  const warningHtml = (warnings || []).map(w =>
    `<div class="tax-destiny-card__warning tax-destiny-card__warning--${w.severity}">${sanitizeText(w.message)}</div>`
  ).join('');

  const savingsDisplay = cardData.isPreTax && cardData.estimatedAnnualSavings > 0
    ? `<div class="tax-destiny-card__savings">
         Est. tax savings: <strong>${formatTaxCurrency(cardData.estimatedAnnualSavings)}/yr</strong>
         <span class="tax-destiny-card__savings-note">(${formatTaxCurrency(cardData.estimatedMonthlySavings)}/mo)</span>
       </div>`
    : isPostTax
      ? `<div class="tax-destiny-card__savings tax-destiny-card__savings--info">
           Tax-free growth (no current deduction)
         </div>`
      : '';

  return `
    <div class="tax-destiny-card ${overLimit ? 'tax-destiny-card--overlimit' : ''} ${disabled ? 'tax-destiny-card--disabled' : ''}"
         id="td-card-${id}">
      <div class="tax-destiny-card__header">
        <h4 class="tax-destiny-card__title">${sanitizeText(title)}</h4>
        ${isPostTax ? '<span class="tax-destiny-card__badge">Post-Tax</span>' : '<span class="tax-destiny-card__badge tax-destiny-card__badge--pretax">Pre-Tax</span>'}
      </div>
      <p class="tax-destiny-card__description">${sanitizeText(description)}</p>

      <div class="tax-destiny-card__input-row">
        <label class="tax-destiny-card__input-label" for="td-input-${id}">Monthly</label>
        <div class="tax-destiny-card__input-wrapper">
          <span class="tax-destiny-card__input-prefix">$</span>
          <input type="number"
                 id="td-input-${id}"
                 class="tax-destiny-card__input"
                 value="${monthlyValue}"
                 min="0"
                 step="50"
                 aria-label="${sanitizeText(title)} monthly contribution"
                 ${disabled ? 'disabled' : ''}
                 onchange="${onchange}"
                 onblur="${onchange}" />
          <span class="tax-destiny-card__input-suffix">/mo</span>
        </div>
      </div>

      <div class="tax-destiny-card__annual">
        ${formatTaxCurrency(annualAmount)}/yr of ${formatTaxCurrency(annualLimit)}/yr limit
        ${sharedLimitLabel ? `<span class="tax-destiny-card__shared-limit">(${sanitizeText(sharedLimitLabel)})</span>` : ''}
      </div>

      <div class="tax-destiny-card__limit-bar" role="progressbar"
           aria-valuenow="${Math.round(percentOfLimit * 100)}"
           aria-valuemin="0" aria-valuemax="100"
           aria-label="${sanitizeText(title)} limit usage">
        <div class="tax-destiny-card__limit-fill ${overLimit ? 'tax-destiny-card__limit-fill--over' : ''}"
             style="width: ${Math.min(100, Math.round(percentOfLimit * 100))}%"></div>
      </div>

      ${savingsDisplay}
      ${note ? `<div class="tax-destiny-card__note">${sanitizeText(note)}</div>` : ''}
      ${warningHtml}
    </div>
  `;
}

/**
 * Render a strategy card (annual input, no limit bar)
 */
function renderStrategyCard(opts) {
  const { id, title, description, annualValue, cardData, onchange, note, inputLabel, annualLimit } = opts;

  const savingsDisplay = cardData.estimatedAnnualSavings > 0
    ? `<div class="tax-destiny-card__savings">
         Est. tax savings: <strong>${formatTaxCurrency(cardData.estimatedAnnualSavings)}/yr</strong>
       </div>`
    : '';

  const limitDisplay = annualLimit
    ? `<div class="tax-destiny-card__annual">Max offset: ${formatTaxCurrency(annualLimit)}/yr against ordinary income</div>`
    : '';

  return `
    <div class="tax-destiny-card tax-destiny-card--strategy" id="td-card-${id}">
      <div class="tax-destiny-card__header">
        <h4 class="tax-destiny-card__title">${sanitizeText(title)}</h4>
        <span class="tax-destiny-card__badge tax-destiny-card__badge--strategy">Strategy</span>
      </div>
      <p class="tax-destiny-card__description">${sanitizeText(description)}</p>

      <div class="tax-destiny-card__input-row">
        <label class="tax-destiny-card__input-label" for="td-input-${id}">${sanitizeText(inputLabel || 'Annual amount')}</label>
        <div class="tax-destiny-card__input-wrapper">
          <span class="tax-destiny-card__input-prefix">$</span>
          <input type="number"
                 id="td-input-${id}"
                 class="tax-destiny-card__input"
                 value="${annualValue}"
                 min="0"
                 step="100"
                 aria-label="${sanitizeText(title)} annual amount"
                 onchange="${onchange}"
                 onblur="${onchange}" />
          <span class="tax-destiny-card__input-suffix">/yr</span>
        </div>
      </div>

      ${limitDisplay}
      ${savingsDisplay}
      ${note ? `<div class="tax-destiny-card__note">${sanitizeText(note)}</div>` : ''}
    </div>
  `;
}

/**
 * Section C: Impact Summary (before/after comparison)
 */
function renderImpactSummary(destiny) {
  const baseline = destiny.baseline;
  const optimized = destiny.withAllocations;
  const savings = destiny.annualSavings;
  const hasSavings = savings > 0;

  return `
    <div class="tax-destiny-impact">
      <h3 class="tax-section-header">Your Tax Destiny &mdash; Impact Summary</h3>

      <div class="tax-destiny-impact__comparison">
        <div class="tax-destiny-impact__column">
          <div class="tax-destiny-impact__column-header">Without Contributions</div>
          <div class="tax-destiny-impact__row">
            <span>Federal Tax</span>
            <strong>${formatTaxCurrency(baseline.federalTax)}</strong>
          </div>
          <div class="tax-destiny-impact__row">
            <span>State Tax</span>
            <strong>${formatTaxCurrency(baseline.stateTax)}</strong>
          </div>
          <div class="tax-destiny-impact__row">
            <span>FICA</span>
            <strong>${formatTaxCurrency(baseline.fica)}</strong>
          </div>
          <div class="tax-destiny-impact__row tax-destiny-impact__row--total">
            <span>Total Tax</span>
            <strong>${formatTaxCurrency(baseline.totalTax)}</strong>
          </div>
          <div class="tax-destiny-impact__row">
            <span>Effective Rate</span>
            <strong>${formatTaxPercent(baseline.effectiveRate)}</strong>
          </div>
        </div>

        <div class="tax-destiny-impact__arrow">
          ${hasSavings ? '&#8594;' : '='}
        </div>

        <div class="tax-destiny-impact__column tax-destiny-impact__column--optimized">
          <div class="tax-destiny-impact__column-header">With Your Choices</div>
          <div class="tax-destiny-impact__row">
            <span>Federal Tax</span>
            <strong>${formatTaxCurrency(optimized.federalTax)}</strong>
          </div>
          <div class="tax-destiny-impact__row">
            <span>State Tax</span>
            <strong>${formatTaxCurrency(optimized.stateTax)}</strong>
          </div>
          <div class="tax-destiny-impact__row">
            <span>FICA</span>
            <strong>${formatTaxCurrency(optimized.fica)}</strong>
          </div>
          <div class="tax-destiny-impact__row tax-destiny-impact__row--total">
            <span>Total Tax</span>
            <strong>${formatTaxCurrency(optimized.totalTax)}</strong>
          </div>
          <div class="tax-destiny-impact__row">
            <span>Effective Rate</span>
            <strong>${formatTaxPercent(optimized.effectiveRate)}</strong>
          </div>
        </div>
      </div>

      ${hasSavings ? `
        <div class="tax-destiny-impact__savings" aria-live="polite">
          <div class="tax-destiny-impact__savings-label">Estimated Annual Tax Savings</div>
          <div class="tax-destiny-impact__savings-amount">${formatTaxCurrency(savings)}</div>
          <div class="tax-destiny-impact__savings-monthly">(${formatTaxCurrency(destiny.monthlySavings)}/mo)</div>
          <div class="tax-destiny-impact__savings-note">
            Hypothetical estimate based on 2025 tax brackets and your selections. Actual savings will vary.
          </div>
        </div>
      ` : `
        <div class="tax-destiny-impact__no-savings">
          Set contribution amounts above to see your estimated tax savings.
        </div>
      `}
    </div>
  `;
}

/**
 * Render advanced strategy toggles
 */
function renderAdvancedStrategies(destiny, snapshot) {
  const advanced = destiny.advanced || {};
  const filingStatus = destiny.filingStatus;
  const rothPhaseout = destiny.limits.rothPhaseout;

  return `
    <div class="tax-destiny-advanced">
      <div class="tax-destiny-advanced__card">
        <label class="tax-destiny-advanced__toggle">
          <input type="checkbox"
                 ${advanced.backdoorRoth ? 'checked' : ''}
                 onchange="updateTaxAdvanced({ backdoorRoth: this.checked })"
                 aria-label="Backdoor Roth IRA strategy" />
          <div class="tax-destiny-advanced__content">
            <h4>Backdoor Roth IRA</h4>
            <p>Contribute to a non-deductible Traditional IRA, then convert to Roth. Useful if your income exceeds Roth IRA limits (${formatTaxCurrency(rothPhaseout.phaseout_end)} for ${filingStatus === 'married' ? 'married filing jointly' : filingStatus === 'head_of_household' ? 'head of household' : 'single'}).</p>
            <div class="tax-destiny-advanced__note">Consult a tax professional. Pro-rata rule may apply if you have existing Traditional IRA balances.</div>
          </div>
        </label>
      </div>

      <div class="tax-destiny-advanced__card">
        <label class="tax-destiny-advanced__toggle">
          <input type="checkbox"
                 ${advanced.megaBackdoorRoth ? 'checked' : ''}
                 onchange="updateTaxAdvanced({ megaBackdoorRoth: this.checked })"
                 aria-label="Mega Backdoor Roth strategy" />
          <div class="tax-destiny-advanced__content">
            <h4>Mega Backdoor Roth</h4>
            <p>Make after-tax contributions to your 401(k) beyond the $23,500 limit (up to $70,000 total in 2025), then convert to Roth. Not all employer plans allow this.</p>
            <div class="tax-destiny-advanced__note">Check with your plan administrator for eligibility. Requires in-plan Roth conversion or in-service distribution.</div>
          </div>
        </label>
      </div>

      <div class="tax-destiny-advanced__card">
        <label class="tax-destiny-advanced__toggle">
          <input type="checkbox"
                 ${advanced.rothConversionLadder ? 'checked' : ''}
                 onchange="updateTaxAdvanced({ rothConversionLadder: this.checked })"
                 aria-label="Roth Conversion Ladder strategy" />
          <div class="tax-destiny-advanced__content">
            <h4>Roth Conversion Ladder</h4>
            <p>In early retirement, convert Traditional IRA/401(k) balances to Roth each year in low-income years, paying minimal taxes. After 5 years, converted amounts can be withdrawn tax-free.</p>
            <div class="tax-destiny-advanced__note">Best for early retirees with lower taxable income. Each conversion starts a new 5-year clock.</div>
          </div>
        </label>
      </div>
    </div>
  `;
}

/**
 * Render year-end tax checklist (preserved from original implementation)
 */
function renderTaxChecklist(taxAnalysis) {
  const limits = taxAnalysis.contributionLimits;

  const items = [
    {
      id: 'checklist-401k',
      task: 'Max out 401(k) contributions',
      deadline: 'December 31',
      description: `Contribute up to $${limits['401k'].toLocaleString()} (or $${(limits['401k'] + limits['catch_up_50_401k']).toLocaleString()} if 50+)`
    },
    {
      id: 'checklist-ira',
      task: 'Make IRA contribution',
      deadline: 'April 15 (next year)',
      description: `You have until tax day to contribute $${limits['ira'].toLocaleString()} to an IRA`
    },
    {
      id: 'checklist-hsa',
      task: 'Max out HSA (if eligible)',
      deadline: 'December 31',
      description: 'Triple tax advantage - often considered among the most tax-efficient accounts'
    },
    {
      id: 'checklist-harvest',
      task: 'Harvest tax losses',
      deadline: 'December 31',
      description: 'Sell losing investments to offset gains (watch wash sale rules)'
    },
    {
      id: 'checklist-charity',
      task: 'Make charitable donations',
      deadline: 'December 31',
      description: 'Consider bunching donations or using a donor-advised fund'
    },
    {
      id: 'checklist-w4',
      task: 'Review W-4 withholding',
      deadline: 'Year-round',
      description: 'Adjust to avoid big refund or unexpected tax bill'
    }
  ];

  const checklistHtml = items.map(item => `
    <div class="tax-checklist-item">
      <label class="tax-checklist-label">
        <input type="checkbox"
               class="tax-checklist-checkbox"
               id="${item.id}"
               onchange="saveTaxChecklistState()" />
        <div class="tax-checklist-content">
          <div class="tax-checklist-task">${sanitizeText(item.task)}</div>
          <div class="tax-checklist-description">${sanitizeText(item.description)}</div>
          <div class="tax-checklist-deadline">Deadline: ${sanitizeText(item.deadline)}</div>
        </div>
      </label>
    </div>
  `).join('');

  return `
    <div class="tax-checklist">
      ${checklistHtml}
    </div>
  `;
}

/**
 * Restore tax destiny input values after re-render
 */
function restoreTaxDestinyInputs() {
  const snapshot = window.state ? window.state.snapshot : null;
  if (!snapshot || !snapshot.taxDestiny) return;

  const alloc = snapshot.taxDestiny.allocations || {};
  const strat = snapshot.taxDestiny.strategies || {};

  const allocFields = {
    'td-input-fourOhOneK': alloc.fourOhOneK || 0,
    'td-input-hsa': alloc.hsa || 0,
    'td-input-traditionalIra': alloc.traditionalIra || 0,
    'td-input-rothIra': alloc.rothIra || 0,
    'td-input-five29': alloc.five29 || 0,
    'td-input-charitable': strat.charitableAnnual || 0,
    'td-input-taxLossHarvest': strat.taxLossHarvest || 0,
  };

  Object.keys(allocFields).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = allocFields[id];
    }
  });

  const filingEl = document.getElementById('td-filing-status');
  if (filingEl) filingEl.value = snapshot.taxDestiny.filingStatus || 'single';

  const hsaEl = document.getElementById('td-hsa-coverage');
  if (hsaEl) hsaEl.value = snapshot.taxDestiny.hsaCoverage || 'individual';
}

/**
 * Restore checklist state from localStorage
 */
function restoreTaxChecklistState() {
  const saved = localStorage.getItem('taxChecklist');
  if (!saved) return;

  try {
    const checklistState = JSON.parse(saved);
    if (typeof checklistState !== 'object' || checklistState === null) return;

    Object.keys(checklistState).forEach(id => {
      if (typeof id === 'string' && typeof checklistState[id] === 'boolean') {
        const el = document.getElementById(id);
        if (el && el.type === 'checkbox') {
          el.checked = checklistState[id];
        }
      }
    });
  } catch (e) {
    console.warn('Failed to restore tax checklist state');
  }
}

/**
 * Save checklist state to localStorage
 */
function saveTaxChecklistState() {
  const checkboxes = document.querySelectorAll('.tax-checklist-checkbox');
  const checklistState = {};
  checkboxes.forEach(cb => {
    if (cb.id) {
      checklistState[cb.id] = cb.checked;
    }
  });
  try {
    localStorage.setItem('taxChecklist', JSON.stringify(checklistState));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Sanitize text for safe HTML insertion
 */
function sanitizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions
window.renderTaxOptimization = renderTaxOptimization;
window.saveTaxChecklistState = saveTaxChecklistState;
window.restoreTaxChecklistState = restoreTaxChecklistState;
window.restoreTaxDestinyInputs = restoreTaxDestinyInputs;
