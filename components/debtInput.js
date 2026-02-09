/**
 * debtInput.js
 * Enhanced debt input UI with templates and helpers
 */

// ===========================
// SIMPLIFIED DEBT INPUT
// ===========================

/**
 * Render enhanced debt input section
 * @param {Object} snapshot - Financial snapshot
 * @returns {string} HTML
 */
function renderDebtInputSection(snapshot) {
  const activeDebts = snapshot.debts.filter(d => d.balance > 0);

  return `
    <div class="debt-input-section">
      <div class="debt-section-header">
        <h3 class="panel-header">Debts</h3>
        <button class="btn-quick-add" onclick="showQuickAddDebt()" aria-label="Quick add a new debt">
          + Quick Add
        </button>
      </div>

      <!-- Existing Debts -->
      <div class="debt-cards-grid">
        ${activeDebts.length > 0 ? activeDebts.map((debt, index) =>
          renderDebtCard(debt, snapshot.debts.indexOf(debt))
        ).join('') : `
          <div class="no-debts-state">
            <div class="no-debts-icon">✨</div>
            <h4>No debts added yet</h4>
            <p>Click "Quick Add" to get started, or enter debts manually below</p>
          </div>
        `}
      </div>

      <!-- Verify terms note -->
      <p class="debt-note debt-verify-note">
        Always verify rates, balances, and terms against your most recent statements.
      </p>
    </div>
  `;
}

/**
 * Render individual debt card
 * @param {Object} debt - Debt object
 * @param {number} index - Debt index in the array
 * @returns {string} HTML
 */
function renderDebtCard(debt, index) {
  const template = window.DEBT_TEMPLATES ? window.DEBT_TEMPLATES[debt.category] : null;
  const monthlyPayment = calculateMonthlyPayment(
    debt.balance,
    debt.interestRate,
    debt.termMonths || 60
  );

  return `
    <div class="debt-card" role="article" aria-label="${escapeHtml(debt.label || 'Debt')} details">
      <div class="debt-card-header">
        <div class="debt-card-icon">${template ? template.icon : '💵'}</div>
        <div class="debt-card-info">
          <h4 class="debt-card-title">${escapeHtml(template ? template.name : debt.label)}</h4>
          <div class="debt-card-balance">${formatCurrency(debt.balance)}</div>
        </div>
        <button class="btn-remove-debt" onclick="removeDebtCard(${index})" title="Remove this debt" aria-label="Remove ${escapeHtml(debt.label)}">
          ×
        </button>
      </div>

      <div class="debt-card-details">
        <div class="debt-card-row">
          <span class="debt-detail-label">Interest Rate:</span>
          <span class="debt-detail-value">${debt.interestRate.toFixed(2)}%</span>
        </div>
        <div class="debt-card-row">
          <span class="debt-detail-label">Term:</span>
          <span class="debt-detail-value">${debt.termMonths} months</span>
        </div>
        <div class="debt-card-row">
          <span class="debt-detail-label">Monthly Payment:</span>
          <span class="debt-detail-value debt-detail-highlight">${formatCurrency(monthlyPayment)}</span>
        </div>
      </div>

      <button class="btn-edit-debt" onclick="editDebtCard(${index})" aria-label="Edit ${escapeHtml(debt.label)} details">
        Edit Details
      </button>
    </div>
  `;
}

/**
 * Show quick add debt modal
 */
