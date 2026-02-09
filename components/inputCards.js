/**
 * inputCards.js
 * Renders the input form (General panel with FIRE target)
 */

// ===========================
// VALIDATION HANDLERS
// ===========================

function handleAgeChange(e) {
  const input = e.target;
  const result = validateAge(input.value);

  if (result.valid) {
    showValidationSuccess(input);
    window.updateGeneral({ age: result.value });
  } else {
    showValidationError(input, result.message);
  }
}

function handleRetirementAgeChange(e) {
  const input = e.target;
  const currentAge = window.state.snapshot.general.age;
  const result = validateRetirementAge(input.value, currentAge);

  if (result.valid) {
    showValidationSuccess(input);
    window.updateGeneral({ targetRetirement: result.value });
  } else {
    showValidationError(input, result.message);
  }
}

function handleCurrencyChange(fieldName) {
  return function(e) {
    const input = e.target;
    const result = validateCurrency(input.value);

    if (result.valid) {
      showValidationSuccess(input);
      // Format the display value
      input.value = formatCurrency(result.value);

      // Update store based on which panel this belongs to
      if (fieldName === 'monthlyTakeHome' || fieldName === 'monthlyExpense' || fieldName === 'annualIncome') {
        window.updateGeneral({ [fieldName]: result.value });
      } else {
        window.updateInvestments({ [fieldName]: result.value });
      }
    } else {
      showValidationError(input, result.message);
    }
  };
}

function handleInterestRateChange(debtIndex) {
  return function(e) {
    const input = e.target;
    const result = validateInterestRate(input.value);

    if (result.valid) {
      showValidationSuccess(input);
      window.updateDebt(debtIndex, { interestRate: result.value });
    } else {
      showValidationError(input, result.message);
    }
  };
}

function handleDebtTermChange(debtIndex) {
  return function(e) {
    const input = e.target;
    const result = validateDebtTerm(input.value);

    if (result.valid) {
      showValidationSuccess(input);
      window.updateDebt(debtIndex, { termMonths: result.value });
    } else {
      showValidationError(input, result.message);
    }
  };
}

function handleDebtBalanceChange(debtIndex) {
  return function(e) {
    const input = e.target;
    const result = validateCurrency(input.value);

    if (result.valid) {
      showValidationSuccess(input);
      window.updateDebt(debtIndex, { balance: result.value });
    } else {
      showValidationError(input, result.message);
    }
  };
}

function handleMsaChange(e) {
  const input = e.target;
  const result = validateMsa(input.value);

  if (result.valid) {
    if (result.value) {
      showValidationSuccess(input);
    } else {
      clearValidationState(input);
    }
    updateGeneral({ msa: result.value });
  } else {
    showValidationError(input, result.message);
  }
}

function handleFireExpenseTargetChange(e) {
  const input = e.target;
  const result = validateCurrency(input.value);

  if (result.valid) {
    showValidationSuccess(input);
    input.value = formatCurrency(result.value);
    window.updateFireSettings({ fireAnnualExpenseTarget: result.value });
  } else {
    showValidationError(input, result.message);
  }
}

// ===========================
// KEYBOARD NAVIGATION
// ===========================

/**
 * Handle Enter key to move to next input field
 * Also handles Tab key navigation within the form
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleInputKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Trigger blur to save current value
    e.target.blur();
    // Move to next input
    moveToNextInput(e.target);
  }
}

/**
 * Move focus to the next input field in tab order
 * @param {HTMLElement} currentInput - Current focused input
 */
function moveToNextInput(currentInput) {
  // Get all focusable inputs in the form
  const form = document.querySelector('.two-col-grid');
  if (!form) return;

  const inputs = Array.from(form.querySelectorAll('input:not([disabled])'));
  const currentIndex = inputs.indexOf(currentInput);

  if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
    // Focus next input
    setTimeout(() => {
      inputs[currentIndex + 1].focus();
      inputs[currentIndex + 1].select();
    }, 10);
  }
}

// ===========================
// RENDER FUNCTION
// ===========================

