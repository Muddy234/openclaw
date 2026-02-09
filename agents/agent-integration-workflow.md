# Agent Integration Workflow

## Overview

This document defines how the four Financial GPS agents work together on common tasks. Each workflow shows the sequence of handoffs, skill invocations, and approval gates.

---

## Agent Capabilities Summary

| Agent | Primary Skills | Receives From | Hands Off To |
|-------|---------------|---------------|--------------|
| **Product Manager** | brainstorming, writing-plans, executing-plans | User | All agents |
| **Frontend Architect** | frontend-design, accessibility-testing, seo-performance | Product Manager | Security, Compliance |
| **Security Analyst** | security-guidance, audit-project, verification | Frontend Architect | Product Manager |
| **Compliance Reviewer** | content-compliance-review, financial-calculations-validation | All agents | Product Manager |

---

## Workflow 1: New Feature Development

### Sequence Diagram

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCT MANAGER                            │
│  Skills: brainstorming, writing-plans                          │
│                                                                 │
│  1. Analyze request                                             │
│  2. Create feature specification                                │
│  3. Define acceptance criteria                                  │
│  4. Prioritize in backlog                                       │
└─────────────────────────────────────────────────────────────────┘
     │
     │ Feature Spec + Requirements
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND ARCHITECT                           │
│  Skills: frontend-design, accessibility-testing, seo-performance│
│                                                                 │
│  1. Review specification                                        │
│  2. Design component architecture                               │
│  3. Implement HTML/CSS/JS                                       │
│  4. Run accessibility audit                                     │
│  5. Optimize performance                                        │
└─────────────────────────────────────────────────────────────────┘
     │
     │ Code + Implementation
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY ANALYST                            │
│  Skills: security-guidance, audit-project                       │
│                                                                 │
│  1. Review code for vulnerabilities                             │
│  2. Check input validation                                      │
│  3. Verify output encoding                                      │
│  4. Audit data handling                                         │
│  5. Approve or request changes                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     │ Security-Approved Code
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPLIANCE REVIEWER                           │
│  Skills: content-compliance-review, financial-calculations      │
│                                                                 │
│  1. Scan for prohibited language                                │
│  2. Verify disclaimers present                                  │
│  3. Validate calculations (if applicable)                       │
│  4. Check regulatory requirements                               │
│  5. Approve or request changes                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     │ Compliance-Approved
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCT MANAGER                            │
│  Skills: executing-plans                                        │
│                                                                 │
│  1. Verify acceptance criteria met                              │
│  2. Final review                                                │
│  3. Approve for deployment                                      │
│  4. Update changelog                                            │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
  DEPLOYED
```

### Handoff Templates

**Product Manager → Frontend Architect:**
```yaml
feature_request:
  name: "[Feature Name]"
  priority: "P0/P1/P2/P3"
  deadline: "YYYY-MM-DD"

specification:
  user_story: "As a [user], I want [feature] so that [benefit]"
  requirements:
    - "[Requirement 1]"
    - "[Requirement 2]"
  acceptance_criteria:
    - "[Criterion 1]"
    - "[Criterion 2]"

design_guidance:
  wireframe: "[Link if available]"
  similar_components: "[Reference existing patterns]"

compliance_notes:
  financial_data: true/false
  disclaimers_needed: "[List]"
  calculations: "[If any]"
```

**Frontend Architect → Security Analyst:**
```yaml
security_review_request:
  feature: "[Feature Name]"
  files_modified:
    - "[File path 1]"
    - "[File path 2]"

user_input_handling:
  form_fields:
    - name: "[Field name]"
      type: "[text/number/email/etc]"
      validation: "[Validation applied]"
  url_parameters: true/false
  local_storage: true/false

dom_manipulation:
  innerhtml_usage: "[Locations]"
  dynamic_content: "[Description]"

data_sensitivity:
  financial_data: true/false
  personal_info: true/false
  stored_data: "[What/where]"

