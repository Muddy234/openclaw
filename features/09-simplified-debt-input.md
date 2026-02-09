# Feature 9: Simplified Debt Input

## Vision

Current debt input requires users to know their exact balance, interest rate, and term for each debt - information many people don't have readily available. This creates friction and abandonment. Financial GPS should make debt input effortless with smart defaults, common debt presets, and the ability to quickly estimate if exact numbers aren't known.

## Goal

Streamline debt input to reduce friction and improve completion rates:
- Provide debt templates with common terms (credit cards, student loans, auto loans)
- Allow "quick add" with minimal information
- Auto-populate reasonable defaults (e.g., credit cards default to 18% APR, 60-month term)
- Option to upload statement or connect accounts (future: Plaid integration)
- Validate and warn about unusual inputs

## Success Metrics

**What Success Looks Like:**
- Reduced time to add all debts (from 5 minutes to <2 minutes)
- Increased form completion rate (fewer abandonments at debt section)
- Users can add debts even without exact details
- Positive feedback: "So much easier than other calculators!"

**Acceptance Criteria:**
- [ ] "Quick Add Debt" button opens modal with debt templates
- [ ] Templates for: Credit Card, Student Loan, Auto Loan, Mortgage, Medical, Personal Loan
- [ ] Each template has pre-filled defaults (rate, term)
- [ ] "Don't know?" helper text with estimation guidance
- [ ] Import from statement (parse balance and rate from text paste)
- [ ] Bulk debt entry (multiple debts at once)
- [ ] "Skip for now" option with reminder
- [ ] Visual debt cards (easier to scan than form rows)

---

## Implementation Plan

### 1. Create Debt Templates and Helper Functions

**File:** `js/debtTemplates.js` (new file)

**Purpose:** Predefined debt templates and estimation helpers

**Full Code:**

```javascript
// ===========================
// DEBT TEMPLATES & HELPERS
// ===========================

/**
 * Predefined debt templates with common defaults
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
      'Look for APR on your statement (usually 14-25%)',
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
      'Federal loans: 3-7% APR',
      'Private loans: 5-12% APR',
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
      'New car loans: 3-6% APR',
      'Used car loans: 5-10% APR',
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
      'Fixed-rate mortgages: 6-8% (as of 2025)',
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
      'Negotiate before agreeing to terms'
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
      'Personal loans: 6-15% APR (depending on credit)',
      'Common terms: 24, 36, or 48 months',
      'Payday loans (avoid!): 300%+ APR'
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
    throw new Error(`Unknown debt template: ${templateKey}`);
  }

  return {
    category: template.category,
    balance: balance,
    interestRate: rate !== null ? rate : template.defaultRate,
    termMonths: term !== null ? term : template.defaultTerm
  };
}

/**
 * Parse debt information from pasted statement text
 * Uses regex to extract balance and interest rate
 * @param {string} text - Pasted statement text
 * @returns {Object} { balance, rate } or null if not found
 */
function parseDebtFromStatement(text) {
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

  for (let pattern of balancePatterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      result.balance = parseFloat(cleaned);
      break;
    }
  }

  // Try to find interest rate
  // Patterns: "18.5%", "APR: 18.5", "Interest Rate 18.5%"
  const ratePatterns = [
    /(?:apr|interest\s+rate|rate)[\s:]*(\d+\.?\d{0,2})%?/i,
    /(\d+\.?\d{0,2})%/
  ];

  for (let pattern of ratePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.rate = parseFloat(match[1]);
      break;
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
  const template = DEBT_TEMPLATES[debt.category];
  const result = {
    valid: true,
    warnings: [],
    errors: []
  };

  // Check balance
  if (debt.balance <= 0) {
    result.errors.push('Balance must be greater than $0');
    result.valid = false;
  }

  if (debt.balance > 1000000) {
    result.warnings.push('Balance seems unusually high. Please verify.');
  }

  // Check interest rate
  if (debt.interestRate < 0 || debt.interestRate > 50) {
    result.errors.push('Interest rate must be between 0% and 50%');
    result.valid = false;
  }

  if (template && debt.interestRate > template.rateRange.max) {
    result.warnings.push(
      `Interest rate (${debt.interestRate}%) is higher than typical for ${template.name} (${template.rateRange.max}%). Please verify.`
    );
  }

  // Check term
  if (debt.termMonths < 1 || debt.termMonths > 600) {
    result.errors.push('Term must be between 1 and 600 months');
    result.valid = false;
  }

  if (template && debt.termMonths > template.termRange.max) {
    result.warnings.push(
      `Term (${debt.termMonths} months) is longer than typical for ${template.name}. Consider refinancing.`
    );
  }

  return result;
}
```

