# Getting Started with n8n-BMAD

This tutorial will guide you through installing n8n-BMAD, configuring it for your n8n instance, and exploring the core features. By the end, you will have a working setup ready for workflow development.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18.0.0 or higher** - Check with `node --version`
- **npm or yarn** - Comes with Node.js
- **An n8n instance** - Local or cloud-hosted
- **A terminal** - Command line access

## Step 1: Install n8n-BMAD

Install the framework globally using npm:

```bash
npm install -g n8n-bmad
```

Or use npx to run without installing:

```bash
npx n8n-bmad --version
```

Verify the installation:

```bash
n8n-bmad --version
```

You should see the version number displayed.

## Step 2: Initialize Your Project

Navigate to your project directory or create a new one:

```bash
mkdir my-automation-project
cd my-automation-project
```

Run the initialization command:

```bash
n8n-bmad init
```

The interactive wizard will ask you:

1. **Project name** - A descriptive name for your project
2. **n8n instance URL** - The URL of your n8n instance (default: `http://localhost:5678`)
3. **API key** - Your n8n API key (optional but recommended)
4. **MCP setup** - Whether to configure MCP integration for AI assistants

Alternatively, use flags to skip the wizard:

```bash
n8n-bmad init --name "Customer Onboarding Automation" --url "http://localhost:5678"
```

## Step 3: Explore the Project Structure

After initialization, your project will have this structure:

```
my-automation-project/
├── n8n-bmad.config.yaml    # Project configuration
├── .mcp.json               # MCP integration settings
├── docs/                   # Generated documentation
├── exports/                # Workflow exports
├── backups/                # Workflow backups
└── reports/                # Validation reports
```

The `n8n-bmad.config.yaml` file contains your project settings:

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

## Step 4: Meet the Agents

n8n-BMAD includes 13 specialized AI agents. List them with:

```bash
n8n-bmad agent list
```

You will see output like:

```
Available Agents:
┌──────────────┬─────────────────────┬──────────────────────────────────────┐
│ ID           │ Name                │ Primary Functions                     │
├──────────────┼─────────────────────┼──────────────────────────────────────┤
│ n8n-master   │ Master Orchestrator │ Help system, agent routing            │
│ po           │ Product Owner       │ Requirements, backlog                 │
│ pm           │ Project Manager     │ Sprint planning, releases             │
│ architect    │ Solution Architect  │ Design patterns, ADRs                 │
│ developer    │ Workflow Developer  │ Implementation, expressions           │
│ qa           │ QA Engineer         │ Test planning, bug reports            │
│ devops       │ DevOps Engineer     │ Deployment, incidents                 │
└──────────────┴─────────────────────┴──────────────────────────────────────┘
```

Load an agent to access its specialized features:

```bash
n8n-bmad agent load developer
```

View an agent's menu of available commands:

```bash
n8n-bmad agent menu developer
```

## Step 5: Browse Templates

Templates help you create consistent project documentation. List available templates:

```bash
n8n-bmad template list
```

Templates are organized by category:

- **project** - PRD, project charter, project brief
- **agile** - Epic, story, task, sprint retrospective
- **architecture** - ADR, solution design, integration spec
- **operations** - Runbook, incident report, post-mortem
- **testing** - Test plan, test case, test report
- **n8n-specific** - Workflow spec, credential manifest
- **security** - Security assessment, credential rotation

Generate a template:

```bash
n8n-bmad template generate workflow-spec --output ./docs/my-workflow.md
```

## Step 6: Explore Workflow Patterns

Patterns are reusable workflow templates for common scenarios. List them:

```bash
n8n-bmad pattern list
```

Patterns are organized by category:

- **error-handling** - Retry, dead letter queue, circuit breaker
- **integration** - API orchestration, webhook receiver, database sync
- **data-transformation** - Batch processing, pagination
- **scheduling** - Cron patterns, polling to webhook

View pattern details:

```bash
n8n-bmad pattern show retry-with-backoff
```

## Step 7: Validate a Workflow

n8n-BMAD can validate your workflows for best practices and potential issues:

```bash
# Validate a single workflow
n8n-bmad validate workflow ./my-workflow.json

# Validate all workflows in a directory
n8n-bmad validate workflow ./workflows/

# Check naming conventions
n8n-bmad validate naming ./workflows/
```

The validator checks for:

- Proper error handling
- Naming convention compliance
- Expression syntax issues
- Security concerns
- Performance problems

## Step 8: Set Up MCP Integration (Optional)

If you use AI assistants like Claude, you can connect them directly to n8n via MCP:

```bash
n8n-bmad init --mcp
```

This creates an `.mcp.json` configuration file. Add this to your AI assistant's MCP configuration:

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

Your AI assistant can now interact with your n8n instance through the framework.

## Next Steps

You now have n8n-BMAD set up and ready to use. Here is what to do next:

1. **Build your first workflow** - Follow the [First Workflow Tutorial](first-workflow.md)
2. **Learn error handling** - Read the [Error Handling Guide](../how-to/handle-errors.md)
3. **Understand the framework** - Explore the [Framework Overview](../explanation/framework-overview.md)
4. **Reference the CLI** - Check the [CLI Reference](../reference/cli-reference.md)

## Common Issues

### n8n connection fails

Ensure your n8n instance is running and the URL is correct:

```bash
curl http://localhost:5678/healthz
```

### API key not working

1. Generate a new API key in n8n Settings > API
2. Update your configuration or set the environment variable:

```bash
export N8N_API_KEY="your-api-key-here"
```

### Permission denied

If you get permission errors during global install:

```bash
sudo npm install -g n8n-bmad
```

Or use a Node version manager like nvm to avoid permission issues.

## Summary

In this tutorial, you:

1. Installed n8n-BMAD globally
2. Initialized a new project with configuration
3. Explored the available agents
4. Browsed templates and patterns
5. Learned to validate workflows
6. Optionally set up MCP integration

You are now ready to start building workflows with the framework.
