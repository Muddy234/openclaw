# Feature 2: Welcome Screen + Example Data

## Vision

New users arriving at a blank form with 30+ input fields experience analysis paralysis and bounce. A welcoming onboarding experience with pre-loaded example data allows users to immediately see the value of Financial GPS, understand what outputs they'll receive, and feel confident entering their own information.

## Goal

Create an engaging welcome screen that:
- Greets new users with a clear value proposition
- Offers "Try Example Data" to instantly see the tool in action
- Provides a smooth path to "Start Fresh" with their own data
- Shows example calculations that demonstrate the platform's insights

## Success Metrics

**What Success Looks Like:**
- Reduced bounce rate on first visit (target: <30% bounce)
- Users spend 2+ minutes exploring example data before entering their own
- Clear understanding of what Financial GPS does before data entry
- Smooth transition from example → own data without confusion

**Acceptance Criteria:**
- [ ] Welcome screen appears for first-time visitors (no localStorage data)
- [ ] "Try Example Data" button loads realistic scenario instantly
- [ ] Example banner appears at top when viewing example data
- [ ] "Clear & Start Fresh" button removes example data and shows blank form
- [ ] Welcome screen does NOT show for returning users with saved data
- [ ] Example data reflects realistic middle-class FIRE journey (age 32, $120K income, moderate debt)
- [ ] All calculations work correctly with example data

---

## Implementation Plan

### 1. Create Welcome Component

**File:** `components/welcome.js` (new file)

**Purpose:** Render welcome screen for first-time users

**Full Code:**

```javascript
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
          <div class="feature-icon">📊</div>
          <h3>Visualize Your Journey</h3>
          <p>See month-by-month projections from today to financial independence</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Prioritize Actions</h3>
          <p>Get a personalized FIRE strategy based on your unique situation</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">💡</div>
          <h3>Discover Insights</h3>
          <p>Uncover optimization opportunities you might be missing</p>
        </div>
      </div>

      <div class="welcome-cta">
        <button class="btn-primary btn-large" onclick="loadExampleData()">
          🚀 Try Example Data
        </button>
        <button class="btn-secondary btn-large" onclick="window.app.showInput()">
          ✏️ Start Fresh
        </button>
      </div>

      <div class="welcome-footer">
        <p class="text-muted">
          <strong>Try Example Data</strong> to see Financial GPS in action with a realistic scenario,
          or <strong>Start Fresh</strong> to enter your own information.
        </p>
      </div>
    </div>
  `;
}

/**
 * Load example data and show dashboard
 */
function loadExampleData() {
  const exampleData = {
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
      {
        category: 'CREDIT_CARD',
        balance: 5200,
        interestRate: 18.5,
        termMonths: 60
      },
      {
        category: 'STUDENT',
        balance: 28000,
        interestRate: 5.5,
        termMonths: 120
      }
    ]
  };

  // Create a complete snapshot with example data
  const exampleSnapshot = {
    ...window.createDefaultSnapshot(),
    general: exampleData.general,
    investments: exampleData.investments,
    debts: exampleData.debts,
    isExample: true  // Flag to show example banner
  };

  // Update store with example data
  window.store.state.snapshot = exampleSnapshot;
  window.store.recalculate();
  window.store.saveState();

  // Show dashboard
  window.app.showDashboard();
}

/**
 * Show banner when viewing example data
 * @returns {string} HTML for example banner
 */
function showExampleBanner() {
  if (!window.store.state.snapshot.isExample) {
    return '';
  }

  return `
    <div class="example-banner">
      <div class="banner-content">
        <span class="banner-icon">👀</span>
        <span class="banner-text">
          You're viewing <strong>example data</strong> for a 32-year-old earning $120K/year with moderate debt.
        </span>
        <button class="btn-link" onclick="clearExampleData()">
          Clear & Start Fresh
        </button>
      </div>
    </div>
  `;
}

/**
 * Clear example data and return to input form
 */
function clearExampleData() {
  // Reset to default snapshot
  window.store.state.snapshot = window.createDefaultSnapshot();
  window.store.recalculate();
  window.store.saveState();

  // Show input form
  window.app.showInput();
}
```

---

### 2. Update App Router

**File:** `js/app.js`

**Changes:** Add 'welcome' view state and detection logic

**Implementation Steps:**

1. Modify the render function to handle welcome view:

```javascript
function render() {
  const appDiv = document.getElementById('app');

  // Determine which view to show
  if (currentView === 'welcome') {
    appDiv.innerHTML = renderWelcome();
  } else if (currentView === 'dashboard') {
    appDiv.innerHTML = showExampleBanner() + renderDashboard();
  } else if (currentView === 'input') {
    appDiv.innerHTML = showExampleBanner() + renderInputCards();
  }
}
```

2. Update init function to detect first-time users:

```javascript
function init() {
  window.store.loadState();

  // Check if this is a first-time visitor (no saved data)
  const hasData = window.store.state.snapshot.general.age !== 30; // Default age is 30
  const hasInvestments = window.store.state.snapshot.investments.savings > 0 ||
                         window.store.state.snapshot.investments.fourOhOneK > 0;
  const hasDebts = window.store.state.snapshot.debts.some(d => d.balance > 0);

  // Show welcome screen if no meaningful data exists
  if (!hasData && !hasInvestments && !hasDebts) {
    currentView = 'welcome';
  } else {
    currentView = 'dashboard';
  }

  render();
}
```

3. Add showWelcome function for explicit navigation:

```javascript
function showWelcome() {
  currentView = 'welcome';
  render();
}
```

---

### 3. Add Welcome Screen CSS Styles

**File:** `css/styles.css`

**Add these styles:**

```css
/* ===========================
   WELCOME SCREEN STYLES
   ========================== */

