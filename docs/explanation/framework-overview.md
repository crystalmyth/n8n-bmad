# Framework Overview

This document explains the philosophy, design principles, and architecture behind the n8n-BMAD framework.

## What is n8n-BMAD?

n8n-BMAD (**B**uild **M**ore **A**utomations **D**aily) is a methodology framework that brings structured, AI-assisted development practices to n8n workflow automation teams. It is inspired by the [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) and adapted specifically for the unique challenges of workflow automation.

## Core Philosophy

### 1. Workflows Are Software

n8n workflows are software that deserves the same rigor as traditional code:

- **Version control** - Workflows should be tracked in Git
- **Code review** - Changes should be reviewed before deployment
- **Testing** - Workflows need test plans and validation
- **Documentation** - Workflows require operational runbooks
- **Deployment pipelines** - Changes should flow through environments

n8n-BMAD provides the templates, patterns, and processes to treat workflows as first-class software artifacts.

### 2. Roles Enable Expertise

Different aspects of workflow development require different expertise:

- Product requirements need product thinking
- Architecture needs systems thinking
- Implementation needs n8n expertise
- Testing needs quality assurance skills
- Operations needs reliability engineering

n8n-BMAD provides specialized AI agent personas for each role, ensuring you get contextually appropriate guidance.

### 3. Patterns Prevent Problems

Many workflow challenges have known solutions:

- Error handling patterns prevent silent failures
- Integration patterns solve common API challenges
- Data transformation patterns handle complex mappings
- Scheduling patterns manage timing requirements

n8n-BMAD provides a library of battle-tested patterns you can adapt to your needs.

### 4. Consistency Enables Scaling

As teams grow, consistency becomes critical:

- Naming conventions make workflows discoverable
- Documentation templates ensure completeness
- Quality checklists maintain standards
- Validation tools enforce rules

n8n-BMAD provides the tooling to maintain consistency across teams and projects.

## Framework Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        n8n-BMAD Framework                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Agents    │  │  Templates  │  │  Patterns   │             │
│  │             │  │             │  │             │             │
│  │ - PO        │  │ - Project   │  │ - Error     │             │
│  │ - Architect │  │ - Agile     │  │ - Integration│             │
│  │ - Developer │  │ - Ops       │  │ - Transform │             │
│  │ - QA        │  │ - Testing   │  │ - Scheduling│             │
│  │ - DevOps    │  │ - Security  │  │             │             │
│  │ - ...       │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       CLI Tools                          │    │
│  │                                                          │    │
│  │  n8n-bmad init | agent | template | pattern | validate  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     MCP Integration                      │    │
│  │                                                          │    │
│  │       AI Assistants ←→ n8n Instance ←→ Filesystem       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Design Principles

### Modular and Composable

Each component of n8n-BMAD is independent and can be used separately:

- Use just the templates without agents
- Use just the patterns without the CLI
- Use just the validation without MCP

This allows teams to adopt incrementally.

### n8n Native

n8n-BMAD is designed specifically for n8n:

- Patterns use n8n node configurations
- Validation checks n8n-specific best practices
- Templates reference n8n concepts
- CLI integrates with n8n API

It is not a generic automation framework adapted to n8n; it is built for n8n from the ground up.

### AI-Augmented, Not AI-Replaced

AI agents provide guidance and assistance, but humans remain in control:

- Agents suggest; they do not decide
- Patterns are templates, not rigid rules
- Validation flags issues; it does not auto-fix
- Documentation assists; it does not replace expertise

The goal is to amplify human capabilities, not replace them.

### Convention Over Configuration

n8n-BMAD provides sensible defaults:

- Standard naming conventions
- Recommended project structure
- Default validation rules
- Standard template formats

Teams can customize everything, but starting with conventions reduces decisions and increases consistency.

## The Development Lifecycle

n8n-BMAD supports the full workflow development lifecycle:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ IDEATE   │ →  │  DESIGN  │ →  │  BUILD   │ →  │   TEST   │
│          │    │          │    │          │    │          │
│ PO Agent │    │ Architect│    │ Developer│    │ QA Agent │
│ BA Agent │    │ Agent    │    │ Agent    │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                     │
    ┌────────────────────────────────────────────────┘
    │
    ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│  DEPLOY  │ →  │ OPERATE  │ →  │ ITERATE  │