testing_completed:
  - "[Test 1]"
  - "[Test 2]"
```

**Security Analyst → Compliance Reviewer:**
```yaml
compliance_review_request:
  feature: "[Feature Name]"
  security_status: "Approved/Approved with conditions"

content_for_review:
  - type: "[UI text/Calculator/Article]"
    content: "[Text or description]"

calculations_present:
  - name: "[Calculation name]"
    formula: "[Formula used]"
    assumptions: "[List]"

data_handling:
  user_data_collected: "[What]"
  data_storage: "[Where/how]"
  data_usage: "[Purpose]"

security_notes:
  - "[Any relevant security context]"
```

**Compliance Reviewer → Product Manager:**
```yaml
compliance_review_complete:
  feature: "[Feature Name]"
  status: "Approved/Conditional/Rejected"

findings:
  critical: []
  high: []
  medium: []
  low: []

required_changes:
  - "[Change 1]"

disclaimers_added:
  - "[Disclaimer 1]"

compliance_score: 95

ready_for_deployment: true/false
```

---

## Workflow 2: Calculator/Tool Development

### Enhanced Flow for Financial Calculations

```
                         Feature Request
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT MANAGER                            │
│                                                                  │
│  1. Define calculator purpose and scope                          │
│  2. Specify inputs, outputs, and formulas needed                 │
│  3. List required assumptions and their defaults                 │
│  4. Define disclosure requirements                               │
└──────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────────────┐         ┌─────────────────────────────┐
│   FRONTEND ARCHITECT    │         │    COMPLIANCE REVIEWER      │
│                         │         │                             │
│  Implement UI/UX        │         │  PRE-VALIDATE formulas      │
│  - Input forms          │    ◄────│  - Verify calculations      │
│  - Results display      │  Formulas│  - Check assumptions       │
│  - Accessibility        │         │  - Draft disclaimers        │
└─────────────────────────┘         └─────────────────────────────┘
          │                                       │
          │                                       │
          ▼                                       │
┌─────────────────────────┐                       │
│   SECURITY ANALYST      │                       │
│                         │                       │
│  Review implementation  │                       │
│  - Input validation     │                       │
│  - Data handling        │                       │
│  - Client-side security │                       │
└─────────────────────────┘                       │
          │                                       │
          └───────────────────┬───────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE REVIEWER                           │
│            Skill: financial-calculations-validation              │
│                                                                  │
│  FINAL VALIDATION:                                               │
│  1. Test calculations against known values                       │
│  2. Verify edge cases handled                                    │
│  3. Confirm all disclaimers present                              │
│  4. Validate assumption disclosures                              │
│  5. Check for prohibited language                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT MANAGER                            │
│                                                                  │
│  1. User acceptance testing                                      │
│  2. Verify requirements met                                      │
│  3. Final approval                                               │
└──────────────────────────────────────────────────────────────────┘
```

### Calculator Development Checklist

```markdown
## Calculator Development Checklist

### Product Manager (Specification)
- [ ] Purpose clearly defined
- [ ] Target user identified
- [ ] Inputs specified with valid ranges
- [ ] Outputs defined
- [ ] Formulas documented
- [ ] Default assumptions listed
- [ ] Disclosure requirements noted

### Compliance Pre-Validation (Formulas)
- [ ] Formulas mathematically verified
- [ ] Assumptions deemed reasonable
- [ ] Required disclaimers drafted
- [ ] No investment advice language
- [ ] Historical data sources cited

### Frontend Architect (Implementation)
- [ ] UI implemented per spec
- [ ] Inputs validated client-side
- [ ] Results displayed clearly
- [ ] Assumptions visible with results
- [ ] Disclaimers integrated
- [ ] Accessibility audit passed
- [ ] Responsive design verified