---

### 2. Create Simplified Debt Input Component

**File:** `components/debtInput.js` (new file)

**Purpose:** Enhanced debt input UI with templates and helpers

**Full Code:**

```javascript
// ===========================
// SIMPLIFIED DEBT INPUT
// ===========================

/**
 * Render enhanced debt input section
 * @param {Object} snapshot - Financial snapshot
 * @returns {string} HTML
 */
function renderDebtInputSection(snapshot) {
  return `
    <div class="debt-input-section">
      <div class="section-header">
        <h3>💳 Your Debts</h3>
        <button class="btn-primary btn-sm" onclick="showQuickAddDebt()">
          ⚡ Quick Add Debt
        </button>
      </div>

      <!-- Existing Debts -->
      <div class="debt-cards">
        ${snapshot.debts.filter(d => d.balance > 0).map((debt, index) =>
          renderDebtCard(debt, index)
        ).join('')}

        ${snapshot.debts.filter(d => d.balance > 0).length === 0 ? `
          <div class="no-debts">
            <div class="empty-icon">✨</div>
            <h4>No debts added yet</h4>
            <p>Click "Quick Add Debt" to get started</p>
          </div>
        ` : ''}
      </div>

      <!-- Skip for now option -->
      <div class="skip-option">
        <button class="btn-link" onclick="skipDebts()">
          Skip for now - I'll add debts later
        </button>
      </div>
    </div>
  `;
}

/**
 * Render individual debt card
 * @param {Object} debt - Debt object
 * @param {number} index - Debt index
 * @returns {string} HTML
 */
function renderDebtCard(debt, index) {
  const template = DEBT_TEMPLATES[debt.category];
  const monthlyPayment = window.calculateMonthlyPayment(
    debt.balance,
    debt.interestRate / 100 / 12,
    debt.termMonths
  );

  return `
    <div class="debt-card">
      <div class="debt-card-header">
        <div class="debt-icon">${template ? template.icon : '💵'}</div>
        <div class="debt-info">
          <h4>${template ? template.name : debt.category}</h4>
          <div class="debt-balance">${formatCurrency(debt.balance)}</div>
        </div>
        <button class="btn-icon-delete" onclick="removeDebt(${index})" title="Remove">
          🗑️
        </button>
      </div>

      <div class="debt-details">
        <div class="debt-detail-row">
          <span class="detail-label">Interest Rate:</span>
          <span class="detail-value">${debt.interestRate.toFixed(2)}%</span>
        </div>
        <div class="debt-detail-row">
          <span class="detail-label">Term:</span>
          <span class="detail-value">${debt.termMonths} months</span>
        </div>
        <div class="debt-detail-row">
          <span class="detail-label">Monthly Payment:</span>
          <span class="detail-value highlight">${formatCurrency(monthlyPayment)}</span>
        </div>
      </div>

      <button class="btn-secondary btn-sm btn-full" onclick="editDebt(${index})">
        ✏️ Edit Details
      </button>
    </div>
  `;
}

/**
 * Show quick add debt modal
 */
function showQuickAddDebt() {
  const modal = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content modal-large" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>⚡ Quick Add Debt</h3>
          <button class="btn-close" onclick="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <p class="modal-description">
            Choose a debt type to get started with smart defaults
          </p>

          <div class="debt-templates">
            ${Object.entries(DEBT_TEMPLATES).map(([key, template]) => `
              <button class="template-card" onclick="selectDebtTemplate('${key}')">
                <div class="template-icon">${template.icon}</div>
                <div class="template-info">
                  <h4>${template.name}</h4>
                  <p>${template.description}</p>
                  <div class="template-defaults">
                    Default: ${template.defaultRate}% APR, ${template.defaultTerm} months
                  </div>
                </div>
              </button>
            `).join('')}
          </div>

          <div class="modal-divider">
            <span>OR</span>
          </div>

          <div class="paste-statement">
            <h4>📄 Paste from Statement</h4>
            <p class="help-text">
              Copy and paste text from your statement. We'll try to extract balance and interest rate.
            </p>
            <textarea
              id="statementText"
              class="statement-textarea"
              placeholder="Paste statement text here...&#10;&#10;Example:&#10;Balance: $5,234.56&#10;APR: 18.5%&#10;Minimum Payment: $105"
            ></textarea>
            <button class="btn-secondary" onclick="parseStatement()">
              🔍 Extract Information
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

/**
 * Select debt template and show detail form
 * @param {string} templateKey - Template identifier
 */
function selectDebtTemplate(templateKey) {
  const template = DEBT_TEMPLATES[templateKey];

  const form = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>${template.icon} Add ${template.name}</h3>
          <button class="btn-close" onclick="closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Balance Input -->
          <div class="form-group">
            <label for="debtBalance">
              Balance
              <span class="required">*</span>
            </label>
            <input
              type="text"
              id="debtBalance"
              class="form-input"
              placeholder="$5,000"
              autocomplete="off"
            />
          </div>

          <!-- Interest Rate Input -->
          <div class="form-group">
            <label for="debtRate">
              Interest Rate (APR)
              <button class="help-button" onclick="showRateHelp('${templateKey}')">?</button>
            </label>
            <div class="input-with-unit">
              <input
                type="number"
                id="debtRate"
                class="form-input"
                value="${template.defaultRate}"
                step="0.01"
                min="0"
                max="50"
              />
              <span class="input-unit">%</span>
            </div>
            <div class="help-text">
              Typical range: ${template.rateRange.min}% - ${template.rateRange.max}%
            </div>
          </div>

          <!-- Term Input -->
          <div class="form-group">
            <label for="debtTerm">
              Payoff Term
              <button class="help-button" onclick="showTermHelp('${templateKey}')">?</button>
            </label>
            <div class="input-with-unit">
              <input
                type="number"
                id="debtTerm"
                class="form-input"
                value="${template.defaultTerm}"
                min="1"
                max="600"
              />
              <span class="input-unit">months</span>
            </div>
            <div class="help-text">
              Typical range: ${template.termRange.min} - ${template.termRange.max} months
            </div>
          </div>

          <!-- Tips -->
          <div class="tips-box">
            <h5>💡 Tips:</h5>
            <ul>
              ${template.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn-primary" onclick="saveDebtFromTemplate('${templateKey}')">
              Add Debt
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  closeModal();
  setTimeout(() => {
    document.body.insertAdjacentHTML('beforeend', form);
  }, 100);
}

/**
 * Save debt from template form
 * @param {string} templateKey - Template identifier
 */
function saveDebtFromTemplate(templateKey) {
  const balance = parseFloat(document.getElementById('debtBalance').value.replace(/[$,]/g, ''));
  const rate = parseFloat(document.getElementById('debtRate').value);
  const term = parseInt(document.getElementById('debtTerm').value);

  if (isNaN(balance) || balance <= 0) {
    alert('Please enter a valid balance');
    return;
  }

  const debt = window.createDebtFromTemplate(templateKey, balance, rate, term);
  const validation = window.validateDebtInput(debt);

  if (!validation.valid) {
    alert('Validation errors:\n' + validation.errors.join('\n'));
    return;
  }

  if (validation.warnings.length > 0) {
    const confirmed = confirm(
      'Warnings:\n' + validation.warnings.join('\n') + '\n\nContinue anyway?'
    );
    if (!confirmed) return;
  }

  // Add debt to store
  const currentDebts = window.store.state.snapshot.debts;
  currentDebts.push(debt);
  window.store.updateDebt({ debts: currentDebts });

  closeModal();
  window.app.render();
}

/**
 * Parse statement text
 */
function parseStatement() {
  const text = document.getElementById('statementText').value;
  const parsed = window.parseDebtFromStatement(text);

  if (!parsed) {
    alert('Could not extract debt information. Please enter manually.');
    return;
  }

  let message = 'Found:\n';
  if (parsed.balance) message += `Balance: $${parsed.balance.toFixed(2)}\n`;
  if (parsed.rate) message += `Interest Rate: ${parsed.rate}%\n`;
  message += '\nWhich debt type is this?';

  alert(message);
  // In production, show template selector with pre-filled values
}

/**
 * Skip debts for now
 */
function skipDebts() {
  const confirmed = confirm(
    'You can add debts later from the dashboard.\n\nNote: Debt information is important for accurate FIRE projections and optimization recommendations.\n\nContinue without debts?'
  );

  if (confirmed) {
    window.app.showDashboard();
  }
}

/**
 * Remove debt
 */
function removeDebt(index) {
  const confirmed = confirm('Remove this debt?');
  if (!confirmed) return;

  const debts = window.store.state.snapshot.debts;
  debts.splice(index, 1);
  window.store.updateDebt({ debts });
  window.app.render();
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}
```

