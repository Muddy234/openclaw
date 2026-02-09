# Feature 1: Input Validation

## Vision

Users currently experience frustration when entering invalid data that breaks calculations or produces nonsensical results. A robust validation system will catch errors in real-time, guide users toward correct input, and prevent the "garbage in, garbage out" problem that undermines trust in the Financial GPS platform.

## Goal

Implement comprehensive client-side validation for all user inputs with:
- Real-time feedback as users type or change values
- Clear, helpful error messages
- Visual indicators (colors, icons) for validation states
- Prevention of invalid data from entering the calculation engine

## Success Metrics

**What Success Looks Like:**
- Zero invalid data entries make it into projections
- Users receive immediate feedback on validation errors (< 100ms)
- Error messages are clear and actionable ("Age must be between 18 and 100" not "Invalid input")
- Form fields show visual validation states (green checkmark for valid, red border for invalid)
- Reduced support requests about "broken calculations"

**Acceptance Criteria:**
- [ ] Age validates: 18-100 range
- [ ] Retirement age validates: greater than current age, less than 100
- [ ] All currency fields validate: 0-$10M range, accept formatted input ($50,000 or 50000)
- [ ] Interest rates validate: 0-30% range
- [ ] Debt terms validate: 1-480 months
- [ ] Error messages appear immediately on blur
- [ ] Valid inputs show green checkmark
- [ ] Invalid inputs show red border + error message
- [ ] Currency fields auto-format on blur (50000 → $50,000)

---

## Implementation Plan

### 1. Create Validation Library

**File:** `js/validation.js` (new file)

**Purpose:** Centralized validation functions for all input types

**Full Code:**

```javascript
// ===========================
// VALIDATION LIBRARY
// ===========================

/**
 * Validate age input
 * @param {string|number} value - The age value to validate
 * @returns {Object} { valid: boolean, message: string, value: number }
 */
function validateAge(value) {
  const num = parseInt(value);
  if (isNaN(num) || num < 18 || num > 100) {
    return {
      valid: false,
      message: 'Age must be between 18 and 100',
      value: null
    };
  }
  return { valid: true, message: '', value: num };
}

/**
 * Validate retirement age relative to current age
 * @param {number} retirementAge - Target retirement age
 * @param {number} currentAge - Current age
 * @returns {Object} { valid: boolean, message: string, value: number }
 */
function validateRetirementAge(retirementAge, currentAge) {
  const num = parseInt(retirementAge);
  if (isNaN(num)) {
    return {
      valid: false,
      message: 'Please enter a valid retirement age',
      value: null
    };
  }
  if (num <= currentAge) {
    return {
      valid: false,
      message: `Retirement age must be greater than current age (${currentAge})`,
      value: null
    };
  }
  if (num > 100) {
    return {
      valid: false,
      message: 'Retirement age cannot exceed 100',
      value: null
    };
  }
  return { valid: true, message: '', value: num };
}

/**
 * Validate currency input (accepts formatted or raw numbers)
 * @param {string|number} value - The currency value to validate
 * @returns {Object} { valid: boolean, message: string, value: number }
 */
function validateCurrency(value) {
  // Remove dollar signs, commas, and whitespace
  const cleaned = String(value).replace(/[\$,\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return {
      valid: false,
      message: 'Please enter a valid amount',
      value: null
    };
  }
  if (num < 0) {
    return {
      valid: false,
      message: 'Amount cannot be negative',
      value: null
    };
  }
  if (num > 10000000) {
    return {
      valid: false,
      message: 'Amount cannot exceed $10,000,000',
      value: null
    };
  }
  return { valid: true, message: '', value: num };
}

/**
 * Validate interest rate (percentage)
 * @param {string|number} value - The interest rate to validate
 * @returns {Object} { valid: boolean, message: string, value: number }
 */
function validateInterestRate(value) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return {
      valid: false,
      message: 'Please enter a valid interest rate',
      value: null
    };
  }
  if (num < 0 || num > 30) {
    return {
      valid: false,
      message: 'Interest rate must be between 0% and 30%',
      value: null
    };
  }
  return { valid: true, message: '', value: num };
}

/**
 * Validate debt term in months
 * @param {string|number} value - The term in months
 * @returns {Object} { valid: boolean, message: string, value: number }
 */
function validateDebtTerm(value) {
  const num = parseInt(value);
  if (isNaN(num)) {
    return {
      valid: false,
      message: 'Please enter a valid term',
      value: null
    };
  }
  if (num < 1 || num > 480) {
    return {
      valid: false,
      message: 'Term must be between 1 and 480 months (40 years)',
      value: null
    };
  }
  return { valid: true, message: '', value: num };
}

/**
 * Format number as currency
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Show validation error on input element
 * @param {HTMLElement} inputElement - The input element
 * @param {string} message - Error message to display
 */
function showValidationError(inputElement, message) {
  // Remove any existing error
  clearValidationState(inputElement);

  // Add error class
  inputElement.classList.add('input-error');

  // Create and append error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  inputElement.parentElement.appendChild(errorDiv);
}

/**
 * Show validation success on input element
 * @param {HTMLElement} inputElement - The input element
 */
function showValidationSuccess(inputElement) {
  // Remove any existing error
  clearValidationState(inputElement);

  // Add valid class
  inputElement.classList.add('input-valid');
}

/**
 * Clear validation state from input element
 * @param {HTMLElement} inputElement - The input element
 */
function clearValidationState(inputElement) {
  inputElement.classList.remove('input-error', 'input-valid');

  // Remove any existing error message
  const existingError = inputElement.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
}
```

