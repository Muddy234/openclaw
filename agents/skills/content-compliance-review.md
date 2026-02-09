# Content Compliance Review Skill

## SKILL.md

**Name:** content-compliance-review
**Version:** 1.0.0
**Agent:** Compliance Reviewer (Primary)
**Triggers:** disclaimer, disclosure, content review, compliance check, regulatory, legal review, terms, privacy

---

## Description

Automated content compliance review skill that scans content for required disclaimers, prohibited language, and regulatory compliance. Ensures all Financial GPS content meets SEC, FINRA, FTC, and privacy regulations.

---

## System Prompt Addition

```xml
<content_compliance_review>
You are equipped with automated content compliance capabilities for Financial GPS.
Your goal is to ensure all content meets regulatory requirements before publication.

AUTOMATED CHECKS:

1. DISCLAIMER DETECTION
   Scan for required disclaimers based on content type:
   - Investment-related content → "Not investment advice" disclaimer
   - Projections/calculators → "Estimates only" disclaimer
   - Tax mentions → Tax professional disclaimer
   - Historical returns → "Past performance" disclaimer
   - Third-party links → Third-party disclaimer

2. PROHIBITED LANGUAGE DETECTION
   Flag high-risk terms:
   - "Guaranteed" (returns, income, results)
   - "Risk-free"
   - "Safe investment"
   - "No risk"
   - "Will" (for future performance)
   - "Best" (without substantiation)
   - "You should" (investment advice)
   - "We recommend" (specific investments)
   - "Certain" (about future outcomes)
   - "Always" / "Never" (absolute claims)

3. REQUIRED ELEMENT VERIFICATION
   Check presence of:
   - Privacy policy link
   - Terms of service link
   - Contact information
   - Last updated date
   - Author attribution (for articles)

4. CLAIM SUBSTANTIATION
   For factual claims:
   - Source cited?
   - Data current?
   - Claim verifiable?

SEVERITY LEVELS:

CRITICAL (Must fix before publish):
- Missing required disclaimers
- Prohibited language (guarantees, specific advice)
- False or misleading claims

HIGH (Should fix before publish):
- Missing compliance elements
- Vague or potentially misleading language
- Unsubstantiated claims

MEDIUM (Fix within 24 hours):
- Missing recommended disclosures
- Unclear language
- Missing sources

LOW (Improve when possible):
- Style/clarity improvements
- Enhanced disclosure recommendations

OUTPUT FORMAT:

CONTENT COMPLIANCE SCAN: [Content Title/URL]
Date: [Date]
Status: [Pass / Fail / Conditional Pass]

CRITICAL ISSUES:
[List with exact location and required fix]

HIGH ISSUES:
[List with location and recommended fix]

REQUIRED DISCLAIMERS:
[Which disclaimers must be added and where]

LANGUAGE FIXES:
| Original | Issue | Suggested Fix |
|----------|-------|---------------|

COMPLIANCE SCORE: [0-100]
</content_compliance_review>
```

---

## Compliance Scan Patterns

### Pattern Library: Prohibited Language

