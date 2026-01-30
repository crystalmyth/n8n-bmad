# String Methods in n8n Expressions

This reference documents common string manipulation methods available in n8n expressions. All examples use the `{{ }}` expression syntax.

## Table of Contents

- [Accessing String Data](#accessing-string-data)
- [Case Transformation](#case-transformation)
- [String Search and Testing](#string-search-and-testing)
- [String Extraction](#string-extraction)
- [String Modification](#string-modification)
- [Splitting and Joining](#splitting-and-joining)
- [Trimming and Padding](#trimming-and-padding)
- [Template Literals](#template-literals)
- [n8n Built-in String Methods](#n8n-built-in-string-methods)

---

## Accessing String Data

### Basic Field Access

```javascript
// Access a string field from input data
{{ $json.name }}

// Access nested string fields
{{ $json.user.email }}

// Access from a specific node
{{ $('HTTP Request').item.json.response.message }}
```

### Safe Access with Optional Chaining

```javascript
// Prevent errors when field might not exist
{{ $json.user?.name }}

// With default value using nullish coalescing
{{ $json.user?.name ?? 'Unknown' }}
```

---

## Case Transformation

### toUpperCase()

Converts all characters to uppercase.

```javascript
// Input: "hello world"
{{ $json.text.toUpperCase() }}
// Output: "HELLO WORLD"
```

### toLowerCase()

Converts all characters to lowercase.

```javascript
// Input: "HELLO WORLD"
{{ $json.text.toLowerCase() }}
// Output: "hello world"
```

### Capitalizing First Letter

```javascript
// Capitalize first letter only
{{ $json.name.charAt(0).toUpperCase() + $json.name.slice(1).toLowerCase() }}
// Input: "jOHN" -> Output: "John"
```

### Title Case (Each Word Capitalized)

```javascript
// Using split, map, and join
{{ $json.text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') }}
// Input: "hello world" -> Output: "Hello World"
```

---

## String Search and Testing

### includes()

Check if a string contains a substring.

```javascript
// Returns true or false
{{ $json.email.includes('@gmail.com') }}

// Use in IF node conditions
{{ $json.status.includes('error') }}
```

### startsWith()

Check if a string starts with a specific substring.

```javascript
{{ $json.phone.startsWith('+1') }}
// Input: "+1-555-1234" -> Output: true

// With position parameter
{{ $json.text.startsWith('world', 6) }}
// Input: "hello world" -> Output: true
```

### endsWith()

Check if a string ends with a specific substring.

```javascript
{{ $json.filename.endsWith('.pdf') }}
// Input: "report.pdf" -> Output: true
```

### indexOf() / lastIndexOf()

Find the position of a substring.

```javascript
// First occurrence
{{ $json.text.indexOf('error') }}
// Returns -1 if not found

// Last occurrence
{{ $json.text.lastIndexOf('/') }}
// Input: "/path/to/file" -> Output: 8
```

### match()

Match against a regular expression.

```javascript
// Extract matches
{{ $json.text.match(/\d+/) }}
// Input: "Order #12345" -> Output: ["12345"]

// Get first match value
{{ $json.text.match(/\d+/)?.[0] }}
// Output: "12345"

// Global match (all occurrences)
{{ $json.text.match(/\d+/g) }}
// Input: "Order 123, Item 456" -> Output: ["123", "456"]
```

### test() with RegExp

```javascript
// Test if pattern matches (use RegExp constructor)
{{ new RegExp('\\d{3}-\\d{4}').test($json.phone) }}
// Input: "555-1234" -> Output: true
```

---

## String Extraction

### substring()

Extract a portion of a string.

```javascript
// Extract from position 0 to 5
{{ $json.text.substring(0, 5) }}
// Input: "Hello World" -> Output: "Hello"

// From position to end
{{ $json.text.substring(6) }}
// Input: "Hello World" -> Output: "World"
```

### slice()

Similar to substring but supports negative indices.

```javascript
// Last 4 characters
{{ $json.phone.slice(-4) }}
// Input: "555-123-4567" -> Output: "4567"

// Remove last 4 characters
{{ $json.filename.slice(0, -4) }}
// Input: "document.pdf" -> Output: "document"

// Range with negative index
{{ $json.text.slice(-10, -5) }}
```

### charAt()

Get a single character at a position.

```javascript
{{ $json.text.charAt(0) }}
// Input: "Hello" -> Output: "H"
```

### Extract Between Delimiters

```javascript
// Extract value between brackets
{{ $json.text.split('[')[1]?.split(']')[0] }}
// Input: "Error [CODE-123] occurred" -> Output: "CODE-123"

// Using substring with indexOf
{{ $json.text.substring($json.text.indexOf('[') + 1, $json.text.indexOf(']')) }}
```

---

## String Modification

### replace()

Replace first occurrence.

```javascript
{{ $json.text.replace('old', 'new') }}
// Input: "old value, old data" -> Output: "new value, old data"
```

### replaceAll()

Replace all occurrences.

```javascript
{{ $json.text.replaceAll('old', 'new') }}
// Input: "old value, old data" -> Output: "new value, new data"

// With regex (must use global flag)
{{ $json.text.replace(/\s+/g, '-') }}
// Input: "hello   world" -> Output: "hello-world"
```

### Remove Characters

```javascript
// Remove all spaces
{{ $json.text.replaceAll(' ', '') }}

// Remove special characters
{{ $json.text.replace(/[^a-zA-Z0-9]/g, '') }}

// Remove HTML tags
{{ $json.html.replace(/<[^>]*>/g, '') }}
```

### concat()

Concatenate strings.

```javascript
{{ $json.firstName.concat(' ', $json.lastName) }}
// Output: "John Doe"

// Template literal is often cleaner
{{ `${$json.firstName} ${$json.lastName}` }}
```

### repeat()

Repeat a string.

```javascript
{{ '-'.repeat(10) }}
// Output: "----------"

{{ $json.char.repeat(3) }}
// Input: "ab" -> Output: "ababab"
```

---

## Splitting and Joining

### split()

Split a string into an array.

```javascript
// Split by comma
{{ $json.tags.split(',') }}
// Input: "tag1,tag2,tag3" -> Output: ["tag1", "tag2", "tag3"]

// Split by multiple characters
{{ $json.path.split('/') }}
// Input: "/path/to/file" -> Output: ["", "path", "to", "file"]

// Limit number of splits
{{ $json.text.split(',', 2) }}
// Input: "a,b,c,d" -> Output: ["a", "b"]

// Split by regex
{{ $json.text.split(/\s+/) }}
// Input: "hello   world" -> Output: ["hello", "world"]
```

### join()

Join array elements into a string.

```javascript
// Join with comma
{{ $json.tags.join(', ') }}
// Input: ["tag1", "tag2"] -> Output: "tag1, tag2"

// Join with newline
{{ $json.lines.join('\n') }}
```

### Split and Rejoin Pattern

```javascript
// Reverse words in a sentence
{{ $json.text.split(' ').reverse().join(' ') }}
// Input: "Hello World" -> Output: "World Hello"

// Convert to kebab-case
{{ $json.text.toLowerCase().split(' ').join('-') }}
// Input: "Hello World" -> Output: "hello-world"
```

---

## Trimming and Padding

### trim()

Remove whitespace from both ends.

```javascript
{{ $json.input.trim() }}
// Input: "  hello  " -> Output: "hello"
```

### trimStart() / trimEnd()

Remove whitespace from one end.

```javascript
{{ $json.text.trimStart() }}
// Input: "  hello" -> Output: "hello"

{{ $json.text.trimEnd() }}
// Input: "hello  " -> Output: "hello"
```

### padStart() / padEnd()

Pad string to a target length.

```javascript
// Pad with zeros
{{ $json.number.toString().padStart(5, '0') }}
// Input: "42" -> Output: "00042"

// Pad end with spaces
{{ $json.text.padEnd(10, ' ') }}
// Input: "hello" -> Output: "hello     "

// Create fixed-width columns
{{ $json.id.padStart(6, '0') }}
// Input: "123" -> Output: "000123"
```

---

## Template Literals

Use backticks for template strings with embedded expressions.

### Basic Interpolation

```javascript
{{ `Hello, ${$json.name}!` }}
// Output: "Hello, John!"
```

### Multi-line Strings

```javascript
{{ `Line 1
Line 2
Line 3` }}
```

### Complex Expressions

```javascript
{{ `Order ${$json.orderId} total: $${($json.price * $json.quantity).toFixed(2)}` }}
// Output: "Order 12345 total: $99.99"
```

### Conditional Content

```javascript
{{ `Status: ${$json.active ? 'Active' : 'Inactive'}` }}
```

---

## n8n Built-in String Methods

n8n provides additional helper methods via the expression editor.

### .isEmpty()

Check if string is empty or contains only whitespace.

```javascript
{{ $json.name.isEmpty() }}
// Input: "" -> Output: true
// Input: "  " -> Output: true
// Input: "John" -> Output: false
```

### .isNotEmpty()

Check if string has content.

```javascript
{{ $json.name.isNotEmpty() }}
```

### .toDate()

Parse string to Date object (for date strings).

```javascript
{{ $json.dateString.toDate() }}
// Works with ISO date strings
```

### .extractEmail()

Extract email addresses from text.

```javascript
{{ $json.text.extractEmail() }}
// Input: "Contact us at support@example.com" -> Output: "support@example.com"
```

### .extractUrl()

Extract URLs from text.

```javascript
{{ $json.text.extractUrl() }}
```

### .hash()

Generate hash of a string.

```javascript
{{ $json.password.hash('sha256') }}
// Supported: md5, sha1, sha256, sha384, sha512
```

### .encode() / .decode()

Encode/decode strings.

```javascript
// Base64 encode
{{ $json.text.encode('base64') }}

// Base64 decode
{{ $json.encoded.decode('base64') }}

// URL encode
{{ $json.text.encode('url') }}
```

---

## Common Real-World Examples

### Clean and Normalize Email

```javascript
{{ $json.email.toLowerCase().trim() }}
```

### Extract Domain from Email

```javascript
{{ $json.email.split('@')[1] }}
// Input: "user@example.com" -> Output: "example.com"
```

### Format Phone Number

```javascript
// Remove non-digits then format
{{ $json.phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') }}
// Input: "5551234567" -> Output: "(555) 123-4567"
```

### Truncate with Ellipsis

```javascript
{{ $json.description.length > 50 ? $json.description.substring(0, 47) + '...' : $json.description }}
```

### Generate Slug from Title

```javascript
{{ $json.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }}
// Input: "  Hello World!  " -> Output: "hello-world"
```

### Extract File Extension

```javascript
{{ $json.filename.split('.').pop() }}
// Input: "document.pdf" -> Output: "pdf"
```

### Extract Filename Without Extension

```javascript
{{ $json.filename.split('.').slice(0, -1).join('.') }}
// Input: "my.document.pdf" -> Output: "my.document"
```

### Mask Sensitive Data

```javascript
// Mask all but last 4 digits
{{ '*'.repeat($json.cardNumber.length - 4) + $json.cardNumber.slice(-4) }}
// Input: "4111111111111111" -> Output: "************1111"

// Mask email
{{ $json.email.split('@')[0].charAt(0) + '***@' + $json.email.split('@')[1] }}
// Input: "john@example.com" -> Output: "j***@example.com"
```

### Parse Name Components

```javascript
// First name
{{ $json.fullName.split(' ')[0] }}

// Last name
{{ $json.fullName.split(' ').slice(-1)[0] }}

// Middle name(s)
{{ $json.fullName.split(' ').slice(1, -1).join(' ') }}
```

---

## See Also

- [Array Methods](./array-methods.md) - For working with arrays
- [Date/Time Methods](./date-time.md) - For date manipulation with Luxon
- [Common Patterns](./common-patterns.md) - More expression patterns
- [Common Gotchas](./gotchas.md) - Avoid common mistakes
