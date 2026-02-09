/**
 * store.js
 * Global state management with localStorage persistence
 */

const STORAGE_KEY = 'financial-gps-data';

// Global state object
let state = {
  snapshot: createDefaultSnapshot(),
  currentSteps: [],
  nextStep: null,
};

// Load state from sessionStorage
function loadState() {
  if (typeof Debug !== 'undefined') Debug.state('Loading state from sessionStorage...');
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (typeof Debug !== 'undefined') Debug.data('Found saved state, parsing...');
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle any missing fields
      const defaultDebts = createDefaultSnapshot().debts;
      // Merge saved debts with defaults to add new fields (termMonths, minPayment)
      const mergedDebts = parsed.debts ? parsed.debts.map((savedDebt, i) => ({
        ...defaultDebts[i], // Start with defaults (includes termMonths, minPayment)
        ...savedDebt, // Override with saved values
        // Ensure termMonths has a sensible default if not set
        termMonths: savedDebt.termMonths || defaultDebts[i]?.termMonths || 60,
      })) : defaultDebts;

      // Merge debtSettings
      const defaultDebtSettings = createDefaultSnapshot().debtSettings;
      const savedDebtSettings = parsed.debtSettings || {};
      const mergedDebtSettings = {
        ...defaultDebtSettings,
        ...savedDebtSettings,
      };
      // Migrate old extraMonthlyPayment to aggressiveness
      if ('extraMonthlyPayment' in savedDebtSettings && !('aggressiveness' in savedDebtSettings)) {
        mergedDebtSettings.aggressiveness = savedDebtSettings.extraMonthlyPayment === null ? 100 : 50;
        delete mergedDebtSettings.extraMonthlyPayment;
      }

      // Merge taxDestiny including nested objects
      const defaultTaxDestiny = createDefaultSnapshot().taxDestiny;
      const savedTaxDestiny = parsed.taxDestiny || {};
      const mergedTaxDestiny = {
        ...defaultTaxDestiny,
        ...savedTaxDestiny,
        allocations: {
          ...defaultTaxDestiny.allocations,
          ...(savedTaxDestiny.allocations || {}),
        },
        strategies: {
          ...defaultTaxDestiny.strategies,
          ...(savedTaxDestiny.strategies || {}),
        },
        advanced: {
          ...defaultTaxDestiny.advanced,
          ...(savedTaxDestiny.advanced || {}),
        },
      };

      // Merge fireSettings including allocations
      const defaultFireSettings = createDefaultSnapshot().fireSettings;
      const savedFireSettings = parsed.fireSettings || {};
      const mergedFireSettings = {
        ...defaultFireSettings,
        ...savedFireSettings,
        allocations: {
          ...defaultFireSettings.allocations,
          ...(savedFireSettings.allocations || {}),
        },
      };

      // Merge expenseCategories
      const defaultExpenseCategories = createDefaultSnapshot().expenseCategories;
      const savedExpenseCategories = parsed.expenseCategories || {};
      const mergedExpenseCategories = {
        ...defaultExpenseCategories,
        ...savedExpenseCategories,
      };

      state.snapshot = {
        general: { ...createDefaultSnapshot().general, ...parsed.general },
        investments: { ...createDefaultSnapshot().investments, ...parsed.investments },
        debts: mergedDebts,
        debtSettings: mergedDebtSettings,
        taxDestiny: mergedTaxDestiny,
        fireSettings: mergedFireSettings,
        expenseCategories: mergedExpenseCategories,
      };
      if (typeof Debug !== 'undefined') Debug.success('State loaded and merged with defaults');
    } else {
      if (typeof Debug !== 'undefined') Debug.info('No saved state found, using defaults');
    }
  } catch (e) {
    if (typeof Debug !== 'undefined') Debug.error('Error loading state:', e);
    console.error('Error loading state:', e);
  }
  recalculate();
}

// Save state to sessionStorage
function saveState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.snapshot));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// Update general info
function updateGeneral(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateGeneral:', updates);
  state.snapshot.general = { ...state.snapshot.general, ...updates };
  recalculate();
  saveState();
  render();
}

// Update investments
function updateInvestments(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateInvestments:', updates);
  state.snapshot.investments = { ...state.snapshot.investments, ...updates };
  recalculate();
  saveState();
  render();
}

// Update a specific debt by index
function updateDebt(index, updates) {
  if (typeof Debug !== 'undefined') Debug.state(`updateDebt[${index}]:`, updates);
  state.snapshot.debts = state.snapshot.debts.map((debt, i) =>
    i === index ? { ...debt, ...updates } : debt
  );
  recalculate();
  saveState();
  render();
}

