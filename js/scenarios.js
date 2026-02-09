/**
 * scenarios.js
 * Scenario Management System for Financial GPS
 *
 * Enables users to save, compare, and analyze alternative financial scenarios.
 * All projections are hypothetical illustrations for educational purposes only.
 */

const SCENARIO_STORAGE_KEY = 'financial-gps-scenarios';
const SCENARIO_MAX_COUNT = 5;
const SCENARIO_NAME_MAX_LENGTH = 100;
const SCENARIO_DESC_MAX_LENGTH = 500;

// ===========================
// SECURITY UTILITIES
// ===========================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate a cryptographically secure UUID
 * @returns {string} UUID
 */
function generateSecureUUID() {
  // Use native crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Last resort fallback (less secure but functional)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Remove prototype pollution properties from objects
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key in obj) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
}

/**
 * Safely deep copy an object
 * @param {Object} obj - Object to copy
 * @returns {Object} Deep copy
 */
function safeDeepCopy(obj) {
  try {
    const sanitized = sanitizeObject(obj);
    return JSON.parse(JSON.stringify(sanitized));
  } catch (e) {
    console.error('Deep copy failed:', e);
    return null;
  }
}

// ===========================
// VALIDATION
// ===========================

/**
 * Validate scenario input
 * @param {string} name - Scenario name
 * @param {string} description - Scenario description
 * @returns {Object} Validated and sanitized inputs
 * @throws {Error} If validation fails
 */
function validateScenarioInput(name, description) {
  // Type validation
  if (typeof name !== 'string') {
    throw new Error('Scenario name must be a string');
  }
  if (typeof description !== 'string') {
    throw new Error('Scenario description must be a string');
  }

  // Trim whitespace
  const trimmedName = name.trim();
  const trimmedDesc = description.trim();

  // Length validation
  if (trimmedName.length === 0) {
    throw new Error('Scenario name cannot be empty');
  }
  if (trimmedName.length > SCENARIO_NAME_MAX_LENGTH) {
    throw new Error(`Scenario name cannot exceed ${SCENARIO_NAME_MAX_LENGTH} characters`);
  }
  if (trimmedDesc.length > SCENARIO_DESC_MAX_LENGTH) {
    throw new Error(`Scenario description cannot exceed ${SCENARIO_DESC_MAX_LENGTH} characters`);
  }

  return {
    name: trimmedName,
    description: trimmedDesc
  };
}

/**
 * Validate scenario schema from storage
 * @param {Array} scenarios - Array of scenarios to validate
 * @returns {Array} Valid scenarios only
 */
function validateScenarioSchema(scenarios) {
  if (!Array.isArray(scenarios)) {
    return [];
  }

  return scenarios.filter(s => {
    // Must be an object
    if (!s || typeof s !== 'object') return false;

    // Check required string properties
    if (typeof s.id !== 'string') return false;
    if (typeof s.name !== 'string') return false;
    if (typeof s.description !== 'string') return false;
    if (typeof s.createdAt !== 'string') return false;

    // Check snapshot exists and is object
    if (!s.snapshot || typeof s.snapshot !== 'object') return false;

    // Check boolean
    if (typeof s.isBaseline !== 'boolean') return false;

    // Prevent prototype pollution
    if (Object.prototype.hasOwnProperty.call(s, '__proto__') ||
        Object.prototype.hasOwnProperty.call(s, 'constructor') ||
        Object.prototype.hasOwnProperty.call(s, 'prototype')) {
      return false;
    }

    return true;
  }).slice(0, SCENARIO_MAX_COUNT); // Enforce max count
}

// ===========================
// SCENARIO CRUD OPERATIONS
// ===========================

/**
 * Get all saved scenarios from sessionStorage
 * @returns {Array} Array of validated scenarios
 */
function getScenarios() {
  const stored = sessionStorage.getItem(SCENARIO_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return validateScenarioSchema(sanitizeObject(parsed));
  } catch (e) {
    console.error('Failed to parse scenarios:', e);
    return [];
  }
}

/**
 * Save scenarios to sessionStorage
 * @param {Array} scenarios - Array of scenarios
 */
function saveScenarios(scenarios) {
  try {
    const validated = validateScenarioSchema(scenarios);
    sessionStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(validated));
  } catch (e) {
    console.error('Failed to save scenarios:', e);
  }
}

