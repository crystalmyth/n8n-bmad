# n8n Workflow Validation Handler

> **Purpose:** Validate n8n workflow JSON for correctness and best practices
> **Used by:** QA, Developer, DevOps agents
> **MCP Integration:** Uses `mcp__n8n__validate_workflow` when available

## Validation Checks

### 1. Structure Validation
```yaml
checks:
  - name: "Valid JSON structure"
    rule: "Workflow must be valid JSON with nodes[] and connections{}"
    severity: error

  - name: "Required properties"
    rule: "Must have name, nodes, connections, settings"
    severity: error

  - name: "Node definitions"
    rule: "Each node must have id, name, type, position"
    severity: error
```

### 2. Connection Validation
```yaml
checks:
  - name: "Valid connections"
    rule: "All connections reference existing node names"
    severity: error

  - name: "No orphan nodes"
    rule: "All nodes should be connected (except triggers)"
    severity: warning

  - name: "Single trigger"
    rule: "Workflow should have exactly one trigger node"
    severity: warning
```

### 3. Expression Validation
```yaml
checks:
  - name: "Valid expression syntax"
    rule: "All {{ }} expressions must have valid syntax"
    severity: error

  - name: "Node references exist"
    rule: "$('NodeName') must reference existing nodes"
    severity: error

  - name: "No undefined variables"
    rule: "All referenced variables should exist in scope"
    severity: warning
```

### 4. Best Practices
```yaml
checks:
  - name: "Error handling"
    rule: "Workflow should have error handling configured"
    severity: warning

  - name: "Naming conventions"
    rule: "Workflow name should follow {prefix}_{name} convention"
    severity: info

  - name: "Node naming"
    rule: "Nodes should have descriptive names (not 'HTTP Request')"
    severity: info

  - name: "Credentials referenced"
    rule: "Credential IDs should be valid"
    severity: warning
```

## Usage

### In Workflow Context
```
When validating a workflow:
1. Check if MCP is available → Use mcp__n8n__validate_workflow
2. If not, apply manual validation rules above
3. Return validation report with errors, warnings, info
```

### Validation Report Format
```markdown
## Workflow Validation Report

**Workflow:** {workflow_name}
**Status:** ✅ Valid | ⚠️ Warnings | ❌ Invalid

### Errors (must fix)
- [ ] {error_description} at {location}

### Warnings (should fix)
- [ ] {warning_description} at {location}

### Suggestions (nice to have)
- {suggestion}

### Summary
- Nodes: {count}
- Connections: {count}
- Expressions: {count}
- Credentials: {count}
```

## Integration with MCP

When MCP is available, use the n8n MCP server for deep validation:

```javascript
// Example MCP call
mcp__n8n__validate_workflow({
  workflow: workflowJson,
  options: {
    validateNodes: true,
    validateConnections: true,
    validateExpressions: true,
    profile: 'ai-friendly'
  }
})
```
