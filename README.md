# n8n-BMAD Framework

> **B**uild **M**ore **A**utomations **D**aily - An AI-powered methodology framework for n8n workflow automation teams

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-workflow%20automation-orange)](https://n8n.io)

## Overview

n8n-BMAD brings structured AI-assisted development methodology to workflow automation. Inspired by the [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD), this framework provides:

- **15 Specialized AI Agent Personas** - From Product Owner to DevOps Engineer, plus Quick Flow and Prompt Engineer
- **Scale-Adaptive Intelligence** - Auto-adjusts ceremony based on project complexity
- **Agent + Skill Invocation** - Self-documenting `/n8n:agent *skill` syntax
- **25+ Workflow Definitions** - Multi-agent orchestration across the full SDLC
- **7 Handler Components** - Reusable patterns for validation, expressions, errors
- **37 Document Templates** - PRDs, ADRs, runbooks, test plans, and more
- **Party Mode** - Multi-agent collaboration for complex decisions
- **Quick Flow** - Lightweight solo-developer workflow with session persistence
- **Full CLI Tooling** - Initialize, validate, and manage your n8n projects
- **MCP Integration** - Connect AI assistants directly to your n8n instance
- **Node Discovery** - Discover custom nodes installed on your n8n instance

## Quick Start

> **New here?** See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute guide.

### Essential Workflow (The Only 5 Commands You Need)

| Skill | What It Does | When to Use |
|-------|--------------|-------------|
| `*create-prd` | Create PRD | Start any project (auto-scales) |
| `*create-architecture` | Create Architecture | After requirements |
| `*create-story` | Create Story | Break work into tasks |
| `*dev-story` | Dev Story | Implement a story |
| `*code-review` | Code Review | Before shipping |

**The Flow:** `/n8n:pm *create-prd` → `/n8n:arch *create-architecture` → `/n8n:po *create-story` → `/n8n:dev *dev-story` → `/n8n:qa *code-review`

```bash
# Start a project
/n8n:pm *create-prd
```

### Installation

```bash
# Install globally
npm install -g n8n-bmad

# Or use npx
npx n8n-bmad init
```

### Initialize a Project

```bash
# Interactive setup
n8n-bmad init

# Or with options
n8n-bmad init --name "my-automation-project" --url "http://localhost:5678/api/v1"
```

The setup will prompt for your n8n API key and create the project structure in `.n8n-bmad/`.

### Use an Agent

```bash
# List available agents
n8n-bmad agent list

# Load a specific agent
n8n-bmad agent load architect

# Get agent-specific help
n8n-bmad agent menu architect
```

### Work with Templates

```bash
# List all templates
n8n-bmad template list

# Generate from template
n8n-bmad template generate workflow-spec --output ./docs/my-workflow.md
```

### Validate Workflows

```bash
# Validate a workflow file
n8n-bmad validate workflow ./my-workflow.json

# Validate all workflows in directory
n8n-bmad validate workflow ./workflows/

# Check naming conventions
n8n-bmad validate naming ./workflows/
```

## Project Structure

When you initialize a project with `n8n-bmad init`, the following structure is created:

```
my-project/
├── .mcp.json                    # MCP config (project root)
├── .claude/commands/n8n/        # Claude Code slash commands
│   ├── master.md
│   ├── dev.md
│   └── ...
└── .n8n-bmad/                   # Framework files
    ├── src/core/
    │   ├── agents/              # AI agent persona definitions
    │   └── module.yaml          # Framework configuration
    ├── templates/               # Document templates
    ├── patterns/                # Reusable workflow patterns
    ├── reference/               # Technical reference docs
    └── .env                     # Environment variables
```

### Framework Source Structure

The n8n-BMAD package itself contains:

```
n8n-bmad/
├── src/core/
│   ├── agents/          # AI agent persona definitions
│   ├── workflows/       # BMAD workflow processes
│   └── tasks/           # Task definitions (XML)
├── templates/           # Document templates
│   ├── project/         # PRD, charter, brief
│   ├── agile/           # Epics, stories, retrospectives
│   ├── architecture/    # ADRs, solution designs
│   ├── operations/      # Runbooks, incident reports
│   ├── testing/         # Test plans, test cases
│   ├── n8n-specific/    # Workflow specs, credentials
│   └── security/        # Security assessments
├── patterns/            # Reusable n8n workflow patterns
│   ├── error-handling/  # Retry, DLQ, circuit breaker
│   ├── integration/     # API, webhook, database
│   ├── data-transformation/  # Batch, pagination
│   └── scheduling/      # Cron, polling patterns
├── reference/           # Technical reference docs
│   ├── expressions/     # n8n expression guides
│   ├── nodes/           # Node documentation
│   └── conventions/     # Naming, versioning
├── docs/                # User documentation (Diataxis)
│   ├── tutorials/       # Learning-oriented
│   ├── how-to/          # Problem-solving
│   ├── explanation/     # Understanding
│   └── reference/       # Information
└── tools/cli/           # CLI implementation
```

## Agent Personas

| Agent | Role | Primary Functions |
|-------|------|-------------------|
| **n8n-master** | Orchestrator | Help system, agent routing |
| **po** | Product Owner | Requirements, backlog, acceptance criteria |
| **pm** | Project Manager | Epic planning, releases, status |
| **sm** | Scrum Master | Ceremonies, impediments, coaching |
| **architect** | Solution Architect | Design patterns, ADRs, technical decisions |
| **developer** | Workflow Developer | Implementation, expressions, error handling |
| **qa** | QA Engineer | Test planning, execution, bug reports |
| **devops** | DevOps Engineer | Pipelines, environments, incidents |
| **ba** | Business Analyst | Process mapping, ROI analysis |
| **security** | Security Specialist | Reviews, credentials, compliance |
| **integration** | Integration Specialist | APIs, webhooks, third-party |
| **data-analyst** | Data Analyst | Data modeling, transformation |
| **tech-writer** | Technical Writer | Documentation, runbooks |
| **prompt-engineer** | Prompt Engineer | AI/LLM workflow design |
| **quick-flow** | Quick Flow Solo Dev | Lightweight implementation |

## Claude Code Integration

When you initialize a project, slash commands are automatically generated for Claude Code in `.claude/commands/n8n/`. These commands provide quick access to each agent persona.

### Available Slash Commands

| Command | Agent | Description |
|---------|-------|-------------|
| `/n8n-master` | n8n-master | Help system, agent routing |
| `/n8n-dev` | developer | Workflow implementation |
| `/n8n-architect` | architect | Solution design, ADRs |
| `/n8n-po` | po | Requirements, backlog |
| `/n8n-pm` | pm | Epic planning, releases |
| `/n8n-qa` | qa | Test planning, execution |
| `/n8n-devops` | devops | Pipelines, incidents |
| `/n8n-ba` | ba | Process mapping, ROI |
| `/n8n-security` | security | Reviews, compliance |
| `/n8n-integration` | integration | APIs, webhooks |
| `/n8n-data` | data-analyst | Data modeling |
| `/n8n-docs` | tech-writer | Documentation |

### Command Alias Mapping

Commands are auto-generated from agent YAML definitions. The mapping uses these conventions:

- `developer` → `dev`
- `data-analyst` → `data`
- `tech-writer` → `docs`
- Other agents use their YAML filename directly

## Workflow Patterns

Ready-to-use n8n workflow patterns:

### Error Handling
- **Retry with Backoff** - Exponential retry for transient failures
- **Dead Letter Queue** - Capture and process failed items
- **Circuit Breaker** - Prevent cascade failures
- **Error Notification** - Alert on failures

### Integration
- **API Orchestration** - Compose multiple API calls
- **Webhook Receiver** - Handle incoming webhooks
- **Database Sync** - Synchronize data sources
- **File Processing** - Process uploaded files

### Data Transformation
- **Batch Processing** - Handle large datasets
- **Pagination** - Fetch paginated APIs
- **Data Enrichment** - Augment data from sources
- **Format Conversion** - Transform between formats

## MCP Integration

Connect AI assistants (Claude, etc.) directly to your n8n instance. The `n8n-bmad init` command automatically creates a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "N8N_API_URL": "http://localhost:5678/api/v1",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MCP_MODE` | Set to `stdio` for CLI integration |
| `N8N_API_URL` | Your n8n instance URL with `/api/v1` suffix |
| `N8N_API_KEY` | API key from n8n Settings → API |

## Configuration

Framework configuration is stored in `.n8n-bmad/src/core/module.yaml`:

```yaml
n8n:
  instance_url: http://localhost:5678/api/v1
  api_key: ${N8N_API_KEY}

naming:
  workflow_prefix: "wf_"
  credential_prefix: "cred_"

output:
  docs_path: ./docs
  exports_path: ./exports
```

Environment variables (like `N8N_API_KEY`) are stored in `.n8n-bmad/.env`.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- Built for the [n8n](https://n8n.io) community
