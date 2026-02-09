# Accessibility Testing Skill

## SKILL.md

**Name:** accessibility-testing
**Version:** 1.0.0
**Agent:** Frontend Architect
**Triggers:** accessibility, a11y, WCAG, screen reader, keyboard navigation, contrast, ADA compliance

---

## Description

Comprehensive accessibility testing and remediation skill that ensures Financial GPS meets WCAG 2.1 AA standards and provides an inclusive experience for all users, including those using assistive technologies.

---

## System Prompt Addition

```xml
<accessibility_testing>
You are equipped with comprehensive accessibility testing capabilities for Financial GPS.
Your goal is to ensure the application meets WCAG 2.1 Level AA standards and provides
an excellent experience for users with disabilities.

TESTING FRAMEWORK:

1. AUTOMATED FIRST PASS
   Run automated checks using axe-core patterns to detect:
   - Missing alt text
   - Insufficient color contrast
   - Missing form labels
   - Invalid ARIA usage
   - Heading hierarchy violations
   - Missing landmarks

2. MANUAL VERIFICATION (Cannot be automated)
   - Keyboard navigation flow (logical tab order)
   - Screen reader announcements (meaningful content)
   - Focus management (visible, logical)
   - Cognitive load (clear, simple language)
   - Error recovery (helpful, specific messages)
   - Time limits (sufficient time or ability to extend)

3. FINANCIAL-SPECIFIC ACCESSIBILITY
   For calculators and projections:
   - Numbers announced correctly by screen readers
   - Charts have text alternatives
   - Dynamic updates announced via aria-live
   - Complex tables have proper headers
   - Currency formatted accessibly ($1,234.56 reads as "one thousand two hundred thirty four dollars and fifty six cents")

WCAG 2.1 AA CHECKLIST:

Perceivable:
- [ ] 1.1.1 Non-text content has text alternatives
- [ ] 1.3.1 Info and relationships conveyed programmatically
- [ ] 1.3.2 Meaningful sequence preserved
- [ ] 1.3.3 Sensory characteristics not sole instruction
- [ ] 1.4.1 Color not sole means of conveying info
- [ ] 1.4.3 Contrast ratio minimum 4.5:1 (3:1 large text)
- [ ] 1.4.4 Text resizable to 200% without loss
- [ ] 1.4.5 Images of text avoided
- [ ] 1.4.10 Content reflows at 320px width
- [ ] 1.4.11 Non-text contrast minimum 3:1
- [ ] 1.4.12 Text spacing adjustable
- [ ] 1.4.13 Content on hover/focus dismissible

Operable:
- [ ] 2.1.1 All functionality keyboard accessible
- [ ] 2.1.2 No keyboard traps
- [ ] 2.1.4 Single-key shortcuts can be turned off
- [ ] 2.4.1 Skip links provided
- [ ] 2.4.2 Pages have descriptive titles
- [ ] 2.4.3 Focus order is logical
- [ ] 2.4.4 Link purpose clear from context
- [ ] 2.4.6 Headings and labels descriptive
- [ ] 2.4.7 Focus indicator visible
- [ ] 2.5.1 Pointer gestures have alternatives
- [ ] 2.5.2 Pointer cancellation supported
- [ ] 2.5.3 Accessible name matches visible label
- [ ] 2.5.4 Motion actuation has alternatives

Understandable:
- [ ] 3.1.1 Page language specified
- [ ] 3.1.2 Language of parts specified
- [ ] 3.2.1 No unexpected context change on focus
- [ ] 3.2.2 No unexpected context change on input
- [ ] 3.2.3 Consistent navigation
- [ ] 3.2.4 Consistent identification
- [ ] 3.3.1 Input errors identified
- [ ] 3.3.2 Labels or instructions provided
- [ ] 3.3.3 Error suggestions provided
- [ ] 3.3.4 Error prevention for financial data

Robust:
- [ ] 4.1.1 No parsing errors
- [ ] 4.1.2 Name, role, value exposed
- [ ] 4.1.3 Status messages announced

OUTPUT FORMAT:
When testing, report findings as:

ACCESSIBILITY AUDIT: [Component/Page Name]
Date: [Date]
Standard: WCAG 2.1 Level AA

AUTOMATED FINDINGS:
| Issue | WCAG | Severity | Location | Fix |
|-------|------|----------|----------|-----|

MANUAL TESTING RESULTS:
| Test | Pass/Fail | Notes |
|------|-----------|-------|

REMEDIATION PRIORITY:
1. Critical (blocks access): [List]
2. Serious (significant barrier): [List]
3. Moderate (causes difficulty): [List]
4. Minor (annoyance): [List]
</accessibility_testing>
```