```javascript
const PROHIBITED_PATTERNS = {
  // Guaranteed returns
  guaranteedReturns: {
    patterns: [
      /guarantee[ds]?\s+(return|income|profit|gain)/gi,
      /guaranteed\s+\d+%/gi,
      /you\s+will\s+(earn|make|receive)\s+\d+%/gi,
      /certain\s+(return|profit|income)/gi,
    ],
    severity: 'CRITICAL',
    message: 'Cannot guarantee financial returns',
    suggestion: 'Use "potential" or "historical" instead'
  },

  // Risk-free claims
  riskFree: {
    patterns: [
      /risk[\s-]?free/gi,
      /no\s+risk/gi,
      /zero\s+risk/gi,
      /without\s+risk/gi,
      /safe\s+investment/gi,
      /completely\s+safe/gi,
    ],
    severity: 'CRITICAL',
    message: 'All investments carry risk',
    suggestion: 'Describe as "lower risk" or "historically stable" with context'
  },

  // Investment advice language
  investmentAdvice: {
    patterns: [
      /you\s+should\s+(invest|buy|sell|hold)/gi,
      /we\s+recommend\s+(investing|buying|selling)/gi,
      /invest\s+in\s+[A-Z]{1,5}\s/g, // Specific tickers
      /buy\s+(this|these)\s+(stock|fund|bond)/gi,
      /the\s+best\s+investment\s+for\s+you/gi,
    ],
    severity: 'CRITICAL',
    message: 'May constitute investment advice (requires registration)',
    suggestion: 'Use "you might consider" or "one option is"'
  },

  // Absolute future claims
  absoluteClaims: {
    patterns: [
      /will\s+(definitely|certainly|always)\s+(increase|grow|appreciate)/gi,
      /prices?\s+will\s+(rise|increase|go\s+up)/gi,
      /market\s+will\s+(crash|fall|decline)/gi,
      /certain\s+to\s+(increase|grow|profit)/gi,
    ],
    severity: 'HIGH',
    message: 'Cannot make absolute predictions about future performance',
    suggestion: 'Use "may," "could," or "historically has"'
  },

  // Misleading comparisons
  misleadingComparisons: {
    patterns: [
      /better\s+than\s+(a\s+)?savings?\s+account/gi,
      /beat(s)?\s+the\s+market/gi,
      /outperform(s)?\s+\w+/gi,
    ],
    severity: 'HIGH',
    message: 'Performance comparisons need substantiation and context',
    suggestion: 'Add historical data, time period, and disclaimers'
  },

  // Superlatives without substantiation
  unsubstantiatedSuperlatives: {
    patterns: [
      /\b(best|safest|most\s+profitable|highest\s+return)\b/gi,
      /\b(#1|number\s+one|top\s+rated)\b/gi,
    ],
    severity: 'MEDIUM',
    message: 'Superlatives require substantiation',
    suggestion: 'Add source or qualification, or remove claim'
  }
};
```

### Pattern Library: Required Disclaimers

```javascript
const DISCLAIMER_REQUIREMENTS = {
  // Content triggers and required disclaimers

  investmentContent: {
    triggers: [
      /invest(ment|ing|or)?/gi,
      /stock|bond|fund|etf|portfolio/gi,
      /retire(ment)?|401k|ira|roth/gi,
      /compound(ing)?\s+interest/gi,
    ],
    requiredDisclaimer: 'NOT_INVESTMENT_ADVICE',
    disclaimerText: `
      This content is for educational purposes only and does not constitute
      investment advice. Financial GPS is not a registered investment advisor.
      Consult a qualified financial advisor before making investment decisions.
    `
  },

  projections: {
    triggers: [
      /project(ion|ed|ing)?/gi,
      /estimat(e|ed|ion)/gi,
      /calculat(e|or|ion)/gi,
      /forecast/gi,
      /\d+\s+year(s)?\s+(projection|outlook)/gi,
    ],
    requiredDisclaimer: 'ESTIMATES_ONLY',
    disclaimerText: `
      These projections are hypothetical illustrations based on the assumptions
      provided. Actual results will vary and may be significantly different.
      This tool is for educational purposes only.
    `
  },

  historicalReturns: {
    triggers: [
      /historical\s+(return|performance|average)/gi,
      /past\s+(performance|return|result)/gi,
      /over\s+the\s+(last|past)\s+\d+\s+years/gi,
      /since\s+\d{4}/gi,
      /\d+%\s+(annual|average)\s+return/gi,
    ],
    requiredDisclaimer: 'PAST_PERFORMANCE',
    disclaimerText: `
      Past performance does not guarantee future results. Historical returns
      are provided for illustrative purposes only. Actual future performance
      may be materially different.
    `
  },

  taxContent: {
    triggers: [
      /tax(es|able|ation)?/gi,
      /deduct(ion|ible)?/gi,
      /irs|internal\s+revenue/gi,
      /capital\s+gains/gi,
    ],
    requiredDisclaimer: 'TAX_DISCLAIMER',
    disclaimerText: `
      This information is for educational purposes only and should not be
      considered tax advice. Tax laws are complex and subject to change.
      Consult a qualified tax professional for advice specific to your situation.
    `
  },

  dataCollection: {
    triggers: [
      /enter\s+your\s+(email|information)/gi,
      /sign\s+up|subscribe|register/gi,
      /we\s+collect|collecting\s+data/gi,
    ],
    requiredDisclaimer: 'PRIVACY_NOTICE',
    disclaimerText: `
      By providing your information, you agree to our Privacy Policy.
      We respect your privacy and will never sell your data.
    `,
    requiredLink: '/privacy-policy'
  }
};
```

