# Webhook Configuration Handler

> **Purpose:** Configure and secure webhook endpoints in n8n
> **Used by:** Integration, Developer, Security agents
> **Nodes:** Webhook, Webhook Response

## Webhook Node Configuration

### Basic Setup
```yaml
node: Webhook
settings:
  httpMethod: POST  # GET, POST, PUT, DELETE, etc.
  path: "/my-webhook"
  authentication: "none" | "basicAuth" | "headerAuth"
  responseMode: "onReceived" | "lastNode"
```

### URL Structure
```
Production: https://your-n8n.com/webhook/{path}
Test: https://your-n8n.com/webhook-test/{path}
```

### Authentication Options

#### Header Authentication
```yaml
auth_type: headerAuth
config:
  name: "X-API-Key"
  value: "your-secret-key"

verification: |
  Request must include:
  X-API-Key: your-secret-key
```

#### Basic Authentication
```yaml
auth_type: basicAuth
config:
  user: "webhook-user"
  password: "secure-password"

verification: |
  Request must include:
  Authorization: Basic {base64(user:password)}
```

#### Custom HMAC Verification
```yaml
auth_type: custom
implementation:
  1. Receive signature header (X-Signature)
  2. Compute HMAC of body with secret
  3. Compare signatures
  4. Reject if mismatch

code_node: |
  const crypto = require('crypto');
  const signature = $request.headers['x-signature'];
  const body = JSON.stringify($json);
  const secret = $env.WEBHOOK_SECRET;

  const computed = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== computed) {
    throw new Error('Invalid signature');
  }
```

## Security Best Practices

### 1. Always Authenticate
```yaml
rule: Never use authentication "none" in production
options:
  - Header-based API key
  - HMAC signature verification
  - IP allowlisting (if possible)
  - OAuth2 (for complex integrations)
```

### 2. Validate Input
```yaml
validation_steps:
  1. Check required fields exist
  2. Validate data types
  3. Sanitize string inputs
  4. Reject unexpected fields

example_check: |
  {{
    $json.event &&
    ['created', 'updated', 'deleted'].includes($json.event) &&
    typeof $json.id === 'string'
  }}
```

### 3. Rate Limiting
```yaml
approaches:
  - n8n built-in rate limiting (if available)
  - External rate limiter (API Gateway)
  - Custom tracking in workflow

custom_pattern:
  - Store request counts in Redis/DB
  - Check before processing
  - Return 429 if limit exceeded
```

### 4. IP Allowlisting
```yaml
when_possible:
  - Get sender's IP range
  - Configure firewall/proxy
  - Verify in workflow if needed

code_check: |
  const allowedIPs = ['1.2.3.4', '5.6.7.8'];
  const clientIP = $request.headers['x-forwarded-for']
                   || $request.connection.remoteAddress;

  if (!allowedIPs.includes(clientIP)) {
    throw new Error('IP not allowed');
  }
```

## Common Webhook Patterns

### Event Processing
```yaml
pattern: Event-driven webhook
structure:
  - Webhook receives event
  - IF node routes by event type
  - Process each event type differently
  - Send appropriate response

common_events:
  - created, updated, deleted
  - started, completed, failed
  - payment_succeeded, payment_failed
```

### Async Processing
```yaml
pattern: Acknowledge immediately, process later
structure:
  1. Webhook receives request
  2. Immediately respond with 200 OK
  3. Trigger async workflow for processing

benefits:
  - Sender doesn't timeout
  - Can retry on failure
  - Decouples receive from process
```

### Retry Handling
```yaml
pattern: Idempotent processing
structure:
  - Extract event ID from payload
  - Check if already processed
  - Skip if duplicate
  - Process if new
  - Store event ID after success

implementation: |
  // Check for duplicate
  const eventId = $json.event_id;
  const processed = await checkIfProcessed(eventId);

  if (processed) {
    return { status: 'duplicate', skipped: true };
  }

  // Process event
  // ...

  // Mark as processed
  await markProcessed(eventId);
```

## Webhook Response Configuration

### Response Modes
```yaml
onReceived:
  description: Respond immediately when received
  use_when: Sender needs quick acknowledgment
  response: Automatic 200 OK

lastNode:
  description: Wait for workflow to complete
  use_when: Need to send processing result
  response: From Respond to Webhook node
```

### Response to Webhook Node
```yaml
node: Respond to Webhook
settings:
  respondWith: "firstIncomingItem" | "allIncomingItems" | "custom"
  responseCode: 200  # Can customize
  responseHeaders: {}  # Custom headers

custom_response: |
  {
    "success": true,
    "message": "Event processed",
    "id": "{{ $json.processedId }}"
  }
```

### Error Responses
```yaml
pattern: Proper error status codes
codes:
  200: Success
  202: Accepted (async processing)
  400: Bad request (invalid payload)
  401: Unauthorized (auth failed)
  403: Forbidden (not allowed)
  429: Too many requests
  500: Internal error
```

## Testing Webhooks

### Test Mode
```yaml
steps:
  1. Use webhook-test URL during development
  2. Send test requests with curl/Postman
  3. Verify processing in executions
  4. Switch to production URL when ready
```

### Test Command
```bash
# Test webhook with curl
curl -X POST https://your-n8n.com/webhook-test/my-webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"event": "test", "data": {"foo": "bar"}}'
```

### Mock Data for Testing
```json
{
  "event": "order.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "ORD-123",
    "customer": "test@example.com",
    "total": 99.99
  }
}
```

## Handler Usage

When configuring webhooks:
1. Define the endpoint path
2. Choose authentication method
3. Implement input validation
4. Set appropriate response mode
5. Add error handling
6. Test with sample payloads
7. Document for external consumers
