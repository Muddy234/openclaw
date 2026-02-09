# Financial GPS - Claude Configuration

This file configures Claude Code for the Financial GPS project and its AI agent team.

## Project Context

Financial GPS is a consumer-facing financial assistance and planning website. The project prioritizes:
- Security (financial data handling)
- Compliance (SEC, FINRA, FTC regulations)
- Accessibility (WCAG 2.1 AA)
- Performance (Core Web Vitals)

## Agent Team

This project uses a 4-agent team structure:

1. **Product Manager** - Strategy, prioritization, orchestration
2. **Frontend Architect** - UI/UX, HTML/CSS/JS, accessibility
3. **Security Analyst** - Security review, vulnerability prevention
4. **Compliance Reviewer** - Regulatory compliance, disclaimers

## Key Files

```
/agents/
├── README.md                      # Agent framework overview
├── product-manager.md             # PM agent specification
├── frontend-architect.md          # Frontend agent specification
├── security-analyst.md            # Security agent specification
├── compliance-reviewer.md         # Compliance agent specification
├── skills-catalog.md              # Available skills reference
├── agent-integration-workflow.md  # How agents work together
├── skills/
│   ├── accessibility-testing.md   # WCAG testing skill
│   ├── financial-calculations-validation.md
│   ├── seo-performance.md
│   └── content-compliance-review.md
└── config/
    ├── mcp-servers.json           # MCP server configuration
    ├── plugin-registry.json       # Plugin assignments
    └── CLAUDE.md                  # This file
```

## Coding Standards

### HTML
- Semantic HTML5 elements
- ARIA attributes where needed
- Single H1 per page
- Proper heading hierarchy

### CSS
- BEM naming convention (.block__element--modifier)
- Mobile-first responsive design
- CSS variables for theming
- Minimum 4.5:1 contrast ratio

### JavaScript
- ES6+ syntax
- Modular architecture
- Input validation required
- No innerHTML with user data

## Security Requirements

CRITICAL - All code must:
- Sanitize user input
- Escape output appropriately
- Avoid eval() and innerHTML
- Use textContent for user data
- Follow OWASP guidelines

## Compliance Requirements

All financial content must include:
- "Not investment advice" disclaimer
- "Estimates only" for projections
- "Past performance" for historical data
- "Consult a professional" recommendation

Prohibited language:
- "Guaranteed returns"
- "Risk-free"
- "You should invest"
- Absolute future predictions

## Accessibility Requirements

All UI must:
- Support keyboard navigation
- Work with screen readers
- Meet WCAG 2.1 AA standards
- Have visible focus indicators
- Include form labels

## Frontend Aesthetics

When creating UI:

<frontend_aesthetics>
Avoid generic "AI slop" aesthetics. Make distinctive, professional frontends.

Typography: Use distinctive fonts for a financial audience. Avoid Inter, Roboto, Arial.
Prefer: IBM Plex Sans, DM Sans, Source Sans 3 for trust; JetBrains Mono for numbers.

Color: Commit to a cohesive palette. Financial apps benefit from:
- Blues (trust, stability)
- Greens (growth, money)
- Neutrals (professionalism)
Use sharp accents sparingly.

Motion: Subtle, purposeful animations. Staggered reveals on load.
Avoid excessive animation that distracts from financial data.

Layout: Clean, scannable layouts. Clear data hierarchy.
Financial dashboards need breathing room and clear visual separation.
</frontend_aesthetics>

## Workflow Reminders

### Before implementing features:
1. Check if Product Manager has created a spec
2. Review existing patterns in /components/
3. Plan for accessibility from the start

### Before submitting code:
1. Run accessibility audit
2. Test keyboard navigation
3. Verify responsive behavior
4. Check for security issues

### For calculators/projections:
1. Verify formulas with Compliance
2. Add all required disclaimers
3. Test with edge cases
4. Document assumptions

## Quick Commands

```bash
# Run accessibility audit (if configured)
npm run a11y

# Run performance audit
npm run lighthouse

# Check for security issues
npm run security-check
```

## Contact

For questions about:
- Agent workflows → See agent-integration-workflow.md
- Available skills → See skills-catalog.md
- Specific agent duties → See individual agent .md files
