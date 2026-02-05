# Integration Specification Workflow [IS]

> **Agent:** Ivy (Integration) 🔌
> **Trigger:** `IS` or `integration-spec`
> **Output:** Integration specification document

---

## Overview

Design and document an integration specification for external APIs and systems. Covers authentication, endpoints, data mapping, and error handling.

---

## Step 1: Integration Context

**Agent:** Ivy (Integration) 🔌

### Integration Overview

| Field | Value |
|-------|-------|
| System Name | {system_name} |
| Integration Type | API / Webhook / Database / File |
| Direction | Inbound / Outbound / Bidirectional |
| Purpose | {what_this_integration_does} |

### Source Documents

| Document | Location |
|----------|----------|
| Story | `./docs/backlog/stories/story-{id}.md` |
| Architecture | `./docs/architecture/` |
| API Docs | {link_to_docs} |

---

## Step 2: API Discovery

**Agent:** Ivy (Integration) 🔌

### API Information

| Field | Value |
|-------|-------|
| Base URL | {base_url} |
| API Version | {version} |
| Documentation | {docs_url} |
| Sandbox/Test | {sandbox_url} |

### API Type

- [ ] **REST** - Standard REST API
- [ ] **GraphQL** - Query-based API
- [ ] **SOAP** - XML-based services
- [ ] **Webhook** - Event push
- [ ] **OAuth Provider** - Auth only
- [ ] **File/FTP** - File-based integration

### n8n Node Availability

| Option | Status | Notes |
|--------|--------|-------|
| Native n8n node exists | ⬜ | {node_name} |
| Community node exists | ⬜ | {node_name} |
| HTTP Request needed | ⬜ | Custom integration |

---

## Step 3: Authentication Design

**Agent:** Ivy (Integration) 🔌

### Auth Method

| Method | Details |
|--------|---------|
| **Type** | API Key / OAuth2 / Basic / Bearer / Custom |
| **Location** | Header / Query / Body |
| **Credential Name** | cred_{system}_{env} |

### OAuth2 Configuration (if applicable)

| Field | Value |
|-------|-------|
| Grant Type | Authorization Code / Client Credentials / Password |
| Auth URL | {url} |
| Token URL | {url} |
| Scopes | {scopes} |
| Refresh Token | Yes / No |

### API Key Configuration (if applicable)

| Field | Value |
|-------|-------|
| Header Name | {header} |
| Key Format | {format} |
| Environment Specific | Yes / No |

### Credential Setup in n8n

```yaml
Name: cred_{system}_{env}
Type: {type}
Configuration:
  {key}: {value}
```

---

## Step 4: Endpoint Specification

**Agent:** Ivy (Integration) 🔌

### Endpoints Required

| # | Endpoint | Method | Purpose | Priority |
|---|----------|--------|---------|----------|
| 1 | {path} | GET/POST | {purpose} | Must |
| 2 | {path} | GET/POST | {purpose} | Should |
| 3 | {path} | GET/POST | {purpose} | Could |

### Endpoint Details

#### Endpoint: {name}

| Field | Value |
|-------|-------|
| Path | `{path}` |
| Method | {method} |
| Purpose | {purpose} |

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Body (if applicable):**
```json
{
  "field": "value"
}
```

**Response (Success):**
```json
{
  "data": {}
}
```

**Response (Error):**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## Step 5: Data Mapping

**Agent:** Ivy (Integration) 🔌

### Data Transformation

| Source Field | Target Field | Transform | Notes |
|--------------|--------------|-----------|-------|
| {source} | {target} | Direct / Mapped / Computed | {notes} |
| {source} | {target} | {transform} | {notes} |

### Field Mapping Table

#### Inbound (API → n8n)

| API Field | n8n Field | Type | Required | Transform |
|-----------|-----------|------|----------|-----------|
| {api_field} | {n8n_field} | string | Yes | None |
| {api_field} | {n8n_field} | date | No | ISO 8601 |

#### Outbound (n8n → API)

| n8n Field | API Field | Type | Required | Transform |
|-----------|-----------|------|----------|-----------|
| {n8n_field} | {api_field} | string | Yes | None |

### Data Validation

| Field | Validation | On Fail |
|-------|------------|---------|
| {field} | {rule} | Reject / Default |

---

## Step 6: Rate Limits & Quotas

**Agent:** Ivy (Integration) 🔌

### Rate Limit Configuration

| Limit Type | Value | Window |
|------------|-------|--------|
| Requests per second | {X} | 1 second |
| Requests per minute | {X} | 1 minute |
| Requests per day | {X} | 24 hours |
| Concurrent requests | {X} | N/A |

