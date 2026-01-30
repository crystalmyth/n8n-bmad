---
template: integration-spec
version: "1.0"
category: architecture
---

# Integration Specification: {integration_name}

## Overview

| Field | Value |
|-------|-------|
| **Source System** | {source} |
| **Target System** | {target} |
| **Integration Type** | {API / Webhook / Database / File} |
| **Direction** | {Inbound / Outbound / Bidirectional} |
| **Version** | {version} |
| **Owner** | {owner} |

---

## Purpose

{Description of what this integration accomplishes.}

---

## System Context

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Source    │────────▶│     n8n     │────────▶│   Target    │
│   System    │         │  Workflow   │         │   System    │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## Source System

### Connection Details
| Property | Value |
|----------|-------|
| Base URL | {url} |
| Protocol | {HTTP/HTTPS} |
| Authentication | {OAuth2 / API Key / Basic} |
| Rate Limits | {requests/period} |

### Authentication
```
Type: {auth_type}
Header: {header_name}
Format: {format}
```

### Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| {path} | {GET/POST/etc} | {purpose} |

---

## Target System

### Connection Details
| Property | Value |
|----------|-------|
| Base URL | {url} |
| Protocol | {HTTP/HTTPS} |
| Authentication | {auth_type} |
| Rate Limits | {requests/period} |

### Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| {path} | {method} | {purpose} |

---

## Data Mapping

### Field Mapping
| Source Field | Target Field | Type | Transform | Required |
|--------------|--------------|------|-----------|----------|
| {source} | {target} | {string/int/etc} | {transform} | {Y/N} |

### Transformation Rules
1. **{field_name}**: {transformation_description}
   ```javascript
   {{ $json.field.transform() }}
   ```

### Data Validation
| Field | Validation | Action on Failure |
|-------|------------|-------------------|
| {field} | {rule} | {skip/error/default} |

---

## Message Formats

### Request Format
```json
{
  "field1": "string",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
```

### Response Format
```json
{
  "status": "success",
  "data": {
    "id": "string"
  }
}
```

---

## Trigger Configuration

### Trigger Type
{Schedule / Webhook / Event / Manual}

### Schedule (if applicable)
- Cron: `{cron_expression}`
- Timezone: {timezone}
- Frequency: {description}

### Webhook (if applicable)
- URL: `{webhook_url}`
- Method: {method}
- Authentication: {auth_method}

---

## Error Handling

### Error Types
| Error Code | Meaning | Response |
|------------|---------|----------|
| 400 | Bad Request | Log and skip |
| 401 | Unauthorized | Alert and retry auth |
| 429 | Rate Limited | Backoff and retry |
| 500 | Server Error | Retry with backoff |

### Retry Strategy
- Max Retries: {number}
- Backoff: {exponential/linear}
- Initial Delay: {seconds}

### Error Notification
- Channel: {email/slack/etc}
- Recipients: {recipients}
- Threshold: {when to notify}

---

## Performance

### Expected Volume
| Metric | Value |
|--------|-------|
| Records per execution | {count} |
| Executions per day | {count} |
| Peak hours | {times} |

### SLA Requirements
| Metric | Target |
|--------|--------|
| Latency | {ms} |
| Availability | {%} |
| Error Rate | {%} |

---

## Security

### Data Classification
| Data Element | Classification | Handling |
|--------------|----------------|----------|
| {element} | {PII/Sensitive/Public} | {handling} |

### Credentials
| Credential | Type | Stored In | Rotation |
|------------|------|-----------|----------|
| {name} | {API Key/OAuth/etc} | n8n Credentials | {schedule} |

---

## Testing

### Test Scenarios
| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Happy path | {input} | {output} |
| Error case | {input} | {output} |

### Test Data
```json
{
  "test_record": "sample_data"
}
```

---

## Monitoring

### Health Checks
| Check | Frequency | Alert Threshold |
|-------|-----------|-----------------|
| {check} | {frequency} | {threshold} |

### Metrics
- Execution success rate
- Average execution time
- Error count by type

---

## Documentation Links

- Source API Docs: {link}
- Target API Docs: {link}
- n8n Workflow: {link}

---

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| {date} | 1.0 | {author} | Initial version |
