# Financial Calculations Validation Skill

## SKILL.md

**Name:** financial-calculations-validation
**Version:** 1.0.0
**Agent:** Compliance Reviewer (Primary), Frontend Architect (Secondary)
**Triggers:** calculator, projection, financial calculation, retirement, FIRE, compound interest, validation, accuracy

---

## Description

Validates financial calculations, projections, and formulas used in Financial GPS to ensure accuracy, appropriate assumptions, and proper disclosure of limitations. Critical for regulatory compliance and user trust.

---

## System Prompt Addition

```xml
<financial_calculations_validation>
You are equipped to validate financial calculations and projections for accuracy,
reasonableness, and compliance. Every calculation shown to users must be verified.

VALIDATION FRAMEWORK:

1. FORMULA VERIFICATION
   - Confirm mathematical formulas are correct
   - Verify compound interest calculations
   - Check inflation adjustments
   - Validate tax estimate approximations
   - Ensure time value of money calculations

2. ASSUMPTION REASONABLENESS
   - Default rates within historical norms
   - Inflation assumptions appropriate
   - Time horizons realistic
   - No guaranteed return language

3. EDGE CASE HANDLING
   - Zero values handled
   - Negative values prevented or handled
   - Maximum values constrained
   - Division by zero prevented
   - Overflow/underflow protected

4. DISCLOSURE REQUIREMENTS
   - All assumptions visible
   - Limitations stated
   - "Estimates only" messaging
   - Professional advice recommendation

CORE FINANCIAL FORMULAS TO VALIDATE:

Compound Interest (Future Value):
FV = PV × (1 + r)^n
Where: PV=present value, r=rate per period, n=number of periods

Future Value of Annuity (Regular Contributions):
FV = PMT × [((1 + r)^n - 1) / r]
Where: PMT=payment per period

Present Value:
PV = FV / (1 + r)^n

Inflation-Adjusted Value:
Real Value = Nominal Value / (1 + inflation)^years

FIRE Number Calculation:
FIRE Target = Annual Expenses × 25 (4% rule)
OR
FIRE Target = Annual Expenses / Safe Withdrawal Rate

Savings Rate:
Savings Rate = (Income - Expenses) / Income × 100

Years to FIRE:
Years = ln((FI Target × r + Annual Savings) / Annual Savings) / ln(1 + r)

VALIDATION OUTPUT FORMAT:

CALCULATION VALIDATION: [Calculator Name]
Date: [Date]
Status: [Validated/Issues Found/Rejected]

FORMULAS CHECKED:
| Formula | Implementation | Correct | Notes |
|---------|----------------|---------|-------|

ASSUMPTIONS AUDIT:
| Assumption | Default Value | Reasonable | Disclosed |
|------------|--------------|------------|-----------|

EDGE CASES TESTED:
| Scenario | Input | Expected | Actual | Pass |
|----------|-------|----------|--------|------|

DISCLOSURES VERIFIED:
- [ ] Assumptions listed
- [ ] Limitations stated
- [ ] Estimates disclaimer present
- [ ] Professional advice recommended

ISSUES:
[List any problems found]

REMEDIATION:
[Required fixes]
</financial_calculations_validation>
```

---

## Validation Workflows

### Workflow 1: New Calculator Validation

