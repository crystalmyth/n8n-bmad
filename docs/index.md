# n8n-BMAD Framework Documentation

Welcome to the n8n-BMAD framework documentation. This framework brings AI-powered development methodology to n8n workflow automation teams, helping you **B**uild **M**ore **A**utomations **D**aily.

## What is n8n-BMAD?

n8n-BMAD is a comprehensive framework that combines:

- **13 Specialized AI Agent Personas** - From Product Owner to DevOps Engineer, each agent provides domain-specific guidance
- **Reusable Workflow Patterns** - Battle-tested patterns for error handling, integrations, and data transformation
- **Project Templates** - PRDs, ADRs, runbooks, test plans, and more
- **CLI Tooling** - Initialize, validate, and manage your n8n projects
- **MCP Integration** - Connect AI assistants directly to your n8n instance

## Documentation Structure

This documentation follows the [Diataxis](https://diataxis.fr/) framework, organizing content into four categories based on how you will use it:

### Tutorials (Learning-Oriented)

Step-by-step lessons that take you through building something with n8n-BMAD.

- [Getting Started](tutorials/getting-started.md) - Install and configure n8n-BMAD
- [Build Your First Workflow](tutorials/first-workflow.md) - Create a complete workflow using the framework

### How-To Guides (Problem-Oriented)

Practical guides that help you solve specific problems.

- [Debug Workflows](how-to/debug-workflows.md) - Find and fix issues in your workflows
- [Handle Errors](how-to/handle-errors.md) - Implement robust error handling patterns

### Explanation (Understanding-Oriented)

Conceptual discussions that help you understand how n8n-BMAD works.

- [Framework Overview](explanation/framework-overview.md) - Philosophy and design principles
- [Agent System](explanation/agent-system.md) - How AI agents work together

### Reference (Information-Oriented)

Technical descriptions of the framework components.

- [CLI Reference](reference/cli-reference.md) - Complete command documentation
- [Agent Catalog](reference/agent-catalog.md) - All available agents and their capabilities

## Quick Start

```bash
# Install n8n-BMAD
npm install -g n8n-bmad

# Initialize a new project
n8n-bmad init

# List available agents
n8n-bmad agent list

# Get help
n8n-bmad help
```

## Key Concepts

### Agents

Agents are AI personas specialized for different roles in workflow development. Each agent has specific expertise, prompts, and templates. For example:

- **Product Owner** - Requirements and acceptance criteria
- **Developer** - Workflow implementation and expressions
- **DevOps** - Deployment and incident response

### Patterns

Patterns are reusable n8n workflow templates that solve common problems:

- **Error Handling** - Retry with backoff, dead letter queues, circuit breakers
- **Integration** - API orchestration, webhook receivers, database sync
- **Data Transformation** - Batch processing, pagination, data enrichment

### Templates

Templates are document scaffolds for project artifacts:

- **Project** - PRD, project charter, project brief
- **Architecture** - ADR, solution design, integration spec
- **Operations** - Runbook, incident report, post-mortem

## Requirements

- Node.js 18.0.0 or higher
- n8n instance (local or cloud)
- npm or yarn package manager

## Getting Help

- Run `n8n-bmad help` for CLI assistance
- Use the `n8n-master` agent for framework navigation
- Check the [reference documentation](reference/cli-reference.md) for detailed command usage

## Contributing

We welcome contributions. See the [Contributing Guide](../CONTRIBUTING.md) for details on how to submit improvements.

## License

n8n-BMAD is released under the MIT License. See [LICENSE](../LICENSE) for details.