### Security Analyst (Review)
- [ ] Input validation complete
- [ ] No injection vulnerabilities
- [ ] Data handled securely
- [ ] No sensitive data exposure
- [ ] Code review approved

### Compliance Final Validation
- [ ] Test cases pass with known values
- [ ] Edge cases handled appropriately
- [ ] All disclaimers present and visible
- [ ] No prohibited language
- [ ] Methodology documented
- [ ] Compliance score ≥90

### Product Manager (Approval)
- [ ] Acceptance criteria met
- [ ] User testing complete
- [ ] Ready for deployment
```

---

## Workflow 3: Content Publication

### Content Review Flow

```
                       New Content Draft
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT MANAGER                            │
│                                                                  │
│  1. Review content against strategy                              │
│  2. Check alignment with user needs                              │
│  3. Verify topic accuracy                                        │
│  4. Initial approval for review                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE REVIEWER                           │
│            Skill: content-compliance-review                      │
│                                                                  │
│  AUTOMATED SCAN:                                                 │
│  1. Prohibited language detection                                │
│  2. Required disclaimer verification                             │
│  3. Claim substantiation check                                   │
│  4. E-E-A-T elements verification                                │
│                                                                  │
│  Output: Compliance score + required fixes                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              Score ≥90            Score <90
              No critical          Issues found
                    │                   │
                    │                   ▼
                    │         ┌─────────────────┐
                    │         │ Return to       │
                    │         │ author with     │
                    │         │ specific fixes  │
                    │         └────────┬────────┘
                    │                  │
                    │                  │ Revisions made
                    │                  │
                    │         ◄────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND ARCHITECT                           │
│              Skill: seo-performance                              │
│                                                                  │
│  1. SEO optimization (meta tags, schema)                         │
│  2. Accessibility check                                          │
│  3. Performance optimization                                     │
│  4. Mobile responsiveness                                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT MANAGER                            │
│                                                                  │
│  1. Final review                                                 │
│  2. Schedule publication                                         │
│  3. Publish                                                      │
│  4. Monitor performance                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Workflow 4: Bug Fix / Hotfix

### Expedited Review Process

```
                         Bug Report
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT MANAGER                            │
│                                                                  │
│  1. Assess severity and impact                                   │
│  2. Determine if hotfix needed                                   │
│  3. Assign priority                                              │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
         Critical/High                  Medium/Low
         (Hotfix path)               (Standard path)
              │                               │
              ▼                               │
┌─────────────────────────┐                   │
│  FRONTEND ARCHITECT     │                   │
│                         │                   │
│  1. Identify root cause │                   │
│  2. Implement fix       │                   │
│  3. Minimal testing     │                   │
└─────────────────────────┘                   │
              │                               │
              ▼                               │
┌─────────────────────────┐                   │
│  SECURITY ANALYST       │                   │
│                         │                   │
│  EXPEDITED REVIEW:      │                   │
│  - Security impact only │                   │
│  - 15-minute turnaround │                   │
└─────────────────────────┘                   │
              │                               │
              ▼                               │
┌─────────────────────────┐                   │
│  COMPLIANCE REVIEWER    │                   │
│  (If content affected)  │                   │
│                         │                   │
│  EXPEDITED REVIEW:      │                   │
│  - Automated scan only  │                   │
│  - 15-minute turnaround │                   │
└─────────────────────────┘                   │
              │                               │
              ▼                               │
         DEPLOY HOTFIX ◄──────────────────────┘
              │                               (Goes through
              │                                standard flow)
              ▼
    POST-DEPLOYMENT REVIEW
    (Full review within 24 hours)
```

---

## Workflow 5: Quarterly Audit

### Comprehensive Review Cycle

