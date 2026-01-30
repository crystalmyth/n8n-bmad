# n8n-BMAD Framework

> **B**uild **M**ore **A**utomations **D**aily - An AI-powered methodology framework for n8n workflow automation teams

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-workflow%20automation-orange)](https://n8n.io)

## Overview

n8n-BMAD brings structured AI-assisted development methodology to workflow automation. Inspired by the [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD), this framework provides:

- **13 Specialized AI Agent Personas** - From Product Owner to DevOps Engineer
- **Reusable Workflow Patterns** - Error handling, integrations, data transformation
- **Comprehensive Templates** - PRDs, ADRs, runbooks, test plans, and more
- **Full CLI Tooling** - Initialize, validate, and manage your n8n projects
- **MCP Integration** - Connect AI assistants directly to your n8n instance

## Quick Start

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
n8n-bmad init --name "my-automation-project" --url "http://localhost:5678"
```

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

```
n8n-bmad/
├── src/core/
│   ├── agents/          # AI agent persona definitions
│   ├── workflows/       # BMAD workflow processes
│   └── tasks/           # Task definitions (XML)
├── templates/           # Document templates
│   ├── project/         # PRD, charter, brief
│   ├── agile/           # Epics, stories, sprints
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
| **pm** | Project Manager | Sprint planning, releases, status |
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

Connect AI assistants (Claude, etc.) directly to your n8n instance:

```bash
# Setup MCP configuration
n8n-bmad init --mcp

# Configure in your MCP client
{
  "servers": {
    "n8n-bmad": {
      "command": "n8n-bmad",
      "args": ["mcp-server"]
    }
  }
}
```

## Configuration

Create `n8n-bmad.config.yaml` in your project root:

```yaml
n8n:
  instance_url: http://localhost:5678
  api_key: ${N8N_API_KEY}

naming:
  workflow_prefix: "wf_"
  credential_prefix: "cred_"

output:
  docs_path: ./docs
  exports_path: ./exports
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- Built for the [n8n](https://n8n.io) community
