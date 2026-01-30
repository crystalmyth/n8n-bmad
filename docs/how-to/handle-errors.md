# How to Handle Errors in n8n Workflows

This guide covers implementing robust error handling in your n8n workflows using patterns from the n8n-BMAD framework.

## Error Handling Strategies Overview

n8n-BMAD provides four main error handling patterns:

| Pattern | Use Case | Complexity |
|---------|----------|------------|
| Retry with Backoff | Transient failures | Low |
| Error Workflow | Centralized handling | Medium |
| Dead Letter Queue | Failed item processing | Medium |
| Circuit Breaker | Cascade prevention | High |

## Using the Error Handling Patterns

List available patterns:

```bash
n8n-bmad pattern list --category error-handling
```

Export a pattern for import into n8n:

```bash
n8n-bmad pattern export retry-with-backoff --output ./patterns/retry.json
```

## Retry with Exponential Backoff

Use this pattern when dealing with:
- API rate limiting (429 errors)
- Temporary network issues
- Service temporarily unavailable (503 errors)

### Implementation

#### Option 1: Built-in Node Retry

Most n8n nodes support retry configuration:

1. Open node settings
2. Enable "Retry on Fail"
3. Set retry count (recommended: 3)
4. Set wait between retries (ms)

#### Option 2: Custom Retry Logic

For more control, use a Code node:

```javascript
const maxRetries = 3;
const baseDelay = 1000; // 1 second
const input = $input.first().json;

let lastError = null;

for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    // Your API call logic here
    const response = await fetch(input.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true, data: await response.json(), attempts: attempt + 1 };

  } catch (error) {
    lastError = error;

    if (attempt < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// All retries failed
throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError.message}`);
```

### When to Retry

Retry these errors:
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server-side issue
- `502 Bad Gateway` - Proxy issue
- `503 Service Unavailable` - Temporary outage
- `504 Gateway Timeout` - Timeout issue
- Network connection errors

Do not retry these errors:
- `400 Bad Request` - Invalid request (fix the data)
- `401 Unauthorized` - Auth issue (fix credentials)
- `403 Forbidden` - Permission issue (fix access)
- `404 Not Found` - Resource does not exist
- `422 Unprocessable Entity` - Validation error

## Error Workflow

Use an Error Workflow for centralized error handling across multiple workflows.

### Setting Up an Error Workflow

1. **Create the error workflow**

   Add these nodes:
   ```
   [Error Trigger] → [Extract Error Info] → [Log to Database] → [Send Notification]
   ```

2. **Error Trigger node**

   This is a special trigger that receives error data from failed workflows.

3. **Extract Error Info (Code node)**

   ```javascript
   const errorData = $input.first().json;

   return {
     workflow_id: errorData.workflow?.id,
     workflow_name: errorData.workflow?.name,
     execution_id: errorData.execution?.id,
     error_message: errorData.execution?.error?.message,
     error_node: errorData.execution?.error?.node?.name,
     error_timestamp: new Date().toISOString(),
     last_node_executed: errorData.execution?.lastNodeExecuted,
     mode: errorData.execution?.mode,
     // Truncate for logging
     input_data: JSON.stringify(errorData.execution?.data?.resultData?.lastNodeData ?? {}).slice(0, 1000)
   };
   ```

4. **Log to Database (PostgreSQL/MySQL node)**

   Insert into an `error_log` table with the extracted fields.

5. **Send Notification (Slack/Email node)**

   ```
   :x: *Workflow Error*

   *Workflow:* {{ $json.workflow_name }}
   *Node:* {{ $json.error_node }}
   *Error:* {{ $json.error_message }}
   *Execution ID:* {{ $json.execution_id }}
   *Time:* {{ $json.error_timestamp }}
   ```

### Connecting Workflows to Error Workflow

In each workflow that should use centralized error handling:

1. Open workflow Settings
2. Under "Error Workflow", select your error workflow
3. Save the workflow

## Dead Letter Queue (DLQ)

Use a DLQ when processing batches where some items may fail but you need to continue processing others.

### Implementation

```
[Trigger] → [Split Into Batches] → [Process Item] → [Merge Results]
                                         │
                                    (on error)
                                         │
                                         ▼
                                   [DLQ Handler] → [Store Failed Item]
```

### DLQ Handler Code Node

```javascript
const items = $input.all();
const successItems = [];
const failedItems = [];

for (const item of items) {
  try {
    // Process the item
    const result = await processItem(item.json);
    successItems.push({ json: { ...item.json, result, status: 'success' } });
  } catch (error) {
    // Capture failed items with error context
    failedItems.push({
      json: {
        original_item: item.json,
        error_message: error.message,
        error_time: new Date().toISOString(),
        retry_count: (item.json.retry_count || 0) + 1
      }
    });
  }
}

// Output success items on first output
// Output failed items on second output (for DLQ)
return [successItems, failedItems];
```

### Processing the DLQ

Create a separate workflow to retry failed items:

```
[Schedule Trigger] → [Read DLQ Table] → [Retry Processing] → [Update Status]
                                               │
                                          (still fails)
                                               │
                                               ▼
                                        [Send Alert]
```

```javascript
// Check retry count before processing
const item = $input.first().json;

if (item.retry_count >= 3) {
  // Max retries reached - escalate
  return {
    action: 'escalate',
    item: item,
    message: 'Max retries exceeded'
  };
}