---

## Testing Workflows

### Workflow 1: Component Accessibility Audit

```
TRIGGER: New component created or modified

STEPS:

1. STRUCTURAL ANALYSIS
   Check HTML structure:
   ```html
   <!-- Required patterns -->
   <main> - One per page
   <nav> - Navigation landmark
   <header>, <footer> - Page landmarks
   <section aria-labelledby="..."> - Labeled sections
   <h1> through <h6> - Proper hierarchy (no skips)
   ```

2. INTERACTIVE ELEMENT AUDIT
   For each interactive element:
   ```
   □ Has accessible name (label, aria-label, aria-labelledby)
   □ Role is correct (button, link, etc.)
   □ State is announced (aria-expanded, aria-selected, etc.)
   □ Keyboard operable (Enter, Space, Arrow keys as appropriate)
   □ Focus visible
   □ Touch target ≥44x44px
   ```

3. FORM VALIDATION
   ```html
   <!-- Required pattern -->
   <label for="input-id">Label Text</label>
   <input
     id="input-id"
     type="text"
     aria-describedby="hint-id error-id"
     aria-invalid="false"
     required
   >
   <span id="hint-id" class="hint">Help text</span>
   <span id="error-id" class="error" role="alert" hidden>Error</span>
   ```

4. COLOR CONTRAST CHECK
   Verify ratios:
   - Normal text: 4.5:1 minimum
   - Large text (18pt+ or 14pt bold): 3:1 minimum
   - UI components: 3:1 minimum
   - Focus indicators: 3:1 minimum

5. KEYBOARD TESTING
   Navigate entire component using only:
   - Tab / Shift+Tab (move between elements)
   - Enter / Space (activate)
   - Arrow keys (within widgets)
   - Escape (close/cancel)

6. SCREEN READER TESTING
   Verify announcements:
   - Element type announced
   - Label/name announced
   - State announced
   - Instructions available
   - Errors announced immediately

OUTPUT: Component accessibility report
```

### Workflow 2: Financial Calculator Accessibility

