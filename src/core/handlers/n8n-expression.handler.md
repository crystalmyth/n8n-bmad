# n8n Expression Handler

> **Purpose:** Parse, validate, and help construct n8n expressions
> **Used by:** Developer, Data Analyst, Integration agents
> **Reference:** n8n expression syntax

## Expression Syntax Reference

### Basic Access
```javascript
// Current node data
{{ $json.fieldName }}
{{ $json.nested.field }}
{{ $json['field-with-dash'] }}

// Binary data
{{ $binary.data.fileName }}

// Execution context
{{ $execution.id }}
{{ $execution.mode }}
{{ $workflow.name }}
{{ $workflow.id }}
```

### Cross-Node References
```javascript
// Reference other node's output
{{ $('Node Name').item.json.field }}
{{ $('Node Name').first().json.field }}
{{ $('Node Name').last().json.field }}
{{ $('Node Name').all() }}

// With item index
{{ $('Node Name').item.json.field }}  // Current item
{{ $('Node Name').all()[0].json.field }}  // First item
```

### Built-in Variables
```javascript
// Date/Time
{{ $now }}                    // Current datetime
{{ $today }}                  // Today at midnight
{{ $now.toISO() }}           // ISO string
{{ $now.format('yyyy-MM-dd') }}

// Environment
{{ $env.MY_VAR }}            // Environment variable

// Execution info
{{ $execution.resumeUrl }}   // For wait nodes
{{ $runIndex }}              // Current run index
{{ $itemIndex }}             // Current item index
```

### Common Functions
```javascript
// String operations
{{ $json.name.toUpperCase() }}
{{ $json.email.toLowerCase() }}
{{ $json.text.includes('search') }}
{{ $json.text.split(',') }}
{{ $json.text.trim() }}
{{ $json.text.replace('old', 'new') }}

// Number operations
{{ Math.round($json.price) }}
{{ Math.floor($json.value) }}
{{ parseFloat($json.amount) }}
{{ parseInt($json.count) }}

// Array operations
{{ $json.items.length }}
{{ $json.items.map(i => i.name) }}
{{ $json.items.filter(i => i.active) }}
{{ $json.items.find(i => i.id === 123) }}
{{ $json.items.join(', ') }}

// Object operations
{{ Object.keys($json.data) }}
{{ Object.values($json.data) }}
{{ JSON.stringify($json.data) }}
{{ JSON.parse($json.jsonString) }}
```

### Conditional Logic
```javascript
// Ternary
{{ $json.status === 'active' ? 'Yes' : 'No' }}

// Nullish coalescing
{{ $json.value ?? 'default' }}

// Optional chaining
{{ $json.user?.email ?? 'no email' }}

// Logical operators
{{ $json.a && $json.b }}
{{ $json.a || $json.b }}
```

## Expression Validation Rules

### Common Errors
```yaml
errors:
  - pattern: "$json"
    fix: "{{ $json }}"
    message: "Expressions must be wrapped in {{ }}"

  - pattern: "{{ $json.field"
    fix: "{{ $json.field }}"
    message: "Missing closing }}"

  - pattern: "{{$"
    fix: "{{ $"
    message: "Add space after {{"

  - pattern: "$('Node')"
    fix: "$('Node Name')"
    message: "Use exact node name with spaces if applicable"
```

### Best Practices
```yaml
practices:
  - rule: "Use optional chaining for potentially undefined paths"
    example: "{{ $json.user?.profile?.name ?? 'Unknown' }}"

  - rule: "Handle empty arrays before accessing"
    example: "{{ $json.items.length > 0 ? $json.items[0].name : 'No items' }}"

  - rule: "Type check before operations"
    example: "{{ typeof $json.count === 'number' ? $json.count * 2 : 0 }}"

  - rule: "Use meaningful variable names in functions"
    example: "{{ $json.users.filter(user => user.active) }}"
```

## Handler Usage

### Expression Help Command (EH)
When user needs expression help:
1. Identify what they're trying to access
2. Determine the source node and data structure
3. Provide the correct expression syntax
4. Include error handling if appropriate

### Expression Validation Command (VE)
When validating an expression:
1. Check syntax (balanced {{ }})
2. Verify node references exist
3. Check for common errors
4. Suggest improvements

### Response Template
```markdown
## Expression: {purpose}

**Expression:**
```javascript
{{ {expression} }}
```

**Explanation:**
{what_it_does}

**Example Output:**
{example_value}

**Error Handling:**
```javascript
{{ {expression_with_fallback} }}
```
```

## Date/Time Expressions

### Common Date Operations
```javascript
// Format dates
{{ $json.date.toFormat('yyyy-MM-dd') }}
{{ $json.date.toFormat('HH:mm:ss') }}
{{ $json.date.toISO() }}
{{ $json.date.toLocaleString() }}

// Date math
{{ $now.plus({ days: 7 }) }}
{{ $now.minus({ hours: 24 }) }}
{{ $now.startOf('day') }}
{{ $now.endOf('month') }}

// Comparisons
{{ $json.date > $now }}
{{ $json.date.diff($now, 'days').days }}

// Parse strings to dates
{{ DateTime.fromISO($json.dateString) }}
{{ DateTime.fromFormat($json.date, 'dd/MM/yyyy') }}
```

### Timezone Handling
```javascript
// Convert timezone
{{ $json.date.setZone('America/New_York') }}
{{ $now.toUTC() }}
{{ DateTime.local().zoneName }}
```