```
TRIGGER: New financial calculator or tool created

STEPS:

1. FORMULA EXTRACTION
   Identify all calculations performed:
   ```javascript
   // Document each formula used
   // Example from projections.js:

   // Future Value with contributions
   function calculateFutureValue(principal, monthlyContribution, annualRate, years) {
     const monthlyRate = annualRate / 12;
     const months = years * 12;

     // FV of lump sum
     const fvPrincipal = principal * Math.pow(1 + monthlyRate, months);

     // FV of annuity
     const fvContributions = monthlyContribution *
       ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

     return fvPrincipal + fvContributions;
   }
   ```

2. MATHEMATICAL VERIFICATION
   For each formula:
   ```
   □ Formula matches standard financial formula
   □ Order of operations correct
   □ Rate conversion correct (annual ↔ monthly)
   □ Period conversion correct (years ↔ months)
   □ Rounding appropriate for currency
   ```

3. TEST CASE VALIDATION
   Run against known values:
   ```javascript
   // Test cases with verified answers
   const testCases = [
     {
       name: "Simple compound interest",
       input: { principal: 10000, rate: 0.07, years: 10 },
       expected: 19671.51, // Verified externally
       tolerance: 0.01
     },
     {
       name: "Monthly contributions",
       input: { principal: 0, monthly: 500, rate: 0.07, years: 30 },
       expected: 566764.88,
       tolerance: 0.01
     },
     {
       name: "FIRE number at 4% SWR",
       input: { annualExpenses: 40000, swr: 0.04 },
       expected: 1000000,
       tolerance: 0
     }
   ];
   ```

4. EDGE CASE TESTING
   ```javascript
   const edgeCases = [
     { name: "Zero principal", input: { principal: 0 }, expectation: "Should work" },
     { name: "Zero rate", input: { rate: 0 }, expectation: "Should return principal only" },
     { name: "Zero years", input: { years: 0 }, expectation: "Should return principal" },
     { name: "Negative input", input: { principal: -1000 }, expectation: "Should reject or handle" },
     { name: "Very large number", input: { principal: 1e15 }, expectation: "Should not overflow" },
     { name: "Very long term", input: { years: 100 }, expectation: "Should handle reasonably" },
     { name: "High rate", input: { rate: 0.50 }, expectation: "Should warn or cap" }
   ];
   ```

5. ASSUMPTION AUDIT
   ```
   Default Assumptions Review:

   | Assumption | Default | Historical Range | Reasonable? |
   |------------|---------|------------------|-------------|
   | Stock return | 7% | 6-10% real | ✓ |
   | Bond return | 3% | 2-5% real | ✓ |
   | Inflation | 3% | 2-4% | ✓ |
   | Safe withdrawal | 4% | 3-4% | ✓ |

   Red flags:
   ❌ Returns > 12% (unrealistic)
   ❌ Inflation < 1% (too optimistic)
   ❌ SWR > 5% (too aggressive)
   ❌ Time horizon > 60 years (uncertain)
   ```

6. DISCLOSURE CHECK
   ```
   Required disclosures present:
   □ "These projections are estimates only"
   □ "Past performance does not guarantee future results"
   □ "Actual results may vary significantly"
   □ "Consult a financial advisor for personalized advice"
   □ All assumptions clearly listed
   □ Assumptions are user-adjustable
   □ Methodology explained or linked
   ```

OUTPUT: Calculator validation certificate or remediation list
```

### Workflow 2: Projection Accuracy Audit

