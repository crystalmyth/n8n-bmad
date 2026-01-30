# How the Agent System Works

This document explains the design and operation of the n8n-BMAD agent system, including how agents are structured, how they collaborate, and how to work with them effectively.

## What Are Agents?

Agents in n8n-BMAD are AI personas specialized for specific roles in workflow development. Each agent has:

- **Identity** - A defined role, expertise areas, and personality
- **Responsibilities** - Specific tasks the agent can help with
- **Templates** - Documents the agent commonly uses
- **Prompts** - Pre-built conversation starters
- **Menu** - Quick actions available via the CLI

Agents are not separate AI models. They are context configurations that shape how an AI assistant (like Claude) responds to your questions.

## Agent Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Agent Definition                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐ │
│  │        Identity          │  │      Responsibilities        │ │
│  │                          │  │                              │ │
│  │  - Role description     │  │  - Core tasks               │ │
│  │  - Expertise areas      │  │  - Processes                │ │
│  │  - Personality traits   │  │  - Outputs                  │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐ │
│  │        Templates         │  │       Collaborators          │ │
│  │                          │  │                              │ │
│  │  - Document templates   │  │  - Related agents           │ │
│  │  - Output formats       │  │  - Handoff points           │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐ │
│  │         Prompts          │  │          Menu               │ │
│  │                          │  │                              │ │
│  │  - Conversation starters│  │  - Quick actions            │ │
│  │  - Guided workflows     │  │  - Keyboard shortcuts       │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## The Agent Catalog

n8n-BMAD includes 13 specialized agents organized by function:

### Orchestration

| Agent | Role | Primary Focus |
|-------|------|---------------|
| n8n-master | Master Orchestrator | Help system, agent routing, framework navigation |

### Product & Planning

| Agent | Role | Primary Focus |
|-------|------|---------------|
| po | Product Owner | Requirements, backlog, acceptance criteria |
| pm | Project Manager | Sprint planning, releases, status tracking |
| sm | Scrum Master | Ceremonies, impediments, team coaching |
| ba | Business Analyst | Process mapping, ROI analysis, stakeholders |

### Technical

| Agent | Role | Primary Focus |
|-------|------|---------------|
| architect | Solution Architect | Design patterns, ADRs, technical decisions |
| developer | Workflow Developer | Implementation, expressions, error handling |
| integration | Integration Specialist | APIs, webhooks, third-party services |
| data-analyst | Data Analyst | Data modeling, transformation logic |

### Quality & Security

| Agent | Role | Primary Focus |
|-------|------|---------------|
| qa | QA Engineer | Test planning, execution, bug reports |
| security | Security Specialist | Reviews, credentials, compliance |

### Operations

| Agent | Role | Primary Focus |
|-------|------|---------------|
| devops | DevOps Engineer | Deployment, environments, incidents |
| tech-writer | Technical Writer | Documentation, runbooks, articles |

## How Agents Work

### Loading an Agent

When you load an agent, the CLI configures the AI context:

```bash
n8n-bmad agent load developer
```

This:
1. Reads the agent definition from `src/core/agents/developer.agent.yaml`
2. Loads the agent's identity, expertise, and prompts
3. Makes the agent's templates and patterns available
4. Presents the agent's menu of actions

### Agent Context

Each agent provides context that shapes AI responses:

```yaml
identity:
  description: |
    You are an expert n8n workflow developer. You implement workflows based on
    specifications, write complex expressions, implement robust error handling,
    and follow best practices for maintainable automation.

  expertise:
    - n8n workflow implementation
    - Expression writing (JavaScript, JMESPath)
    - Node configuration
    - Error handling patterns
    - Data transformation
```

When you ask a question, the AI responds as if it has this expertise and perspective.

### Agent Menus

Each agent has a menu of common actions:

```bash
n8n-bmad agent menu developer
```

```
Developer Agent Menu
====================

[Implementation]
  N - Start new workflow
  E - Edit existing workflow
  T - Configure trigger

[Expressions]
  X - Expression syntax help
  V - Validate expression
  D - Date/time expressions

[Debug]
  R - Test workflow
  L - View execution logs
  B - Debug mode
```

These shortcuts launch common workflows for that agent.

## Agent Routing

The Master Orchestrator (n8n-master) routes you to the right agent based on your request:

```
User: "I need to design a workflow for processing invoices"
           │
           ▼
┌────────────────────┐
│   n8n-master       │
│   (Orchestrator)   │
│                    │
│ Analyzes request:  │
│ "design" + "workflow" │
│                    │
│ Recommends:        │
│ → architect agent  │
└────────────────────┘
           │
           ▼
"Based on your request, I recommend working with the
Solution Architect agent. They can help you design the
workflow architecture before implementation."
```

The routing logic is defined in the agent:

```yaml
routing:
  rules:
    - condition: "design OR architecture OR ADR OR pattern"
      agent: "architect"
      reason: "Architecture decisions"

    - condition: "implement OR code OR expression OR node"
      agent: "developer"
      reason: "Implementation work"
```

## Agent Collaboration

Agents are designed to work together. Each agent knows which other agents it should collaborate with:

```yaml
collaborates_with:
  - agent: "architect"
    relationship: "Design guidance and pattern selection"
  - agent: "qa"
    relationship: "Testing and bug fixes"
  - agent: "devops"
    relationship: "Deployment and environment setup"
```

### Collaboration Patterns

**Sequential Handoff**

Requirements flow through agents in sequence:

```
PO (requirements) → Architect (design) → Developer (implement) → QA (test) → DevOps (deploy)
```

**Parallel Consultation**

Multiple agents contribute to a single task:

```
                  ┌─── Security Agent (security review) ───┐
                  │                                        │
Architect (design) ├─── Developer Agent (feasibility) ────┼──► Final Design
                  │                                        │
                  └─── Integration Agent (API design) ────┘
```

**Iterative Refinement**

Agents loop until quality is achieved:

```
Developer (implement) ←→ QA (test) ←→ Developer (fix)
        ↑                                   │
        └───────────── (iterate) ───────────┘
```

## Working with Agents Effectively

### 1. Start with the Right Agent

Choose the agent that matches your current task:

| If you need to... | Use this agent |
|-------------------|----------------|
| Define what to build | po |
| Design how it works | architect |
| Write the workflow | developer |
| Test the workflow | qa |
| Deploy to production | devops |
| Document the workflow | tech-writer |
| Review security | security |

### 2. Provide Context

Agents work better with context:

```
# Less effective
"Help me with error handling"

# More effective
"I have a webhook workflow that calls an external payment API.
The API sometimes returns 500 errors. How should I handle
retries and notify the team of failures?"
```

### 3. Use Agent Templates

Each agent has templates they commonly use:

```bash
# See templates for the developer agent
n8n-bmad template list --agent developer
```

Generate templates to structure your work:

```bash
n8n-bmad template generate workflow-spec --output ./docs/my-workflow.md
```

### 4. Follow Agent Recommendations

When an agent recommends involving another agent, follow the suggestion:

```
Developer Agent: "For the database schema design, I recommend
consulting with the Data Analyst agent who can help optimize
the data model for your transformation needs."
```

### 5. Use Menu Shortcuts

Agent menus provide quick access to common tasks:

```bash
# Load agent
n8n-bmad agent load qa

# View menu
n8n-bmad agent menu qa

# Execute menu item
# Select P for "Create test plan"
```

## Customizing Agents

You can customize agents for your team's needs.

### Adding Expertise

Extend an agent's expertise in the YAML definition:

```yaml
expertise:
  - n8n workflow implementation
  - Expression writing
  # Add your custom expertise
  - Your company's API standards
  - Your specific integration patterns
```

### Adding Templates

Reference additional templates:

```yaml
templates:
  - templates/n8n-specific/workflow-spec.md
  # Add your custom templates
  - templates/custom/your-team-template.md
```

### Adding Menu Items

Extend the agent menu:

```yaml
menu:
  sections:
    - name: "Custom Actions"
      commands:
        - key: "Y"
          action: "your-custom-action"
          description: "Your custom action"
```

### Creating New Agents

Create a new agent by adding a YAML file to `src/core/agents/`:

```yaml
# my-custom.agent.yaml
agent:
  id: my-custom
  name: "My Custom Agent"
  role: "Custom Role"
  version: "1.0.0"

identity:
  description: |
    Your agent description here.

  expertise:
    - Custom expertise 1
    - Custom expertise 2

responsibilities:
  main_responsibility:
    description: "What this agent does"
    activities:
      - Activity 1
      - Activity 2

# ... rest of configuration
```

Register the agent in `src/core/module.yaml`:

```yaml
agents:
  available_agents:
    - my-custom  # Add your agent
```

## Agent Best Practices

### Do

- Load the appropriate agent for your task
- Provide specific context about your workflow
- Use agent templates for consistency
- Follow agent recommendations for collaboration
- Iterate between agents as needed

### Do Not

- Ask one agent to do another agent's job
- Expect agents to remember previous sessions (they do not persist state)
- Ignore agent recommendations without reason
- Skip agents in the development lifecycle

## Summary

The n8n-BMAD agent system provides:

- **Specialized expertise** through role-specific agents
- **Consistent processes** via agent responsibilities and templates
- **Intelligent routing** through the Master Orchestrator
- **Collaborative workflows** with defined handoff points
- **Extensibility** through YAML configuration

By working with agents, you get contextually appropriate guidance at each stage of workflow development. The system is designed to be a knowledgeable teammate, not a replacement for human judgment.
