/**
 * app.js
 * Main app controller - view routing and initialization
 */

// Current view state
let currentView = 'welcome'; // 'welcome', 'input', or 'dashboard'

// Get the app container
function getAppContainer() {
  return document.getElementById('app');
}

// Render the current view
function render() {
  Debug.render(`Rendering view: ${currentView}`);
  Debug.time('render');

  const container = getAppContainer();
  if (!container) {
    Debug.error('App container #app not found!');
    return;
  }

  // Get example banner if viewing example data
  const exampleBanner = typeof renderExampleBanner === 'function' ? renderExampleBanner() : '';

  try {
    if (currentView === 'welcome') {
      Debug.render('Rendering welcome screen');
      container.innerHTML = typeof renderWelcome === 'function' ? renderWelcome() : renderInputCards();
    } else if (currentView === 'dashboard') {
      Debug.render('Rendering dashboard');
      container.innerHTML = exampleBanner + renderDashboard();
      // Initialize tab navigation and charts after DOM update
      setTimeout(() => {
        Debug.render('Initializing dashboard components');
        // Initialize tab navigation
        if (typeof window.DashboardTabs !== 'undefined') {
          window.DashboardTabs.init();
          Debug.success('Tab navigation initialized');
        }
        // Initialize inline editing
        if (typeof initInlineEditing === 'function') {
          initInlineEditing();
          Debug.success('Inline editing initialized');
        }
        // Initialize charts (will also be re-initialized when switching tabs)
        if (typeof initNetWorthChart === 'function') {
          initNetWorthChart();
          Debug.success('Net worth chart initialized');
        }
        if (typeof initDebtPayoffChart === 'function') {
          initDebtPayoffChart();
          Debug.success('Debt payoff chart initialized');
        }
        if (typeof initScenarioComparisonChart === 'function') {
          initScenarioComparisonChart();
          Debug.success('Scenario comparison chart initialized');
        }
        // Initialize budget charts and sliders
        if (typeof initBudgetCharts === 'function') {
          initBudgetCharts();
        }
        if (typeof initExpenseSliders === 'function') {
          initExpenseSliders();
        }
      }, 0);
    } else {
      Debug.render('Rendering input cards');
      container.innerHTML = exampleBanner + renderInputCards();
    }
    Debug.timeEnd('render');
  } catch (error) {
    Debug.error('Render failed:', error);
    Debug.timeEnd('render');
  }
}

// Switch to dashboard view
function showDashboard() {
  Debug.event('Navigation: showDashboard()');
  currentView = 'dashboard';
  render();
}

// Switch to input view
function showInput() {
  Debug.event('Navigation: showInput()');
  currentView = 'input';
  render();
}

// Switch to welcome view
function showWelcome() {
  Debug.event('Navigation: showWelcome()');
  currentView = 'welcome';
  render();
}

// Log available console functions
function showConsoleHelp() {
  console.log('%c=== Financial GPS Console Functions ===', 'font-weight: bold; font-size: 14px; color: #e5a823;');
  console.log('');
  console.log('%cDebugging:', 'font-weight: bold; color: #a855f7;');
  console.log('  Debug.enable()           - Enable debug logging');
  console.log('  Debug.disable()          - Disable debug logging');
  console.log('  Debug.setLevel(level)    - Set min level: log, info, warn, error');
  console.log('  Debug.status()           - Show debug configuration');
  console.log('  Debug.history(n)         - Show last n log entries');
  console.log('  Debug.logState()         - Log current app state');
  console.log('');
  console.log('%cProjection Reports:', 'font-weight: bold; color: #30d158;');
  console.log('  getProjectionTable()     - Full month-by-month projection to retirement');
  console.log('  getYearlyProjection()    - Yearly snapshots with net worth breakdown');
  console.log('  printProjection()        - Opens printable projection report');
  console.log('');
  console.log('%cNet Worth:', 'font-weight: bold; color: #30d158;');
  console.log('  getNetWorthProjection()  - Net worth projection with 6 buckets');
  console.log('  getYearlyNetWorth()      - Yearly net worth by category');
  console.log('  printNetWorthChart()     - Opens printable net worth chart');
  console.log('');
  console.log('%cCash Flow Waterfall:', 'font-weight: bold; color: #30d158;');
  console.log('  getBoxTimeline()         - Shows when each FIRE box completes');
  console.log('  printWaterfall()         - Opens detailed waterfall report');
  console.log('  exportWaterfallCSV()     - Downloads waterfall as CSV');
  console.log('');
  console.log('%cExport Data:', 'font-weight: bold; color: #30d158;');
  console.log('  exportProjectionCSV()    - Downloads full projection as CSV');
  console.log('');
  console.log('%cRaw Data (after running functions above):', 'font-weight: bold; color: #30d158;');
  console.log('  window.projectionTable   - Raw projection array');
  console.log('  window.projectionSummary - Summary stats');
  console.log('  window.netWorthProjection - Net worth array');
  console.log('  window.netWorthSummary   - Net worth summary');
  console.log('');
  console.log('%cType showConsoleHelp() to see this list again', 'color: #888;');
}

// Initialize the app
function init() {
  Debug.group('App Initialization');
  Debug.info('Starting Financial GPS...');
  Debug.time('init');

  try {
    // Load saved state from localStorage
    Debug.state('Loading saved state...');
    loadState();
    Debug.success('State loaded');

    // Decide initial view based on existing data
    if (hasData()) {
      currentView = 'dashboard';
      Debug.info('Existing data found, showing dashboard');
    } else {
      currentView = 'welcome';
      Debug.info('No data found, showing welcome screen');
    }

    // Render the initial view
    render();

    Debug.timeEnd('init');
    Debug.success('App initialized successfully');
    Debug.groupEnd();

    // Show console help on startup
    showConsoleHelp();
  } catch (error) {
    Debug.error('App initialization failed:', error);
    Debug.timeEnd('init');
    Debug.groupEnd();
  }
}

// Expose functions globally
window.render = render;
window.showDashboard = showDashboard;
window.showInput = showInput;
window.showWelcome = showWelcome;
window.showConsoleHelp = showConsoleHelp;

// Expose app object for components that need re-rendering
window.app = {
  render: render,
  showDashboard: showDashboard,
  showInput: showInput,
  showWelcome: showWelcome
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
