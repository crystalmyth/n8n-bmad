# n8n Node Discovery Handler

> **Purpose:** Discover and leverage installed custom nodes from user's n8n instance
> **Used by:** Developer, Architect, Integration agents
> **Related:** n8n MCP Server, node-discovery.js library

## Overview

The Node Discovery handler enables agents to discover nodes installed on the user's actual n8n instance, not just nodes in the public registry. This allows agents to recommend powerful custom nodes that users have already installed.

## Discovery Flow

```yaml
discovery_flow:
  1. Query n8n API for installed nodes
  2. Categorize nodes (core/community/custom)
  3. Cache results (24hr TTL)
  4. Include in agent context building

cache_location: ".n8n-bmad/cache/installed-nodes.json"
cache_ttl: 24 hours
```

## Node Categories

### Core Nodes
```yaml
category: core
prefixes:
  - "n8n-nodes-base.*"
  - "@n8n/n8n-nodes-*"
  - "n8n-nodes-langchain.*"
description: Built-in n8n nodes shipped with every installation
examples:
  - n8n-nodes-base.httpRequest
  - n8n-nodes-base.webhook
  - n8n-nodes-langchain.agent
```

### Community Nodes
```yaml
category: community
prefixes:
  - "n8n-nodes-*" (excluding n8n-nodes-base)
  - "@community/*"
description: Community-published packages from npm
examples:
  - n8n-nodes-puppeteer
  - n8n-nodes-browserless
  - "@community/n8n-nodes-notion"
```

### Custom Nodes
```yaml
category: custom
description: User-installed nodes not matching core or community patterns
use_cases:
  - Company-specific integrations
  - Custom API wrappers
  - Proprietary business logic
  - Modified community nodes
```

## CLI Commands

```bash
# Discover and cache installed nodes
n8n-bmad nodes discover
n8n-bmad nodes discover --force    # Force refresh

# List cached nodes
n8n-bmad nodes list                # All nodes
n8n-bmad nodes list --type custom  # Custom nodes only
n8n-bmad nodes list --type community

# Search nodes
n8n-bmad nodes search webhook
n8n-bmad nodes search slack --type custom

# Check cache status
n8n-bmad nodes status
```

## Agent Usage

### When to Check for Custom Nodes

```yaml
check_custom_nodes_when:
  - Starting new workflow design
  - User mentions specific integration needs
  - Recommending node solutions
  - Building architecture documentation

do_not_assume:
  - User has specific community nodes
  - User's n8n version supports all features
  - Custom nodes exist without discovery
```

### Discovery Before Recommendation

```yaml
best_practice: "Discover before recommending"

workflow:
  1. Agent receives task requiring specific integration
  2. Check cached custom nodes first
  3. If not found in cache, suggest discovery:
     "Run n8n-bmad nodes discover to check for installed custom nodes"
  4. Include discovered nodes in recommendations
```

### Example Agent Reasoning

```markdown
## Context Gathering

User needs Slack integration.

**Check installed nodes:**
- Core: n8n-nodes-base.slack (available)
- Custom: Check cache for enhanced Slack nodes

**Cached custom nodes include:**
- my-company.slack-advanced (custom threading support)

**Recommendation:**
Use `my-company.slack-advanced` for thread management,
fall back to `n8n-nodes-base.slack` for basic operations.
```

## Integration with LLM Context

Custom nodes are automatically included in LLM context when running `n8n-bmad context build`:

```markdown
## Installed Custom Nodes

| Node Type | Display Name | Description |
|-----------|--------------|-------------|
| my-company.crm-sync | CRM Sync | Syncs with internal CRM |
| my-company.data-transform | Data Transform | Company data formats |
```

This gives agents awareness of available custom capabilities.

## Configuration

In `src/core/module.yaml`:

```yaml
node_discovery:
  enabled: true
  cache_path: "./.n8n-bmad/cache/installed-nodes.json"
  cache_ttl_hours: 24
```

## API Requirements

```yaml
required:
  - N8N_API_URL or N8N_INSTANCE_URL environment variable
  - N8N_API_KEY (if instance requires authentication)

endpoints_tried:
  - /api/v1/node-types
  - /api/v1/nodes
  - /rest/node-types

fallback:
  - Return cached data if API unavailable
  - Warn about stale cache
```

## Error Handling

### No API Configuration
```yaml
error: "n8n API URL not configured"
solution:
  - Run "n8n-bmad init" to configure
  - Set N8N_API_URL environment variable
```

### API Connection Failed
```yaml
error: "Failed to fetch nodes from n8n API"
behavior:
  - Return cached data if available
  - Mark data as stale
  - Suggest manual refresh
```

### No Cache Available
```yaml
error: "No cached node data available"
solution:
  - Run "n8n-bmad nodes discover"
  - Ensure n8n instance is accessible
```

## Best Practices

### For Agents

```yaml
practices:
  - Check cache before making node recommendations
  - Prefer custom nodes when they match user needs
  - Suggest discovery when cache is stale or missing
  - Include node source in recommendations (core/custom)
```

### For Users

```yaml
practices:
  - Run discovery after installing new nodes
  - Run discovery periodically (weekly) for accuracy
  - Include custom nodes in project documentation
```

## Handler Usage Checklist

When building workflows or making recommendations:

```markdown
## Node Discovery Checklist

### Before Recommending Nodes
- [ ] Check if cache exists (n8n-bmad nodes status)
- [ ] Cache is fresh (< 24 hours old)
- [ ] Searched for relevant custom nodes

### When Custom Node Found
- [ ] Verify node capabilities match requirements
- [ ] Document custom node usage in workflow
- [ ] Note any version requirements

### When No Custom Node Available
- [ ] Recommend core/community alternatives
- [ ] Consider suggesting custom node development
- [ ] Document gap in requirements
```
