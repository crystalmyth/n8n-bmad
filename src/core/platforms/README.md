# n8n-BMAD Platform Configuration

n8n-BMAD is designed exclusively for **Claude Code** (Anthropic CLI).

## Claude Code Integration

Claude Code provides the best integration with n8n-BMAD:
- **MCP support** for direct n8n API access
- **Slash commands** for agent switching (`/n8n:pm`, `/n8n:po`, etc.)
- **Full tool access** for workflow manipulation

## Setup

```bash
n8n-bmad init
```

This creates:
- `.mcp.json` - MCP server configuration for n8n access
- `.claude/commands/n8n/*.md` - Slash commands for each agent

## Configuration File

The `claude-code.platform.yaml` defines:
- Command file locations
- MCP server settings
- Agent-to-command mappings