// Otherwise, attempt retry
return {
  action: 'retry',
  item: item.original_item
};
```

## Circuit Breaker

Use a circuit breaker to prevent cascade failures when an external service is down.

### Circuit Breaker States

- **Closed** (normal) - Requests flow through normally
- **Open** (tripped) - Requests fail immediately without calling the service
- **Half-Open** (testing) - Allow one request to test if service recovered

### Implementation

Store circuit state in a database or cache:

```javascript
const CIRCUIT_BREAKER_KEY = 'circuit:payment-api';
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT_MS = 60000; // 1 minute

// Get current circuit state
async function getCircuitState() {
  // In practice, fetch from Redis or database
  return global.circuitBreaker?.[CIRCUIT_BREAKER_KEY] ?? {
    state: 'closed',
    failures: 0,
    lastFailure: null,
    lastSuccess: null
  };
}

async function updateCircuitState(newState) {
  global.circuitBreaker = global.circuitBreaker ?? {};
  global.circuitBreaker[CIRCUIT_BREAKER_KEY] = newState;
}

// Main logic
const circuit = await getCircuitState();

// Check if circuit is open
if (circuit.state === 'open') {
  const timeSinceLastFailure = Date.now() - circuit.lastFailure;

  if (timeSinceLastFailure < RECOVERY_TIMEOUT_MS) {
    // Circuit is open - fail fast
    throw new Error('Circuit breaker is open. Service unavailable.');
  }

  // Move to half-open to test
  circuit.state = 'half-open';
}

try {
  // Attempt the operation
  const result = await callExternalService();

  // Success - reset circuit
  await updateCircuitState({
    state: 'closed',
    failures: 0,
    lastSuccess: Date.now()
  });

  return result;

} catch (error) {
  // Failure - update circuit
  circuit.failures++;
  circuit.lastFailure = Date.now();

  if (circuit.failures >= FAILURE_THRESHOLD || circuit.state === 'half-open') {
    circuit.state = 'open';
  }

  await updateCircuitState(circuit);
  throw error;
}
```

### Fallback Behavior

When the circuit is open, provide graceful degradation:

```javascript
if (circuit.state === 'open') {
  // Return cached data
  return {
    status: 'degraded',
    data: getCachedData(),
    message: 'Using cached data. Live service temporarily unavailable.'
  };
}
```

## Combining Patterns

For production workflows, combine patterns:

```
[Trigger]
    │
    ▼
[Validate Input] ─── (invalid) ──► [Error Response]
    │
    │ (valid)
    ▼
[Check Circuit Breaker] ─── (open) ──► [Fallback Response]
    │
    │ (closed)
    ▼
[Call API with Retry]
    │
    ├── (success) ──► [Process Response]
    │
    └── (all retries failed) ──► [DLQ Handler]
                                      │
                                      ▼
                                [Error Workflow]
```

## Best Practices

### 1. Log Meaningful Context

```javascript
{
  "error_id": "{{ $now.toMillis() }}_{{ Math.random().toString(36).substr(2, 9) }}",
  "workflow": "{{ $workflow.name }}",
  "execution_id": "{{ $execution.id }}",
  "node": "{{ $node.name }}",
  "error_type": "API_FAILURE",
  "error_message": "{{ $json.error?.message }}",
  "http_status": "{{ $json.error?.statusCode }}",
  "request_url": "{{ $json.request?.url }}",
  "request_method": "{{ $json.request?.method }}",
  "timestamp": "{{ $now.toISO() }}"
}
```

### 2. Set Appropriate Timeouts

```javascript
// HTTP Request node settings
{
  "timeout": 30000,  // 30 seconds max
  "retryOnFail": true,
  "maxRetries": 3,
  "waitBetweenRetries": 1000
}
```

### 3. Categorize Errors

```javascript
function categorizeError(error) {
  const status = error.statusCode;

  if (status >= 400 && status < 500) {
    return {
      category: 'CLIENT_ERROR',
      retryable: false,
      action: 'fix_request'
    };
  }

  if (status >= 500) {
    return {
      category: 'SERVER_ERROR',
      retryable: true,
      action: 'retry'
    };
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      category: 'NETWORK_ERROR',
      retryable: true,
      action: 'retry'
    };
  }

  return {
    category: 'UNKNOWN',
    retryable: false,
    action: 'escalate'
  };
}
```

### 4. Monitor Error Rates

Track these metrics:
- Error count per workflow per hour
- Error rate (errors / total executions)
- Retry success rate
- Circuit breaker trips

Set alerts for:
- Error rate > 5%
- Sudden spike in errors
- Circuit breaker open for > 5 minutes

## Validation

Run the n8n-BMAD workflow review to check error handling:

```bash
n8n-bmad task run workflow-review \
  --workflow ./my-workflow.json \
  --review-type thorough
```

The review checks for:
- Presence of error handling nodes
- Error workflow configuration
- Retry settings
- Timeout configuration

## Summary

Effective error handling requires:

1. **Retry transient failures** - Use exponential backoff for temporary issues
2. **Centralize error handling** - Use Error Workflows for consistent logging and notification
3. **Handle batch failures** - Use Dead Letter Queues to avoid losing data
4. **Prevent cascades** - Use Circuit Breakers for unreliable services
5. **Log context** - Include enough information to debug issues
6. **Monitor** - Track error rates and alert on anomalies

Import the n8n-BMAD patterns to get started quickly:

```bash
n8n-bmad pattern export error-handling --output ./patterns/
```