```
TRIGGER: Calculator or projection tool created/modified

STEPS:

1. INPUT ACCESSIBILITY
   ```html
   <!-- Currency input pattern -->
   <label for="income">Annual Income</label>
   <div class="currency-input">
     <span aria-hidden="true">$</span>
     <input
       id="income"
       type="text"
       inputmode="decimal"
       aria-describedby="income-format income-error"
       pattern="[0-9,]*\.?[0-9]*"
     >
   </div>
   <span id="income-format" class="hint">
     Enter amount without dollar sign (e.g., 50000)
   </span>
   ```

2. LIVE RESULTS ANNOUNCEMENT
   ```html
   <!-- Results that update dynamically -->
   <div
     aria-live="polite"
     aria-atomic="true"
     role="status"
   >
     <h2>Your Projection Results</h2>
     <p>
       Estimated retirement savings:
       <span class="result">$1,234,567</span>
     </p>
   </div>
   ```

3. CHART ALTERNATIVES
   Every chart must have:
   ```html
   <figure>
     <div class="chart" aria-hidden="true">
       <!-- Visual chart -->
     </div>
     <figcaption>
       <h3>Savings Growth Over Time</h3>
       <p>Summary: Your savings grow from $50,000 to $1.2M over 30 years.</p>
     </figcaption>
     <!-- Accessible data table alternative -->
     <details>
       <summary>View data as table</summary>
       <table>
         <caption>Savings projection by year</caption>
         <thead>
           <tr>
             <th scope="col">Year</th>
             <th scope="col">Balance</th>
           </tr>
         </thead>
         <tbody>...</tbody>
       </table>
     </details>
   </figure>
   ```

4. NUMBER FORMATTING
   ```javascript
   // Screen-reader friendly currency
   function formatCurrencyAccessible(amount) {
     const formatted = new Intl.NumberFormat('en-US', {
       style: 'currency',
       currency: 'USD'
     }).format(amount);

     // Add aria-label for proper pronunciation
     return `<span aria-label="${speakCurrency(amount)}">${formatted}</span>`;
   }

   function speakCurrency(amount) {
     // $1,234.56 → "1234 dollars and 56 cents"
     const dollars = Math.floor(amount);
     const cents = Math.round((amount - dollars) * 100);

     let spoken = `${dollars} dollars`;
     if (cents > 0) {
       spoken += ` and ${cents} cents`;
     }
     return spoken;
   }
   ```

5. ERROR HANDLING
   ```javascript
   function showCalculationError(input, message) {
     const errorEl = document.getElementById(`${input.id}-error`);
     errorEl.textContent = message;
     errorEl.hidden = false;
     input.setAttribute('aria-invalid', 'true');

     // Move focus to error for screen reader announcement
     input.focus();

     // Announce error
     announceToScreenReader(`Error: ${message}`);
   }

   function announceToScreenReader(message) {
     const announcer = document.getElementById('sr-announcer');
     announcer.textContent = message;
   }
   ```

OUTPUT: Calculator accessibility certification
```

### Workflow 3: Page-Level Accessibility Audit

```
TRIGGER: Before page deployment or quarterly audit

STEPS:

1. DOCUMENT STRUCTURE
   ```
   □ <!DOCTYPE html> present
   □ <html lang="en"> specified
   □ <title> descriptive and unique
   □ <meta name="viewport"> allows zoom
   □ One <main> landmark
   □ <h1> present and unique
   □ Heading hierarchy logical (h1 → h2 → h3)
   □ Skip link to main content
   ```

2. LANDMARK AUDIT
   ```
   Required landmarks:
   □ <header> or role="banner"
   □ <nav> or role="navigation"
   □ <main> or role="main"
   □ <footer> or role="contentinfo"

   Multiple nav elements labeled:
   □ aria-label="Main navigation"
   □ aria-label="Footer navigation"
   ```

3. IMAGE AUDIT
   ```
   Every <img> has:
   □ alt="" (decorative) OR
   □ alt="Descriptive text" (informative)

   Complex images have:
   □ Brief alt text
   □ Longer description linked or adjacent
   ```

4. LINK AUDIT
   ```
   Every link:
   □ Has descriptive text (not "click here")
   □ Opens in same window OR warns about new window
   □ Distinguishable from surrounding text (not just color)
   ```

5. RESPONSIVE/ZOOM TESTING
   Test at:
   □ 320px width (mobile reflow)
   □ 200% zoom (text scaling)
   □ 400% zoom (extreme magnification)

   Verify:
   □ No horizontal scrolling at 320px
   □ No content loss at 200% zoom
   □ No overlapping text
   □ All functionality accessible

6. MOTION/ANIMATION
   ```
   □ prefers-reduced-motion respected
   □ No auto-playing video
   □ Animations can be paused
   □ No flashing content (3 flashes/second max)
   ```

OUTPUT: Full page accessibility report
```

---

## Remediation Patterns

### Common Issues and Fixes

