# Array Methods in n8n Expressions

This reference documents array manipulation methods available in n8n expressions. Arrays are essential for working with multiple items, transforming data, and aggregating results.

## Table of Contents

- [Accessing Array Data](#accessing-array-data)
- [Iterating and Transforming](#iterating-and-transforming)
- [Filtering Arrays](#filtering-arrays)
- [Finding Elements](#finding-elements)
- [Testing Arrays](#testing-arrays)
- [Adding and Removing Elements](#adding-and-removing-elements)
- [Sorting and Reversing](#sorting-and-reversing)
- [Reducing Arrays](#reducing-arrays)
- [Combining Arrays](#combining-arrays)
- [n8n Built-in Array Methods](#n8n-built-in-array-methods)
- [Working with Node Items](#working-with-node-items)

---

## Accessing Array Data

### Basic Array Access

```javascript
// Access array field
{{ $json.items }}

// Access specific index (0-based)
{{ $json.items[0] }}

// Access last element
{{ $json.items[$json.items.length - 1] }}

// Access with at() - supports negative indices
{{ $json.items.at(-1) }}  // Last element
{{ $json.items.at(-2) }}  // Second to last
```

### Safe Array Access

```javascript
// Check if array exists before accessing
{{ $json.items?.[0] }}

// With default value
{{ $json.items?.[0] ?? 'default' }}

// Check length safely
{{ ($json.items ?? []).length }}
```

### Accessing Nested Arrays

```javascript
// Nested array element
{{ $json.data.users[0].emails[0] }}

// Access all items from a node
{{ $('Previous Node').all() }}

// Access specific item from a node
{{ $('Previous Node').item }}
```

---

## Iterating and Transforming

### map()

Transform each element in an array.

```javascript
// Extract a property from each object
{{ $json.users.map(user => user.name) }}
// Input: [{name: "John"}, {name: "Jane"}] -> Output: ["John", "Jane"]

// Transform values
{{ $json.prices.map(price => price * 1.1) }}
// Input: [100, 200] -> Output: [110, 220]

// Create new objects
{{ $json.items.map(item => ({ id: item.id, label: item.name.toUpperCase() })) }}

// With index
{{ $json.items.map((item, index) => ({ ...item, position: index + 1 })) }}
```

### forEach()

Execute a function for each element (doesn't return a new array).

```javascript
// Note: forEach returns undefined, use map() for transformations
// forEach is rarely used directly in n8n expressions
```

### flatMap()

Map and flatten in one step.

```javascript
// Extract and flatten nested arrays
{{ $json.orders.flatMap(order => order.items) }}
// Input: [{items: [1,2]}, {items: [3,4]}] -> Output: [1, 2, 3, 4]
```

---

## Filtering Arrays

### filter()

Create a new array with elements that pass a test.

```javascript
// Filter by condition
{{ $json.users.filter(user => user.active) }}

// Filter by value
{{ $json.items.filter(item => item.status === 'completed') }}

// Filter by multiple conditions
{{ $json.products.filter(p => p.price > 10 && p.inStock) }}

// Filter out empty/null values
{{ $json.values.filter(v => v != null && v !== '') }}

// Filter by string content
{{ $json.emails.filter(email => email.includes('@company.com')) }}
```

### Filter with Index

```javascript
// Get even-indexed elements
{{ $json.items.filter((item, index) => index % 2 === 0) }}

// Get first 5 elements (alternative to slice)
{{ $json.items.filter((item, index) => index < 5) }}
```

### Combining filter() and map()

```javascript
// Filter then transform
{{ $json.users.filter(u => u.active).map(u => u.email) }}

// Get names of high-value orders
{{ $json.orders.filter(o => o.total > 100).map(o => o.customerName) }}
```

---

## Finding Elements

### find()

Return the first element that matches.

```javascript
// Find first match
{{ $json.users.find(user => user.id === 123) }}

// Find by property
{{ $json.products.find(p => p.sku === 'ABC123') }}

// Returns undefined if not found
{{ $json.items.find(i => i.type === 'special') ?? { type: 'default' } }}
```

### findIndex()

Return the index of the first matching element.

```javascript
{{ $json.items.findIndex(item => item.id === targetId) }}
// Returns -1 if not found
```

### findLast() / findLastIndex()

Find from the end of the array.

```javascript
// Find last matching element
{{ $json.logs.findLast(log => log.level === 'error') }}

// Find last matching index
{{ $json.items.findLastIndex(item => item.completed) }}
```

### indexOf() / lastIndexOf()

Find index of a specific value (for primitives).

```javascript
{{ $json.tags.indexOf('important') }}
// Returns -1 if not found

{{ $json.values.lastIndexOf(42) }}
```

---

## Testing Arrays

### includes()

Check if array contains a value.

```javascript
{{ $json.roles.includes('admin') }}
// Output: true or false

// Use in conditions
{{ $json.tags.includes('urgent') ? 'High Priority' : 'Normal' }}
```

### some()

Check if at least one element passes a test.

```javascript
// Check if any user is admin
{{ $json.users.some(user => user.role === 'admin') }}

// Check if any value exceeds threshold
{{ $json.readings.some(r => r > 100) }}
```

### every()

Check if all elements pass a test.

```javascript
// Check if all items are valid
{{ $json.items.every(item => item.validated) }}

// Check if all values are positive
{{ $json.numbers.every(n => n > 0) }}
```

### Array.isArray()

Check if a value is an array.

```javascript
{{ Array.isArray($json.data) }}

// Safe array processing
{{ Array.isArray($json.items) ? $json.items : [] }}
```

---

## Adding and Removing Elements

### slice()

Extract a portion of an array (non-mutating).

```javascript
// First 3 elements
{{ $json.items.slice(0, 3) }}

// From index 2 to end
{{ $json.items.slice(2) }}

// Last 3 elements
{{ $json.items.slice(-3) }}

// Copy array
{{ $json.items.slice() }}
```

### concat()

Combine arrays.

```javascript
{{ $json.array1.concat($json.array2) }}

// Add elements
{{ $json.items.concat(['new item']) }}

// Combine multiple
{{ [].concat($json.arr1, $json.arr2, $json.arr3) }}
```

### Spread Operator

```javascript
// Combine arrays
{{ [...$json.array1, ...$json.array2] }}

// Add elements
{{ [...$json.items, 'new item'] }}

// Insert at beginning
{{ ['first', ...$json.items] }}

// Insert in middle
{{ [...$json.items.slice(0, 2), 'middle', ...$json.items.slice(2)] }}
```

### filter() for Removal

```javascript
// Remove specific value
{{ $json.items.filter(item => item !== 'remove me') }}

// Remove by id
{{ $json.users.filter(user => user.id !== 123) }}

// Remove empty values
{{ $json.items.filter(Boolean) }}
```

---

## Sorting and Reversing

### sort()

Sort array elements.

```javascript
// Sort strings alphabetically
{{ $json.names.slice().sort() }}

// Sort numbers (must provide comparator)
{{ $json.numbers.slice().sort((a, b) => a - b) }}

// Sort descending
{{ $json.numbers.slice().sort((a, b) => b - a) }}

// Sort objects by property
{{ $json.users.slice().sort((a, b) => a.name.localeCompare(b.name)) }}

// Sort by numeric property
{{ $json.products.slice().sort((a, b) => a.price - b.price) }}

// Sort by date
{{ $json.events.slice().sort((a, b) => new Date(a.date) - new Date(b.date)) }}
```

**Important**: Always use `.slice()` before `.sort()` to avoid mutating the original array.

### reverse()

Reverse array order.

```javascript
// Reverse array
{{ $json.items.slice().reverse() }}

// Combine with sort for descending
{{ $json.items.slice().sort().reverse() }}
```

### toSorted() / toReversed() (ES2023)

Non-mutating versions.

```javascript
{{ $json.numbers.toSorted((a, b) => a - b) }}
{{ $json.items.toReversed() }}
```

---

## Reducing Arrays

### reduce()

Reduce array to a single value.

```javascript
// Sum numbers
{{ $json.numbers.reduce((sum, n) => sum + n, 0) }}
// Input: [1, 2, 3, 4] -> Output: 10

// Calculate average
{{ $json.numbers.reduce((sum, n) => sum + n, 0) / $json.numbers.length }}

// Find max value
{{ $json.numbers.reduce((max, n) => n > max ? n : max, -Infinity) }}

// Find min value
{{ $json.numbers.reduce((min, n) => n < min ? n : min, Infinity) }}

// Count occurrences
{{ $json.items.reduce((counts, item) => {
  counts[item] = (counts[item] || 0) + 1;
  return counts;
}, {}) }}

// Group by property
{{ $json.users.reduce((groups, user) => {
  const key = user.department;
  groups[key] = groups[key] || [];
  groups[key].push(user);
  return groups;
}, {}) }}

// Flatten nested arrays
{{ $json.nested.reduce((flat, arr) => flat.concat(arr), []) }}

// Build object from array
{{ $json.pairs.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}) }}
```

### reduceRight()

Reduce from right to left.

```javascript
{{ $json.items.reduceRight((acc, item) => acc + item, '') }}
```

---

## Combining Arrays

### flat()

Flatten nested arrays.

```javascript
// Flatten one level
{{ $json.nested.flat() }}
// Input: [[1, 2], [3, 4]] -> Output: [1, 2, 3, 4]

// Flatten multiple levels
{{ $json.deepNested.flat(2) }}

// Flatten all levels
{{ $json.deepNested.flat(Infinity) }}
```

### Removing Duplicates

```javascript
// Using Set (for primitives)
{{ [...new Set($json.tags)] }}
// Input: ["a", "b", "a", "c"] -> Output: ["a", "b", "c"]

// For objects by property
{{ $json.users.filter((user, index, self) =>
  index === self.findIndex(u => u.id === user.id)
) }}
```

### Zipping Arrays

```javascript
// Combine two arrays element-wise
{{ $json.keys.map((key, i) => ({ key, value: $json.values[i] })) }}
```

---

## n8n Built-in Array Methods

### .first() / .last()

```javascript
{{ $json.items.first() }}  // First element
{{ $json.items.last() }}   // Last element
```

### .isEmpty() / .isNotEmpty()

```javascript
{{ $json.items.isEmpty() }}     // true if empty
{{ $json.items.isNotEmpty() }}  // true if has elements
```

### .randomItem()

```javascript
// Get random element
{{ $json.options.randomItem() }}
```

### .unique()

```javascript
// Remove duplicates (n8n helper)
{{ $json.tags.unique() }}
```

### .chunk()

```javascript
// Split into chunks
{{ $json.items.chunk(3) }}
// Input: [1,2,3,4,5,6,7] -> Output: [[1,2,3], [4,5,6], [7]]
```

### .pluck()

```javascript
// Extract property from all objects
{{ $json.users.pluck('email') }}
// Equivalent to: $json.users.map(u => u.email)
```

---

## Working with Node Items

### Accessing All Items

```javascript
// Get all items from a node
{{ $('HTTP Request').all() }}

// Get all items from current input
{{ $input.all() }}
```

### Iterating Over Items

```javascript
// Map over all items
{{ $('Previous Node').all().map(item => item.json.name) }}

// Filter items
{{ $input.all().filter(item => item.json.status === 'active') }}
```

### First/Last Item

```javascript
// First item
{{ $('Node').first() }}

// Last item
{{ $('Node').last() }}

// Specific index
{{ $('Node').item(2) }}
```

### Item Count

```javascript
// Number of items
{{ $input.all().length }}

// Check if items exist
{{ $input.all().length > 0 }}
```

### Current Item Context

```javascript
// Current item in a loop
{{ $json }}

// Current item index
{{ $itemIndex }}

// Total item count
{{ $input.all().length }}
```

---

## Common Real-World Examples

### Extract Unique Emails from Contacts

```javascript
{{ [...new Set($json.contacts.map(c => c.email.toLowerCase()))] }}
```

### Get Top 5 by Score

```javascript
{{ $json.players.slice().sort((a, b) => b.score - a.score).slice(0, 5) }}
```

### Calculate Order Total

```javascript
{{ $json.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) }}
```

### Group Items by Category

```javascript
{{ $json.products.reduce((groups, product) => {
  const cat = product.category;
  return { ...groups, [cat]: [...(groups[cat] || []), product] };
}, {}) }}
```

### Find Users with Multiple Roles

```javascript
{{ $json.users.filter(user => user.roles.length > 1) }}
```

### Merge Arrays of Objects by ID

```javascript
{{ $json.array1.map(item1 => ({
  ...item1,
  ...$json.array2.find(item2 => item2.id === item1.id)
})) }}
```

### Convert Array to Object

```javascript
// Array of objects to keyed object
{{ Object.fromEntries($json.items.map(item => [item.id, item])) }}
```

### Paginate Array

```javascript
// Get page of results
{{ $json.items.slice(($json.page - 1) * $json.pageSize, $json.page * $json.pageSize) }}
```

### Check for Overlapping Values

```javascript
{{ $json.array1.some(item => $json.array2.includes(item)) }}
```

### Create Index Map

```javascript
// Map items to their indices
{{ Object.fromEntries($json.items.map((item, i) => [item, i])) }}
```

---

## Performance Tips

1. **Chain methods efficiently**: `filter().map()` is often better than multiple iterations
2. **Use `find()` instead of `filter()[0]`**: More efficient for finding single items
3. **Use `some()` instead of `filter().length > 0`**: Stops at first match
4. **Avoid sorting large arrays unnecessarily**: Sort operations are O(n log n)
5. **Use `slice()` before `sort()`**: Prevents mutating original data

---

## See Also

- [String Methods](./string-methods.md) - For string manipulation
- [Date/Time Methods](./date-time.md) - For date manipulation with Luxon
- [Common Patterns](./common-patterns.md) - More expression patterns
- [Common Gotchas](./gotchas.md) - Avoid common mistakes