│          │    │          │    │          │
│ DevOps   │    │ DevOps   │    │ All      │
│ Agent    │    │ Agent    │    │ Agents   │
└──────────┘    └──────────┘    └──────────┘
```

### 1. Ideate

Define what needs to be automated:

- **Product Owner Agent** - Requirements and acceptance criteria
- **Business Analyst Agent** - Process mapping and ROI analysis
- **Templates** - PRD, user stories, process maps

### 2. Design

Plan how the automation will work:

- **Solution Architect Agent** - Workflow architecture and patterns
- **Security Agent** - Security requirements
- **Templates** - ADR, solution design, integration spec

### 3. Build

Implement the workflow:

- **Developer Agent** - Implementation guidance
- **Integration Agent** - API and webhook configuration
- **Data Analyst Agent** - Data transformation logic
- **Patterns** - Error handling, integration, data transformation

### 4. Test

Validate the workflow works correctly:

- **QA Agent** - Test planning and execution
- **Templates** - Test plan, test cases, bug reports
- **Tools** - Expression validation, workflow review

### 5. Deploy

Move the workflow to production:

- **DevOps Agent** - Deployment and environment management
- **Templates** - Runbook, change request, rollback procedure
- **Tools** - Workflow export, validation

### 6. Operate

Run and maintain the workflow:

- **DevOps Agent** - Monitoring and incident response
- **Templates** - Incident report, post-mortem
- **Patterns** - Error notification, circuit breaker

### 7. Iterate

Improve based on learnings:

- All agents participate in retrospectives
- Templates updated based on experience
- Patterns refined based on production use

## Integration Points

### n8n API Integration

n8n-BMAD connects to your n8n instance via the n8n API:

```yaml
n8n:
  instance_url: http://localhost:5678
  api_key: ${N8N_API_KEY}
```

This enables:
- Workflow export and import
- Workflow activation/deactivation
- Execution history access
- Credential management (read-only)

### MCP Integration

Model Context Protocol (MCP) allows AI assistants to interact with n8n:

```json
{
  "servers": {
    "n8n-bmad": {
      "command": "n8n-bmad",
      "args": ["mcp-server"]
    }
  }
}
```

This enables AI assistants to:
- List and read workflows
- Suggest patterns based on context
- Validate expressions
- Generate documentation

### Filesystem Integration

n8n-BMAD manages project files:

```
project/
├── n8n-bmad.config.yaml    # Project configuration
├── docs/                   # Documentation
├── exports/                # Workflow exports
├── backups/                # Workflow backups
└── reports/                # Validation reports
```

## Comparison with Other Approaches

### vs. Manual Development

| Aspect | Manual | n8n-BMAD |
|--------|--------|----------|
| Consistency | Variable | Enforced via conventions |
| Documentation | Often missing | Templates ensure completeness |
| Error handling | Ad-hoc | Proven patterns |
| Knowledge sharing | Tribal | Codified in agents/templates |
| Quality | Depends on individual | Validation ensures standards |

### vs. Generic Automation Frameworks

| Aspect | Generic | n8n-BMAD |
|--------|---------|----------|
| n8n integration | Adapted | Native |
| Expression validation | No | Yes |
| Node-specific patterns | No | Yes |
| n8n API support | No | Yes |
| Learning curve | Requires translation | Direct application |

## When to Use n8n-BMAD

n8n-BMAD is particularly valuable when:

- Your team is scaling beyond 2-3 developers
- You have production workflows that need reliability
- You want to establish consistent practices
- You are onboarding new team members
- You are building complex, multi-system integrations
- You need audit trails and documentation

n8n-BMAD may be overkill when:

- You are building one-off personal automations
- Your workflow is a simple two-node connection
- You are just experimenting with n8n

## Summary

n8n-BMAD brings professional software development practices to n8n workflow automation. By providing specialized agents, reusable patterns, comprehensive templates, and validation tooling, it helps teams build reliable automations at scale.

The framework is designed to be:
- **Modular** - Adopt what you need
- **n8n-native** - Built specifically for n8n
- **AI-augmented** - Assistants, not replacements
- **Convention-driven** - Sensible defaults, customizable when needed

Whether you are a solo developer wanting more structure or a team needing to scale, n8n-BMAD provides the methodology to build more automations daily.