```html
<!-- ISSUE: Missing form label -->
<!-- BAD -->
<input type="text" placeholder="Enter email">

<!-- GOOD -->
<label for="email">Email Address</label>
<input type="email" id="email" placeholder="you@example.com">


<!-- ISSUE: Non-descriptive link -->
<!-- BAD -->
<a href="/learn-more">Click here</a>

<!-- GOOD -->
<a href="/learn-more">Learn more about retirement planning</a>


<!-- ISSUE: Image without alt -->
<!-- BAD -->
<img src="chart.png">

<!-- GOOD (informative) -->
<img src="chart.png" alt="Line chart showing savings growth from $0 to $1M over 30 years">

<!-- GOOD (decorative) -->
<img src="decoration.png" alt="" role="presentation">


<!-- ISSUE: Color-only indication -->
<!-- BAD -->
<span style="color: red;">Required field</span>

<!-- GOOD -->
<span class="required">
  <span aria-hidden="true">*</span>
  Required field
</span>


<!-- ISSUE: Custom button not keyboard accessible -->
<!-- BAD -->
<div class="button" onclick="submit()">Submit</div>

<!-- GOOD -->
<button type="submit" class="button">Submit</button>

<!-- OR if div required -->
<div
  class="button"
  role="button"
  tabindex="0"
  onclick="submit()"
  onkeydown="if(event.key==='Enter'||event.key===' ')submit()"
>
  Submit
</div>
```

---

## Testing Tools Integration

### Automated Testing Script

```javascript
// Add to build/CI pipeline
// accessibility-audit.js

async function runAccessibilityAudit(url) {
  const results = {
    automated: [],
    manual: [],
    timestamp: new Date().toISOString()
  };

  // Run axe-core
  const axeResults = await runAxe(url);
  results.automated = axeResults.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    wcag: v.tags.filter(t => t.startsWith('wcag')),
    nodes: v.nodes.length,
    help: v.helpUrl
  }));

  // Generate manual testing checklist
  results.manual = generateManualChecklist(url);

  return results;
}

function generateManualChecklist(url) {
  return [
    { test: 'Keyboard navigation logical', status: 'pending' },
    { test: 'Skip link works', status: 'pending' },
    { test: 'Focus visible on all elements', status: 'pending' },
    { test: 'Screen reader announces content correctly', status: 'pending' },
    { test: 'Forms announce errors', status: 'pending' },
    { test: 'Dynamic content announced', status: 'pending' },
    { test: 'No keyboard traps', status: 'pending' },
    { test: 'Touch targets adequate', status: 'pending' }
  ];
}
```

### Browser Testing Commands

```bash
# Chrome DevTools Accessibility Audit
# Open DevTools → Lighthouse → Accessibility

# Firefox Accessibility Inspector
# Open DevTools → Accessibility tab

# axe DevTools Extension
# Install from browser store, run on any page

# WAVE Extension
# Install from browser store, shows inline annotations
```

---

## Reporting Template

```markdown
# Accessibility Audit Report

**Page/Component:** [Name]
**URL:** [URL]
**Date:** [Date]
**Auditor:** Accessibility Testing Skill
**Standard:** WCAG 2.1 Level AA

## Executive Summary
- **Overall Score:** [Pass/Conditional Pass/Fail]
- **Critical Issues:** [Count]
- **Total Issues:** [Count]

## Automated Testing Results
Tool: axe-core v4.x

| # | Issue | Impact | WCAG | Count | Status |
|---|-------|--------|------|-------|--------|
| 1 | [Issue] | [Critical/Serious/Moderate/Minor] | [Criteria] | [N] | [Open/Fixed] |

## Manual Testing Results

| Test | Result | Notes |
|------|--------|-------|
| Keyboard Navigation | ✓/✗ | [Notes] |
| Screen Reader | ✓/✗ | [Notes] |
| Focus Management | ✓/✗ | [Notes] |
| Color Contrast | ✓/✗ | [Notes] |
| Responsive/Zoom | ✓/✗ | [Notes] |

## Remediation Plan

### Critical (Must fix before launch)
1. [Issue + Fix]

### Serious (Fix within 1 sprint)
1. [Issue + Fix]

### Moderate (Fix within 1 month)
1. [Issue + Fix]

## Sign-off
- [ ] All critical issues resolved
- [ ] All serious issues resolved or scheduled
- [ ] Manual testing passed
- [ ] Ready for deployment
```