/**
 * Create a new scenario from current snapshot
 * @param {string} name - Scenario name
 * @param {string} description - Scenario description
 * @param {Object} snapshot - Financial snapshot
 * @param {boolean} isBaseline - Whether this is the baseline scenario
 * @returns {Object} New scenario
 */
function createScenario(name, description, snapshot, isBaseline = false) {
  const validated = validateScenarioInput(name, description);
  const sanitizedSnapshot = safeDeepCopy(snapshot);

  if (!sanitizedSnapshot) {
    throw new Error('Invalid snapshot data');
  }

  return {
    id: generateSecureUUID(),
    name: validated.name,
    description: validated.description,
    snapshot: sanitizedSnapshot,
    createdAt: new Date().toISOString(),
    isBaseline: Boolean(isBaseline)
  };
}

/**
 * Add a scenario
 * @param {Object} scenario - Scenario to add
 */
function addScenario(scenario) {
  const scenarios = getScenarios();

  // If this is baseline, unmark any existing baseline
  if (scenario.isBaseline) {
    scenarios.forEach(s => s.isBaseline = false);
  }

  // Limit to max scenarios
  if (scenarios.length >= SCENARIO_MAX_COUNT) {
    // Remove oldest non-baseline scenario
    const oldestNonBaseline = scenarios.findIndex(s => !s.isBaseline);
    if (oldestNonBaseline !== -1) {
      scenarios.splice(oldestNonBaseline, 1);
    } else {
      scenarios.shift();
    }
  }

  scenarios.push(scenario);
  saveScenarios(scenarios);
}

/**
 * Update a scenario
 * @param {string} scenarioId - ID of scenario to update
 * @param {Object} updates - Fields to update
 */
function updateScenario(scenarioId, updates) {
  const scenarios = getScenarios();
  const index = scenarios.findIndex(s => s.id === scenarioId);

  if (index !== -1) {
    // Validate name/description if being updated
    if (updates.name !== undefined || updates.description !== undefined) {
      const currentName = updates.name !== undefined ? updates.name : scenarios[index].name;
      const currentDesc = updates.description !== undefined ? updates.description : scenarios[index].description;
      const validated = validateScenarioInput(currentName, currentDesc);
      updates.name = validated.name;
      updates.description = validated.description;
    }

    scenarios[index] = { ...scenarios[index], ...updates };
    saveScenarios(scenarios);
  }
}

/**
 * Delete a scenario
 * @param {string} scenarioId - ID of scenario to delete
 */
function deleteScenarioById(scenarioId) {
  const scenarios = getScenarios();
  const filtered = scenarios.filter(s => s.id !== scenarioId);
  saveScenarios(filtered);

  // Re-render if app is available
  if (typeof window !== 'undefined' && window.app && window.app.render) {
    window.app.render();
  }
}

/**
 * Load a scenario into the current state
 * @param {string} scenarioId - ID of scenario to load
 */
function loadScenarioById(scenarioId) {
  const scenarios = getScenarios();
  const scenario = scenarios.find(s => s.id === scenarioId);

  if (scenario && window.store) {
    window.store.state.snapshot = safeDeepCopy(scenario.snapshot);
    if (typeof window.store.recalculate === 'function') {
      window.store.recalculate();
    }
    if (typeof window.store.saveState === 'function') {
      window.store.saveState();
    }
    if (window.app && typeof window.app.render === 'function') {
      window.app.render();
    }
  }
}

// ===========================
// SCENARIO COMPARISON
// ===========================

/**
 * Compare multiple scenarios
 * @param {Array} scenarioIds - IDs of scenarios to compare
 * @returns {Array|null} Comparison data
 */
