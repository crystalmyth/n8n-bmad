# n8n-BMAD Handler Components

Reusable building blocks for n8n workflow development. Handlers provide standardized patterns, validation rules, and best practices.

## Available Handlers

| Handler | Purpose | Used By |
|---------|---------|---------|
| [n8n-validate](./n8n-validate.handler.md) | Workflow validation rules | QA, Developer, DevOps |
| [n8n-expression](./n8n-expression.handler.md) | Expression syntax & validation | Developer, Data Analyst |
| [n8n-error](./n8n-error.handler.md) | Error handling patterns | Developer, Architect |
| [n8n-credential](./n8n-credential.handler.md) | Credential management | Security, DevOps |
| [ai-node-config](./ai-node-config.handler.md) | AI/LLM node configuration | Prompt Engineer, Developer |
| [webhook-config](./webhook-config.handler.md) | Webhook setup & security | Integration, Developer |
| [n8n-node-discovery](./n8n-node-discovery.handler.md) | Custom node discovery | Developer, Architect, Integration |

## Handler Structure

Each handler follows this format:

```markdown
# Handler Name

> **Purpose:** What this handler does
> **Used by:** Which agents use it
> **Related:** Other relevant handlers/nodes

## Overview
Brief description of the handler's scope

## Configuration/Patterns
Detailed patterns and configurations

## Best Practices
Recommended approaches

## Common Issues
Problems and solutions

## Handler Usage
How agents should use this handler
```

## Using Handlers in Workflows

Handlers are referenced by agents when:
1. **Building workflows** - Use patterns from handlers
2. **Validating work** - Apply handler rules
3. **Troubleshooting** - Reference common issues
4. **Reviewing** - Check against best practices

## Creating New Handlers

When creating a new handler:
1. Identify the reusable pattern or concern
2. Document the standard approach
3. Include examples and templates
4. Add to this README index
5. Reference from relevant agent files

## Handler Categories

### Core n8n
- `n8n-validate` - Workflow structure validation
- `n8n-expression` - Expression syntax
- `n8n-error` - Error handling

### Security & Operations
- `n8n-credential` - Credential management
- `webhook-config` - Webhook security

### AI & Advanced
- `ai-node-config` - LLM/AI node setup

## MCP Integration

Several handlers integrate with the n8n MCP server:
- `n8n-validate` uses `mcp__n8n__validate_workflow`
- Node lookups use `mcp__n8n__get_node`
- Template examples use `mcp__n8n__search_templates`
- `n8n-node-discovery` queries installed nodes via n8n API