```
TRIGGER: Quarterly audit or before major release

STEPS:

1. COLLECT ALL CALCULATIONS
   Inventory every calculation in the application:
   ```
   Location: /js/projections.js
   - calculateFutureValue()
   - calculateRetirementNeeds()
   - calculateSavingsRate()
   - calculateYearsToFIRE()

   Location: /js/strategy.js
   - calculateDebtPayoff()
   - calculateEmergencyFund()
   - calculateInsuranceNeeds()

   Location: /components/fireJourney.js
   - calculateFIRENumber()
   - calculateCoastFIRE()
   - calculateBaristaFIRE()
   ```

2. CROSS-REFERENCE WITH STANDARDS
   Compare formulas against:
   - CFP Board calculation standards
   - Standard financial textbook formulas
   - Multiple financial calculator websites

   ```
   Verification sources:
   1. Investopedia formula reference
   2. Calculator.net financial calculators
   3. Bogleheads wiki formulas
   4. CFP exam prep materials
   ```

3. INDEPENDENT CALCULATION CHECK
   For each formula, calculate expected result independently:
   ```javascript
   // Example: Verify FIRE calculation
   const annualExpenses = 40000;
   const safeWithdrawalRate = 0.04;

   // Our calculation
   const ourResult = calculateFIRENumber(annualExpenses, safeWithdrawalRate);

   // Independent verification
   const verifiedResult = annualExpenses / safeWithdrawalRate;

   // Compare
   const difference = Math.abs(ourResult - verifiedResult);
   const isAccurate = difference < 0.01;
   ```

4. SCENARIO TESTING
   ```
   Test realistic user scenarios:

   Scenario 1: Young Professional
   - Age: 25, Income: $60,000, Savings: $10,000
   - Goal: Retire at 55
   - Verify projections are reasonable

   Scenario 2: Mid-Career
   - Age: 40, Income: $120,000, Savings: $200,000
   - Goal: Retire at 60
   - Verify projections account for shorter timeline

   Scenario 3: Near Retirement
   - Age: 55, Income: $150,000, Savings: $800,000
   - Goal: Retire at 65
   - Verify projections show realistic outcome
   ```

5. LIMITATION DOCUMENTATION
   Ensure documented limitations include:
   ```
   This calculator does not account for:
   - Taxes (income, capital gains, estate)
   - Social Security benefits
   - Pension income
   - Healthcare costs in retirement
   - Sequence of returns risk
   - Inflation variability
   - Market volatility
   - Personal circumstances
   ```

OUTPUT: Comprehensive accuracy audit report
```

### Workflow 3: Real-Time Input Validation

```
TRIGGER: User inputs financial data

VALIDATION RULES:

1. INCOME VALIDATION
   ```javascript
   function validateIncome(value) {
     const errors = [];

     if (value < 0) {
       errors.push("Income cannot be negative");
     }
     if (value > 10000000) {
       errors.push("Please verify income amount");
     }
     if (!Number.isFinite(value)) {
       errors.push("Please enter a valid number");
     }

     return errors;
   }
   ```

2. PERCENTAGE VALIDATION
   ```javascript
   function validatePercentage(value, context) {
     const errors = [];

     if (value < 0) {
       errors.push("Percentage cannot be negative");
     }
     if (value > 100 && context !== 'return_rate') {
       errors.push("Percentage cannot exceed 100%");
     }
     if (context === 'return_rate' && value > 30) {
       errors.push("Warning: Return rate above 30% is historically rare");
     }
     if (context === 'savings_rate' && value > 90) {
       errors.push("Warning: Savings rate above 90% may not be realistic");
     }

     return errors;
   }
   ```

3. AGE/YEAR VALIDATION
   ```javascript
   function validateAge(value) {
     const errors = [];

     if (value < 0 || value > 120) {
       errors.push("Please enter a valid age");
     }
     if (!Number.isInteger(value)) {
       errors.push("Age must be a whole number");
     }

     return errors;
   }

   function validateYears(value) {
     const errors = [];

     if (value < 0) {
       errors.push("Years cannot be negative");
     }
     if (value > 100) {
       errors.push("Time horizon over 100 years may not be meaningful");
     }

     return errors;
   }
   ```

4. CROSS-FIELD VALIDATION
   ```javascript
   function validateRetirementInputs(inputs) {
     const errors = [];

     if (inputs.retirementAge <= inputs.currentAge) {
       errors.push("Retirement age must be greater than current age");
     }
     if (inputs.expenses > inputs.income) {
       errors.push("Warning: Expenses exceed income");
     }
     if (inputs.savingsRate > 0 && inputs.savings === 0 && inputs.income > 0) {
       // This is fine, just starting to save
     }

     return errors;
   }
   ```

OUTPUT: Validated input or error messages
```

---

## Compliance Checklist for Calculators