function showQuickAddDebt() {
  const templates = window.DEBT_TEMPLATES || {};

  const modal = `
    <div class="modal-overlay" onclick="closeDebtModal(event)" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
      <div class="modal-content modal-large" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 id="quick-add-title">Quick Add Debt</h3>
          <button class="btn-modal-close" onclick="closeDebtModal()" aria-label="Close modal">×</button>
        </div>

        <div class="modal-body">
          <p class="modal-description">
            Choose a debt type to get started with typical market values (you can adjust these)
          </p>

          <div class="debt-templates-grid" role="list">
            ${Object.entries(templates).map(([key, template]) => `
              <button class="template-card" onclick="selectDebtTemplate('${key}')" role="listitem" aria-label="Add ${escapeHtml(template.name)}">
                <div class="template-icon">${template.icon}</div>
                <div class="template-info">
                  <h4>${escapeHtml(template.name)}</h4>
                  <p>${escapeHtml(template.description)}</p>
                  <div class="template-defaults">
                    Tool defaults: ${template.defaultRate}% APR, ${template.defaultTerm} mo
                  </div>
                </div>
              </button>
            `).join('')}
          </div>

          <div class="modal-divider">
            <span>OR</span>
          </div>

          <div class="paste-statement-section">
            <h4>Paste from Statement</h4>
            <p class="paste-help-text">
              Copy and paste text from your statement. We'll try to extract balance and interest rate.
            </p>
            <textarea
              id="statementText"
              class="statement-textarea"
              placeholder="Paste statement text here...

Example:
Balance: $5,234.56
APR: 18.5%
Minimum Payment: $105"
              maxlength="5000"
              aria-label="Paste your statement text here"
            ></textarea>
            <button class="btn-parse-statement" onclick="parseStatementText()">
              Extract Information
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);

  // Focus the first template for accessibility
  setTimeout(() => {
    const firstTemplate = document.querySelector('.template-card');
    if (firstTemplate) firstTemplate.focus();
  }, 100);
}

/**
 * Select debt template and show detail form
 * @param {string} templateKey - Template identifier
 */
function selectDebtTemplate(templateKey) {
  const templates = window.DEBT_TEMPLATES || {};
  const template = templates[templateKey];
  if (!template) return;

  closeDebtModal();

  setTimeout(() => {
    const form = `
      <div class="modal-overlay" onclick="closeDebtModal(event)" role="dialog" aria-modal="true" aria-labelledby="add-debt-title">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 id="add-debt-title">${template.icon} Add ${escapeHtml(template.name)}</h3>
            <button class="btn-modal-close" onclick="closeDebtModal()" aria-label="Close modal">×</button>
          </div>

          <div class="modal-body">
            <!-- Balance Input -->
            <div class="form-group">
              <label for="debtBalance">
                Balance
                <span class="required-indicator" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="debtBalance"
                class="form-input"
                placeholder="$5,000"
                autocomplete="off"
                aria-required="true"
              />
            </div>

            <!-- Interest Rate Input -->
            <div class="form-group">
              <label for="debtRate">
                Interest Rate (APR)
                <button type="button" class="help-btn" onclick="showRateHelp('${templateKey}')" aria-label="Help with interest rate">?</button>
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
                  aria-describedby="rate-help"
                />
                <span class="input-unit">%</span>
              </div>
              <div id="rate-help" class="input-help-text">
                Typical range: ${template.rateRange.min}% - ${template.rateRange.max}%
              </div>
            </div>

            <!-- Term Input -->
            <div class="form-group">
              <label for="debtTerm">
                Payoff Term
                <button type="button" class="help-btn" onclick="showTermHelp('${templateKey}')" aria-label="Help with payoff term">?</button>
              </label>
              <div class="input-with-unit">
                <input
                  type="number"
                  id="debtTerm"
                  class="form-input"
                  value="${template.defaultTerm}"
                  min="1"
                  max="600"
                  aria-describedby="term-help"
                />
                <span class="input-unit">months</span>
              </div>
              <div id="term-help" class="input-help-text">
                Typical range: ${template.termRange.min} - ${template.termRange.max} months
              </div>
            </div>

            <!-- Tips -->
            <div class="tips-box" role="note">
              <h5>Tips:</h5>
              <ul>
                ${template.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="modal-actions">
              <button class="btn-secondary" onclick="closeDebtModal()">Cancel</button>
              <button class="btn-primary" onclick="saveDebtFromTemplate('${templateKey}')">
                Add Debt
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', form);

    // Focus the balance input
    setTimeout(() => {
      const balanceInput = document.getElementById('debtBalance');
      if (balanceInput) balanceInput.focus();
    }, 100);
  }, 150);
}

/**
 * Save debt from template form
 * @param {string} templateKey - Template identifier
 */
function saveDebtFromTemplate(templateKey) {
  const balanceInput = document.getElementById('debtBalance');
  const rateInput = document.getElementById('debtRate');
  const termInput = document.getElementById('debtTerm');

  if (!balanceInput || !rateInput || !termInput) return;

  // Parse and sanitize balance
  const balanceStr = balanceInput.value.replace(/[$,\s]/g, '');
  const balance = parseFloat(balanceStr);
  const rate = parseFloat(rateInput.value);
  const term = parseInt(termInput.value, 10);

  if (isNaN(balance) || balance <= 0) {
    showDebtError('Please enter a valid balance greater than $0');
    balanceInput.focus();
    return;
  }

  if (isNaN(rate) || rate < 0 || rate > 50) {
    showDebtError('Please enter a valid interest rate between 0% and 50%');
    rateInput.focus();
    return;
  }

  if (isNaN(term) || term < 1 || term > 600) {
    showDebtError('Please enter a valid term between 1 and 600 months');
    termInput.focus();
    return;
  }

  const debt = window.createDebtFromTemplate(templateKey, balance, rate, term);
  const validation = window.validateDebtInput(debt);

  if (!validation.valid) {
    showDebtError('Validation errors:\n' + validation.errors.join('\n'));
    return;
  }

  if (validation.warnings.length > 0) {
    const confirmed = confirm(
      'Warnings:\n' + validation.warnings.join('\n') + '\n\nContinue anyway?'
    );
    if (!confirmed) return;
  }

  // Find the matching default debt slot or add new
  const currentState = getState();
  const debts = [...currentState.snapshot.debts];

  // Find existing slot for this category
  const existingIndex = debts.findIndex(d => d.category === debt.category && d.balance === 0);

  if (existingIndex >= 0) {
    // Update existing slot
    debts[existingIndex] = { ...debts[existingIndex], ...debt };
  } else {
    // Find first empty "OTHER" slot or append
    const otherIndex = debts.findIndex(d => d.category === 'OTHER' && d.balance === 0);
    if (otherIndex >= 0) {
      debts[otherIndex] = { ...debts[otherIndex], ...debt };
    } else {
      debts.push(debt);
    }
  }

  // Update state
  state.snapshot.debts = debts;
  recalculate();
  saveState();

  closeDebtModal();
  render();
}

