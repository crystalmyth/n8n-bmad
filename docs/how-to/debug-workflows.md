# How to Debug Workflows

This guide covers practical techniques for finding and fixing issues in n8n workflows using the n8n-BMAD framework tools.

## Quick Debugging Checklist

Before diving deep, check these common issues:

- [ ] Is the workflow active?
- [ ] Are all credentials properly configured?
- [ ] Is the trigger receiving data?
- [ ] Are expressions using the correct syntax?
- [ ] Is there data in the expected format at each node?

## Using the Developer Agent

Load the Developer agent for debugging assistance:

```bash
n8n-bmad agent load developer
n8n-bmad agent menu developer
```

Select "Debug" menu options:
- **R** - Run test execution
- **L** - View execution logs
- **B** - Enter debug mode

## Viewing Execution History

### In n8n UI

1. Open your workflow
2. Click "Executions" in the left panel
3. Find failed executions (marked with red)
4. Click to view execution details

### Via CLI

```bash
# List recent executions
n8n-bmad executions list --workflow <workflow-id> --limit 10

# Get execution details
n8n-bmad executions get <execution-id>
```

## Debugging Node by Node

### Step 1: Identify the Failing Node

Look for nodes with red borders in the execution view. The error message appears when you click the node.

Common indicators:
- **Red node** - Execution error
- **Yellow node** - Warning or partial failure
- **Grey node** - Did not execute (upstream failure or condition not met)

### Step 2: Inspect Input Data

Click on the failing node and check the "Input" tab:

```javascript
// Expected structure
{
  "customer_id": "cust_123",
  "name": "John Doe"
}

// Actual (problematic) structure
{
  "data": {
    "customer_id": "cust_123",
    "name": "John Doe"
  }
}
```

The data might be nested differently than expected.

### Step 3: Verify Expressions

Use the expression editor to test expressions:

1. Click into an expression field
2. Open the expression editor (click the expression icon)
3. Check the preview output

Common expression issues:

```javascript
// Problem: Accessing undefined property
{{ $json.user.name }}  // Error if 'user' is undefined

// Solution: Use optional chaining
{{ $json.user?.name ?? 'Unknown' }}

// Problem: Wrong node reference
{{ $('NodeName').item.json.field }}

// Check: Is the node name exactly correct? (case-sensitive)
```

### Step 4: Check Data Types

Many errors come from type mismatches:

```javascript
// Problem: Expecting string, got number
{{ $json.id }}  // Returns 123 (number)

// Solution: Convert to string
{{ String($json.id) }}

// Problem: Expecting array, got object
{{ $json.items.length }}  // Error if items is not an array

// Solution: Check type first
{{ Array.isArray($json.items) ? $json.items.length : 0 }}
```

## Debugging Specific Issues

### Webhook Not Triggering

1. **Check webhook URL is correct**
   ```bash
   # Test the webhook
   curl -X POST https://your-n8n.com/webhook/your-path \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Check workflow is active**
   - Workflows must be active to receive webhooks
   - Test webhooks work even when inactive

3. **Check for firewall/network issues**
   - Ensure your n8n instance is accessible
   - Check for SSL certificate issues

4. **Verify authentication**
   - If webhook has authentication, include credentials
   - Check for IP whitelisting requirements

### HTTP Request Failures

1. **Check the response status**
   ```javascript
   // View full error in Code node
   const response = $input.first().json;
   console.log('Status:', response.$response?.statusCode);
   console.log('Body:', response.$response?.body);
   ```

2. **Common status codes**
   - `401` - Authentication failed (check credentials)
   - `403` - Forbidden (check permissions)
   - `404` - Endpoint not found (check URL)
   - `429` - Rate limited (add retry with backoff)
   - `500` - Server error (external service issue)

3. **Test the request externally**
   ```bash
   curl -X GET "https://api.example.com/endpoint" \
     -H "Authorization: Bearer your-token" \
     -v
   ```

### Expression Errors

Use the expression validator:

```bash
n8n-bmad task run expression-validate \
  --expression "{{ \$json.items.map(i => i.name) }}"
```

Common fixes:

```javascript
// Problem: Cannot read property of undefined
{{ $json.data.items[0].name }}

// Solution: Add safety checks
{{ $json.data?.items?.[0]?.name ?? 'N/A' }}

