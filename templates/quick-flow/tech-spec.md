# Tech Spec: ${WORKFLOW_NAME}

> **Created:** ${TIMESTAMP}
> **Status:** Draft | Approved

## Overview

**Purpose:** ${PURPOSE_ONE_SENTENCE}
**Trigger:** ${TRIGGER_TYPE}

---

## Trigger Configuration

| Setting | Value |
|---------|-------|
| **Type** | ${WEBHOOK_OR_SCHEDULE_OR_MANUAL} |
| **Path/Cron** | ${PATH_OR_CRON} |
| **Auth** | ${AUTH_METHOD_OR_NONE} |

---

## Key Nodes

| # | Node Type | Purpose |
|---|-----------|---------|
| 1 | ${NODE_TYPE_1} | ${PURPOSE_1} |
| 2 | ${NODE_TYPE_2} | ${PURPOSE_2} |
| 3 | ${NODE_TYPE_3} | ${PURPOSE_3} |

---

## Input/Output

### Input
```json
${INPUT_SCHEMA}
```

### Output
```json
${OUTPUT_SCHEMA}
```

---

## Error Handling

| Error Type | Handling |
|------------|----------|
| **Invalid Input** | ${INVALID_INPUT_HANDLING} |
| **API Failure** | ${API_FAILURE_HANDLING} |
| **Timeout** | ${TIMEOUT_HANDLING} |

---

## Notes

${ADDITIONAL_NOTES}

---

<!--
Tech Spec - Lightweight technical specification for Quick Flow.
Used when you need to document the technical approach before implementing.

When to create:
- Complex node configurations
- Multiple integrations
- Non-obvious error handling
- Sharing approach with others

When to skip:
- Simple single-node workflows
- Obvious implementations
- Solo work with clear requirements
-->