function compareScenarios(scenarioIds) {
  const scenarios = getScenarios();
  const toCompare = scenarios.filter(s => scenarioIds.includes(s.id));

  if (toCompare.length === 0) {
    return null;
  }

  // Calculate projections for each scenario
  const comparisons = toCompare.map(scenario => {
    // Use window functions if available
    const projections = typeof window.calculateProjections === 'function'
      ? window.calculateProjections(scenario.snapshot)
      : [];
    const metrics = typeof window.calculateMetrics === 'function'
      ? window.calculateMetrics(scenario.snapshot)
      : { netWorth: 0, savingsRate: 0, dti: 0 };

    // Find estimated FI timeline (25x annual expenses)
    const fiNumber = (typeof getFireAnnualExpenses === 'function'
      ? getFireAnnualExpenses(scenario.snapshot)
      : (scenario.snapshot.general?.monthlyExpense || 0) * 12) * 25;
    const fiMonth = projections.findIndex(p => p.netWorth >= fiNumber);
    const currentAge = scenario.snapshot.general?.age || 30;

    // Hypothetical projection at age 65
    const monthsTo65 = Math.max(0, (65 - currentAge) * 12);
    const projectedNetWorth65 = projections[monthsTo65]?.netWorth || 0;

    // Monthly investment capacity
    const monthlyTakeHome = scenario.snapshot.general?.monthlyTakeHome || 0;
    const monthlyInvestments = monthlyTakeHome - monthlyExpense;

    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      isBaseline: scenario.isBaseline,
      metrics: {
        currentNetWorth: metrics.netWorth || 0,
        savingsRate: metrics.savingsRate || 0,
        dti: metrics.dti || 0,
        estimatedFIAge: fiMonth !== -1 ? Math.round((currentAge + fiMonth / 12) * 10) / 10 : null,
        projectedNetWorth65: projectedNetWorth65,
        monthlyInvestments: monthlyInvestments
      },
      projections: projections,
      assumptions: {
        investmentReturn: '7% annually',
        inflation: '3% annually',
        taxTreatment: 'Simplified model'
      }
    };
  });

  return comparisons;
}

// ===========================
// SCENARIO TEMPLATES
// ===========================

/**
 * Generate scenario from template
 * @param {string} template - Template type
 * @param {Object} currentSnapshot - Current financial snapshot
 * @returns {Object|null} New scenario or null if invalid template
 */
function createScenarioFromTemplate(template, currentSnapshot) {
  const snapshot = safeDeepCopy(currentSnapshot);
  if (!snapshot) return null;

  switch (template) {
    case 'raise_10k':
      snapshot.general.annualIncome = (snapshot.general.annualIncome || 0) + 10000;
      snapshot.general.monthlyTakeHome = (snapshot.general.monthlyTakeHome || 0) + 600;
      return createScenario(
        'Scenario: +$10K Income',
        'Hypothetical scenario assuming a $10,000 annual income increase. Take-home estimate based on simplified 60% assumption.',
        snapshot
      );

    case 'reduce_expenses_500':
      snapshot.general.monthlyExpense = Math.max(0, (snapshot.general.monthlyExpense || 0) - 500);
      return createScenario(
        'Scenario: $500 Lower Expenses',
        'Hypothetical scenario assuming monthly expenses reduced by $500.',
        snapshot
      );

    case 'max_401k':
      const monthlyContribution = 1958; // $23,500 / 12 (2025 limit)
      snapshot.general.monthlyTakeHome = Math.max(0, (snapshot.general.monthlyTakeHome || 0) - monthlyContribution);
      return createScenario(
        'Scenario: Maximum 401(k)',
        'Hypothetical scenario assuming 401(k) contributions at the annual limit ($23,500/year). Reduces take-home pay accordingly.',
        snapshot
      );

    case 'pay_off_high_interest':
      if (snapshot.debts && Array.isArray(snapshot.debts)) {
        snapshot.debts = snapshot.debts.map(d =>
          d.interestRate > 10 ? { ...d, balance: 0 } : d
        );
      }
      return createScenario(
        'Scenario: No High-Interest Debt',
        'Hypothetical scenario assuming all debts with >10% interest rate are eliminated.',
        snapshot
      );

    case 'side_hustle_1k':
      snapshot.general.monthlyTakeHome = (snapshot.general.monthlyTakeHome || 0) + 1000;
      return createScenario(
        'Scenario: +$1K Monthly',
        'Hypothetical scenario assuming $1,000/month additional income.',
        snapshot
      );

    default:
      return null;
  }
}

// ===========================
// EXPOSE TO WINDOW
// ===========================

if (typeof window !== 'undefined') {
  window.getScenarios = getScenarios;
  window.saveScenarios = saveScenarios;
  window.createScenario = createScenario;
  window.addScenario = addScenario;
  window.updateScenario = updateScenario;
  window.deleteScenarioById = deleteScenarioById;
  window.loadScenarioById = loadScenarioById;
  window.compareScenarios = compareScenarios;
  window.createScenarioFromTemplate = createScenarioFromTemplate;
  window.escapeHtml = escapeHtml;
}