---

### 2. Update Input Cards Component

**File:** `components/inputCards.js`

**Changes:** Add validation handlers to all input fields

**Implementation Steps:**

1. Add validation handlers for each input type:

```javascript
// Add these handler functions to inputCards.js

function handleAgeChange(e) {
  const input = e.target;
  const result = validateAge(input.value);

  if (result.valid) {
    showValidationSuccess(input);
    window.store.updateGeneral({ age: result.value });
  } else {
    showValidationError(input, result.message);
  }
}

function handleRetirementAgeChange(e) {
  const input = e.target;
  const currentAge = window.store.state.snapshot.general.age;
  const result = validateRetirementAge(input.value, currentAge);

  if (result.valid) {
    showValidationSuccess(input);
    window.store.updateGeneral({ targetRetirement: result.value });
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
        window.store.updateGeneral({ [fieldName]: result.value });
      } else {
        window.store.updateInvestments({ [fieldName]: result.value });
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
      const debts = [...window.store.state.snapshot.debts];
      debts[debtIndex].interestRate = result.value;
      window.store.updateDebt({ debts });
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
      const debts = [...window.store.state.snapshot.debts];
      debts[debtIndex].termMonths = result.value;
      window.store.updateDebt({ debts });
    } else {
      showValidationError(input, result.message);
    }
  };
}
```

2. Update input elements to use validation handlers:

```javascript
// Example: Update age input in renderGeneralPanel()
<input
  type="number"
  id="age"
  value="${snapshot.general.age}"
  onblur="handleAgeChange(event)"
  min="18"
  max="100"
/>

// Example: Update currency input in renderGeneralPanel()
<input
  type="text"
  id="monthlyTakeHome"
  value="${formatCurrency(snapshot.general.monthlyTakeHome)}"
  onblur="handleCurrencyChange('monthlyTakeHome')(event)"
/>

// Example: Update interest rate in renderDebtsPanel()
<input
  type="number"
  step="0.01"
  value="${debt.interestRate}"
  onblur="handleInterestRateChange(${index})(event)"
/>
```

---

### 3. Add Validation CSS Styles

**File:** `css/styles.css`

**Add these styles:**

```css
/* ===========================
   VALIDATION STYLES
   ========================== */

/* Input validation states */
input.input-error,
select.input-error {
  border-color: var(--danger);
  background-color: rgba(239, 68, 68, 0.1);
}

input.input-valid,
select.input-valid {
  border-color: var(--success);
  background-color: rgba(34, 197, 94, 0.1);
}

/* Error message styling */
.error-message {
  color: var(--danger);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-message::before {
  content: '⚠️';
  font-size: 1rem;
}

/* Success checkmark (optional) */
input.input-valid::after {
  content: '✓';
  color: var(--success);
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

/* Focus states for validation */
input.input-error:focus {
  outline-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

input.input-valid:focus {
  outline-color: var(--success);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}
```

---

### 4. Update index.html Script Loading Order

**File:** `index.html`

**Change:** Add validation.js to script loading sequence

```html
<script src="js/constants.js"></script>
<script src="js/validation.js"></script>  <!-- ADD THIS LINE -->
<script src="js/store.js"></script>
<script src="js/strategy.js"></script>
<script src="js/projections.js"></script>
<script src="components/dashboard.js"></script>
<script src="components/inputCards.js"></script>
<script src="components/fireJourney.js"></script>
<script src="js/app.js"></script>
```

---

## Testing & Edge Cases

### Test Cases

1. **Age Validation**
   - Input: 17 → Error: "Age must be between 18 and 100"
   - Input: 101 → Error: "Age must be between 18 and 100"
   - Input: 32 → Success: Green checkmark
   - Input: "abc" → Error: "Age must be between 18 and 100"

2. **Retirement Age Validation**
   - Current age: 32, Retirement: 30 → Error: "Retirement age must be greater than current age (32)"
   - Current age: 32, Retirement: 50 → Success: Green checkmark
   - Current age: 32, Retirement: 105 → Error: "Retirement age cannot exceed 100"

3. **Currency Validation**
   - Input: "-500" → Error: "Amount cannot be negative"
   - Input: "$50,000" → Success: Formatted as "$50,000"
   - Input: "50000" → Success: Formatted as "$50,000"
   - Input: "15000000" → Error: "Amount cannot exceed $10,000,000"
   - Input: "abc" → Error: "Please enter a valid amount"

4. **Interest Rate Validation**
   - Input: "35" → Error: "Interest rate must be between 0% and 30%"
   - Input: "-5" → Error: "Interest rate must be between 0% and 30%"
   - Input: "5.5" → Success: Green checkmark

5. **Debt Term Validation**
   - Input: "0" → Error: "Term must be between 1 and 480 months"
   - Input: "500" → Error: "Term must be between 1 and 480 months"
   - Input: "60" → Success: Green checkmark

### Edge Cases

- **Empty fields:** Should show error on blur
- **Pasted values:** Should validate formatted currency ($50,000)
- **Tab navigation:** Validation should trigger on blur
- **Form submission:** Should prevent submission if any field is invalid
- **Existing data:** Should not show errors on page load, only on user interaction

---

## Estimated Effort

**Development Time:** 6-8 hours

**Breakdown:**
- Validation library creation: 2 hours
- Input handlers implementation: 2-3 hours
- CSS styling: 1 hour
- Testing and edge case handling: 2-3 hours

**Priority:** P0 (Critical - Foundational feature)

**Dependencies:** None