/**
 * Parse statement text
 */
function parseStatementText() {
  const textarea = document.getElementById('statementText');
  if (!textarea) return;

  const text = textarea.value;
  const parsed = window.parseDebtFromStatement(text);

  if (!parsed) {
    showDebtError('Could not extract debt information from the text. Please try entering values manually.');
    return;
  }

  let message = 'Found:\n';
  if (parsed.balance) message += 'Balance: $' + parsed.balance.toFixed(2) + '\n';
  if (parsed.rate) message += 'Interest Rate: ' + parsed.rate + '%\n';
  message += '\nSelect a debt type to continue with these values.';

  alert(message);

  // Store parsed values for use when selecting template
  window._parsedStatementData = parsed;
}

/**
 * Show rate help for template
 * @param {string} templateKey - Template identifier
 */
function showRateHelp(templateKey) {
  const templates = window.DEBT_TEMPLATES || {};
  const template = templates[templateKey];
  if (!template) return;

  alert(
    template.name + ' Interest Rate Help\n\n' +
    'Typical range: ' + template.rateRange.min + '% - ' + template.rateRange.max + '%\n\n' +
    template.tips.join('\n')
  );
}

/**
 * Show term help for template
 * @param {string} templateKey - Template identifier
 */
function showTermHelp(templateKey) {
  const templates = window.DEBT_TEMPLATES || {};
  const template = templates[templateKey];
  if (!template) return;

  alert(
    template.name + ' Payoff Term Help\n\n' +
    'Typical range: ' + template.termRange.min + ' - ' + template.termRange.max + ' months\n\n' +
    'The term is how long you plan to take to pay off this debt. ' +
    'Shorter terms mean higher monthly payments but less interest paid overall.'
  );
}


/**
 * Remove debt card
 * @param {number} index - Debt index
 */
function removeDebtCard(index) {
  const confirmed = confirm('Remove this debt?');
  if (!confirmed) return;

  const currentState = getState();
  const debts = [...currentState.snapshot.debts];

  if (index >= 0 && index < debts.length) {
    // Reset to zero rather than removing (to maintain fixed categories)
    debts[index] = {
      ...debts[index],
      balance: 0,
      interestRate: 0
    };
  }

  state.snapshot.debts = debts;
  recalculate();
  saveState();
  render();
}

/**
 * Edit debt card
 * @param {number} index - Debt index
 */
function editDebtCard(index) {
  const currentState = getState();
  const debt = currentState.snapshot.debts[index];
  if (!debt) return;

  // Find matching template
  const templates = window.DEBT_TEMPLATES || {};
  let templateKey = Object.keys(templates).find(key => templates[key].category === debt.category);
  if (!templateKey) templateKey = 'PERSONAL';

  selectDebtTemplate(templateKey);

  // Pre-fill values after modal opens
  setTimeout(() => {
    const balanceInput = document.getElementById('debtBalance');
    const rateInput = document.getElementById('debtRate');
    const termInput = document.getElementById('debtTerm');

    if (balanceInput) balanceInput.value = debt.balance > 0 ? formatCurrency(debt.balance) : '';
    if (rateInput) rateInput.value = debt.interestRate || '';
    if (termInput) termInput.value = debt.termMonths || '';
  }, 200);
}

/**
 * Close debt modal
 * @param {Event} event - Click event (optional)
 */
function closeDebtModal(event) {
  if (event && event.target !== event.currentTarget) return;

  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

/**
 * Show debt error message
 * @param {string} message - Error message
 */
function showDebtError(message) {
  alert(message);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Expose functions globally
window.renderDebtInputSection = renderDebtInputSection;
window.showQuickAddDebt = showQuickAddDebt;
window.selectDebtTemplate = selectDebtTemplate;
window.saveDebtFromTemplate = saveDebtFromTemplate;
window.parseStatementText = parseStatementText;
window.showRateHelp = showRateHelp;
window.showTermHelp = showTermHelp;
window.removeDebtCard = removeDebtCard;
window.editDebtCard = editDebtCard;
window.closeDebtModal = closeDebtModal;