---

### 3. Add CSS Styling

**File:** `css/styles.css`

```css
/* ===========================
   SIMPLIFIED DEBT INPUT
   ========================== */

.debt-input-section {
  margin: 2rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* Debt Cards */
.debt-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.debt-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.debt-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.debt-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.debt-icon {
  font-size: 2rem;
}

.debt-info {
  flex: 1;
}

.debt-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
}

.debt-balance {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gold);
}

.btn-icon-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.btn-icon-delete:hover {
  opacity: 1;
  color: var(--danger);
}

.debt-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
}

.debt-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-value.highlight {
  color: var(--gold);
  font-weight: 600;
}

/* No Debts State */
.no-debts {
  text-align: center;
  padding: 3rem 1rem;
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Debt Templates */
.debt-templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.template-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-card:hover {
  border-color: var(--gold);
  background: rgba(212, 175, 55, 0.05);
  transform: translateY(-2px);
}

.template-icon {
  font-size: 2rem;
}

.template-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.template-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.template-defaults {
  font-size: 0.75rem;
  color: var(--gold);
}

/* Paste Statement */
.paste-statement {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.statement-textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  margin: 1rem 0;
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.required {
  color: var(--danger);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 1rem;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-unit .form-input {
  flex: 1;
}

.input-unit {
  color: var(--text-secondary);
  font-weight: 500;
}

.help-text {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.help-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--background);
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* Tips Box */
.tips-box {
  background: rgba(96, 165, 250, 0.1);
  border-left: 3px solid var(--accent);
  padding: 1rem;
  border-radius: 4px;
  margin: 1.5rem 0;
}

.tips-box h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.tips-box ul {
  margin: 0;
  padding-left: 1.5rem;
}

.tips-box li {
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: 0.25rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.btn-close:hover {
  color: var(--text);
}

.modal-body {
  padding: 1.5rem;
}

.modal-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.modal-divider {
  text-align: center;
  margin: 2rem 0;
  position: relative;
}

.modal-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border);
}

.modal-divider span {
  position: relative;
  background: var(--background);
  padding: 0 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

/* Skip Option */
.skip-option {
  text-align: center;
  padding: 1rem 0;
}

.btn-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-link:hover {
  color: var(--text);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .debt-cards {
    grid-template-columns: 1fr;
  }

  .debt-templates {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
  }
}
```

