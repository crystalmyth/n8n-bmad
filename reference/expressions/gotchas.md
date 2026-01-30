# Common Expression Gotchas in n8n

This document covers common mistakes, pitfalls, and "gotchas" when working with n8n expressions. Understanding these will help you write more reliable workflows.

## Table of Contents

- [Data Access Errors](#data-access-errors)
- [Type Coercion Issues](#type-coercion-issues)
- [Array and Object Pitfalls](#array-and-object-pitfalls)
- [Date and Time Gotchas](#date-and-time-gotchas)
- [Expression Syntax Errors](#expression-syntax-errors)
- [Node Reference Issues](#node-reference-issues)
- [Performance Issues](#performance-issues)
- [Scope and Context Issues](#scope-and-context-issues)
- [Common Debugging Techniques](#common-debugging-techniques)

---

## Data Access Errors

### Undefined Property Access

**Problem**: Accessing properties on undefined values causes errors.

```javascript
// WRONG - Will error if user is undefined
{{ $json.user.email }}

// CORRECT - Use optional chaining
{{ $json.user?.email }}

// CORRECT - With default value
{{ $json.user?.email ?? 'no-email' }}
```

### Array Index Out of Bounds

**Problem**: Accessing array indices that don't exist.

```javascript
// WRONG - Might be undefined or error
{{ $json.items[5] }}

// CORRECT - Safe access
{{ $json.items?.[5] }}

// CORRECT - Check length first
{{ $json.items?.length > 5 ? $json.items[5] : null }}

// CORRECT - Use at() with fallback
{{ $json.items?.at(5) ?? 'default' }}
```

### Empty Array/Object Checks

**Problem**: Treating empty arrays/objects as falsy.

```javascript
// WRONG - Empty arrays are truthy!
{{ $json.items ? 'has items' : 'no items' }}
// [] is truthy, so this returns 'has items'

// CORRECT - Check length
{{ $json.items?.length > 0 ? 'has items' : 'no items' }}

// WRONG - Empty objects are truthy!
{{ $json.data ? 'has data' : 'no data' }}
// {} is truthy

// CORRECT - Check keys
{{ Object.keys($json.data ?? {}).length > 0 ? 'has data' : 'no data' }}
```

### Case Sensitivity

**Problem**: Property names are case-sensitive.

```javascript
// These are all different properties:
{{ $json.userId }}    // undefined if key is 'UserId'
{{ $json.UserId }}    // undefined if key is 'userId'
{{ $json.USERID }}    // undefined if key is 'userId'

// Check actual key names in your data!
```

---

## Type Coercion Issues

### String vs Number Comparisons

**Problem**: Comparing strings and numbers can yield unexpected results.

```javascript
// WRONG - String comparison
{{ $json.id == '123' }}  // Works but inconsistent
{{ $json.id === 123 }}   // False if id is "123" (string)

// CORRECT - Explicit conversion
{{ Number($json.id) === 123 }}
{{ String($json.id) === '123' }}
{{ parseInt($json.id, 10) === 123 }}
```

### Boolean Coercion Surprises

**Problem**: Understanding what values are falsy.

```javascript
// Falsy values in JavaScript:
// false, 0, '', null, undefined, NaN

// WRONG - This will use default for 0 and ''
{{ $json.count || 10 }}  // Returns 10 if count is 0

// CORRECT - Only default for null/undefined
{{ $json.count ?? 10 }}  // Keeps 0 if count is 0

// WRONG - Empty string is falsy
{{ $json.name || 'Anonymous' }}  // Replaces '' with 'Anonymous'

// CORRECT - If you want to keep empty strings
{{ $json.name ?? 'Anonymous' }}
```

### Number Parsing Gotchas

**Problem**: parseInt and parseFloat behaviors.

```javascript
// GOTCHA - parseInt stops at first non-numeric
{{ parseInt('123abc') }}  // Returns 123, not error!

// GOTCHA - parseInt needs radix for safety
{{ parseInt('08') }}      // Could be 0 in old JS (octal)
{{ parseInt('08', 10) }}  // Always 8 (decimal)

// GOTCHA - parseFloat with comma decimals
{{ parseFloat('1,234.56') }}  // Returns 1, not 1234.56!
{{ parseFloat('1234.56') }}   // Returns 1234.56

// CORRECT - Remove commas first
{{ parseFloat($json.amount.replace(/,/g, '')) }}

// GOTCHA - Number() is stricter
{{ Number('123abc') }}  // Returns NaN
{{ Number('123') }}     // Returns 123
```

### JSON String vs Object

**Problem**: Confusing JSON strings with objects.

```javascript
// WRONG - Trying to access property on string
{{ $json.data.name }}  // Error if data is '{"name":"John"}'

// CORRECT - Parse JSON string first
{{ JSON.parse($json.data).name }}

// CHECK - Is it already an object?
{{ typeof $json.data === 'string' ? JSON.parse($json.data) : $json.data }}
```

---

## Array and Object Pitfalls

### Array Mutation

**Problem**: sort() and reverse() mutate the original array.

```javascript
// WRONG - Mutates original array
{{ $json.items.sort() }}

// CORRECT - Create copy first
{{ $json.items.slice().sort() }}
{{ [...$json.items].sort() }}
{{ $json.items.toSorted() }}  // ES2023
```

### forEach Returns Undefined

**Problem**: Using forEach expecting a return value.

```javascript
// WRONG - forEach returns undefined
{{ $json.items.forEach(item => item.name) }}

// CORRECT - Use map for transformations
{{ $json.items.map(item => item.name) }}
```

### Object Spread Overwrites

**Problem**: Understanding spread operator order.

```javascript
// Later properties overwrite earlier ones
{{ { a: 1, ...$json } }}  // $json.a will overwrite a: 1
{{ { ...$json, a: 1 } }}  // a: 1 will overwrite $json.a

// GOTCHA - Nested objects are shallow copied
{{ { ...$json, nested: { ...$json.nested, newProp: 'value' } } }}
```

### Array includes() Type Matching

**Problem**: includes() uses strict equality.

```javascript
// WRONG - Type mismatch
{{ [1, 2, 3].includes('2') }}  // false! (string vs number)

// CORRECT - Ensure same type
{{ [1, 2, 3].includes(Number($json.value)) }}
{{ ['1', '2', '3'].includes(String($json.value)) }}

// GOTCHA - Objects are compared by reference
{{ [{a:1}].includes({a:1}) }}  // false! Different object references
```

### find() Returns Undefined

**Problem**: Not handling when find() doesn't match.

```javascript
// WRONG - Accessing property on potentially undefined
{{ $json.users.find(u => u.id === 999).name }}

// CORRECT - Handle undefined case
{{ $json.users.find(u => u.id === 999)?.name ?? 'Not found' }}
```

---

## Date and Time Gotchas

### Invalid Date Parsing

**Problem**: Parsing dates that don't exist or are ambiguous.

```javascript
// GOTCHA - Ambiguous date format
{{ DateTime.fromISO('01/02/2024') }}  // Invalid! ISO expects yyyy-MM-dd

// CORRECT - Use fromFormat for non-ISO
{{ DateTime.fromFormat('01/02/2024', 'MM/dd/yyyy') }}

// GOTCHA - Invalid dates might not error
{{ DateTime.fromISO('2024-02-30') }}  // Feb 30 doesn't exist!
// Always check: .isValid

// CORRECT - Validate parsed dates
{{ DateTime.fromISO($json.date).isValid ? DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') : 'Invalid' }}
```

### Timezone Confusion

**Problem**: Timezone handling inconsistencies.

```javascript
// GOTCHA - Local vs UTC
{{ DateTime.now().toISO() }}      // Local time with offset
{{ DateTime.utc().toISO() }}      // UTC time

// GOTCHA - Parsing assumes local timezone
{{ DateTime.fromISO('2024-03-15') }}  // Midnight in LOCAL timezone

// CORRECT - Explicit timezone
{{ DateTime.fromISO('2024-03-15', { zone: 'utc' }) }}
{{ DateTime.fromISO('2024-03-15T00:00:00Z') }}  // Z = UTC
```

### Date Comparison Failures

**Problem**: Comparing DateTime objects incorrectly.

```javascript
// WRONG - Object comparison doesn't work
{{ DateTime.now() === DateTime.now() }}  // Always false!

// CORRECT - Compare timestamps
{{ DateTime.now().toMillis() >= DateTime.fromISO($json.date).toMillis() }}

// CORRECT - Use comparison methods
{{ DateTime.fromISO($json.date1) < DateTime.fromISO($json.date2) }}
{{ DateTime.fromISO($json.date1).equals(DateTime.fromISO($json.date2)) }}
```

### Month Numbering

**Problem**: Months are 1-indexed in Luxon (unlike JavaScript Date).

```javascript
// Luxon: January = 1, December = 12
{{ DateTime.local(2024, 1, 15) }}  // January 15, 2024

// JavaScript Date: January = 0, December = 11
{{ new Date(2024, 0, 15) }}  // January 15, 2024

// Don't mix them up!
```

---

## Expression Syntax Errors

### Quote Mismatches

**Problem**: Mixing quote types incorrectly.

```javascript
// WRONG - Quote mismatch
{{ 'Hello "World' }}  // Unclosed string

// CORRECT - Match quotes or escape
{{ 'Hello "World"' }}
{{ "Hello 'World'" }}
{{ 'Hello \'World\'' }}
{{ `Hello "World" and 'Everyone'` }}  // Template literals accept both
```

### Missing Expression Brackets

**Problem**: Forgetting parts of expression syntax.

```javascript
// WRONG - Missing closing brackets
{{ $json.name }   // Syntax error
{ $json.name }}   // Syntax error

// CORRECT
{{ $json.name }}
```

### Reserved Words in Property Names

**Problem**: Using JavaScript reserved words as property names.

```javascript
// WRONG - If property name is a reserved word
{{ $json.class }}  // Might cause issues

// CORRECT - Use bracket notation
{{ $json['class'] }}
{{ $json['default'] }}
{{ $json['return'] }}
```

### Template Literal Escaping

**Problem**: Special characters in template literals.

```javascript
// GOTCHA - Dollar signs need escaping in some contexts
{{ `Price: $${$json.price}` }}  // Works
{{ `Price: \${$json.price}` }}  // Literal ${...}

// GOTCHA - Backticks in template literals
{{ `Code: \`example\`` }}  // Use backslash to escape
```

---

## Node Reference Issues

### Node Name Changes

**Problem**: Renaming nodes breaks references.

```javascript
// If you rename "HTTP Request" to "Fetch Data"
{{ $('HTTP Request').item.json }}  // BREAKS!
{{ $('Fetch Data').item.json }}    // New reference needed

// TIP: Use consistent naming conventions
// TIP: Search for node name before renaming
```

### Node Not Executed

**Problem**: Referencing nodes that haven't run in the current execution.

```javascript
// WRONG - Node might not have run in this branch
{{ $('Optional Node').item.json.value }}

// CORRECT - Check if node has data
{{ $('Optional Node').all().length > 0 ? $('Optional Node').item.json.value : 'default' }}
```

### Multiple Runs Reference

**Problem**: Confusing current run with all runs.

```javascript
// Gets all items ever processed by node
{{ $('Node').all() }}

// Gets current item being processed
{{ $('Node').item }}

// In a loop, be careful which you need!
```

### $input vs $json

**Problem**: Confusing when to use $input vs $json.

```javascript
// $json is shorthand for current item's json
{{ $json.name }}
// Same as:
{{ $input.item.json.name }}

// $input gives access to methods
{{ $input.all() }}        // All items
{{ $input.first() }}      // First item
{{ $input.last() }}       // Last item

// In most cases, $json is what you want for the current item
```

---

## Performance Issues

### Repeated Expensive Operations

**Problem**: Calling expensive operations multiple times.

```javascript
// WRONG - Calls filter 3 times
{{ {
  count: $json.items.filter(i => i.active).length,
  first: $json.items.filter(i => i.active)[0],
  ids: $json.items.filter(i => i.active).map(i => i.id)
} }}

// CORRECT - Filter once
{{ (() => {
  const active = $json.items.filter(i => i.active);
  return {
    count: active.length,
    first: active[0],
    ids: active.map(i => i.id)
  };
})() }}
```

### Large Array Operations

**Problem**: Processing very large arrays in expressions.

```javascript
// SLOW - Creating many intermediate arrays
{{ $json.items.filter(x => x.a).map(x => x.b).filter(x => x).sort() }}

// BETTER - Use Code node for complex operations
// Or combine operations
{{ $json.items
  .reduce((acc, x) => {
    if (x.a && x.b) acc.push(x.b);
    return acc;
  }, [])
  .sort() }}
```

### Unnecessary JSON Operations

**Problem**: Stringify/parse when not needed.

```javascript
// WRONG - Unnecessary round-trip
{{ JSON.parse(JSON.stringify($json)) }}

// CORRECT - Spread for shallow copy
{{ { ...$json } }}

// CORRECT - If you need deep copy
{{ structuredClone($json) }}  // Modern JavaScript
```

---

## Scope and Context Issues

### Variable Scope in IIFEs

**Problem**: Variables not accessible outside their scope.

```javascript
// WRONG - result is not accessible
{{ (() => {
  const result = process($json);
})() }}
{{ result }}  // undefined or error

// CORRECT - Return the value
{{ (() => {
  const result = process($json);
  return result;
})() }}
```

### Arrow Function Gotchas

**Problem**: Arrow function implicit return confusion.

```javascript
// GOTCHA - Braces require explicit return
{{ $json.items.map(i => { i.name }) }}  // Returns [undefined, undefined, ...]

// CORRECT - Implicit return (no braces)
{{ $json.items.map(i => i.name) }}

// CORRECT - Explicit return with braces
{{ $json.items.map(i => { return i.name; }) }}

// GOTCHA - Returning objects needs parentheses
{{ $json.items.map(i => { name: i.name }) }}  // WRONG - interpreted as label

// CORRECT - Wrap object in parentheses
{{ $json.items.map(i => ({ name: i.name })) }}
```

### Async Operations

**Problem**: Expressions are synchronous.

```javascript
// WRONG - Async doesn't work in expressions
{{ await fetch('https://api.example.com') }}  // Error

// CORRECT - Use HTTP Request node instead
// Or use Code node for async operations
```

---

## Common Debugging Techniques

### Check Data Type

```javascript
// See what type a value is
{{ typeof $json.value }}
{{ Array.isArray($json.data) }}
{{ $json.value === null }}
{{ $json.value === undefined }}
```

### Log Intermediate Values

```javascript
// Return intermediate value to see it
{{ (() => {
  const step1 = $json.items.filter(i => i.active);
  console.log('After filter:', step1);  // Shows in execution
  return step1;
})() }}
```

### Check for Undefined/Null

```javascript
// Detailed null check
{{ {
  isNull: $json.value === null,
  isUndefined: $json.value === undefined,
  isFalsy: !$json.value,
  type: typeof $json.value,
  value: $json.value
} }}
```

### Validate Structure

```javascript
// Check object structure
{{ {
  hasField: 'fieldName' in $json,
  keys: Object.keys($json),
  isEmpty: Object.keys($json).length === 0
} }}

// Check array structure
{{ {
  isArray: Array.isArray($json.items),
  length: $json.items?.length ?? 0,
  firstItem: $json.items?.[0]
} }}
```

### Test Expression Parts

```javascript
// Build expression incrementally
// Step 1: Check data exists
{{ $json.users }}

// Step 2: Check filter works
{{ $json.users.filter(u => u.active) }}

// Step 3: Check map works
{{ $json.users.filter(u => u.active).map(u => u.email) }}

// Step 4: Final expression
{{ $json.users.filter(u => u.active).map(u => u.email).join(', ') }}
```

---

## Quick Reference: Safe Patterns

```javascript
// Safe property access
{{ $json.a?.b?.c ?? 'default' }}

// Safe array access
{{ $json.items?.[0]?.name ?? 'default' }}

// Safe number conversion
{{ Number($json.value) || 0 }}

// Safe array check
{{ Array.isArray($json.items) && $json.items.length > 0 }}

// Safe object check
{{ $json.data && typeof $json.data === 'object' && Object.keys($json.data).length > 0 }}

// Safe string operations
{{ ($json.text ?? '').toLowerCase() }}

// Safe array operations
{{ ($json.items ?? []).map(i => i.name) }}

// Safe date parsing
{{ DateTime.fromISO($json.date).isValid ? DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') : null }}
```

---

## See Also

- [String Methods](./string-methods.md) - String manipulation reference
- [Array Methods](./array-methods.md) - Array operations reference
- [Date/Time Methods](./date-time.md) - Date handling with Luxon
- [Common Patterns](./common-patterns.md) - Proven expression patterns