// Update debt paydown settings (extra payment, strategy preference)
function updateDebtSettings(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateDebtSettings:', updates);
  state.snapshot.debtSettings = { ...state.snapshot.debtSettings, ...updates };
  recalculate();
  saveState();
  render();
}

// Update Tax Destiny top-level settings (filingStatus, hsaCoverage)
function updateTaxDestiny(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateTaxDestiny:', updates);
  state.snapshot.taxDestiny = { ...state.snapshot.taxDestiny, ...updates };
  recalculate();
  saveState();
  render();
}

// Update Tax Destiny monthly allocations
function updateTaxAllocations(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateTaxAllocations:', updates);
  const current = state.snapshot.taxDestiny.allocations || {};
  state.snapshot.taxDestiny = {
    ...state.snapshot.taxDestiny,
    allocations: { ...current, ...updates },
  };
  recalculate();
  saveState();
  render();
}

// Update Tax Destiny annual strategy amounts
function updateTaxStrategies(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateTaxStrategies:', updates);
  const current = state.snapshot.taxDestiny.strategies || {};
  state.snapshot.taxDestiny = {
    ...state.snapshot.taxDestiny,
    strategies: { ...current, ...updates },
  };
  recalculate();
  saveState();
  render();
}

// Update Tax Destiny advanced toggles
function updateTaxAdvanced(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateTaxAdvanced:', updates);
  const current = state.snapshot.taxDestiny.advanced || {};
  state.snapshot.taxDestiny = {
    ...state.snapshot.taxDestiny,
    advanced: { ...current, ...updates },
  };
  recalculate();
  saveState();
  render();
}

// Update FIRE settings (box toggles and inputs)
function updateFireSettings(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateFireSettings:', updates);
  state.snapshot.fireSettings = { ...state.snapshot.fireSettings, ...updates };
  recalculate();
  saveState();
  render();
}

// Update allocation for a specific flexible box
// value = null means "all remaining", number means specific amount
function updateBoxAllocation(boxKey, value) {
  const currentAllocations = state.snapshot.fireSettings.allocations || {};
  state.snapshot.fireSettings = {
    ...state.snapshot.fireSettings,
    allocations: {
      ...currentAllocations,
      [boxKey]: value,
    },
  };
  recalculate();
  saveState();
  render();
}

// Update expense category breakdown (no render — sliders update DOM directly)
function updateExpenseCategories(updates) {
  if (typeof Debug !== 'undefined') Debug.state('updateExpenseCategories:', updates);
  const current = state.snapshot.expenseCategories || {};
  state.snapshot.expenseCategories = { ...current, ...updates };
  saveState();
}

// Reset all data
function resetAll() {
  state.snapshot = createDefaultSnapshot();
  recalculate();
  saveState();
  render();
}

// Recalculate steps based on current snapshot
function recalculate() {
  state.currentSteps = getSteps(state.snapshot);
  state.nextStep = getNextStep(state.snapshot);

  // Update projection table (silently, for console access)
  if (typeof calculateProjection === 'function') {
    calculateProjection(state.snapshot);
  }
}

// Get current state (read-only)
function getState() {
  return state;
}

// Check if user has entered data
function hasData() {
  return state.snapshot.general.annualIncome > 0;
}

// Expose state and functions to window for global access
window.state = state;
window.updateGeneral = updateGeneral;
window.updateInvestments = updateInvestments;
window.updateDebt = updateDebt;
window.updateDebtSettings = updateDebtSettings;
window.updateTaxDestiny = updateTaxDestiny;
window.updateTaxAllocations = updateTaxAllocations;
window.updateTaxStrategies = updateTaxStrategies;
window.updateTaxAdvanced = updateTaxAdvanced;
window.updateFireSettings = updateFireSettings;
window.updateBoxAllocation = updateBoxAllocation;
window.updateExpenseCategories = updateExpenseCategories;
window.resetAll = resetAll;
window.getState = getState;
window.hasData = hasData;
window.loadState = loadState;
window.saveState = saveState;
window.recalculate = recalculate;

// Also expose as window.store object for compatibility
window.store = {
  state: state,
  updateGeneral: updateGeneral,
  updateInvestments: updateInvestments,
  updateDebt: updateDebt,
  updateDebtSettings: updateDebtSettings,
  updateTaxDestiny: updateTaxDestiny,
  updateTaxAllocations: updateTaxAllocations,
  updateTaxStrategies: updateTaxStrategies,
  updateTaxAdvanced: updateTaxAdvanced,
  updateFireSettings: updateFireSettings,
  updateBoxAllocation: updateBoxAllocation,
  updateExpenseCategories: updateExpenseCategories,
  resetAll: resetAll,
  getState: getState,
  hasData: hasData,
  loadState: loadState,
  saveState: saveState,
  recalculate: recalculate
};
