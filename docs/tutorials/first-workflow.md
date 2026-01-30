# Build Your First Workflow with n8n-BMAD

This tutorial walks you through building a complete workflow using the n8n-BMAD framework methodology. You will create a webhook-triggered workflow that processes incoming data, calls an external API, and handles errors gracefully.

## What You Will Build

A customer feedback processing workflow that:

1. Receives feedback via webhook
2. Validates the incoming data
3. Enriches the feedback with sentiment analysis
4. Stores the result in a database
5. Sends a notification on completion or error

## Prerequisites

- n8n-BMAD installed and configured ([Getting Started](getting-started.md))
- An n8n instance running
- Basic familiarity with n8n

## Step 1: Define Requirements with the Product Owner Agent

Start by loading the Product Owner agent to define clear requirements:

```bash
n8n-bmad agent load po
```

Create a user story for your workflow. Generate a story template:

```bash
n8n-bmad template generate story --output ./docs/feedback-story.md
```

Edit the template with your requirements:

```markdown
# User Story: Customer Feedback Processing

**As a** customer success manager,
**I want** customer feedback to be automatically processed and categorized,
**So that** I can quickly identify and respond to negative sentiment.

## Acceptance Criteria

- [ ] Webhook accepts POST requests with JSON payload
- [ ] Validates required fields: customer_id, feedback_text, timestamp
- [ ] Returns 400 error for invalid payloads
- [ ] Analyzes sentiment (positive, neutral, negative)
- [ ] Stores enriched feedback in database
- [ ] Sends Slack notification for negative sentiment
- [ ] Logs all errors with context
- [ ] Processes within 5 seconds
```

## Step 2: Design Architecture with the Architect Agent

Load the Solution Architect agent to design the workflow:

```bash
n8n-bmad agent load architect
```

The architect recommends this architecture:

```
[Webhook Trigger]
       │
       ▼
[Input Validation] ─── (invalid) ──► [Error Response]
       │
       │ (valid)
       ▼
[Sentiment Analysis API]
       │
       ▼
[Enrich Data]
       │
       ▼
[Store in Database]
       │
       ▼
[Check Sentiment] ─── (negative) ──► [Slack Notification]
       │
       │ (positive/neutral)
       ▼
[Success Response]
```

Create an Architecture Decision Record:

```bash
n8n-bmad template generate ADR --output ./docs/adr-001-feedback-workflow.md
```

Document key decisions:

- Using webhook trigger for real-time processing
- External sentiment API for analysis
- PostgreSQL for storage
- Error workflow for centralized error handling

## Step 3: Set Up Error Handling

Before implementing, set up error handling patterns. View the available patterns:

```bash
n8n-bmad pattern show error-notification
```

Import the error notification pattern into n8n:

1. Export the pattern:
   ```bash
   n8n-bmad pattern export error-notification --output ./patterns/error-notification.json
   ```

2. Import into n8n via the UI or API

3. Configure the notification channel (Slack, email, etc.)

4. Note the workflow ID for use as your error workflow

## Step 4: Implement the Workflow

Load the Developer agent for implementation guidance:

```bash
n8n-bmad agent load developer
```

### 4.1 Create the Webhook Trigger

In n8n, create a new workflow and add a Webhook node:

- **HTTP Method**: POST
- **Path**: `feedback`
- **Response Mode**: Last Node

The webhook URL will be: `https://your-n8n.com/webhook/feedback`

### 4.2 Add Input Validation

Add a Code node named "Validate Input":

```javascript
const input = $input.first().json;
const errors = [];

// Check required fields
if (!input.customer_id) {
  errors.push('customer_id is required');
}
if (!input.feedback_text) {
  errors.push('feedback_text is required');
}
if (!input.timestamp) {
  errors.push('timestamp is required');
}

// Validate types
if (input.customer_id && typeof input.customer_id !== 'string') {
  errors.push('customer_id must be a string');
}
if (input.feedback_text && typeof input.feedback_text !== 'string') {
  errors.push('feedback_text must be a string');
}

if (errors.length > 0) {
  return {
    valid: false,
    errors: errors,
    statusCode: 400
  };
}

return {
  valid: true,
  data: {
    customer_id: input.customer_id,
    feedback_text: input.feedback_text,
    timestamp: input.timestamp,
    received_at: new Date().toISOString()
  }
};
```

### 4.3 Add Conditional Branch

Add an If node to branch on validation result:

- **Condition**: `{{ $json.valid }}` equals `true`

### 4.4 Handle Invalid Input

On the "false" branch, add a Respond to Webhook node:

- **Response Code**: `{{ $json.statusCode }}`
- **Response Body**:
  ```json
  {
    "success": false,
    "errors": {{ $json.errors }}
  }
  ```

### 4.5 Call Sentiment Analysis API

On the "true" branch, add an HTTP Request node:

- **Method**: POST
- **URL**: `https://api.sentiment-service.com/analyze`
- **Body**:
  ```json
  {
    "text": "{{ $json.data.feedback_text }}"
  }
  ```