### Handling Strategy

| Scenario | Strategy |
|----------|----------|
| Rate limit hit | Exponential backoff |
| Quota exceeded | Queue and retry |
| Concurrent limit | Request queuing |

### n8n Configuration

```yaml
Retry on Fail: true
Max Tries: 3
Wait Between Tries: 1000ms
Continue On Fail: false
```

---

## Step 7: Error Handling Specification

**Agent:** Ivy (Integration) 🔌

### Error Codes

| Code | Meaning | Retry? | Action |
|------|---------|--------|--------|
| 400 | Bad Request | No | Log, fix request |
| 401 | Unauthorized | No | Refresh token |
| 403 | Forbidden | No | Check permissions |
| 404 | Not Found | No | Handle gracefully |
| 429 | Rate Limited | Yes | Backoff, retry |
| 500 | Server Error | Yes | Retry with backoff |
| 502/503 | Unavailable | Yes | Retry with backoff |

### Error Handling Flow

```
[API Call] → [Check Response]
      ↓ success    ↓ error
  [Continue]   [Classify Error]
                    ↓
        [Retryable?] → Yes → [Retry Logic]
             ↓ No                    ↓
        [Handle]              [Max Retries?]
             ↓                    ↓ Yes
        [Log/Alert]          [Escalate]
```

---

## Step 8: Pagination Handling

**Agent:** Ivy (Integration) 🔌

### Pagination Type

- [ ] **Offset** - Skip/Limit based
- [ ] **Cursor** - Token-based
- [ ] **Page Number** - Page/Size based
- [ ] **Link Headers** - URL-based
- [ ] **None** - No pagination

### Pagination Configuration

| Field | Value |
|-------|-------|
| Page Size | {size} |
| Max Pages | {max} |
| Param Names | {params} |

### n8n Pagination Setup

```yaml
Pagination:
  Type: {type}
  Parameters:
    limit: {value}
    offset: "={{ $itemIndex }}"
```

---

## Step 9: Testing Specification

**Agent:** Ivy (Integration) 🔌

### Test Cases

| # | Scenario | Input | Expected | Priority |
|---|----------|-------|----------|----------|
| 1 | Successful call | Valid data | 200 + data | High |
| 2 | Invalid auth | Bad token | 401 | High |
| 3 | Rate limit | Many requests | 429 + retry | Medium |
| 4 | Not found | Invalid ID | 404 handled | Medium |
| 5 | Server error | N/A | 500 + retry | Medium |

### Test Data

| Scenario | Data |
|----------|------|
| Happy path | {sample_data} |
| Edge case | {edge_data} |
| Error case | {error_data} |

---

## Step 10: Generate Integration Spec Document

**Agent:** Ivy (Integration) 🔌

### Integration Spec Template

```markdown
# Integration Specification: {System Name}

## Overview

| Field | Value |
|-------|-------|
| System | {name} |
| Type | {type} |
| Direction | {direction} |
| Author | Ivy (Integration) |
| Date | {date} |
| Version | 1.0 |

---

## Authentication

| Field | Value |
|-------|-------|
| Method | {method} |
| Credential | {cred_name} |
| Token Refresh | {yes/no} |

---

## Endpoints

### {Endpoint 1 Name}

| Field | Value |
|-------|-------|
| Path | {path} |
| Method | {method} |
| Purpose | {purpose} |

**Request:**
```json
{request_example}
```

**Response:**
```json
{response_example}
```

---

## Data Mapping

| Source | Target | Transform |
|--------|--------|-----------|
| {field} | {field} | {transform} |

---

## Rate Limits

| Limit | Value | Handling |
|-------|-------|----------|
| {limit} | {value} | {strategy} |

---

## Error Handling

| Error | Retry | Action |
|-------|-------|--------|
| {error} | {yes/no} | {action} |

---

## n8n Implementation Notes

{implementation_notes}

---

## Testing

| Scenario | Expected |
|----------|----------|
| {scenario} | {expected} |
```

### Save Location

```
./docs/integrations/integration-{system}.md
```

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Security concerns | Sierra (Security) | `SR` |
| Architecture impact | Winston (Architect) | `CA` |
| Implementation ready | Nate (Developer) | `NW` or `DS` |

---

## Quick Reference

**Inputs:**
- API documentation
- Requirements (story/PRD)
- Architecture docs

**Outputs:**
- Integration specification
- Credential configuration
- Test cases

**Duration:** 1-2 hours per integration

**Next Steps:**
- Implement with `NW` or `DS`
- Security review with `SR`
