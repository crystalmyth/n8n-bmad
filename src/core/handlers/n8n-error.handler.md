# n8n Error Handling Handler

> **Purpose:** Standard patterns for error handling in n8n workflows
> **Used by:** Developer, Architect, QA agents
> **Patterns:** Try-catch, error workflows, retry logic

## Error Handling Patterns

### 1. Node-Level Error Handling

#### Continue on Fail
```json
{
  "continueOnFail": true,
  "onError": "continueRegularOutput"
}
```
Use when:
- Non-critical operations
- Batch processing where some failures are acceptable
- Logging/notification nodes

#### Stop Workflow
```json
{
  "continueOnFail": false,
  "onError": "stopWorkflow"
}
```
Use when:
- Critical operations that must succeed
- Data integrity is essential
- Downstream nodes depend on success

### 2. Error Workflow Pattern

Create a dedicated error handling workflow:
```yaml
name: wf_error_handler
trigger: Error Trigger
nodes:
  - Error Trigger (captures workflow errors)
  - Extract Error Info
  - Log to Monitoring
  - Send Alert (Slack/Email)
  - Optional: Create Ticket
```

Error data available:
```javascript
{{ $json.execution.id }}
{{ $json.execution.url }}
{{ $json.workflow.id }}
{{ $json.workflow.name }}
{{ $json.error.message }}
{{ $json.error.node }}
{{ $json.error.timestamp }}
```

### 3. Try-Catch with IF Node

```yaml
pattern: try-catch
nodes:
  - HTTP Request (might fail)
  - IF Node (check for error)
    - true branch: Handle Error
    - false branch: Continue Processing
```

IF condition for error check:
```javascript
{{ $json.error !== undefined || $json.statusCode >= 400 }}
```

### 4. Retry Pattern

For transient failures (API rate limits, network issues):

```yaml
pattern: retry-with-backoff
approach: Sub-workflow with counter

main_workflow:
  - Trigger
  - Set retry_count = 0
  - Execute Operation Sub-Workflow

sub_workflow:
  - Receive retry_count
  - Try Operation
  - IF failed AND retry_count < 3:
    - Wait (exponential: 2^retry_count seconds)
    - Call self with retry_count + 1
  - ELSE:
    - Return result or final error
```

Wait time calculation:
```javascript
{{ Math.pow(2, $json.retry_count) * 1000 }}  // Exponential backoff in ms
```

### 5. Circuit Breaker Pattern

For protecting against cascading failures:

```yaml
pattern: circuit-breaker
states:
  - CLOSED: Normal operation
  - OPEN: Failing, reject requests
  - HALF_OPEN: Testing if recovered

implementation:
  - Store state in external service (Redis/DB)
  - Check state before operation
  - Track failure count
  - Open circuit after threshold
  - Half-open after timeout
```

## Error Response Templates

### Standardized Error Object
```json
{
  "success": false,
  "error": {
    "code": "ERR_API_TIMEOUT",
    "message": "API request timed out after 30 seconds",
    "details": {
      "endpoint": "/api/v1/users",
      "timeout_ms": 30000
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "workflow": "wf_user_sync",
    "node": "Fetch Users"
  },
  "retry": {
    "possible": true,
    "after_seconds": 60
  }
}
```

### Set Node for Error Formatting
```javascript
// Transform raw error to standard format
{
  "success": false,
  "error": {
    "code": $json.error?.code ?? "ERR_UNKNOWN",
    "message": $json.error?.message ?? "An unknown error occurred",
    "details": $json.error?.details ?? {},
    "timestamp": $now.toISO(),
    "workflow": $workflow.name,
    "node": $json._node ?? "Unknown"
  }
}
```

## Common Error Scenarios

### API Errors
```yaml
scenario: HTTP 429 (Rate Limited)
handling:
  - Extract Retry-After header
  - Wait specified time
  - Retry request
  - Max 3 retries then fail

expression: |
  {{
    $json.headers['retry-after']
    ? parseInt($json.headers['retry-after']) * 1000
    : 60000
  }}
```

### Data Validation Errors
```yaml
scenario: Invalid input data
handling:
  - Validate early in workflow
  - Use IF node for validation checks
  - Route invalid data to error branch
  - Log and optionally notify

validation_expression: |
  {{
    $json.email &&
    $json.email.includes('@') &&
    $json.name &&
    $json.name.length > 0
  }}
```

### Integration Errors
```yaml
scenario: External service unavailable
handling:
  - Implement retry with backoff
  - Have fallback service if available
  - Queue request for later processing
  - Alert operations team
```

## Error Logging Best Practices

### What to Log
```yaml
always_log:
  - Error message
  - Workflow name and execution ID
  - Node that failed
  - Timestamp
  - Input data that caused failure (sanitized)

optional:
  - Stack trace (development only)
  - Request/response details
  - User context
```

### Log Format
```javascript
{
  "level": "error",
  "timestamp": $now.toISO(),
  "workflow": {
    "id": $workflow.id,
    "name": $workflow.name,
    "execution_id": $execution.id
  },
  "error": {
    "message": $json.error.message,
    "code": $json.error.code,
    "node": $json._node
  },
  "context": {
    // Sanitized relevant data
  }
}
```

## Handler Usage

When helping with error handling:
1. Identify the type of error (transient vs permanent)
2. Recommend appropriate pattern
3. Provide implementation example
4. Include logging recommendations
5. Suggest monitoring/alerting
