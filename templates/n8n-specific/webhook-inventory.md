---
template: webhook-inventory
version: "1.0"
category: n8n-specific
---

# Webhook Inventory

## Document Information

| Field | Value |
|-------|-------|
| **Project** | {project_name} |
| **Environment** | {environment} |
| **Base URL** | {base_url} |
| **Last Updated** | {date} |

---

## Active Webhooks

| ID | Path | Workflow | Method | Auth | Status |
|----|------|----------|--------|------|--------|
| 1 | `/webhook/{path}` | {workflow_name} | POST | {auth_type} | Active |
| 2 | `/webhook/{path}` | {workflow_name} | POST | None | Active |

---

## Webhook Details

### Webhook: {webhook_name}

| Property | Value |
|----------|-------|
| **Full URL** | `{base_url}/webhook/{path}` |
| **Workflow** | {workflow_name} |
| **Workflow ID** | {workflow_id} |
| **HTTP Method** | {GET/POST/PUT/DELETE} |
| **Authentication** | {None/Basic/Header/JWT} |
| **Response Mode** | {Immediate/Last Node/Response Node} |
| **Created** | {date} |
| **Owner** | {owner} |

#### Authentication Details
{Authentication configuration details.}

#### Request Schema
```json
{
  "type": "object",
  "properties": {
    "event": { "type": "string" },
    "data": { "type": "object" }
  },
  "required": ["event"]
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Received"
}
```

#### Source Systems
| System | Purpose | Contact |
|--------|---------|---------|
| {system} | {purpose} | {contact} |

---

### Webhook: {webhook_name}

| Property | Value |
|----------|-------|
| **Full URL** | `{url}` |
| **Workflow** | {workflow} |
| **Method** | {method} |
| **Auth** | {auth} |

---

## Webhook by Category

### External Integrations
| Webhook | Source | Purpose |
|---------|--------|---------|
| {path} | {source_system} | {purpose} |

### Internal Triggers
| Webhook | Caller | Purpose |
|---------|--------|---------|
| {path} | {internal_system} | {purpose} |

### Test Webhooks
| Webhook | Purpose | Auto-cleanup |
|---------|---------|--------------|
| {path} | {testing_purpose} | {yes/no} |

---

## Security Configuration

### Authentication Methods
| Webhook | Method | Details |
|---------|--------|---------|
| {path} | Header Auth | `X-API-Key: {masked}` |
| {path} | Basic Auth | User: {user} |
| {path} | HMAC | Algorithm: SHA256 |

### IP Allowlisting
| Webhook | Allowed IPs | Notes |
|---------|-------------|-------|
| {path} | {ip_list} | {notes} |

### Rate Limiting
| Webhook | Limit | Window |
|---------|-------|--------|
| {path} | {requests} | {per_second/minute} |

---

## Testing

### Test URLs (Development)
| Webhook | Test URL |
|---------|----------|
| {name} | `{dev_url}` |

### Test Payload Examples
```bash
# Test {webhook_name}
curl -X POST "{webhook_url}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: {test_key}" \
  -d '{
    "event": "test",
    "data": {}
  }'
```

---

## Monitoring

### Health Checks
| Webhook | Check Frequency | Alert Threshold |
|---------|-----------------|-----------------|
| {path} | {frequency} | {threshold} |

### Metrics Tracked
- Request count
- Response time
- Error rate
- Payload size

---

## Troubleshooting

### Common Issues

#### 404 Not Found
- Verify webhook path is correct
- Check if workflow is active
- Confirm webhook node configuration

#### 401 Unauthorized
- Verify authentication header
- Check credential validity
- Confirm auth method matches

#### 500 Internal Error
- Check workflow execution logs
- Verify input data format
- Check downstream services

---

## Change Log

| Date | Webhook | Change | Author |
|------|---------|--------|--------|
| {date} | {path} | Created | {author} |
| {date} | {path} | Auth added | {author} |

---

## Environment Mapping

| Webhook | Development | Staging | Production |
|---------|-------------|---------|------------|
| {name} | `{dev_url}` | `{stg_url}` | `{prod_url}` |