function renderInputCards() {
  const { snapshot } = getState();
  const cashFlow = snapshot.general.monthlyTakeHome - snapshot.general.monthlyExpense;
  const isReady = snapshot.general.annualIncome > 0 && snapshot.general.monthlyExpense > 0;

  return `
    <div class="container">
      <div class="max-w-6xl">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="mb-2">Financial GPS</h1>
          <p class="text-secondary">Enter your financial information</p>
        </div>

        <!-- Input Layout -->
        <div class="two-col-grid">

          <!-- General -->
          <div class="card">
            <h3 class="panel-header">General</h3>
            <div class="panel-grid">
              <div class="panel-row">
                <span class="panel-label">Age</span>
                <input
                  type="number"
                  class="panel-input"
                  value="${snapshot.general.age || ''}"
                  onblur="handleAgeChange(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="1"
                  min="18"
                  max="100"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">
                  ${typeof renderTooltip === 'function'
                    ? renderTooltip('targetRetirement', 'Target Retirement', {})
                    : 'Target Retirement'}
                </span>
                <input
                  type="number"
                  class="panel-input"
                  value="${snapshot.general.targetRetirement || ''}"
                  onblur="handleRetirementAgeChange(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="2"
                  min="${(snapshot.general.age || 18) + 1}"
                  max="100"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">Annual Income</span>
                <input
                  type="text"
                  class="panel-input"
                  placeholder="$225,000"
                  value="${snapshot.general.annualIncome ? formatCurrency(snapshot.general.annualIncome) : ''}"
                  onblur="handleCurrencyChange('annualIncome')(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="3"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">
                  ${typeof renderTooltip === 'function'
                    ? renderTooltip('monthlyTakeHome', 'Monthly Take-home', {})
                    : 'Monthly Take-home'}
                </span>
                <input
                  type="text"
                  class="panel-input"
                  placeholder="$14,000"
                  value="${snapshot.general.monthlyTakeHome ? formatCurrency(snapshot.general.monthlyTakeHome) : ''}"
                  onblur="handleCurrencyChange('monthlyTakeHome')(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="4"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">
                  ${typeof renderTooltip === 'function'
                    ? renderTooltip('monthlyExpense', 'Monthly Expenses', {})
                    : 'Monthly Expense'}
                </span>
                <input
                  type="text"
                  class="panel-input"
                  placeholder="$12,000"
                  value="${snapshot.general.monthlyExpense ? formatCurrency(snapshot.general.monthlyExpense) : ''}"
                  onblur="handleCurrencyChange('monthlyExpense')(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="5"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">Monthly Cash Flow</span>
                <span class="panel-value">${cashFlow.toLocaleString()}</span>
              </div>
              <div class="panel-row">
                <span class="panel-label">MSA</span>
                <input
                  type="text"
                  class="panel-input"
                  placeholder="City"
                  value="${snapshot.general.msa || ''}"
                  onblur="handleMsaChange(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="6"
                  maxlength="100"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">
                  ${typeof renderTooltip === 'function'
                    ? renderTooltip('fireAnnualExpenseTarget', 'Annual Expense Target', {})
                    : 'Annual Expense Target'}
                </span>
                <input
                  type="text"
                  class="panel-input"
                  placeholder="$144,000"
                  value="${snapshot.fireSettings.fireAnnualExpenseTarget ? formatCurrency(snapshot.fireSettings.fireAnnualExpenseTarget) : ''}"
                  onblur="handleFireExpenseTargetChange(event)"
                  onkeydown="handleInputKeydown(event)"
                  tabindex="7"
                >
              </div>
              <div class="panel-row">
                <span class="panel-label">FIRE Target Net Worth</span>
                <span class="panel-value">${
                  snapshot.fireSettings.fireAnnualExpenseTarget > 0
                    ? formatCurrency(snapshot.fireSettings.fireAnnualExpenseTarget * 25)
                    : (snapshot.general.monthlyExpense > 0
                        ? formatCurrency(snapshot.general.monthlyExpense * 12 * 25)
                        : '$0')
                }</span>
              </div>
            </div>
          </div>
        </div>

        <p class="text-dim text-sm text-center mt-2">Investments, savings, and debts can be entered on the dashboard tabs.</p>

        <!-- Continue Button -->
        <div class="text-center">
          <button
            onclick="showDashboard()"
            ${!isReady ? 'disabled' : ''}
            class="btn btn-primary px-12"
          >
            View My Dashboard
          </button>
          ${!isReady ? '<p class="text-dim text-sm mt-4">Enter income and expenses to continue</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

// Expose to window for global access
window.renderInputCards = renderInputCards;
window.handleAgeChange = handleAgeChange;
window.handleRetirementAgeChange = handleRetirementAgeChange;
window.handleCurrencyChange = handleCurrencyChange;
window.handleInterestRateChange = handleInterestRateChange;
window.handleDebtTermChange = handleDebtTermChange;
window.handleDebtBalanceChange = handleDebtBalanceChange;
window.handleMsaChange = handleMsaChange;
window.handleFireExpenseTargetChange = handleFireExpenseTargetChange;
window.handleInputKeydown = handleInputKeydown;
window.moveToNextInput = moveToNextInput;