// Problem: Unexpected token
{{ $json.items.map(item => { return item.name; }) }}

// Solution: For complex logic, use a Code node instead
```

### Credential Issues

1. **Verify credential is selected**
   - Open the node
   - Check the credential dropdown shows a selection

2. **Test the credential**
   - Try a simple operation with the same credential
   - Check if the credential has expired

3. **Check credential permissions**
   - Ensure the API key/token has required scopes
   - Verify OAuth tokens are not expired

4. **Re-authenticate if needed**
   - Delete and recreate the credential
   - Re-authorize OAuth connections

### Data Flow Issues

Add logging nodes to trace data:

```javascript
// Add a Code node before the problem area
console.log('Input data:', JSON.stringify($input.all(), null, 2));
return $input.all();
```

Or use the Set node to capture intermediate state:

```javascript
{
  "debug_timestamp": "{{ $now.toISO() }}",
  "debug_input": "{{ JSON.stringify($json) }}"
}
```

## Using Validation Tools

### Workflow Review

Run a comprehensive workflow review:

```bash
n8n-bmad task run workflow-review \
  --workflow ./my-workflow.json \
  --review-type thorough
```

The review checks:
- Structure and organization
- Error handling patterns
- Security concerns
- Performance issues
- Best practice violations

### Expression Validation

Validate expressions with sample context:

```bash
n8n-bmad task run expression-validate \
  --expression "{{ \$json.items.filter(i => i.active) }}" \
  --context '{"items": [{"name": "a", "active": true}]}'
```

## Debugging Patterns

### Add Catch-All Error Handler

```
[Main Flow] ─── (error) ──► [Error Handler]
                              │
                              ▼
                        [Log Error Details]
                              │
                              ▼
                        [Send Notification]
```

In the error handler, capture:

```javascript
{
  "error_message": "{{ $json.error?.message }}",
  "error_node": "{{ $json.error?.node }}",
  "execution_id": "{{ $execution.id }}",
  "workflow_name": "{{ $workflow.name }}",
  "timestamp": "{{ $now.toISO() }}",
  "input_data": "{{ JSON.stringify($json.error?.input ?? {}) }}"
}
```

### Test with Sample Data

Create a manual trigger branch for testing:

```
[Manual Trigger] ─── [Sample Data] ───┐
                                      ├──► [Main Logic]
[Webhook Trigger] ────────────────────┘
```

The Sample Data node contains:

```javascript
{
  "customer_id": "test_123",
  "name": "Test User",
  "email": "test@example.com"
}
```

### Isolate Problem Nodes

When debugging complex workflows:

1. Duplicate the workflow
2. Delete nodes after the suspected problem
3. Add a Set node to output the current data
4. Run and inspect

### Use Sticky Notes

Add sticky notes to document:
- Expected data format at key points
- Known issues and workarounds
- Debugging steps you have tried

## Performance Debugging

### Identify Slow Nodes

1. View execution details
2. Check duration for each node
3. Look for nodes taking > 1 second

### Common Performance Issues

1. **Too many sequential API calls**
   ```
   Solution: Use Split in Batches with parallel processing
   ```

2. **Processing unnecessary data**
   ```javascript
   // Before: Processing all fields
   return $input.all();

   // After: Only needed fields
   return $input.all().map(item => ({
     id: item.json.id,
     name: item.json.name
   }));
   ```

3. **Large payload handling**
   ```
   Solution: Stream data or process in chunks
   ```

Run a performance audit:

```bash
n8n-bmad task run performance-audit \
  --workflow ./my-workflow.json
```

## Getting Help

If you are stuck:

1. **Check execution logs** - Often contain the actual error message
2. **Simplify the workflow** - Remove nodes until it works, then add back
3. **Test components independently** - Verify each integration works alone
4. **Use the n8n community forum** - Search for similar issues
5. **Contact support** - For n8n cloud users

## Summary

Effective debugging follows this process:

1. **Identify** - Find the failing node from execution history
2. **Inspect** - Check input data and expression outputs
3. **Isolate** - Test the problem node independently
4. **Fix** - Apply the appropriate solution
5. **Validate** - Run the workflow review to catch other issues
6. **Test** - Verify the fix with multiple test cases

Use the n8n-BMAD validation tools to catch issues before they reach production.