.welcome-screen {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  text-align: center;
}

.welcome-hero {
  margin-bottom: 3rem;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(135deg, var(--gold) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.5rem;
  color: var(--text-secondary);
  font-weight: 300;
}

/* Feature cards */
.welcome-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--gold);
}

.feature-card p {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Call to action buttons */
.welcome-cta {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-width: 200px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold) 0%, var(--accent) 100%);
  color: var(--background);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
}

.btn-secondary {
  background: transparent;
  color: var(--gold);
  border: 2px solid var(--gold);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--gold);
  color: var(--background);
  transform: translateY(-2px);
}

.welcome-footer {
  margin-top: 2rem;
}

.text-muted {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Example data banner */
.example-banner {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%);
  border: 1px solid var(--gold);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.banner-icon {
  font-size: 1.5rem;
}

.banner-text {
  flex: 1;
  min-width: 250px;
  text-align: left;
}

.banner-text strong {
  color: var(--gold);
}

.btn-link {
  background: none;
  border: none;
  color: var(--gold);
  text-decoration: underline;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
}

.btn-link:hover {
  color: var(--accent);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2.5rem;
  }

  .welcome-subtitle {
    font-size: 1.25rem;
  }

  .welcome-features {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .welcome-cta {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-large {
    min-width: auto;
    width: 100%;
  }

  .banner-content {
    flex-direction: column;
    text-align: center;
  }

  .banner-text {
    text-align: center;
  }
}
```

---

### 4. Update index.html Script Loading

**File:** `index.html`

**Change:** Add welcome.js to script loading sequence

```html
<script src="js/constants.js"></script>
<script src="js/validation.js"></script>
<script src="js/store.js"></script>
<script src="js/strategy.js"></script>
<script src="js/projections.js"></script>
<script src="components/welcome.js"></script>  <!-- ADD THIS LINE -->
<script src="components/dashboard.js"></script>
<script src="components/inputCards.js"></script>
<script src="components/fireJourney.js"></script>
<script src="js/app.js"></script>
```

---

## Example Data Details

### Persona: "Sarah - Aspiring Early Retiree"

**Demographics:**
- Age: 32
- Target Retirement: 50 (18 years away)
- Location: Denver, CO
- Income: $120,000/year ($7,200/month take-home)
- Expenses: $4,500/month

**Current Financial Position:**
- **Total Assets:** $123,000
  - Savings: $15,000
  - Traditional IRA: $25,000
  - Roth IRA: $12,000
  - 401(k): $45,000
  - Stocks/Bonds: $8,000
  - Car Value: $18,000

- **Total Debts:** $33,200
  - Credit Card: $5,200 @ 18.5% (5 years)
  - Student Loans: $28,000 @ 5.5% (10 years)

**Key Metrics (Example Output):**
- Net Worth: $89,800
- DTI: ~22% (healthy)
- Savings Rate: ~37.5%
- Fragility Score: Medium (due to credit card debt)

**Why This Example Works:**
- Relatable to median American professional
- Shows both progress (good 401k) and challenges (credit card debt)
- Demonstrates FIRE strategy prioritization (pay off high-interest first)
- Realistic timeframe (18 years to FIRE)
- Multiple debt types to showcase comparison features

---

## Testing & Edge Cases

### Test Cases

1. **First-Time Visitor**
   - Clear localStorage → Refresh page → Should see welcome screen
   - Click "Try Example Data" → Should load dashboard with Sarah's data
   - Example banner should appear at top

2. **Returning User**
   - Has saved data in localStorage → Should skip welcome screen
   - Should go directly to dashboard

3. **Example Data Navigation**
   - While viewing example data, click "View Inputs" → Example banner should persist
   - Click "Clear & Start Fresh" → Should reset to blank input form
   - Example banner should disappear after clearing

4. **Example Data Calculations**
   - All projections should calculate correctly
   - FIRE journey should show proper prioritization
   - Dashboard metrics should be accurate

### Edge Cases

- **User has example data, closes tab, returns:** Should show example banner and allow clearing
- **User loads example, then manually changes values:** isExample flag should be removed after first manual edit
- **Welcome screen on mobile:** Should be fully responsive
- **No JavaScript:** Graceful degradation message

---

## Estimated Effort

**Development Time:** 6-8 hours

**Breakdown:**
- Welcome component creation: 3 hours
- App routing modifications: 1-2 hours
- CSS styling and responsiveness: 2 hours
- Example data scenario design: 1 hour
- Testing and edge cases: 1-2 hours

**Priority:** P0 (Critical - Major UX improvement for new users)

**Dependencies:** None