```
                      Quarterly Trigger
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    SECURITY     │ │   COMPLIANCE    │ │    FRONTEND     │
│    ANALYST      │ │   REVIEWER      │ │   ARCHITECT     │
│                 │ │                 │ │                 │
│ Full security   │ │ Full content    │ │ Performance     │
│ audit:          │ │ audit:          │ │ audit:          │
│ - Vulnerability │ │ - All pages     │ │ - Core Vitals   │
│   scan          │ │ - All calcs     │ │ - SEO rankings  │
│ - Dependency    │ │ - Disclaimers   │ │ - Accessibility │
│   check         │ │ - Regulations   │ │ - Mobile        │
│ - Code review   │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       PRODUCT MANAGER                            │
│                                                                  │
│  1. Consolidate audit findings                                   │
│  2. Prioritize remediation items                                 │
│  3. Create remediation plan                                      │
│  4. Schedule fixes in upcoming sprints                           │
│  5. Report to stakeholders                                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Parallel Processing Guidelines

### When Agents Can Work in Parallel

```
PARALLEL ALLOWED:
┌─────────────────┐     ┌─────────────────┐
│ Security Audit  │     │ Compliance Scan │
│ (code review)   │     │ (content check) │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              Both complete
                     │
                     ▼
         ┌───────────────────┐
         │ Product Manager   │
         │ consolidates      │
         └───────────────────┘

PARALLEL ALLOWED:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ A11y Testing    │     │ SEO Audit       │     │ Performance     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                         All complete
                                 │
                     ┌───────────────────┐
                     │ Frontend Architect│
                     │ consolidates      │
                     └───────────────────┘
```

### When Sequential Processing Required

```
SEQUENTIAL REQUIRED:

1. Code Implementation → Security Review
   (Security must review actual code)

2. Security Approval → Compliance Review
   (Compliance assumes code is secure)

3. All Reviews → Deployment
   (Cannot deploy without all approvals)

4. Compliance Pre-validation → Calculator Implementation
   (Formulas must be verified before coding)
```

---

## Communication Protocol

### Status Updates

Each agent should provide status updates in this format:

```yaml
status_update:
  agent: "[Agent Name]"
  task: "[Task/Feature Name]"
  status: "In Progress/Blocked/Complete/Needs Review"
  progress: "XX%"
  blockers:
    - "[Blocker 1 if any]"
  next_steps:
    - "[Next step 1]"
  eta: "YYYY-MM-DD HH:MM"
  handoff_ready: true/false
```

### Escalation Path

```
Issue Severity → Escalation Action

CRITICAL (Security breach, legal risk):
  └→ Immediate escalation to Product Manager
  └→ All work stops until resolved
  └→ Notify stakeholders

HIGH (Blocks deployment, major bug):
  └→ Same-day escalation to Product Manager
  └→ Prioritize in current sprint
  └→ Daily updates

MEDIUM (Impacts quality, minor bug):
  └→ Include in next standup
  └→ Schedule for current/next sprint
  └→ Weekly updates

LOW (Enhancement, minor improvement):
  └→ Add to backlog
  └→ Prioritize during planning
  └→ Address when capacity allows
```

---

## Integration with Skills

### Skill Invocation by Workflow Step

| Workflow Step | Agent | Skills Invoked |
|--------------|-------|----------------|
| Feature Planning | Product Manager | brainstorming, writing-plans |
| UI Implementation | Frontend Architect | frontend-design, frontend-aesthetics |
| A11y Check | Frontend Architect | accessibility-testing |
| SEO Optimization | Frontend Architect | seo-performance |
| Security Review | Security Analyst | security-guidance, audit-project |
| Content Check | Compliance Reviewer | content-compliance-review |
| Calc Validation | Compliance Reviewer | financial-calculations-validation |
| Deployment | Product Manager | executing-plans, changelog-generator |

### Skill Dependencies

```
frontend-design
     │
     └──► accessibility-testing (always follows)
     │
     └──► seo-performance (for public pages)

content-compliance-review
     │
     └──► financial-calculations-validation (if calculator)

security-guidance
     │
     └──► audit-project (for major features)
```