```markdown
## Calculator Compliance Checklist

### Mathematical Accuracy
- [ ] Formulas verified against standard references
- [ ] Test cases pass with known values
- [ ] Edge cases handled appropriately
- [ ] Rounding is consistent and appropriate
- [ ] No floating-point precision issues

### Assumptions
- [ ] All assumptions documented
- [ ] Default values reasonable
- [ ] Users can modify assumptions
- [ ] Assumption ranges constrained
- [ ] Historical context provided for rates

### Disclosures
- [ ] "Estimates only" clearly stated
- [ ] "Not investment advice" disclaimer
- [ ] "Consult professional" recommendation
- [ ] Limitations listed
- [ ] Methodology explained

### User Experience
- [ ] Inputs validated in real-time
- [ ] Error messages helpful
- [ ] Results clearly labeled
- [ ] Assumptions visible with results
- [ ] Easy to understand output

### Regulatory
- [ ] No guaranteed return language
- [ ] No specific investment recommendations
- [ ] Balanced presentation of outcomes
- [ ] Risk factors mentioned
- [ ] Compliant with SEC/FINRA guidelines
```

---

## Common Calculation Errors to Check

```javascript
// ERROR 1: Annual vs Monthly Rate Confusion
// WRONG
const futureValue = principal * Math.pow(1 + annualRate, months);

// CORRECT
const monthlyRate = annualRate / 12;
const futureValue = principal * Math.pow(1 + monthlyRate, months);


// ERROR 2: Forgetting Order of Operations
// WRONG
const result = principal * 1 + rate ** years;

// CORRECT
const result = principal * Math.pow(1 + rate, years);


// ERROR 3: Integer Division Issues
// WRONG (in some languages)
const monthlyRate = annualRate / 12; // Could be 0 if integer division

// CORRECT
const monthlyRate = annualRate / 12.0;


// ERROR 4: Floating Point Comparison
// WRONG
if (result === expectedValue) { ... }

// CORRECT
if (Math.abs(result - expectedValue) < 0.01) { ... }


// ERROR 5: Currency Rounding
// WRONG
const displayValue = result; // 1234.567890123

// CORRECT
const displayValue = Math.round(result * 100) / 100; // 1234.57


// ERROR 6: Percentage Input Handling
// WRONG - if user enters "7" meaning 7%
const futureValue = principal * Math.pow(1 + userInput, years); // Uses 7 not 0.07

// CORRECT
const rate = userInput / 100; // Convert 7 to 0.07
const futureValue = principal * Math.pow(1 + rate, years);
```

---

## Validation Report Template

```markdown
# Financial Calculation Validation Report

**Calculator:** [Name]
**Version:** [Version]
**Date:** [Date]
**Validator:** Financial Calculations Validation Skill
**Status:** [Validated / Issues Found / Rejected]

## Formula Verification

| Formula | Standard Reference | Implementation | Verified |
|---------|-------------------|----------------|----------|
| Compound Interest | FV = PV(1+r)^n | ✓ Correct | ✓ |
| Annuity FV | FV = PMT×((1+r)^n-1)/r | ✓ Correct | ✓ |

## Test Case Results

| Test | Input | Expected | Actual | Diff | Pass |
|------|-------|----------|--------|------|------|
| Basic compound | $10k, 7%, 10yr | $19,671.51 | $19,671.51 | $0.00 | ✓ |

## Assumption Audit

| Assumption | Default | Range Allowed | Reasonable | Disclosed |
|------------|---------|---------------|------------|-----------|
| Annual return | 7% | 0-20% | ✓ | ✓ |
| Inflation | 3% | 0-10% | ✓ | ✓ |

## Edge Case Results

| Scenario | Input | Handled | Notes |
|----------|-------|---------|-------|
| Zero principal | $0 | ✓ | Returns contribution growth only |
| Zero rate | 0% | ✓ | Returns sum of contributions |
| Negative input | -$1000 | ✓ | Error message shown |

## Disclosure Compliance

- [x] Estimates disclaimer present
- [x] Not investment advice stated
- [x] Professional consultation recommended
- [x] Assumptions listed
- [x] Limitations documented

## Issues Found

[None / List of issues]

## Recommendations

[Any improvements suggested]

## Sign-off

- [x] Formulas mathematically correct
- [x] Test cases pass
- [x] Edge cases handled
- [x] Disclosures complete
- [x] Ready for production
```
