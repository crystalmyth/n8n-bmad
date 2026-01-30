# Common Expression Patterns in n8n

This reference documents frequently used expression patterns in n8n workflows. These patterns address common data transformation, conditional logic, and integration scenarios.

## Table of Contents

- [Data Access Patterns](#data-access-patterns)
- [Conditional Logic](#conditional-logic)
- [Data Transformation](#data-transformation)
- [Working with Multiple Items](#working-with-multiple-items)
- [JSON Manipulation](#json-manipulation)
- [Error Handling Patterns](#error-handling-patterns)
- [Environment and Context](#environment-and-context)
- [Integration Patterns](#integration-patterns)
- [Advanced Patterns](#advanced-patterns)

---

## Data Access Patterns

### Safe Property Access

```javascript
// Optional chaining for nested properties
{{ $json.user?.profile?.email }}

// With default value
{{ $json.user?.profile?.email ?? 'no-email@example.com' }}

// Deep nesting with multiple fallbacks
{{ $json.response?.data?.results?.[0]?.value ?? $json.fallback ?? 'default' }}
```

### Dynamic Property Access

```javascript
// Access property by variable name
{{ $json[$json.fieldName] }}

// Access nested property dynamically
{{ $json.data[$json.key].value }}

// Build path dynamically
{{ $json['user_' + $json.userId] }}
```

### Accessing Previous Nodes

```javascript
// Get data from specific node
{{ $('HTTP Request').item.json.data }}

// Get all items from a node
{{ $('Split In Batches').all() }}

// Get first/last item
{{ $('Node Name').first().json.id }}
{{ $('Node Name').last().json.status }}

// Access by index
{{ $('Node Name').item(2).json.name }}

// Get items from input
{{ $input.item.json }}
{{ $input.all() }}
```

### Accessing Workflow Data

```javascript
// Current item index
{{ $itemIndex }}

// Total items in current input
{{ $input.all().length }}

// Current run index (in loops)
{{ $runIndex }}

// Workflow name
{{ $workflow.name }}

// Workflow ID
{{ $workflow.id }}

// Execution ID
{{ $execution.id }}

// Execution mode
{{ $execution.mode }}
```

---

## Conditional Logic

### Ternary Operators

```javascript
// Basic ternary
{{ $json.status === 'active' ? 'Enabled' : 'Disabled' }}

// Nested ternary (use sparingly)
{{ $json.score >= 90 ? 'A' : $json.score >= 80 ? 'B' : $json.score >= 70 ? 'C' : 'F' }}

// Ternary with function calls
{{ $json.items.length > 0 ? $json.items.join(', ') : 'No items' }}
```

### Nullish Coalescing

```javascript
// Use default only for null/undefined
{{ $json.value ?? 'default' }}

// Chain multiple fallbacks
{{ $json.primary ?? $json.secondary ?? $json.tertiary ?? 'fallback' }}

// Preserve falsy values (0, '', false)
{{ $json.count ?? 0 }}  // Keeps 0 if count is 0
```

### Logical OR for Defaults

```javascript
// Replaces all falsy values (including 0, '', false)
{{ $json.name || 'Anonymous' }}

// Use for boolean coercion
{{ !!$json.value }}
```

### Complex Conditions

```javascript
// Multiple conditions
{{ $json.age >= 18 && $json.consent === true ? 'Eligible' : 'Not Eligible' }}

// OR conditions
{{ $json.role === 'admin' || $json.role === 'superuser' ? 'Full Access' : 'Limited' }}

// Combination
{{ ($json.type === 'premium' || $json.credits > 100) && $json.active ? 'Proceed' : 'Blocked' }}
```

### Type Checking

```javascript
// Check type
{{ typeof $json.value === 'string' ? $json.value : String($json.value) }}

// Check for array
{{ Array.isArray($json.data) ? $json.data : [$json.data] }}

// Check for object
{{ typeof $json.config === 'object' && $json.config !== null }}

// Check for number
{{ typeof $json.amount === 'number' && !isNaN($json.amount) }}
```

---

## Data Transformation

### Object Construction

```javascript
// Build new object
{{ {
  id: $json.userId,
  name: `${$json.firstName} ${$json.lastName}`,
  email: $json.email.toLowerCase(),
  active: true
} }}

// Conditional properties
{{ {
  ...$json,
  ...(condition ? { extraField: value } : {})
} }}

// Rename keys
{{ {
  userId: $json.id,
  userName: $json.name,
  userEmail: $json.email
} }}
```

### Object Spreading and Merging

```javascript
// Merge objects
{{ { ...$json.defaults, ...$json.overrides } }}

// Add/override properties
{{ { ...$json, updatedAt: DateTime.now().toISO(), status: 'processed' } }}

// Remove properties (destructuring)
{{ (() => {
  const { password, secret, ...rest } = $json;
  return rest;
})() }}
```

### Array to Object

```javascript
// Convert array to keyed object
{{ Object.fromEntries($json.items.map(item => [item.id, item])) }}

// Key-value pairs to object
{{ Object.fromEntries($json.pairs) }}
// Input: [["a", 1], ["b", 2]] -> { a: 1, b: 2 }
```

### Object to Array

```javascript
// Object entries to array
{{ Object.entries($json.data) }}
// Output: [["key1", "value1"], ["key2", "value2"]]

// Object keys
{{ Object.keys($json.config) }}

// Object values
{{ Object.values($json.counts) }}

// Transform to array of objects
{{ Object.entries($json.data).map(([key, value]) => ({ key, value })) }}
```

### Flattening Nested Structures

```javascript
// Flatten one level of arrays
{{ $json.categories.flatMap(cat => cat.items) }}

// Flatten object to dot notation (simple)
{{ (() => {
  const flatten = (obj, prefix = '') =>
    Object.entries(obj).reduce((acc, [key, val]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      return typeof val === 'object' && val !== null && !Array.isArray(val)
        ? { ...acc, ...flatten(val, newKey) }
        : { ...acc, [newKey]: val };
    }, {});
  return flatten($json);
})() }}
```

### Grouping Data

```javascript
// Group by property
{{ $json.orders.reduce((groups, order) => {
  const key = order.status;
  groups[key] = groups[key] || [];
  groups[key].push(order);
  return groups;
}, {}) }}

// Count by category
{{ $json.items.reduce((counts, item) => {
  counts[item.category] = (counts[item.category] || 0) + 1;
  return counts;
}, {}) }}
```

---

## Working with Multiple Items

### Processing All Items

```javascript
// Sum across all items
{{ $input.all().reduce((sum, item) => sum + item.json.amount, 0) }}

// Get all values of a field
{{ $input.all().map(item => item.json.email) }}

// Filter items
{{ $input.all().filter(item => item.json.status === 'active').map(item => item.json) }}
```

### Aggregating Data

```javascript
// Count items
{{ $input.all().length }}

// Sum values
{{ $input.all().reduce((sum, item) => sum + item.json.value, 0) }}

// Average
{{ $input.all().reduce((sum, item) => sum + item.json.value, 0) / $input.all().length }}

// Min/Max
{{ Math.min(...$input.all().map(item => item.json.value)) }}
{{ Math.max(...$input.all().map(item => item.json.value)) }}
```

### Combining Items

```javascript
// Concatenate all arrays
{{ $input.all().flatMap(item => item.json.tags) }}

// Merge all objects
{{ $input.all().reduce((merged, item) => ({ ...merged, ...item.json }), {}) }}

// Create summary object
{{ {
  totalItems: $input.all().length,
  totalValue: $input.all().reduce((sum, item) => sum + item.json.amount, 0),
  ids: $input.all().map(item => item.json.id)
} }}
```

### Cross-Node Data Access

```javascript
// Join data from two nodes
{{ $('Node A').all().map(a => ({
  ...a.json,
  details: $('Node B').all().find(b => b.json.id === a.json.id)?.json
})) }}

// Lookup value from another node
{{ $('Lookup Table').all().find(item => item.json.code === $json.code)?.json.name ?? 'Unknown' }}
```

---

## JSON Manipulation

### Parsing and Stringifying

```javascript
// Parse JSON string
{{ JSON.parse($json.jsonString) }}

// Stringify object
{{ JSON.stringify($json.data) }}

// Pretty print JSON
{{ JSON.stringify($json.data, null, 2) }}

// Safe parse with fallback
{{ (() => {
  try {
    return JSON.parse($json.text);
  } catch {
    return null;
  }
})() }}
```

### Modifying JSON Structure

```javascript
// Pick specific fields
{{ (({ id, name, email }) => ({ id, name, email }))($json) }}

// Omit fields
{{ (({ password, secret, ...rest }) => rest)($json) }}

// Transform nested structure
{{ {
  ...$json,
  user: {
    ...$json.user,
    fullName: `${$json.user.firstName} ${$json.user.lastName}`
  }
} }}
```

### Handling JSON Arrays

```javascript
// Parse array from string
{{ JSON.parse($json.arrayString).map(item => item.name) }}

// Build JSON array string
{{ JSON.stringify($json.items.map(i => i.id)) }}

// Extract from JSON array string
{{ JSON.parse($json.data)[0].value }}
```

---

## Error Handling Patterns

### Safe Access with Fallbacks

```javascript
// Multiple fallback levels
{{ $json.response?.data?.value ?? $json.default ?? 'N/A' }}

// Try-catch wrapper
{{ (() => {
  try {
    return riskyOperation();
  } catch (e) {
    return 'Error: ' + e.message;
  }
})() }}
```

### Validation Checks

```javascript
// Validate before processing
{{ $json.email && $json.email.includes('@') ? $json.email : null }}

// Check array has items
{{ $json.items?.length > 0 ? $json.items[0] : null }}

// Validate number
{{ typeof $json.amount === 'number' && !isNaN($json.amount) ? $json.amount : 0 }}
```

### Default Object Structure

```javascript
// Ensure object structure
{{ {
  id: $json.id ?? null,
  name: $json.name ?? '',
  items: $json.items ?? [],
  metadata: $json.metadata ?? {}
} }}
```

---

## Environment and Context

### Environment Variables

```javascript
// Access environment variable
{{ $env.API_KEY }}

// With fallback
{{ $env.API_URL ?? 'https://api.default.com' }}

// Build URLs from env
{{ `${$env.BASE_URL}/api/v1/users` }}
```

### Execution Context

```javascript
// Check execution mode
{{ $execution.mode === 'manual' ? 'Test Mode' : 'Production' }}

// Use execution ID for tracking
{{ `Request-${$execution.id}` }}

// Timestamp execution
{{ `${$workflow.name}_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}` }}
```

### Node Context

```javascript
// Current node name
{{ $node.name }}

// Previous node name
{{ $prevNode.name }}

// Check which path/branch
{{ $input.first().json._branch ?? 'main' }}
```

---

## Integration Patterns

### Building API Request Bodies

```javascript
// REST API payload
{{ {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${$env.API_TOKEN}`
  },
  body: {
    userId: $json.id,
    action: 'update',
    data: $json.changes
  }
} }}

// GraphQL query
{{ {
  query: `
    query GetUser($id: ID!) {
      user(id: $id) {
        name
        email
      }
    }
  `,
  variables: {
    id: $json.userId
  }
} }}
```

### Building Query Strings

```javascript
// Build query parameters
{{ new URLSearchParams({
  page: $json.page,
  limit: $json.limit,
  sort: $json.sortField,
  order: $json.sortOrder
}).toString() }}
// Output: "page=1&limit=10&sort=name&order=asc"

// Append to URL
{{ `${$env.API_URL}/search?${new URLSearchParams($json.params).toString()}` }}
```

### Webhook Response Formatting

```javascript
// Standard response format
{{ {
  success: true,
  data: $json.result,
  meta: {
    timestamp: DateTime.now().toISO(),
    requestId: $execution.id
  }
} }}

// Error response
{{ {
  success: false,
  error: {
    code: $json.errorCode,
    message: $json.errorMessage
  }
} }}
```

### Database Query Building

```javascript
// Build WHERE clause
{{ $json.filters.map(f => `${f.field} ${f.operator} '${f.value}'`).join(' AND ') }}

// Build INSERT values
{{ $json.records.map(r => `('${r.name}', '${r.email}', ${r.age})`).join(',\n') }}
```

---

## Advanced Patterns

### Memoization Pattern

```javascript
// Compute once and reuse (within expression)
{{ (() => {
  const processed = expensiveOperation($json);
  return {
    result: processed,
    summary: processed.length,
    first: processed[0]
  };
})() }}
```

### Pipeline Pattern

```javascript
// Chain transformations
{{ [
  $json.text,
  s => s.toLowerCase(),
  s => s.trim(),
  s => s.replace(/\s+/g, '-'),
  s => s.replace(/[^a-z0-9-]/g, '')
].reduce((val, fn) => typeof fn === 'function' ? fn(val) : val) }}
```

### State Machine Pattern

```javascript
// Map status to next state
{{ ({
  'draft': 'pending',
  'pending': 'approved',
  'approved': 'completed',
  'rejected': 'draft'
})[$json.currentStatus] ?? $json.currentStatus }}
```

### Template Pattern

```javascript
// Simple template engine
{{ $json.template.replace(/\{\{(\w+)\}\}/g, (_, key) => $json.data[key] ?? '') }}
// Input: { template: "Hello {{name}}", data: { name: "World" } }
// Output: "Hello World"
```

### Recursive Transformation

```javascript
// Deep transform (e.g., convert all strings to uppercase)
{{ (() => {
  const transform = (obj) => {
    if (typeof obj === 'string') return obj.toUpperCase();
    if (Array.isArray(obj)) return obj.map(transform);
    if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, transform(v)])
      );
    }
    return obj;
  };
  return transform($json);
})() }}
```

### Batch Processing Pattern

```javascript
// Split items into batches
{{ (() => {
  const items = $input.all().map(i => i.json);
  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
})() }}
```

### Retry Logic Data

```javascript
// Track retry attempts
{{ {
  attempt: ($json.attempt ?? 0) + 1,
  maxAttempts: 3,
  shouldRetry: ($json.attempt ?? 0) < 3 && $json.error?.retryable,
  backoffMs: Math.pow(2, $json.attempt ?? 0) * 1000
} }}
```

---

## Tips for Complex Expressions

1. **Use IIFE for complex logic**: `{{ (() => { /* complex code */ })() }}`
2. **Break down complex expressions**: Use Code nodes for very complex logic
3. **Test incrementally**: Build expressions piece by piece
4. **Use the expression editor**: Preview results in n8n's expression editor
5. **Document complex expressions**: Add comments in Code nodes
6. **Consider readability**: Sometimes multiple simple nodes are better than one complex expression

---

## See Also

- [String Methods](./string-methods.md) - String manipulation
- [Array Methods](./array-methods.md) - Array operations
- [Date/Time Methods](./date-time.md) - Date handling with Luxon
- [Common Gotchas](./gotchas.md) - Avoid common mistakes