- **Retry on Fail**: Yes
- **Max Retries**: 3
- **Wait Between Retries**: 1000ms (exponential backoff)

### 4.6 Enrich the Data

Add a Set node named "Enrich Data":

```javascript
{
  "customer_id": "{{ $('Validate Input').item.json.data.customer_id }}",
  "feedback_text": "{{ $('Validate Input').item.json.data.feedback_text }}",
  "timestamp": "{{ $('Validate Input').item.json.data.timestamp }}",
  "received_at": "{{ $('Validate Input').item.json.data.received_at }}",
  "sentiment": "{{ $json.sentiment }}",
  "sentiment_score": "{{ $json.score }}",
  "processed_at": "{{ $now.toISO() }}"
}
```

### 4.7 Store in Database

Add a PostgreSQL node:

- **Operation**: Insert
- **Table**: customer_feedback
- **Columns**: Map all fields from the enriched data

### 4.8 Check for Negative Sentiment

Add an If node:

- **Condition**: `{{ $json.sentiment }}` equals `negative`

### 4.9 Send Slack Notification

On the "true" (negative sentiment) branch, add a Slack node:

- **Channel**: #customer-alerts
- **Message**:
  ```
  :warning: Negative Feedback Received

  *Customer:* {{ $json.customer_id }}
  *Sentiment Score:* {{ $json.sentiment_score }}
  *Feedback:* {{ $json.feedback_text }}

  View in dashboard: https://dashboard.example.com/feedback/{{ $json.id }}
  ```

### 4.10 Return Success Response

Add a Respond to Webhook node (connect both branches):

```json
{
  "success": true,
  "message": "Feedback processed successfully",
  "sentiment": "{{ $json.sentiment }}"
}
```

### 4.11 Configure Error Workflow

In workflow settings:

1. Go to Settings > Error Workflow
2. Select the error notification workflow you created earlier
3. Enable "Save Failed Executions"

## Step 5: Test the Workflow

Load the QA agent for systematic testing:

```bash
n8n-bmad agent load qa
```

### Test Cases

**Test 1: Valid positive feedback**

```bash
curl -X POST https://your-n8n.com/webhook/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_123",
    "feedback_text": "Great product! Love the new features.",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

Expected: 200 OK, sentiment: positive

**Test 2: Valid negative feedback**

```bash
curl -X POST https://your-n8n.com/webhook/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_456",
    "feedback_text": "Terrible experience. Nothing works.",
    "timestamp": "2024-01-15T10:35:00Z"
  }'
```

Expected: 200 OK, sentiment: negative, Slack notification sent

**Test 3: Invalid payload**

```bash
curl -X POST https://your-n8n.com/webhook/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_789"
  }'
```

Expected: 400 Bad Request with error messages

**Test 4: API timeout (simulate)**

Test error handling by temporarily pointing to an invalid API URL.

Expected: Error workflow triggered, notification sent

## Step 6: Validate and Document

Run validation on your workflow:

```bash
# Export the workflow from n8n
n8n-bmad validate workflow ./exports/feedback-workflow.json
```

The validator checks:

- Naming conventions
- Error handling presence
- Expression syntax
- Security concerns

Generate documentation:

```bash
n8n-bmad task run documentation-generate \
  --workflow ./exports/feedback-workflow.json \
  --output ./docs/feedback-workflow.md
```

## Step 7: Prepare for Deployment

Load the DevOps agent:

```bash
n8n-bmad agent load devops
```

Create a runbook:

```bash
n8n-bmad template generate runbook --output ./docs/feedback-runbook.md
```

Document:

- How to activate/deactivate the workflow
- Environment variables required
- Monitoring and alerting setup
- Rollback procedure

## Summary

In this tutorial, you built a production-ready workflow using the n8n-BMAD methodology:

1. **Requirements** - Defined user story and acceptance criteria with PO agent
2. **Architecture** - Designed workflow structure with Architect agent
3. **Error Handling** - Implemented patterns for robust error handling
4. **Implementation** - Built the workflow with Developer agent guidance
5. **Testing** - Validated with QA agent test cases
6. **Documentation** - Generated docs and runbook for operations

## Next Steps

- [Debug Workflows](../how-to/debug-workflows.md) - Learn debugging techniques
- [Handle Errors](../how-to/handle-errors.md) - Deep dive into error patterns
- [Agent Catalog](../reference/agent-catalog.md) - Explore all available agents

## Complete Node Configuration

For reference, here is the complete workflow structure:

```
1. Webhook (trigger)
   └── 2. Validate Input (code)
       └── 3. Is Valid? (if)
           ├── true → 4. Sentiment API (http)
           │          └── 5. Enrich Data (set)
           │              └── 6. Store in DB (postgres)
           │                  └── 7. Is Negative? (if)
           │                      ├── true → 8. Slack Alert (slack)
           │                      │          └── 9. Success Response (respond)
           │                      └── false → 9. Success Response (respond)
           └── false → 10. Error Response (respond)
```

Error workflow connection: All nodes > Error Workflow > Error Notification Pattern
