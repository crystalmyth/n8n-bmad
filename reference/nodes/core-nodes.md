# Core n8n Nodes Reference

This document provides a comprehensive reference for the most commonly used core nodes in n8n workflows. These nodes form the foundation of most automation workflows.

## Table of Contents

- [Trigger Nodes](#trigger-nodes)
- [Flow Control Nodes](#flow-control-nodes)
- [Data Transformation Nodes](#data-transformation-nodes)
- [HTTP and API Nodes](#http-and-api-nodes)
- [Code and Script Nodes](#code-and-script-nodes)
- [Data Storage Nodes](#data-storage-nodes)
- [Utility Nodes](#utility-nodes)

---

## Trigger Nodes

### Manual Trigger

Starts workflow execution manually from the n8n UI.

**Use Cases:**
- Testing and development
- One-time manual operations
- Admin-triggered processes

**Configuration:**
- No configuration required
- Click "Execute Workflow" to trigger

**Tips:**
- Combine with test data using Set node
- Use for debugging before switching to scheduled triggers

---

### Schedule Trigger

Executes workflow on a defined schedule (cron-based).

**Use Cases:**
- Daily reports
- Periodic data sync
- Scheduled maintenance tasks

**Configuration Options:**
| Option | Description |
|--------|-------------|
| Trigger Interval | Simple intervals (minutes, hours, days) |
| Cron Expression | Advanced scheduling with cron syntax |
| Timezone | Timezone for schedule evaluation |

**Common Cron Examples:**
```
0 9 * * *        - Daily at 9:00 AM
0 */2 * * *      - Every 2 hours
0 0 * * 0        - Weekly on Sunday at midnight
0 0 1 * *        - Monthly on the 1st at midnight
*/15 * * * *     - Every 15 minutes
```

**Tips:**
- Always set timezone explicitly
- Consider business hours for notifications
- Use "Trigger Interval" for simple cases

---

### Webhook

Receives HTTP requests to trigger workflow execution.

**Use Cases:**
- API endpoints for external systems
- Form submissions
- Third-party integrations
- Real-time event handling

**Configuration Options:**
| Option | Description |
|--------|-------------|
| HTTP Method | GET, POST, PUT, DELETE, etc. |
| Path | URL path for the webhook |
| Authentication | None, Basic Auth, Header Auth |
| Response Mode | Immediate, Last Node, Custom |
| Response Code | HTTP status code to return |

**Output Data:**
```javascript
// Accessing webhook data
{{ $json.body }}        // POST body
{{ $json.headers }}     // Request headers
{{ $json.query }}       // Query parameters
{{ $json.params }}      // URL parameters
```

**Tips:**
- Use authentication in production
- Set appropriate response codes
- Validate incoming data early
- Consider rate limiting external webhooks

---

### Email Trigger (IMAP)

Triggers when new emails arrive.

**Use Cases:**
- Email processing automation
- Support ticket creation
- Invoice processing

**Configuration:**
- IMAP server settings
- Mailbox to monitor
- Polling interval

---

## Flow Control Nodes

### IF

Routes items based on conditions.

**Use Cases:**
- Conditional branching
- Error handling paths
- Data validation gates

**Configuration:**
| Option | Description |
|--------|-------------|
| Conditions | Boolean expressions to evaluate |
| Combine | ALL (AND) or ANY (OR) for multiple conditions |

**Condition Types:**
```javascript
// String conditions
{{ $json.status === 'active' }}
{{ $json.email.includes('@company.com') }}
{{ $json.name.startsWith('Test') }}

// Number conditions
{{ $json.amount > 100 }}
{{ $json.count >= 1 && $json.count <= 10 }}

// Boolean conditions
{{ $json.isEnabled === true }}
{{ !$json.isDisabled }}

// Existence checks
{{ $json.optionalField !== undefined }}
{{ $json.items?.length > 0 }}
```

**Outputs:**
- **true** branch: Items where condition is true
- **false** branch: Items where condition is false

**Tips:**
- Keep conditions simple and readable
- Use Code node for complex logic
- Test both branches thoroughly

---

### Switch

Routes items to multiple outputs based on value matching.

**Use Cases:**
- Multi-way branching
- Status-based routing
- Category processing

**Configuration:**
| Option | Description |
|--------|-------------|
| Mode | Rules or Expression |
| Data Type | String, Number, Boolean |
| Fallback Output | Where non-matching items go |

**Example Rules:**
```
Value: {{ $json.status }}
Rules:
  - pending -> Output 0
  - processing -> Output 1
  - completed -> Output 2
  - Fallback -> Output 3
```

**Tips:**
- Always configure fallback for unexpected values
- Use for 3+ conditions (IF for 2)
- Document what each output represents

---

### Merge

Combines data from multiple branches.

**Use Cases:**
- Rejoining split paths
- Combining API results
- Data enrichment

**Mode Options:**
| Mode | Description |
|------|-------------|
| Append | Combine all items sequentially |
| Combine | Match and merge by position or field |
| Choose Branch | Keep items from one branch only |
| Multiplex | Create all possible combinations |

**Combine Options:**
```javascript
// Merge by position
// Item 1 from Input 1 + Item 1 from Input 2

// Merge by field
// Match items where field values are equal
// Input 1: { id: 1, name: "John" }
// Input 2: { id: 1, email: "john@example.com" }
// Result:  { id: 1, name: "John", email: "john@example.com" }
```

**Tips:**
- Ensure data arrives in expected order
- Use Wait node if timing is unpredictable
- Consider what happens with unmatched items

---

### Split In Batches

Processes items in smaller groups.

**Use Cases:**
- API rate limiting
- Batch processing
- Memory management for large datasets

**Configuration:**
| Option | Description |
|--------|-------------|
| Batch Size | Number of items per batch |
| Options | Reset on each batch |

**Pattern:**
```
Split In Batches (size: 10)
    |
    v
Process items (10 at a time)
    |
    v
Loop back to Split In Batches
```

**Tips:**
- Add Wait node between batches for rate limiting
- Track progress with Set node
- Consider what happens if batch fails

---

### Loop Over Items

Iterates over each item individually.

**Use Cases:**
- Sequential processing requirements
- Complex per-item operations
- When order matters

**Tips:**
- Use only when parallel processing won't work
- Most nodes already handle multiple items
- Consider performance implications

---

### Wait

Pauses workflow execution.

**Use Cases:**
- Rate limiting API calls
- Waiting for external processes
- Timed delays between actions

**Configuration:**
| Option | Description |
|--------|-------------|
| Resume | After Time Interval, At Specific Time, On Webhook |
| Amount | Duration to wait |
| Unit | Seconds, Minutes, Hours, Days |

**Tips:**
- Keep waits short (webhook timeout considerations)
- Use for API rate limiting between calls
- Consider async patterns for long waits

---

## Data Transformation Nodes

### Set

Creates or modifies fields on items.

**Use Cases:**
- Adding new fields
- Renaming fields
- Setting default values
- Data normalization

**Mode Options:**
| Mode | Description |
|--------|-------------|
| Manual Mapping | Define fields individually |
| JSON | Provide raw JSON |

**Examples:**
```javascript
// Add new field
fullName: {{ $json.firstName + ' ' + $json.lastName }}

// Transform existing field
email: {{ $json.email.toLowerCase() }}

// Add timestamp
processedAt: {{ DateTime.now().toISO() }}

// Conditional field
status: {{ $json.score >= 70 ? 'pass' : 'fail' }}
```

**Tips:**
- Use "Keep Only Set" to remove unwanted fields
- Combine with expressions for transformations
- Document field purposes with comments

---

### Edit Fields (Set Node v2)

Modern version of Set node with improved UX.

**Features:**
- Visual field mapping
- Type validation
- Drag-and-drop field ordering
- Duplicate detection

---

### Rename Keys

Renames object property names.

**Use Cases:**
- API response normalization
- Field name standardization
- Integration mapping

**Configuration:**
```
Old Name -> New Name
user_id -> userId
first_name -> firstName
e-mail -> email
```

---

### Item Lists

Operations on item lists (arrays).

**Operations:**
| Operation | Description |
|-----------|-------------|
| Aggregate | Combine items into single item |
| Limit | Keep first/last N items |
| Remove Duplicates | Deduplicate by field |
| Sort | Order items by field |
| Split Out | Convert array field to items |
| Summarize | Calculate aggregates |

**Examples:**
```javascript
// Aggregate: Combine all emails into array
[{ email: 'a@test.com' }, { email: 'b@test.com' }]
-> { emails: ['a@test.com', 'b@test.com'] }

// Split Out: Expand array to items
{ tags: ['a', 'b', 'c'] }
-> { tags: 'a' }, { tags: 'b' }, { tags: 'c' }

// Summarize: Calculate totals
Sum of 'amount' grouped by 'category'
```

---

### Sort

Orders items by field values.

**Use Cases:**
- Prioritizing items
- Chronological ordering
- Alphabetical sorting

**Options:**
- Ascending/Descending
- Multiple sort fields
- Case-sensitive option

---

### Filter

Keeps only items matching conditions.

**Use Cases:**
- Data validation
- Removing unwanted records
- Conditional processing

**Difference from IF:**
- IF: Routes ALL items to two branches
- Filter: Keeps only matching items (single output)

---

### Remove Duplicates

Eliminates duplicate items.

**Configuration:**
| Option | Description |
|--------|-------------|
| Compare | All Fields or Selected Fields |
| Keep | First or Last occurrence |

---

## HTTP and API Nodes

### HTTP Request

Makes HTTP requests to any API.

**Use Cases:**
- REST API integration
- Custom webhook calls
- File downloads
- Any HTTP operation

**Configuration Options:**
| Option | Description |
|--------|-------------|
| Method | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS |
| URL | Endpoint URL (supports expressions) |
| Authentication | Various auth methods |
| Headers | Custom HTTP headers |
| Query Parameters | URL query string |
| Body | Request body (for POST, PUT, etc.) |
| Options | Timeout, redirects, SSL, etc. |

**Authentication Types:**
- None
- Basic Auth
- Header Auth
- OAuth1, OAuth2
- API Key (header or query)
- Custom

**Body Content Types:**
```javascript
// JSON (most common)
{
  "name": "{{ $json.name }}",
  "email": "{{ $json.email }}"
}

// Form Data
name={{ $json.name }}&email={{ $json.email }}

// Binary (for file uploads)
// Use binary data from previous node
```

**Response Handling:**
```javascript
// Access response
{{ $json }}              // Full response body
{{ $json.data }}         // Nested data
{{ $response.statusCode }}  // HTTP status
{{ $response.headers }}     // Response headers
```

**Tips:**
- Use credentials for sensitive data
- Set appropriate timeouts
- Handle errors with Error Trigger
- Use pagination for large datasets

---

### Webhook Response

Sends custom response to webhook caller.

**Use Cases:**
- Custom API responses
- Dynamic response codes
- Returning processed data

**Configuration:**
| Option | Description |
|--------|-------------|
| Response Code | HTTP status code |
| Response Headers | Custom headers |
| Response Body | Data to return |

---

## Code and Script Nodes

### Code

Executes custom JavaScript code.

**Use Cases:**
- Complex data transformations
- Custom business logic
- Operations not available in other nodes
- Async operations

**Modes:**
| Mode | Description |
|------|-------------|
| Run Once for All Items | Process all items together |
| Run Once for Each Item | Process items individually |

**Run Once for All Items:**
```javascript
// Access all input items
const items = $input.all();

// Process and return new items
const results = items.map(item => ({
  json: {
    originalId: item.json.id,
    processed: true,
    timestamp: new Date().toISOString()
  }
}));

return results;
```

**Run Once for Each Item:**
```javascript
// Access current item
const item = $input.item;

// Return modified item
return {
  json: {
    ...item.json,
    processed: true
  }
};
```

**Available Objects:**
```javascript
$input.all()      // All input items
$input.item       // Current item (in each item mode)
$json             // Current item's JSON (shorthand)
$node             // Current node info
$workflow         // Workflow info
$execution        // Execution info
$env              // Environment variables
$now              // Current DateTime
$today            // Today at midnight

// For accessing other nodes
$('Node Name').all()
$('Node Name').first()
$('Node Name').last()
```

**Tips:**
- Use for complex logic only
- Keep code readable and documented
- Handle errors appropriately
- Test with various input scenarios

---

### Execute Command

Runs shell commands on the n8n server.

**Use Cases:**
- System operations
- Running scripts
- CLI tool integration

**Security Note:**
- Only available in self-hosted n8n
- Be extremely careful with user input
- Validate and sanitize all parameters

---

### Function (Legacy)

Older code node (use Code node instead).

**Migration:**
```javascript
// Old Function node
return items.map(item => {
  item.json.newField = 'value';
  return item;
});

// New Code node
return $input.all().map(item => ({
  json: { ...item.json, newField: 'value' }
}));
```

---

## Data Storage Nodes

### Postgres / MySQL / MongoDB

Database operations.

**Common Operations:**
| Operation | Description |
|-----------|-------------|
| Insert | Add new records |
| Update | Modify existing records |
| Delete | Remove records |
| Select | Query records |
| Execute Query | Run raw SQL |

**Best Practices:**
- Use parameterized queries
- Limit result sets
- Index queried fields
- Use connection pooling

---

### Google Sheets

Read and write Google Sheets data.

**Operations:**
| Operation | Description |
|-----------|-------------|
| Append | Add rows to sheet |
| Read | Get data from sheet |
| Update | Modify existing rows |
| Clear | Remove data |
| Delete | Remove rows |

**Tips:**
- Use header row for column names
- Consider rate limits
- Use batch operations for multiple rows

---

### Airtable

Interact with Airtable bases.

**Operations:**
- List records
- Create records
- Update records
- Delete records

---

### Redis

Key-value storage operations.

**Use Cases:**
- Caching
- Session management
- Rate limiting
- Temporary data storage

---

## Utility Nodes

### No Operation (NoOp)

Does nothing - passes items through unchanged.

**Use Cases:**
- Placeholder in workflow design
- Conditional path that needs no action
- Debugging breakpoints

---

### Respond to Webhook

Returns data to webhook caller (alternative to Webhook Response).

**Use Cases:**
- Immediate webhook responses
- Streaming responses
- Custom headers

---

### Error Trigger

Catches errors from workflow execution.

**Use Cases:**
- Error notifications
- Error logging
- Graceful error handling
- Retry logic

**Error Data:**
```javascript
{{ $json.error.message }}      // Error message
{{ $json.error.stack }}        // Stack trace
{{ $json.workflow.name }}      // Workflow name
{{ $json.execution.id }}       // Execution ID
{{ $json.node.name }}          // Failed node name
```

**Tips:**
- Always have an error handling strategy
- Log errors for debugging
- Notify appropriate people
- Consider retry patterns

---

### Execute Workflow

Runs another workflow.

**Use Cases:**
- Modular workflow design
- Reusable workflow components
- Sub-processes

**Configuration:**
| Option | Description |
|--------|-------------|
| Workflow | Workflow to execute |
| Mode | Call immediately or queue |
| Input Data | Data to pass to sub-workflow |

**Tips:**
- Use for truly reusable processes
- Consider data passing carefully
- Handle sub-workflow errors

---

### DateTime

Date and time operations.

**Operations:**
| Operation | Description |
|-----------|-------------|
| Calculate | Add/subtract time |
| Format | Change date format |
| Get Current | Current date/time |
| Round | Round to unit |
| Subtract | Get difference |

**Tips:**
- Consider timezones explicitly
- Use expressions for complex operations
- See [Date/Time Reference](../expressions/date-time.md)

---

### Crypto

Cryptographic operations.

**Operations:**
- Hash data
- Encrypt/Decrypt
- Sign data
- Generate HMAC

---

### Compression

Compress and decompress data.

**Operations:**
- Gzip
- Zip
- Tar

---

### XML

XML parsing and generation.

**Operations:**
- XML to JSON
- JSON to XML

---

### HTML

HTML parsing and extraction.

**Operations:**
- Extract content
- Generate HTML

**Use Cases:**
- Web scraping
- Email template generation
- Document processing

---

## Node Execution Order

Understanding execution order is crucial:

1. **Trigger nodes** start execution
2. **Connected nodes** execute left-to-right, top-to-bottom
3. **Branches** execute in parallel by default
4. **Wait nodes** pause execution
5. **Merge nodes** wait for all inputs

**Tips:**
- Design for parallel execution where possible
- Use Wait only when necessary
- Consider data dependencies

---

## See Also

- [Expression Reference](../expressions/common-patterns.md)
- [Naming Conventions](../conventions/naming-conventions.md)
- [n8n Official Documentation](https://docs.n8n.io/)
