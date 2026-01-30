# Date and Time in n8n Expressions (Luxon)

n8n uses [Luxon](https://moment.github.io/luxon/) for date and time manipulation. Luxon provides a powerful, immutable API for working with dates, times, durations, and time zones.

## Table of Contents

- [Getting Started with Luxon](#getting-started-with-luxon)
- [Creating DateTime Objects](#creating-datetime-objects)
- [Formatting Dates](#formatting-dates)
- [Parsing Dates](#parsing-dates)
- [Accessing Date Components](#accessing-date-components)
- [Date Arithmetic](#date-arithmetic)
- [Comparing Dates](#comparing-dates)
- [Time Zones](#time-zones)
- [Durations](#durations)
- [Intervals](#intervals)
- [n8n Date Helpers](#n8n-date-helpers)
- [Common Patterns](#common-patterns)

---

## Getting Started with Luxon

In n8n expressions, Luxon is available via the `$luxon` or `DateTime` objects.

```javascript
// Access Luxon DateTime class
{{ DateTime }}
{{ $luxon.DateTime }}

// Create current datetime
{{ DateTime.now() }}
```

---

## Creating DateTime Objects

### Current Date/Time

```javascript
// Current date and time
{{ DateTime.now() }}

// Current date and time in UTC
{{ DateTime.utc() }}

// Current timestamp (milliseconds)
{{ DateTime.now().toMillis() }}

// Current timestamp (seconds)
{{ DateTime.now().toSeconds() }}
```

### From Components

```javascript
// From year, month, day
{{ DateTime.local(2024, 3, 15) }}

// With time components
{{ DateTime.local(2024, 3, 15, 14, 30, 0) }}
// Year, month, day, hour, minute, second

// From object
{{ DateTime.fromObject({ year: 2024, month: 3, day: 15 }) }}

// With time zone
{{ DateTime.fromObject({ year: 2024, month: 3, day: 15 }, { zone: 'America/New_York' }) }}
```

### From Timestamps

```javascript
// From Unix timestamp (seconds)
{{ DateTime.fromSeconds(1710500000) }}

// From Unix timestamp (milliseconds)
{{ DateTime.fromMillis(1710500000000) }}

// From JavaScript Date
{{ DateTime.fromJSDate(new Date()) }}
```

### From Strings

```javascript
// From ISO string (automatic parsing)
{{ DateTime.fromISO($json.dateString) }}
// Input: "2024-03-15T14:30:00Z"

// From ISO with options
{{ DateTime.fromISO($json.dateString, { zone: 'utc' }) }}

// From specific format
{{ DateTime.fromFormat($json.dateString, 'MM/dd/yyyy') }}
// Input: "03/15/2024"

// From SQL format
{{ DateTime.fromSQL($json.sqlDate) }}
// Input: "2024-03-15 14:30:00"

// From HTTP date
{{ DateTime.fromHTTP($json.httpDate) }}
// Input: "Fri, 15 Mar 2024 14:30:00 GMT"

// From RFC 2822
{{ DateTime.fromRFC2822($json.emailDate) }}
```

---

## Formatting Dates

### Preset Formats

```javascript
// ISO format (most common)
{{ DateTime.now().toISO() }}
// Output: "2024-03-15T14:30:00.000-04:00"

// ISO date only
{{ DateTime.now().toISODate() }}
// Output: "2024-03-15"

// ISO time only
{{ DateTime.now().toISOTime() }}
// Output: "14:30:00.000-04:00"

// SQL format
{{ DateTime.now().toSQL() }}
// Output: "2024-03-15 14:30:00.000 -04:00"

// SQL date only
{{ DateTime.now().toSQLDate() }}
// Output: "2024-03-15"

// HTTP format
{{ DateTime.now().toHTTP() }}
// Output: "Fri, 15 Mar 2024 18:30:00 GMT"

// RFC 2822
{{ DateTime.now().toRFC2822() }}
// Output: "Fri, 15 Mar 2024 14:30:00 -0400"
```

### Locale-Aware Formatting

```javascript
// Localized date
{{ DateTime.now().toLocaleString() }}
// Output: "3/15/2024" (US locale)

// Date with options
{{ DateTime.now().toLocaleString(DateTime.DATE_FULL) }}
// Output: "March 15, 2024"

{{ DateTime.now().toLocaleString(DateTime.DATE_MED) }}
// Output: "Mar 15, 2024"

{{ DateTime.now().toLocaleString(DateTime.DATE_SHORT) }}
// Output: "3/15/24"

// Time formatting
{{ DateTime.now().toLocaleString(DateTime.TIME_SIMPLE) }}
// Output: "2:30 PM"

{{ DateTime.now().toLocaleString(DateTime.TIME_WITH_SECONDS) }}
// Output: "2:30:00 PM"

// Date and time
{{ DateTime.now().toLocaleString(DateTime.DATETIME_SHORT) }}
// Output: "3/15/24, 2:30 PM"

{{ DateTime.now().toLocaleString(DateTime.DATETIME_FULL) }}
// Output: "March 15, 2024 at 2:30 PM EDT"
```

### Custom Formats

```javascript
// Custom format with toFormat()
{{ DateTime.now().toFormat('yyyy-MM-dd') }}
// Output: "2024-03-15"

{{ DateTime.now().toFormat('MM/dd/yyyy') }}
// Output: "03/15/2024"

{{ DateTime.now().toFormat('dd MMM yyyy') }}
// Output: "15 Mar 2024"

{{ DateTime.now().toFormat('MMMM d, yyyy') }}
// Output: "March 15, 2024"

{{ DateTime.now().toFormat('HH:mm:ss') }}
// Output: "14:30:00"

{{ DateTime.now().toFormat('h:mm a') }}
// Output: "2:30 PM"

{{ DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') }}
// Output: "2024-03-15 14:30:00"

{{ DateTime.now().toFormat("EEEE, MMMM d 'at' h:mm a") }}
// Output: "Friday, March 15 at 2:30 PM"
```

### Format Tokens Reference

| Token | Output | Description |
|-------|--------|-------------|
| `yyyy` | 2024 | 4-digit year |
| `yy` | 24 | 2-digit year |
| `MM` | 03 | 2-digit month |
| `M` | 3 | Month number |
| `MMM` | Mar | Short month name |
| `MMMM` | March | Full month name |
| `dd` | 15 | 2-digit day |
| `d` | 15 | Day number |
| `EEE` | Fri | Short weekday |
| `EEEE` | Friday | Full weekday |
| `HH` | 14 | 24-hour (2-digit) |
| `H` | 14 | 24-hour |
| `hh` | 02 | 12-hour (2-digit) |
| `h` | 2 | 12-hour |
| `mm` | 30 | Minutes (2-digit) |
| `ss` | 00 | Seconds (2-digit) |
| `a` | PM | AM/PM |
| `Z` | -04:00 | Timezone offset |
| `z` | EST | Timezone abbreviation |

---

## Parsing Dates

### Automatic Parsing

```javascript
// ISO strings (most reliable)
{{ DateTime.fromISO($json.date) }}

// Input variations that work:
// "2024-03-15"
// "2024-03-15T14:30:00"
// "2024-03-15T14:30:00Z"
// "2024-03-15T14:30:00.000+00:00"
```

### Custom Format Parsing

```javascript
// Parse specific format
{{ DateTime.fromFormat($json.date, 'MM/dd/yyyy') }}
// Input: "03/15/2024"

{{ DateTime.fromFormat($json.date, 'dd-MMM-yyyy') }}
// Input: "15-Mar-2024"

{{ DateTime.fromFormat($json.date, 'MMMM d, yyyy') }}
// Input: "March 15, 2024"

{{ DateTime.fromFormat($json.date, 'yyyy/MM/dd HH:mm') }}
// Input: "2024/03/15 14:30"
```

### Handling Invalid Dates

```javascript
// Check if parsing succeeded
{{ DateTime.fromISO($json.date).isValid }}

// Get error message if invalid
{{ DateTime.fromISO($json.date).invalidReason }}

// Parse with fallback
{{ DateTime.fromISO($json.date).isValid ? DateTime.fromISO($json.date) : DateTime.now() }}

// Try multiple formats
{{ DateTime.fromISO($json.date).isValid
   ? DateTime.fromISO($json.date)
   : DateTime.fromFormat($json.date, 'MM/dd/yyyy') }}
```

---

## Accessing Date Components

### Getting Parts

```javascript
// Year
{{ DateTime.now().year }}
// Output: 2024

// Month (1-12)
{{ DateTime.now().month }}
// Output: 3

// Day of month (1-31)
{{ DateTime.now().day }}
// Output: 15

// Hour (0-23)
{{ DateTime.now().hour }}
// Output: 14

// Minute (0-59)
{{ DateTime.now().minute }}
// Output: 30

// Second (0-59)
{{ DateTime.now().second }}

// Millisecond (0-999)
{{ DateTime.now().millisecond }}
```

### Week Information

```javascript
// Day of week (1=Monday, 7=Sunday)
{{ DateTime.now().weekday }}

// Week number of year
{{ DateTime.now().weekNumber }}

// Week year
{{ DateTime.now().weekYear }}
```

### Other Properties

```javascript
// Day of year (1-366)
{{ DateTime.now().ordinal }}

// Days in month
{{ DateTime.now().daysInMonth }}

// Days in year
{{ DateTime.now().daysInYear }}

// Quarter (1-4)
{{ DateTime.now().quarter }}

// Is in leap year?
{{ DateTime.now().isInLeapYear }}

// Weekday name
{{ DateTime.now().weekdayLong }}
// Output: "Friday"

{{ DateTime.now().weekdayShort }}
// Output: "Fri"

// Month name
{{ DateTime.now().monthLong }}
// Output: "March"

{{ DateTime.now().monthShort }}
// Output: "Mar"
```

### Setting Parts

```javascript
// Set specific components
{{ DateTime.now().set({ hour: 9, minute: 0, second: 0 }) }}

// Set to start of day
{{ DateTime.now().startOf('day') }}

// Set to end of day
{{ DateTime.now().endOf('day') }}

// Set to start of week
{{ DateTime.now().startOf('week') }}

// Set to start of month
{{ DateTime.now().startOf('month') }}

// Set to start of year
{{ DateTime.now().startOf('year') }}
```

---

## Date Arithmetic

### Adding Time

```javascript
// Add days
{{ DateTime.now().plus({ days: 7 }) }}

// Add multiple units
{{ DateTime.now().plus({ months: 1, days: 5 }) }}

// Add hours
{{ DateTime.now().plus({ hours: 3 }) }}

// Add various units
{{ DateTime.now().plus({ years: 1 }) }}
{{ DateTime.now().plus({ weeks: 2 }) }}
{{ DateTime.now().plus({ minutes: 30 }) }}
{{ DateTime.now().plus({ seconds: 45 }) }}
```

### Subtracting Time

```javascript
// Subtract days
{{ DateTime.now().minus({ days: 7 }) }}

// Subtract multiple units
{{ DateTime.now().minus({ months: 1, days: 5 }) }}

// One week ago
{{ DateTime.now().minus({ weeks: 1 }) }}
```

### Difference Between Dates

```javascript
// Get difference in specific unit
{{ DateTime.fromISO($json.endDate).diff(DateTime.fromISO($json.startDate), 'days').days }}

// Multiple units
{{ DateTime.fromISO($json.endDate).diff(DateTime.fromISO($json.startDate), ['days', 'hours']) }}

// As duration object
{{ DateTime.fromISO($json.endDate).diff(DateTime.fromISO($json.startDate)).toObject() }}
// Output: { milliseconds: 86400000 }

// Human readable
{{ DateTime.fromISO($json.endDate).diff(DateTime.fromISO($json.startDate), ['years', 'months', 'days']).toHuman() }}
// Output: "1 year, 2 months, 5 days"
```

---

## Comparing Dates

### Comparison Methods

```javascript
// Is before?
{{ DateTime.fromISO($json.date1) < DateTime.fromISO($json.date2) }}

// Is after?
{{ DateTime.fromISO($json.date1) > DateTime.fromISO($json.date2) }}

// Is same?
{{ DateTime.fromISO($json.date1).equals(DateTime.fromISO($json.date2)) }}

// Using milliseconds for comparison
{{ DateTime.fromISO($json.date1).toMillis() < DateTime.fromISO($json.date2).toMillis() }}
```

### Relative Comparisons

```javascript
// Is today?
{{ DateTime.fromISO($json.date).hasSame(DateTime.now(), 'day') }}

// Is this month?
{{ DateTime.fromISO($json.date).hasSame(DateTime.now(), 'month') }}

// Is this year?
{{ DateTime.fromISO($json.date).hasSame(DateTime.now(), 'year') }}

// Is in the past?
{{ DateTime.fromISO($json.date) < DateTime.now() }}

// Is in the future?
{{ DateTime.fromISO($json.date) > DateTime.now() }}
```

### Relative Time (Time Ago)

```javascript
// Relative to now
{{ DateTime.fromISO($json.date).toRelative() }}
// Output: "2 days ago" or "in 3 hours"

// Relative to specific date
{{ DateTime.fromISO($json.date).toRelative({ base: DateTime.fromISO($json.referenceDate) }) }}

// With specific style
{{ DateTime.fromISO($json.date).toRelativeCalendar() }}
// Output: "yesterday", "today", "tomorrow", "last week", etc.
```

---

## Time Zones

### Converting Time Zones

```javascript
// Convert to specific timezone
{{ DateTime.now().setZone('America/New_York') }}

// Convert to UTC
{{ DateTime.now().toUTC() }}

// Parse with timezone, then convert
{{ DateTime.fromISO($json.date, { zone: 'Europe/London' }).setZone('America/Los_Angeles') }}
```

### Getting Timezone Info

```javascript
// Current timezone
{{ DateTime.now().zoneName }}
// Output: "America/New_York"

// Timezone offset
{{ DateTime.now().offset }}
// Output: -240 (minutes)

// Formatted offset
{{ DateTime.now().toFormat('Z') }}
// Output: "-04:00"

// Is DST?
{{ DateTime.now().isInDST }}
```

### Working with UTC

```javascript
// Create in UTC
{{ DateTime.utc() }}
{{ DateTime.utc(2024, 3, 15, 14, 30) }}

// Convert to UTC
{{ DateTime.now().toUTC() }}

// Format as UTC
{{ DateTime.now().toUTC().toISO() }}
```

### Common Timezones

```javascript
// US timezones
{{ DateTime.now().setZone('America/New_York') }}    // Eastern
{{ DateTime.now().setZone('America/Chicago') }}     // Central
{{ DateTime.now().setZone('America/Denver') }}      // Mountain
{{ DateTime.now().setZone('America/Los_Angeles') }} // Pacific

// European
{{ DateTime.now().setZone('Europe/London') }}
{{ DateTime.now().setZone('Europe/Paris') }}
{{ DateTime.now().setZone('Europe/Berlin') }}

// Asia
{{ DateTime.now().setZone('Asia/Tokyo') }}
{{ DateTime.now().setZone('Asia/Shanghai') }}
{{ DateTime.now().setZone('Asia/Singapore') }}
```

---

## Durations

### Creating Durations

```javascript
// From object
{{ $luxon.Duration.fromObject({ hours: 2, minutes: 30 }) }}

// From ISO duration string
{{ $luxon.Duration.fromISO('P1DT2H30M') }}
// P1D = 1 day, T2H30M = 2 hours 30 minutes

// From milliseconds
{{ $luxon.Duration.fromMillis(3600000) }}
// 1 hour in milliseconds
```

### Duration Arithmetic

```javascript
// Add durations
{{ $luxon.Duration.fromObject({ hours: 1 }).plus({ minutes: 30 }) }}

// Subtract durations
{{ $luxon.Duration.fromObject({ hours: 2 }).minus({ minutes: 30 }) }}

// Multiply
{{ $luxon.Duration.fromObject({ hours: 1 }).mapUnits(x => x * 2) }}
```

### Duration Formatting

```javascript
// To ISO format
{{ $luxon.Duration.fromObject({ hours: 2, minutes: 30 }).toISO() }}
// Output: "PT2H30M"

// Human readable
{{ $luxon.Duration.fromObject({ hours: 2, minutes: 30 }).toHuman() }}
// Output: "2 hours, 30 minutes"

// As specific units
{{ $luxon.Duration.fromObject({ hours: 2, minutes: 30 }).as('minutes') }}
// Output: 150

// Rescale (normalize units)
{{ $luxon.Duration.fromObject({ minutes: 90 }).rescale().toObject() }}
// Output: { hours: 1, minutes: 30 }
```

---

## Intervals

### Creating Intervals

```javascript
// From start and end
{{ $luxon.Interval.fromDateTimes(
  DateTime.fromISO($json.startDate),
  DateTime.fromISO($json.endDate)
) }}

// From start and duration
{{ $luxon.Interval.after(DateTime.now(), { days: 7 }) }}

// From end and duration
{{ $luxon.Interval.before(DateTime.now(), { days: 7 }) }}
```

### Interval Operations

```javascript
// Check if date is in interval
{{ $luxon.Interval.fromDateTimes(
  DateTime.fromISO($json.start),
  DateTime.fromISO($json.end)
).contains(DateTime.now()) }}

// Get duration of interval
{{ $luxon.Interval.fromDateTimes(
  DateTime.fromISO($json.start),
  DateTime.fromISO($json.end)
).length('days') }}

// Check overlap
{{ interval1.overlaps(interval2) }}

// Split into sub-intervals
{{ interval.splitBy({ days: 1 }) }}
```

---

## n8n Date Helpers

### $now and $today

```javascript
// Current datetime (Luxon DateTime)
{{ $now }}

// Today at midnight (Luxon DateTime)
{{ $today }}

// Format current date
{{ $now.toFormat('yyyy-MM-dd') }}

// Get timestamp
{{ $now.toMillis() }}
```

### Date Methods on Strings

n8n adds helper methods to strings:

```javascript
// Parse string to DateTime
{{ $json.dateString.toDateTime() }}

// Parse and format
{{ $json.dateString.toDateTime().toFormat('MM/dd/yyyy') }}
```

---

## Common Patterns

### Get Start/End of Day

```javascript
// Start of today
{{ DateTime.now().startOf('day').toISO() }}
// Output: "2024-03-15T00:00:00.000-04:00"

// End of today
{{ DateTime.now().endOf('day').toISO() }}
// Output: "2024-03-15T23:59:59.999-04:00"
```

### Get Date Ranges

```javascript
// Last 7 days range
{{ {
  start: DateTime.now().minus({ days: 7 }).startOf('day').toISO(),
  end: DateTime.now().endOf('day').toISO()
} }}

// Current month range
{{ {
  start: DateTime.now().startOf('month').toISO(),
  end: DateTime.now().endOf('month').toISO()
} }}

// Previous month range
{{ {
  start: DateTime.now().minus({ months: 1 }).startOf('month').toISO(),
  end: DateTime.now().minus({ months: 1 }).endOf('month').toISO()
} }}
```

### Format for APIs

```javascript
// ISO 8601 (most APIs)
{{ DateTime.fromISO($json.date).toISO() }}

// Unix timestamp (seconds)
{{ DateTime.fromISO($json.date).toSeconds() }}

// Unix timestamp (milliseconds)
{{ DateTime.fromISO($json.date).toMillis() }}

// SQL datetime
{{ DateTime.fromISO($json.date).toSQL() }}
```

### Calculate Age

```javascript
// Age in years
{{ Math.floor(DateTime.now().diff(DateTime.fromISO($json.birthDate), 'years').years) }}

// Age with months
{{ DateTime.now().diff(DateTime.fromISO($json.birthDate), ['years', 'months']).toObject() }}
```

### Business Days

```javascript
// Check if weekday (not weekend)
{{ DateTime.fromISO($json.date).weekday <= 5 }}

// Next business day
{{ (() => {
  let d = DateTime.now().plus({ days: 1 });
  while (d.weekday > 5) d = d.plus({ days: 1 });
  return d;
})() }}
```

### Handle Null/Invalid Dates

```javascript
// Safe parsing with fallback
{{ $json.date ? DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') : 'N/A' }}

// Validate before using
{{ DateTime.fromISO($json.date).isValid ? DateTime.fromISO($json.date).toFormat('yyyy-MM-dd') : 'Invalid Date' }}
```

### Format Duration Between Events

```javascript
// Time elapsed as readable string
{{ DateTime.fromISO($json.endTime)
  .diff(DateTime.fromISO($json.startTime), ['hours', 'minutes', 'seconds'])
  .toFormat("h 'hours' m 'minutes'") }}
```

### Generate Date Sequence

```javascript
// Array of dates for a range
{{ Array.from({ length: 7 }, (_, i) =>
  DateTime.now().plus({ days: i }).toFormat('yyyy-MM-dd')
) }}
```

---

## See Also

- [String Methods](./string-methods.md) - For string manipulation
- [Array Methods](./array-methods.md) - For array operations
- [Common Patterns](./common-patterns.md) - More expression patterns
- [Common Gotchas](./gotchas.md) - Avoid common mistakes
- [Luxon Documentation](https://moment.github.io/luxon/) - Official Luxon docs