---

## Compliance Scan Workflows

### Workflow 1: Full Content Scan

```
TRIGGER: New content ready for review

STEPS:

1. EXTRACT CONTENT
   - Get all text content
   - Identify content type (article, calculator, marketing)
   - Note any existing disclaimers

2. RUN PROHIBITED LANGUAGE SCAN
   ```javascript
   function scanForProhibitedLanguage(content) {
     const findings = [];

     for (const [name, rule] of Object.entries(PROHIBITED_PATTERNS)) {
       for (const pattern of rule.patterns) {
         const matches = content.match(pattern);
         if (matches) {
           findings.push({
             type: name,
             matches: matches,
             severity: rule.severity,
             message: rule.message,
             suggestion: rule.suggestion,
             locations: findLocations(content, matches)
           });
         }
       }
     }

     return findings;
   }
   ```

3. CHECK DISCLAIMER REQUIREMENTS
   ```javascript
   function checkDisclaimerRequirements(content, existingDisclaimers) {
     const required = [];

     for (const [name, rule] of Object.entries(DISCLAIMER_REQUIREMENTS)) {
       const triggered = rule.triggers.some(pattern =>
         pattern.test(content)
       );

       if (triggered) {
         const hasDisclaimer = existingDisclaimers.some(d =>
           d.type === rule.requiredDisclaimer
         );

         if (!hasDisclaimer) {
           required.push({
             type: rule.requiredDisclaimer,
             reason: `Content contains ${name} triggers`,
             text: rule.disclaimerText,
             link: rule.requiredLink
           });
         }
       }
     }

     return required;
   }
   ```

4. VERIFY REQUIRED ELEMENTS
   ```javascript
   function verifyRequiredElements(page) {
     const checks = {
       privacyLink: !!page.querySelector('a[href*="privacy"]'),
       termsLink: !!page.querySelector('a[href*="terms"]'),
       contactInfo: !!page.querySelector('.contact, [itemtype*="ContactPoint"]'),
       lastUpdated: !!page.querySelector('.last-updated, [datetime]'),
       authorInfo: !!page.querySelector('.author, [rel="author"]')
     };

     return checks;
   }
   ```

5. CLAIM VERIFICATION
   ```javascript
   function identifyUnverifiedClaims(content) {
     const claims = [];

     // Statistical claims without sources
     const statsPattern = /\d+%\s+of\s+(people|users|investors|Americans)/gi;
     const statsMatches = content.match(statsPattern);
     if (statsMatches) {
       claims.push({
         type: 'statistical',
         claims: statsMatches,
         issue: 'Missing source citation'
       });
     }

     // Comparative claims
     const comparativePattern = /(more|less|better|worse)\s+than\s+(average|typical|most)/gi;
     const compMatches = content.match(comparativePattern);
     if (compMatches) {
       claims.push({
         type: 'comparative',
         claims: compMatches,
         issue: 'Needs substantiation or qualification'
       });
     }

     return claims;
   }
   ```

6. GENERATE REPORT
   ```
   CONTENT COMPLIANCE SCAN REPORT
   ==============================

   Content: [Title]
   URL: [URL]
   Type: [Article/Calculator/Marketing]
   Date: [Scan Date]
   Status: [PASS/FAIL/CONDITIONAL]

   SUMMARY:
   - Critical Issues: [N]
   - High Issues: [N]
   - Medium Issues: [N]
   - Low Issues: [N]
   - Compliance Score: [0-100]

   CRITICAL ISSUES (Must fix):
   1. [Location]: "[Problematic text]"
      Issue: [Description]
      Fix: [Required change]

   REQUIRED DISCLAIMERS:
   1. [Disclaimer type]
      Trigger: [What triggered it]
      Add: [Exact text to add]
      Placement: [Where to add it]

   MISSING ELEMENTS:
   - [ ] [Element] - [How to add]

   UNVERIFIED CLAIMS:
   1. "[Claim]" - Add source or remove

   RECOMMENDED IMPROVEMENTS:
   1. [Suggestion]
   ```

OUTPUT: Compliance scan report
```