---

### 4. Update index.html

```html
<script src="js/debtTemplates.js"></script>  <!-- ADD THIS -->
<script src="components/debtInput.js"></script>  <!-- ADD THIS -->
```

---

### 5. Integrate into Input Cards

**File:** `components/inputCards.js`

Replace the existing debt input section with:

```javascript
// In the renderInputCards function, replace debt section with:
${renderDebtInputSection(snapshot)}
```

---

## Testing & Edge Cases

### Test Cases

1. **Quick Add Flow**
   - Click "Quick Add Debt" → Modal opens with templates
   - Select "Credit Card" → Form opens with defaults (18.5%, 60 months)
   - Enter balance → Validates correctly
   - Save → Debt added to list

2. **Debt Templates**
   - Each template has correct defaults
   - Rate/term ranges shown in help text
   - Tips displayed for each debt type

3. **Statement Parsing**
   - Paste "Balance: $5,234.56, APR: 18.5%" → Extracts both
   - Paste "$2,500" only → Extracts balance
   - Paste "APR 12.5%" only → Extracts rate
   - Invalid text → Shows error

4. **Validation**
   - Unusually high balance → Warning shown
   - Rate outside typical range → Warning shown
   - Invalid inputs → Error prevents saving

5. **Debt Cards**
   - Show debt icon, name, balance
   - Show monthly payment calculation
   - Edit and delete buttons functional

### Edge Cases

- **No balance entered:** Show error
- **Negative balance:** Show error
- **Rate > 50%:** Show error
- **Very long term (>600 months):** Show warning
- **Skip debts:** Confirm dialog, allow continuation
- **No debts:** Show helpful empty state

---

## Estimated Effort

**Development Time:** 8-10 hours

**Breakdown:**
- Debt templates and validation: 2-3 hours
- Quick add modal and forms: 3-4 hours
- Statement parsing logic: 2 hours
- CSS styling and modals: 2 hours
- Testing and edge cases: 1-2 hours

**Priority:** P1 (High - Major UX improvement)

**Dependencies:**
- Requires existing debt data structure
- Should be implemented early to improve onboarding
