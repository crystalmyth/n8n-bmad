---
template: node-configuration
version: "1.0"
category: n8n-specific
---

# Node Configuration: {node_name}

## Node Information

| Property | Value |
|----------|-------|
| **Node Name** | {node_name} |
| **Node Type** | {node_type} |
| **Workflow** | {workflow_name} |
| **Position** | {position_in_flow} |
| **Purpose** | {brief_purpose} |

---

## Description

{Detailed description of what this node does and why it exists in the workflow.}

---

## Configuration

### Basic Settings
| Setting | Value | Notes |
|---------|-------|-------|
| {setting_1} | {value} | {notes} |
| {setting_2} | {value} | {notes} |

### Advanced Settings
| Setting | Value | Notes |
|---------|-------|-------|
| {setting} | {value} | {notes} |

### Full Configuration JSON
```json
{
  "parameters": {
    "setting1": "value1",
    "setting2": "value2"
  },
  "name": "{node_name}",
  "type": "{node_type}",
  "position": [x, y]
}
```

---

## Input

### Expected Input
```json
{
  "field1": "string",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
```

### Input Source
| Field | Source Node | Path |
|-------|-------------|------|
| {field} | {source_node} | `$json.path.to.field` |

### Input Validation
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| {field} | {type} | Yes/No | {rule} |

---

## Output

### Output Format
```json
{
  "outputField1": "transformed_value",
  "outputField2": 456
}
```

### Output Fields
| Field | Type | Description |
|-------|------|-------------|
| {field} | {type} | {description} |

---

## Expressions Used

### Expression 1: {purpose}
```javascript
{{ $json.inputField.toUpperCase() }}
```
**Purpose:** {what_it_does}

### Expression 2: {purpose}
```javascript
{{ $json.items.filter(i => i.active).map(i => i.name) }}
```
**Purpose:** {what_it_does}

### Expression 3: {purpose}
```javascript
{{ DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') }}
```
**Purpose:** {what_it_does}

---

## Credentials

| Credential | Type | Required |
|------------|------|----------|
| {credential_name} | {type} | Yes/No |

---

## Error Handling

### Error Behavior
- **Continue On Fail:** {Yes/No}
- **Error Output:** {output_branch}

### Common Errors
| Error | Cause | Resolution |
|-------|-------|------------|
| {error} | {cause} | {resolution} |

---

## Performance Considerations

| Consideration | Details |
|---------------|---------|
| Execution time | {expected_time} |
| Memory usage | {notes} |
| Rate limits | {if_applicable} |

---

## Dependencies

### Upstream Nodes
| Node | Data Required |
|------|---------------|
| {node_name} | {data_description} |

### Downstream Nodes
| Node | Data Provided |
|------|---------------|
| {node_name} | {data_description} |

---

## Testing Notes

### Test Cases
| Test | Input | Expected Output |
|------|-------|-----------------|
| Happy path | {input} | {output} |
| Edge case | {input} | {output} |

### Test Data
```json
{
  "test_input": "value"
}
```

---

## Related Documentation

- Node Documentation: {link}
- Expression Guide: {link}
- Workflow Spec: {link}

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| {date} | Initial configuration | {author} |
| {date} | {change_description} | {author} |