### Workflow 2: Pre-Publish Checklist

```
TRIGGER: Content ready for publishing

AUTOMATED CHECKLIST:

□ CRITICAL REQUIREMENTS
  □ No guaranteed return language
  □ No risk-free claims
  □ No specific investment advice
  □ No false or misleading claims
  □ Required disclaimers present

□ HIGH PRIORITY
  □ All claims substantiated
  □ Sources cited where needed
  □ No absolute future predictions
  □ Privacy policy linked
  □ Terms of service linked

□ MEDIUM PRIORITY
  □ Last updated date visible
  □ Author attribution (if article)
  □ Contact information accessible
  □ Clear, understandable language

□ FINANCIAL SPECIFIC
  □ Investment disclaimer present
  □ Tax disclaimer (if tax mentioned)
  □ Past performance disclaimer (if historical data)
  □ Projection disclaimer (if estimates shown)
  □ Professional advice recommendation

APPROVAL WORKFLOW:

Content passes automated scan?
├─ YES → Human review required for:
│         - Nuanced language interpretation
│         - Context-specific assessment
│         - Final approval
│
└─ NO → Return to author with:
         - Specific issues flagged
         - Required fixes listed
         - Suggested language alternatives
         - Deadline for revision
```

### Workflow 3: Disclaimer Placement

```
TRIGGER: Disclaimer needs to be added

PLACEMENT RULES:

1. PAGE-LEVEL DISCLAIMERS
   Location: Below content, before footer
   Visibility: Clear, readable font (min 12px)
   Style: Distinguished from content (border or background)

   ```html
   <aside class="disclaimer" role="complementary" aria-label="Important disclaimers">
     <h2 class="disclaimer__title">Important Information</h2>
     <p class="disclaimer__text">
       [Disclaimer text]
     </p>
   </aside>
   ```

2. INLINE DISCLAIMERS
   For specific claims or projections:
   ```html
   <p>
     Based on historical data, the S&P 500 has averaged approximately 10% annual returns.
     <sup><a href="#disclaimer-past-performance">*</a></sup>
   </p>

   <!-- Later on page -->
   <p id="disclaimer-past-performance" class="footnote">
     *Past performance does not guarantee future results.
   </p>
   ```

3. CALCULATOR DISCLAIMERS
   Location: Directly above or below results
   ```html
   <div class="calculator-results">
     <h2>Your Results</h2>
     <div class="results-content">
       <!-- Results here -->
     </div>
     <p class="calculator-disclaimer">
       <strong>Important:</strong> These projections are estimates based on
       the assumptions you provided. Actual results will vary.
       <a href="/disclaimer">Read full disclaimer</a>.
     </p>
   </div>
   ```

4. FOOTER DISCLAIMERS
   Persistent site-wide:
   ```html
   <footer>
     <div class="footer-disclaimer">
       <p>
         Financial GPS provides educational information only and is not a
         registered investment advisor. Content does not constitute investment,
         tax, or legal advice. <a href="/terms">Terms</a> |
         <a href="/privacy">Privacy</a> | <a href="/disclaimer">Full Disclaimer</a>
       </p>
     </div>
   </footer>
   ```

DISCLAIMER TEXT LIBRARY:

Standard Investment Disclaimer:
```
The information provided on Financial GPS is for general educational and
informational purposes only. It is not intended to be, and should not be
construed as, investment, financial, legal, tax, or other professional
advice. Financial GPS is not a registered investment advisor, broker-dealer,
or financial planner.

