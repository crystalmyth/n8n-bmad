---
template: bug-report
version: "1.0"
category: agile
---

# Bug Report: {bug_title}

## Bug Information

| Field | Value |
|-------|-------|
| **Bug ID** | {bug_id} |
| **Severity** | Critical / High / Medium / Low |
| **Priority** | P1 / P2 / P3 / P4 |
| **Status** | Open / In Progress / Fixed / Closed |
| **Reporter** | {reporter} |
| **Assignee** | {assignee} |
| **Found In** | {version/environment} |
| **Fixed In** | {version} |

---

## Summary

{One-line description of the bug.}

---

## Environment

- **n8n Version:** {version}
- **Environment:** Development / Staging / Production
- **Browser:** {browser} (if applicable)
- **OS:** {operating_system}

---

## Steps to Reproduce

1. {step_1}
2. {step_2}
3. {step_3}
4. {step_4}

---

## Expected Behavior

{What should happen.}

---

## Actual Behavior

{What actually happens.}

---

## Error Messages

```
{error_message_or_stack_trace}
```

---

## Screenshots / Recordings

{Attach or link to visual evidence.}

---

## Execution Data

**Execution ID:** {execution_id}

```json
{
  "relevant_data": "from_execution"
}
```

---

## Workflow Information

- **Workflow Name:** {workflow_name}
- **Workflow ID:** {workflow_id}
- **Affected Nodes:** {node_names}

---

## Impact

### User Impact
{How does this affect users?}

### Business Impact
{What is the business impact?}

### Workaround
{Is there a workaround? Describe it.}

---

## Root Cause Analysis

{After investigation, what caused this bug?}

---

## Fix Description

{Description of the fix applied.}

---

## Testing Notes

### Test Cases
- [ ] {test_case_1}
- [ ] {test_case_2}

### Regression Risk
{Areas that should be regression tested.}

---

## Related Items

- Related Bug: {bug_id}
- Related Story: {story_id}
- Related PR: {pr_link}

---

## History

| Date | Action | Author |
|------|--------|--------|
| {date} | Created | {author} |
| {date} | Assigned | {author} |
| {date} | Fixed | {author} |
