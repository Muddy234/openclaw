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
 * Validate MSA/City input
 * @param {string} value - The city/MSA value to validate
 * @returns {Object} { valid: boolean, message: string, value: string }
 */
function validateMsa(value) {
  const stringValue = String(value || '').trim();

  if (stringValue.length === 0) {
    return { valid: true, message: '', value: '' }; // Empty is allowed
  }

  if (stringValue.length > 100) {
    return {
      valid: false,
      message: 'City name too long (max 100 characters)',
      value: null
    };
  }

  // Only allow letters, numbers, spaces, commas, hyphens, periods
  const cleaned = stringValue.replace(/[^a-zA-Z0-9\s,\-\.]/g, '');
  if (cleaned !== stringValue) {
    return {
      valid: false,
      message: 'Only letters, numbers, spaces, commas, and hyphens allowed',
      value: null
    };
  }

  return { valid: true, message: '', value: cleaned };
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

  // Set ARIA attributes for accessibility
  inputElement.setAttribute('aria-invalid', 'true');

  // Create and append error message
  const errorId = 'error-' + Math.random().toString(36).substr(2, 9);
  const errorDiv = document.createElement('div');
  errorDiv.id = errorId;
  errorDiv.className = 'error-message';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.textContent = message;
  inputElement.parentElement.appendChild(errorDiv);

  // Link error message to input
  inputElement.setAttribute('aria-describedby', errorId);
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

  // Set ARIA attribute for valid state
  inputElement.setAttribute('aria-invalid', 'false');
}

/**
 * Clear validation state from input element
 * @param {HTMLElement} inputElement - The input element
 */
function clearValidationState(inputElement) {
  inputElement.classList.remove('input-error', 'input-valid');

  // Remove ARIA attributes
  inputElement.removeAttribute('aria-invalid');
  inputElement.removeAttribute('aria-describedby');

  // Remove any existing error message
  const existingError = inputElement.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
}

// Expose functions globally
window.validateAge = validateAge;
window.validateRetirementAge = validateRetirementAge;
window.validateCurrency = validateCurrency;
window.validateInterestRate = validateInterestRate;
window.validateDebtTerm = validateDebtTerm;
window.validateMsa = validateMsa;
window.formatCurrency = formatCurrency;
window.showValidationError = showValidationError;
window.showValidationSuccess = showValidationSuccess;
window.clearValidationState = clearValidationState;