Before making any investment decisions, you should consult with a qualified
financial advisor who can consider your individual circumstances. Past
performance is not indicative of future results. All investments involve
risk, including the possible loss of principal.
```

Calculator/Projection Disclaimer:
```
The calculations and projections provided by this tool are hypothetical
examples for illustrative purposes only. They are based on the information
and assumptions you provide and do not reflect actual investment results.

Actual results will vary based on numerous factors including market
conditions, individual circumstances, and variables not accounted for in
these calculations. These projections should not be relied upon for making
financial decisions.
```

Tax Disclaimer:
```
The tax information provided is for general educational purposes only and
should not be considered tax advice. Tax laws are complex, vary by
jurisdiction, and are subject to change. The applicability of tax strategies
depends on your individual circumstances.

You should consult with a qualified tax professional before making any
decisions based on tax considerations.
```
```

---

## Language Replacement Guide

```markdown
## Compliant Language Alternatives

### Instead of "Guaranteed"
| Don't Say | Do Say |
|-----------|--------|
| "Guaranteed returns" | "Potential returns" / "Historical returns" |
| "Guaranteed income" | "Potential income stream" |
| "You will earn" | "You may earn" / "Historically, investors have earned" |

### Instead of "Risk-Free"
| Don't Say | Do Say |
|-----------|--------|
| "Risk-free investment" | "Lower-risk investment option" |
| "Safe investment" | "Investments with historically lower volatility" |
| "No risk" | "Risk managed through diversification" |

### Instead of Advice Language
| Don't Say | Do Say |
|-----------|--------|
| "You should invest in..." | "You might consider..." |
| "We recommend buying..." | "Some investors choose to..." |
| "The best investment is..." | "Factors to consider include..." |
| "Invest your money in..." | "Options available include..." |

### Instead of Absolute Predictions
| Don't Say | Do Say |
|-----------|--------|
| "The market will rise" | "The market may rise" / "Historically, markets have risen" |
| "Prices will increase" | "Prices could increase" |
| "You will become wealthy" | "Building wealth takes time and discipline" |
| "This will make you rich" | "This approach has helped some investors" |

### Instead of Superlatives
| Don't Say | Do Say |
|-----------|--------|
| "The best retirement calculator" | "A comprehensive retirement calculator" |
| "The safest way to invest" | "A historically stable investment approach" |
| "The most profitable strategy" | "An approach that has worked for many investors" |
```

---

## Compliance Score Calculation

```javascript
function calculateComplianceScore(scanResults) {
  let score = 100;

  // Deductions
  const deductions = {
    critical: 25,  // Per critical issue
    high: 10,      // Per high issue
    medium: 5,     // Per medium issue
    low: 2,        // Per low issue
    missingDisclaimer: 15,  // Per required disclaimer missing
    missingElement: 5       // Per required element missing
  };

  score -= scanResults.criticalIssues.length * deductions.critical;
  score -= scanResults.highIssues.length * deductions.high;
  score -= scanResults.mediumIssues.length * deductions.medium;
  score -= scanResults.lowIssues.length * deductions.low;
  score -= scanResults.missingDisclaimers.length * deductions.missingDisclaimer;
  score -= scanResults.missingElements.length * deductions.missingElement;

  // Floor at 0
  score = Math.max(0, score);

  // Determine status
  let status;
  if (score >= 90 && scanResults.criticalIssues.length === 0) {
    status = 'PASS';
  } else if (score >= 70 && scanResults.criticalIssues.length === 0) {
    status = 'CONDITIONAL PASS';
  } else {
    status = 'FAIL';
  }

  return { score, status };
}
```
