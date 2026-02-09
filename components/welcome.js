/**
 * welcome.js
 * Welcome screen component for first-time users
 *
 * Security: Uses event delegation instead of inline handlers
 * Compliance: Includes required educational disclaimers
 */

// ===========================
// WELCOME SCREEN COMPONENT
// ===========================

/**
 * Render welcome screen for new users
 * @returns {string} HTML for welcome screen
 */
function renderWelcome() {
  return `
    <div class="welcome-screen">
      <div class="welcome-hero">
        <h1 class="welcome-title">
          <span class="gradient-text">Financial GPS</span>
        </h1>
        <p class="welcome-subtitle">
          Your personalized roadmap to Financial Independence
        </p>
      </div>

      <div class="welcome-features">
        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">📊</div>
          <h3>Visualize Your Journey</h3>
          <p>See hypothetical month-by-month projections based on your inputs</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">🎯</div>
          <h3>Explore Prioritization</h3>
          <p>See how different strategies might apply to various financial situations</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">💡</div>
          <h3>Discover Insights</h3>
          <p>Uncover optimization opportunities you might be missing</p>
        </div>
      </div>

      <div class="welcome-cta">
        <button type="button" class="btn btn-primary btn-large" data-action="load-example" aria-label="Load example data to try the tool">
          🚀 Try Example Data
        </button>
        <button type="button" class="btn btn-secondary btn-large" data-action="start-fresh" aria-label="Start with blank form">
          ✏️ Start Fresh
        </button>
      </div>

      <div class="welcome-footer">
        <p class="text-muted">
          <strong>Try Example Data</strong> to see Financial GPS in action with a realistic scenario,
          or <strong>Start Fresh</strong> to enter your own information.
        </p>
      </div>

      <div class="welcome-disclaimer">
        <p>
          <strong>Educational Tool Only:</strong> Financial GPS provides general financial education
          and illustrative projections. This is not personalized investment, tax, or legal advice.
          Consult a qualified financial advisor, tax professional, or attorney for advice specific
          to your situation.
        </p>
        <p class="mt-2">
          <strong>No Guarantees:</strong> All projections are hypothetical illustrations based on
          assumptions you provide. Actual results will vary based on market conditions, life events,
          and other factors. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  `;
}

/**
 * Example data representing a realistic middle-class FIRE journey
 * Persona: 32-year-old earning $120K/year with moderate debt
 */
const EXAMPLE_DATA = {
  general: {
    age: 32,
    targetRetirement: 50,
    annualIncome: 120000,
    monthlyTakeHome: 7200,
    monthlyExpense: 4500,
    msa: 'Denver, CO'
  },
  investments: {
    savings: 15000,
    ira: 25000,
    rothIra: 12000,
    stocksBonds: 8000,
    fourOhOneK: 45000,
    realEstate: 0,
    carValue: 18000,
    other: 0
  },
  debts: [
    { category: 'CREDIT_CARD', label: 'Credit Card', balance: 5200, interestRate: 18.5, termMonths: 60, minPayment: 0 },
    { category: 'MEDICAL', label: 'Medical', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 },
    { category: 'STUDENT', label: 'Student', balance: 28000, interestRate: 5.5, termMonths: 120, minPayment: 0 },
    { category: 'AUTO', label: 'Car', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 },
    { category: 'MORTGAGE', label: 'Mortgage', balance: 0, interestRate: 0, termMonths: 360, minPayment: 0 },
    { category: 'OTHER', label: 'Other', balance: 0, interestRate: 0, termMonths: 60, minPayment: 0 }
  ]
};

/**
 * Load example data using safe store update functions
 * Security: Uses existing store API instead of direct state mutation
 */
function loadExampleData() {
  try {
    if (typeof Debug !== 'undefined') Debug.event('Loading example data...');

    // Use safe update functions to populate data
    updateGeneral(EXAMPLE_DATA.general);
    updateInvestments(EXAMPLE_DATA.investments);

    // Update each debt individually using safe function
    EXAMPLE_DATA.debts.forEach((debt, index) => {
      updateDebt(index, debt);
    });

    // Set example flag safely in state
    state.snapshot.isExample = true;
    saveState();

    // Show dashboard
    showDashboard();
    if (typeof Debug !== 'undefined') Debug.success('Example data loaded successfully');
  } catch (error) {
    if (typeof Debug !== 'undefined') Debug.error('Error loading example data:', error);
    console.error('[Financial GPS] Error loading example data:', error);
  }
}

/**
 * Show banner when viewing example data
 * @returns {string} HTML for example banner or empty string
 */
function renderExampleBanner() {
  if (!state.snapshot || !state.snapshot.isExample) {
    return '';
  }

  return `
    <div class="example-banner" role="alert">
      <div class="banner-content">
        <span class="banner-icon" aria-hidden="true">👀</span>
        <span class="banner-text">
          You're viewing <strong>example data</strong> for a 32-year-old earning $120K/year with moderate debt.
          <span class="banner-disclaimer">Projections are hypothetical estimates only.</span>
        </span>
        <button class="btn-link" data-action="clear-example" aria-label="Clear example data and start fresh">
          Clear & Start Fresh
        </button>
      </div>
    </div>
  `;
}

/**
 * Clear example data and return to input form
 * Security: Uses existing store functions
 */
function clearExampleData() {
  if (typeof Debug !== 'undefined') Debug.event('Clearing example data...');
  // Reset to default snapshot using existing function
  resetAll();

  // Show welcome screen for fresh start
  showWelcome();
  if (typeof Debug !== 'undefined') Debug.success('Example data cleared');
}

/**
 * Initialize welcome screen event listeners using event delegation
 * Security: Avoids inline onclick handlers
 */
let welcomeListenersInitialized = false;

function initWelcomeListeners() {
  // Prevent multiple registrations
  if (welcomeListenersInitialized) return;
  welcomeListenersInitialized = true;
  if (typeof Debug !== 'undefined') Debug.success('Welcome listeners initialized');

  document.addEventListener('click', function(e) {
    // Handle button actions with closest ancestor check for nested elements
    const button = e.target.closest('[data-action]');
    if (!button) return;

    const buttonAction = button.dataset.action;
    if (typeof Debug !== 'undefined') Debug.event(`Button clicked: ${buttonAction}`);

    switch(buttonAction) {
      case 'load-example':
        loadExampleData();
        break;
      case 'start-fresh':
        showInput();
        break;
      case 'clear-example':
        clearExampleData();
        break;
    }
  });
}

// Initialize listeners - use multiple strategies to ensure it runs
// Strategy 1: If DOM is already ready, run immediately
if (document.readyState !== 'loading') {
  initWelcomeListeners();
}
// Strategy 2: Also listen for DOMContentLoaded as backup
document.addEventListener('DOMContentLoaded', initWelcomeListeners);
