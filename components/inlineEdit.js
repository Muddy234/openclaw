/**
 * inlineEdit.js
 * Inline editing with pencil icons for dashboard fields
 * Allows users to edit values directly without navigating to a separate form
 */

// Pencil icon SVG (matches existing icon style from tabIcons.js)
const PENCIL_ICON = `<svg class="pencil-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

// Field configuration - maps field keys to validators and update functions
const EDITABLE_FIELDS = {
  // General section
  age: {
    section: 'general',
    inputType: 'number',
    inputAttrs: { min: 18, max: 100 },
    validate: (val) => typeof validateAge === 'function' ? validateAge(val) : { valid: true, value: parseInt(val) },
    update: (val) => updateGeneral({ age: val }),
    format: (val) => val
  },
  targetRetirement: {
    section: 'general',
    inputType: 'number',
    inputAttrs: { min: 18, max: 100 },
    validate: (val) => {
      const currentAge = getState().snapshot.general.age;
      return typeof validateRetirementAge === 'function'
        ? validateRetirementAge(val, currentAge)
        : { valid: true, value: parseInt(val) };
    },
    update: (val) => updateGeneral({ targetRetirement: val }),
    format: (val) => val
  },
  annualIncome: {
    section: 'general',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateGeneral({ annualIncome: val }),
    format: (val) => val.toLocaleString()
  },
  monthlyTakeHome: {
    section: 'general',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateGeneral({ monthlyTakeHome: val }),
    format: (val) => val.toLocaleString()
  },
  monthlyExpense: {
    section: 'general',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateGeneral({ monthlyExpense: val }),
    format: (val) => val.toLocaleString()
  },
  msa: {
    section: 'general',
    inputType: 'text',
    validate: (val) => ({ valid: true, value: val.trim() }),
    update: (val) => updateGeneral({ msa: val }),
    format: (val) => val || '-'
  },
  // Investments section
  savings: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ savings: val }),
    format: (val) => val.toLocaleString()
  },
  ira: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ ira: val }),
    format: (val) => val.toLocaleString()
  },
  rothIra: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ rothIra: val }),
    format: (val) => val.toLocaleString()
  },
  stocksBonds: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ stocksBonds: val }),
    format: (val) => val.toLocaleString()
  },
  fourOhOneK: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ fourOhOneK: val }),
    format: (val) => val.toLocaleString()
  },
  realEstate: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ realEstate: val }),
    format: (val) => val.toLocaleString()
  },
  carValue: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ carValue: val }),
    format: (val) => val.toLocaleString()
  },
  otherInvestments: {
    section: 'investments',
    inputType: 'text',
    validate: (val) => typeof validateCurrency === 'function' ? validateCurrency(val) : { valid: true, value: parseFloat(val.replace(/[,$]/g, '')) },
    update: (val) => updateInvestments({ other: val }),
    format: (val) => val.toLocaleString()
  }
};

/**
 * Render an editable field with pencil icon
 * @param {string} fieldKey - Key from EDITABLE_FIELDS
 * @param {string} label - Display label
 * @param {*} value - Current value
 * @returns {string} HTML string
 */
function renderEditableField(fieldKey, label, value) {
  const config = EDITABLE_FIELDS[fieldKey];
  if (!config) {
    // Fallback for unknown fields - render as read-only
    return `
      <div class="panel-row">
        <span class="panel-label">${label}</span>
        <span class="panel-value">${value}</span>
      </div>
    `;
  }

  const formattedValue = config.format(value);
  const rawValue = typeof value === 'number' ? value : value;

  return `
    <div class="panel-row panel-row--editable" data-field="${fieldKey}" data-section="${config.section}" data-raw="${rawValue}">
      <span class="panel-label">${label}</span>
      <span class="panel-value-wrapper">
        <span class="panel-value">${formattedValue}</span>
        <button class="edit-pencil" aria-label="Edit ${label}" title="Edit ${label}">
          ${PENCIL_ICON}
        </button>
      </span>
    </div>
  `;
}

/**
 * Render an editable debt field (for debt table cells)
 * @param {string} fieldType - 'balance' or 'interestRate'
 * @param {*} value - Current value
 * @param {number} debtIndex - Index in debts array
 * @param {string} debtLabel - Label for accessibility
 * @returns {string} HTML string
 */
function renderEditableDebtCell(fieldType, value, debtIndex, debtLabel) {
  const isBalance = fieldType === 'balance';
  const formattedValue = isBalance
    ? (value > 0 ? value.toLocaleString() : '-')
    : (value > 0 ? `${value}%` : '0.0%');
  const rawValue = value;
  const ariaLabel = isBalance ? `Edit ${debtLabel} balance` : `Edit ${debtLabel} interest rate`;

  return `
    <span class="debt-col--editable" data-field="${fieldType}" data-debt-index="${debtIndex}" data-raw="${rawValue}">
      <span class="debt-value">${formattedValue}</span>
      <button class="edit-pencil edit-pencil--small" aria-label="${ariaLabel}" title="${ariaLabel}">
        ${PENCIL_ICON}
      </button>
    </span>
  `;
}

/**
 * Handle pencil click - enter edit mode
 * @param {HTMLElement} pencilBtn - The clicked pencil button
 */
function handlePencilClick(pencilBtn) {
  const container = pencilBtn.closest('[data-field]');
  if (!container) return;

  const field = container.dataset.field;
  const debtIndex = container.dataset.debtIndex;
  const rawValue = container.dataset.raw;

  // Determine input type and attributes
  let inputType = 'text';
  let inputAttrs = '';

  if (debtIndex !== undefined) {
    // Debt field
    if (field === 'balance') {
      inputType = 'text';
    } else if (field === 'interestRate') {
      inputType = 'number';
      inputAttrs = 'min="0" max="30" step="0.1"';
    }
  } else {
    // Regular field
    const config = EDITABLE_FIELDS[field];
    if (config) {
      inputType = config.inputType;
      if (config.inputAttrs) {
        inputAttrs = Object.entries(config.inputAttrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
      }
    }
  }

  // Get the value wrapper
  const valueWrapper = container.querySelector('.panel-value-wrapper') || container;
  const currentValue = rawValue || '';

  // Create input element
  const inputHtml = `
    <input
      type="${inputType}"
      class="inline-edit-input${debtIndex !== undefined ? ' inline-edit-input--debt' : ''}"
      value="${currentValue}"
      data-original="${currentValue}"
      data-field="${field}"
      ${debtIndex !== undefined ? `data-debt-index="${debtIndex}"` : ''}
      ${inputAttrs}
      aria-label="Edit value"
    >
  `;

  // Replace content with input
  valueWrapper.innerHTML = inputHtml;
  container.classList.add('panel-row--editing');

  // Focus and select input
  const input = valueWrapper.querySelector('input');
  if (input) {
    input.focus();
    input.select();
  }
}

/**
 * Handle edit save - validate and update state
 * @param {HTMLInputElement} input - The input element
 */
function handleEditSave(input) {
  if (!input || input._saving) return;
  input._saving = true; // Prevent double-save

  const field = input.dataset.field;
  const debtIndex = input.dataset.debtIndex;
  const originalValue = input.dataset.original;
  const newValue = input.value;

  // If value hasn't changed, just cancel
  if (newValue === originalValue) {
    handleEditCancel(input);
    return;
  }

  let result;

  if (debtIndex !== undefined) {
    // Debt field validation
    if (field === 'balance') {
      result = typeof validateCurrency === 'function'
        ? validateCurrency(newValue)
        : { valid: true, value: parseFloat(newValue.replace(/[,$]/g, '')) || 0 };
    } else if (field === 'interestRate') {
      result = typeof validateInterestRate === 'function'
        ? validateInterestRate(newValue)
        : { valid: true, value: parseFloat(newValue) || 0 };
    }
  } else {
    // Regular field validation
    const config = EDITABLE_FIELDS[field];
    if (config) {
      result = config.validate(newValue);
    } else {
      result = { valid: true, value: newValue };
    }
  }

  if (result && result.valid) {
    // Update state (this triggers re-render, which exits edit mode)
    if (debtIndex !== undefined) {
      const prop = field === 'balance' ? 'balance' : 'interestRate';
      updateDebt(parseInt(debtIndex), { [prop]: result.value });
    } else {
      const config = EDITABLE_FIELDS[field];
      if (config) {
        config.update(result.value);
      }
    }
  } else {
    // Show validation error
    input.classList.add('inline-edit-input--error');
    input._saving = false;
    input.focus();
    input.select();

    // Show error message briefly
    if (result && result.message) {
      const container = input.closest('[data-field]');
      if (container) {
        let errorEl = container.querySelector('.inline-edit-error');
        if (!errorEl) {
          errorEl = document.createElement('span');
          errorEl.className = 'inline-edit-error';
          container.appendChild(errorEl);
        }
        errorEl.textContent = result.message;

        // Remove error after 3 seconds
        setTimeout(() => {
          errorEl.remove();
          input.classList.remove('inline-edit-input--error');
        }, 3000);
      }
    }
  }
}

/**
 * Handle edit cancel - revert to original value
 * @param {HTMLInputElement} input - The input element
 */
function handleEditCancel(input) {
  if (!input) return;

  const container = input.closest('[data-field]');
  if (!container) return;

  const field = container.dataset.field;
  const debtIndex = container.dataset.debtIndex;
  const originalValue = input.dataset.original;

  // Get current state to restore display value
  const { snapshot } = getState();
  let displayValue;

  if (debtIndex !== undefined) {
    const debt = snapshot.debts[parseInt(debtIndex)];
    if (field === 'balance') {
      displayValue = debt.balance > 0 ? debt.balance.toLocaleString() : '-';
    } else {
      displayValue = debt.interestRate > 0 ? `${debt.interestRate}%` : '0.0%';
    }
  } else {
    const config = EDITABLE_FIELDS[field];
    if (config) {
      const section = config.section;
      const value = snapshot[section][field === 'otherInvestments' ? 'other' : field];
      displayValue = config.format(value);
    }
  }

  // Restore display mode
  const valueWrapper = container.querySelector('.panel-value-wrapper') || container;

  if (debtIndex !== undefined) {
    valueWrapper.innerHTML = `
      <span class="debt-value">${displayValue}</span>
      <button class="edit-pencil edit-pencil--small" aria-label="Edit" title="Edit">
        ${PENCIL_ICON}
      </button>
    `;
  } else {
    valueWrapper.innerHTML = `
      <span class="panel-value">${displayValue}</span>
      <button class="edit-pencil" aria-label="Edit" title="Edit">
        ${PENCIL_ICON}
      </button>
    `;
  }

  container.classList.remove('panel-row--editing');
}

/**
 * Initialize inline editing event listeners
 * Uses event delegation on dashboard content
 */
function initInlineEditing() {
  const dashboardContent = document.querySelector('.dashboard-content');
  if (!dashboardContent || dashboardContent._inlineEditInit) return;

  dashboardContent._inlineEditInit = true;

  // Pencil click - enter edit mode
  dashboardContent.addEventListener('click', (e) => {
    const pencilBtn = e.target.closest('.edit-pencil');
    if (pencilBtn) {
      e.preventDefault();
      e.stopPropagation();
      handlePencilClick(pencilBtn);
    }
  });

  // Input blur - save (with small delay to handle button clicks)
  dashboardContent.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('inline-edit-input')) {
      // Small delay to check if focus moved to cancel button or another action
      setTimeout(() => {
        // Only save if we're not clicking something else in the container
        if (document.activeElement !== e.target &&
            !e.target.closest('[data-field]')?.contains(document.activeElement)) {
          handleEditSave(e.target);
        }
      }, 150);
    }
  });

  // Input keydown - Enter to save, Escape to cancel
  dashboardContent.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('inline-edit-input')) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditSave(e.target);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleEditCancel(e.target);
      }
    }
  });

  if (typeof Debug !== 'undefined') {
    Debug.log('Inline editing initialized');
  }
}

// Expose globally
window.renderEditableField = renderEditableField;
window.renderEditableDebtCell = renderEditableDebtCell;
window.initInlineEditing = initInlineEditing;
