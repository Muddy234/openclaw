# Skills Catalog for Financial GPS Agents

A curated collection of skills, plugins, and MCP servers to enhance the capabilities of your AI agent team.

---

## Skills by Agent

### Product Manager

| Skill | Source | Purpose |
|-------|--------|---------|
| **brainstorming** | [obra/superpowers](https://github.com/obra/superpowers) | Socratic design refinement through conversation |
| **writing-plans** | [obra/superpowers](https://github.com/obra/superpowers) | Detailed implementation plans with bite-sized tasks |
| **executing-plans** | [obra/superpowers](https://github.com/obra/superpowers) | Batch execution with human checkpoints |
| **dispatching-parallel-agents** | [obra/superpowers](https://github.com/obra/superpowers) | Concurrent subagent workflows |
| **changelog-generator** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Transform commits into customer-friendly release notes |
| **documentation-generator** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Create READMEs, API docs, and guides from code |

---

### Frontend Architect

| Skill | Source | Purpose |
|-------|--------|---------|
| **frontend-design** | [Claude Code Plugins](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) | Distinctive, production-grade interfaces |
| **frontend-aesthetics** | [Claude Cookbooks](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb) | Typography, color, motion, and visual refinement |
| **senior-frontend** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | React/Next.js patterns with accessibility practices |
| **artifacts-builder** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Multi-component HTML with React, Tailwind, shadcn/ui |
| **theme-factory** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | 10 professional themes for various outputs |
| **test-driven-development** | [obra/superpowers](https://github.com/obra/superpowers) | RED-GREEN-REFACTOR cycle |
| **systematic-debugging** | [obra/superpowers](https://github.com/obra/superpowers) | 4-phase root cause analysis |

---

### Security Analyst

| Skill | Source | Purpose |
|-------|--------|---------|
| **security-guidance** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | OWASP guidelines and secure coding practices |
| **audit-project** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Comprehensive audits: code quality, deps, security |
| **code-review** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Best practices and improvement suggestions |
| **verification-before-completion** | [obra/superpowers](https://github.com/obra/superpowers) | Validates fixes are actually resolved |
| **subagent-driven-development** | [obra/superpowers](https://github.com/obra/superpowers) | Two-stage review (spec compliance, code quality) |

---

### Compliance Reviewer

| Skill | Source | Purpose |
|-------|--------|---------|
| **requesting-code-review** | [obra/superpowers](https://github.com/obra/superpowers) | Pre-review assessment checklist |
| **receiving-code-review** | [obra/superpowers](https://github.com/obra/superpowers) | Feedback incorporation process |
| **documentation-generator** | [awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Generate compliance documentation |

---

## High-Priority Skills to Implement

### 1. Frontend Aesthetics Prompt (Frontend Architect)

Add to system prompt to avoid generic "AI slop" designs:

```xml
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design,
this creates what users call the "AI slop" aesthetic. Avoid this: make creative,
distinctive frontends that surprise and delight.

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic
fonts like Arial and Inter; opt instead for distinctive choices.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency.
Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

Motion: Use animations for effects and micro-interactions. Focus on high-impact
moments: one well-orchestrated page load with staggered reveals creates more
delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors.
Layer CSS gradients, use geometric patterns, or add contextual effects.

Avoid:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
</frontend_aesthetics>
```

### 2. Financial Domain Typography (Frontend Architect)

For financial applications, prefer these font pairings:

```
TRUST & AUTHORITY:
- Headers: IBM Plex Sans, Source Sans 3, DM Sans
- Body: Source Serif Pro, Crimson Pro, Newsreader

MODERN FINTECH:
- Headers: Clash Display, Cabinet Grotesk, Satoshi
- Body: Inter (acceptable here), DM Sans, Plus Jakarta Sans

DATA-HEAVY DASHBOARDS:
- Numbers: JetBrains Mono, Fira Code, IBM Plex Mono
- Labels: DM Sans, Source Sans 3
```

### 3. Accessibility Testing Automation (Frontend Architect + Compliance Reviewer)

Integrate automated WCAG testing into development workflow:

```
AUTOMATED CHECKS (First-line quality gate):
- Run on every pull request
- Use multiple engines in parallel (axe-core, WAVE, Pa11y)
- Detect structural WCAG failures before manual review

MANUAL REVIEW REQUIRED FOR:
- Keyboard navigation flow
- Screen reader experience
- Color contrast in context
- Cognitive accessibility
- Focus management

IMPORTANT: Automated testing catches ~30-40% of issues.
Human expertise remains essential for comprehensive compliance.
```

---

## MCP Servers to Consider

| MCP Server | Use Case | Agent |
|------------|----------|-------|
| **Playwright** | E2E testing via natural language | Frontend Architect |
| **Figma** | Design-to-code accuracy | Frontend Architect |
| **GitHub** | PR management, code review | All Agents |
| **File System** | Local file operations | All Agents |
| **Sequential Thinking** | Complex reasoning chains | Product Manager |
| **Memory Bank** | Persistent context across sessions | All Agents |
| **Notion** | Documentation, specs, wiki | Product Manager |

---

## Recommended Plugin Collections

### 1. [jeremylongshore/claude-code-plugins-plus-skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills)
- 270+ plugins with 739 agent skills
- Production orchestration patterns
- Interactive tutorials (11 Jupyter notebooks)
- CCPI package manager

### 2. [ComposioHQ/awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins)
- Curated list of quality plugins
- Custom commands, agents, hooks
- MCP server integrations

### 3. [obra/superpowers](https://github.com/obra/superpowers)
- Development workflow skills
- Testing and debugging patterns
- Collaboration protocols

### 4. [openskills.space](https://openskills.space)
- 145,000+ agent skills catalog
- Intelligent filtering by category
- Community contributions

### 5. [skills.sh](https://skills.sh)
- Claude skills reference
- Plugin documentation

---

## Financial-Specific Considerations

### Security Framework (2026 Standards)

Based on [AI Agent Security research](https://www.cyberark.com/resources/blog/whats-shaping-the-ai-agent-security-market-in-2026):

```
ZERO TRUST ARCHITECTURE:
- Every agent action authenticated
- Data encryption at rest and in transit
- Network isolation to prevent lateral movement

JUST-IN-TIME PERMISSIONS:
- Agents get access only to required tools
- Specific tasks, time-limited access
- Human approval for sensitive actions

HUMAN-IN-THE-LOOP:
- Critical financial decisions require validation
- AI augments, not replaces, expert oversight
- High-risk decisions get appropriate scrutiny
```

### Compliance Priorities (2026)

Based on [Financial Services AI Compliance research](https://fintech.global/2026/01/08/ai-regulatory-compliance-priorities-financial-institutions-face-in-2026/):

```
KEY REQUIREMENTS:
- Explainable AI models for financial decisions
- Bias and fairness monitoring through periodic audits
- Role-based access controls (ISO 27001, SOC 2)
- Human oversight for credit approvals, regulatory reports

API FOUNDATION:
- Standardized interfaces
- Proper authentication
- Rate limiting
- Governance in place
```

---

## Installation Guide

### Installing Skills via OpenSkills

```bash
# Install the openskills CLI
npm i -g openskills

# Search for skills
npx skills search "frontend design"

# Install a skill
npx skills install <skill-name>
```

### Adding Skills to Claude Code

1. Create a `.claude/skills/` directory in your project
2. Add skill markdown files (SKILL.md format)
3. Reference in your CLAUDE.md or agent prompts

### Plugin Installation

```bash
# Clone plugin repository
git clone https://github.com/ComposioHQ/awesome-claude-plugins

# Navigate to desired plugin
cd awesome-claude-plugins/plugins/<plugin-name>

# Follow plugin-specific installation instructions
```

---

## Quick Reference: Skill Sources

| Source | URL | Focus |
|--------|-----|-------|
| Claude Code Plugins | [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) | Official Anthropic plugins |
| Superpowers | [github.com/obra/superpowers](https://github.com/obra/superpowers) | Development workflows |
| Awesome Claude Plugins | [github.com/ComposioHQ/awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | Curated community plugins |
| OpenSkills | [openskills.space](https://openskills.space) | Skill marketplace |
| Skills.sh | [skills.sh](https://skills.sh) | Skill reference |
| Claude Cookbooks | [github.com/anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) | Prompting techniques |

---

## Next Steps

1. **Prioritize**: Select 2-3 skills per agent to implement first
2. **Test**: Integrate skills in isolated environment
3. **Iterate**: Refine prompts based on output quality
4. **Document**: Update agent specifications with new capabilities
