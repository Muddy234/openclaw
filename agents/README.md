# Financial GPS - AI Agents Framework

## Overview

This framework defines the AI agent team responsible for developing and maintaining the Financial GPS consumer-facing website. Each agent has specific responsibilities, prompts, and workflows designed to ensure quality, security, and compliance.

## Agent Roster

| Agent | Primary Domain | Status |
|-------|---------------|--------|
| [Product Manager](./product-manager.md) | Strategy, oversight, competitive analysis | Active |
| [Frontend Architect](./frontend-architect.md) | HTML/CSS/JS, UI components, responsive design | Active |
| [Security Analyst](./security-analyst.md) | Security hardening, vulnerability prevention | Active |
| [Compliance Reviewer](./compliance-reviewer.md) | Financial regulations, legal requirements | Active |

## Workflow Hierarchy

```
                    ┌─────────────────────┐
                    │   Product Manager   │
                    │   (Orchestrator)    │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    Frontend      │ │    Security      │ │   Compliance     │
│    Architect     │ │    Analyst       │ │   Reviewer       │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Communication Protocol

1. **Product Manager** initiates feature requests and prioritization
2. **Frontend Architect** implements UI/UX changes
3. **Security Analyst** reviews all code changes before deployment
4. **Compliance Reviewer** validates content and functionality against regulations

## Skills & Enhancements

See [skills-catalog.md](./skills-catalog.md) for a comprehensive collection of:
- Skills mapped to each agent
- MCP server integrations
- Plugin collections
- Financial-specific security and compliance requirements

### Custom Skills (Project-Specific)

| Skill | Agent | Description |
|-------|-------|-------------|
| [accessibility-testing](./skills/accessibility-testing.md) | Frontend Architect | WCAG 2.1 AA compliance testing |
| [financial-calculations-validation](./skills/financial-calculations-validation.md) | Compliance Reviewer | Formula verification and accuracy |
| [seo-performance](./skills/seo-performance.md) | Frontend Architect | SEO and Core Web Vitals optimization |
| [content-compliance-review](./skills/content-compliance-review.md) | Compliance Reviewer | Automated disclaimer checking |

### Agent Integration

See [agent-integration-workflow.md](./agent-integration-workflow.md) for:
- Feature development workflow
- Calculator/tool development process
- Content publication flow
- Bug fix/hotfix procedures
- Quarterly audit process

### Configuration

| File | Purpose |
|------|---------|
| [config/CLAUDE.md](./config/CLAUDE.md) | Claude Code project configuration |
| [config/mcp-servers.json](./config/mcp-servers.json) | MCP server setup |
| [config/plugin-registry.json](./config/plugin-registry.json) | Plugin assignments by agent |

## Quick Start

Each agent file contains:
- **Role Definition**: Core identity and expertise
- **Responsibilities**: Specific duties and ownership areas
- **System Prompt**: Ready-to-use prompt for AI implementation
- **Workflows**: Step-by-step processes for common tasks
- **Handoff Protocols**: How to communicate with other agents

## Integration with Financial GPS

These agents are configured for the Financial GPS project structure:
- `/index.html` - Main entry point
- `/components/` - UI components (dashboard, inputCards, fireJourney)
- `/js/` - Core logic (app, store, projections, constants, strategy)
- `/css/` - Styling
