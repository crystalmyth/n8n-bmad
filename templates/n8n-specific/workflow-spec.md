---
template: workflow-spec
version: "1.0"
category: n8n-specific
---

# Workflow Specification: {workflow_name}

## Overview

| Field | Value |
|-------|-------|
| **Workflow Name** | {workflow_name} |
| **Workflow ID** | {workflow_id} |
| **Version** | {version} |
| **Author** | {author} |
| **Date** | {date} |
| **Status** | Draft / In Development / Testing / Production |

---

## Purpose

{Clear description of what this workflow accomplishes.}

---

## Trigger

### Trigger Type
{Webhook / Schedule / Manual / n8n Trigger / Event}

### Configuration

#### For Webhook:
| Property | Value |
|----------|-------|
| Path | `/webhook/{path}` |
| HTTP Method | {GET/POST/PUT} |
| Authentication | {None/Basic/Header} |
| Response Mode | {Immediate/Last Node} |

#### For Schedule:
| Property | Value |
|----------|-------|
| Cron Expression | `{cron}` |
| Timezone | {timezone} |
| Description | {human_readable} |

### Input Schema
```json
{
  "type": "object",
  "properties": {
    "field1": { "type": "string" },
    "field2": { "type": "number" }
  },
  "required": ["field1"]
}
```

---

## Process Flow

### Flow Diagram
```
┌──────────────┐
│   Trigger    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Validate    │──── Invalid ───▶ [Error Response]
└──────┬───────┘
       │ Valid
       ▼
┌──────────────┐
│   Process    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Output     │
└──────────────┘
```

### Node Sequence
| Order | Node Name | Type | Purpose |
|-------|-----------|------|---------|
| 1 | {name} | {type} | {purpose} |
| 2 | {name} | {type} | {purpose} |
| 3 | {name} | {type} | {purpose} |

---

## Node Specifications

### Node 1: {node_name}

**Type:** {node_type}

**Purpose:** {what_this_node_does}

**Configuration:**
```json
{
  "setting1": "value1",
  "setting2": "value2"
}
```

**Input:**
```json
{
  "expected_input": "format"
}
```

**Output:**
```json
{
  "expected_output": "format"
}
```

---

### Node 2: {node_name}

**Type:** {node_type}

**Purpose:** {purpose}

**Expression:**
```javascript
{{ $json.field.transform() }}
```

---

## Data Transformations

### Field Mapping
| Source | Target | Transformation |
|--------|--------|----------------|
| `$json.input` | `output.field` | Direct copy |
| `$json.date` | `output.formatted` | `DateTime.fromISO().toFormat('yyyy-MM-dd')` |

### Expressions Used
```javascript
// Date formatting
{{ DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') }}

// Conditional value
{{ $json.status === 'active' ? 'Yes' : 'No' }}

// Array transformation
{{ $json.items.map(item => item.name).join(', ') }}
```

---

## Error Handling

### Error Strategy
{Overall approach to error handling.}

### Error Workflow
| Property | Value |
|----------|-------|
| Error Workflow ID | {id} |
| Notification | {method} |

### Error Scenarios
| Error | Detection | Response |
|-------|-----------|----------|
| Invalid input | Schema validation | Return 400 |
| API timeout | HTTP node timeout | Retry 3x |
| Rate limit | HTTP 429 | Backoff retry |

---

## External Integrations

### API Calls
| API | Endpoint | Method | Auth |
|-----|----------|--------|------|
| {api} | {endpoint} | {method} | {auth_type} |

### Credentials
| Credential | Type | Purpose |
|------------|------|---------|
| {name} | {OAuth2/API Key} | {purpose} |

---

## Output

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "string",
    "result": "value"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Performance Requirements

| Metric | Requirement |
|--------|-------------|
| Max execution time | {seconds}s |
| Expected throughput | {count} per {period} |
| Max data size | {size} |

---

## Testing Notes

### Test Data
```json
{
  "test_input": "sample_data"
}
```

### Test Scenarios
- [ ] Happy path
- [ ] Invalid input
- [ ] External service unavailable
- [ ] Large payload

---

## Deployment Notes

### Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| {VAR} | {purpose} | Yes/No |

### Prerequisites
- [ ] Credentials configured
- [ ] Error workflow exists
- [ ] Monitoring configured

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {date} | {author} | Initial specification |
