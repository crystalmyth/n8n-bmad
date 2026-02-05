# New Workflow Development [NW]

> **Agent:** Nate (Developer) 💻
> **Trigger:** `NW` or `new-workflow`
> **Output:** Implemented n8n workflow

---

## Overview

Start implementing a new n8n workflow from a user story. This workflow guides you through the complete development process from setup to testing.

---

## Step 1: Story Review

**Agent:** Nate (Developer) 💻

### Load Story

```
./docs/backlog/stories/story-{id}-{slug}.md
```

### Pre-Implementation Checklist

- [ ] Story status is "Ready"
- [ ] Acceptance criteria are clear
- [ ] Subtasks are defined
- [ ] No blocking dependencies
- [ ] Architecture is understood

**If not ready:** Route to Victor (PO) with `VS` to validate story first.

---

## Step 2: Workflow Setup

**Agent:** Nate (Developer) 💻

### Workflow Metadata

| Field | Value |
|-------|-------|
| **Name** | wf_{descriptive_name} |
| **Story** | {STORY-ID} |
| **Description** | {what_it_does} |
| **Environment** | Development |

### Workflow Settings

| Setting | Value | Reason |
|---------|-------|--------|
| Timeout | {seconds} | {why} |
| Save Manual Executions | Yes/No | {why} |
| Save Successful Executions | Yes/No | {why} |
| Save Failed Executions | Yes | Always save failures |

---

## Step 3: Trigger Configuration

**Agent:** Nate (Developer) 💻

### Select Trigger Type

| Type | Use Case | Configuration |
|------|----------|---------------|
| **Webhook** | External events | Path, Auth, Methods |
| **Schedule** | Time-based | Cron expression |
| **Manual** | User-initiated | None |
| **Execute Workflow** | Sub-workflow | Input schema |
| **n8n Trigger** | Internal events | Event type |

### Trigger Configuration

```yaml
Trigger: {type}
Configuration:
  {key}: {value}
```

### Webhook Security (if applicable)

- [ ] Authentication method selected
- [ ] IP allowlist considered
- [ ] Path is unique and not guessable

---

## Step 4: Core Logic Implementation

**Agent:** Nate (Developer) 💻

### Implementation Order

1. **Happy Path First** - Get the main flow working
2. **Data Transformation** - Shape data correctly
3. **Integrations** - Connect external systems
4. **Validation** - Add input/output validation
5. **Error Handling** - Handle failure cases

### Node Implementation Checklist

| # | Node | Purpose | Status |
|---|------|---------|--------|
| 1 | {node} | {purpose} | ⬜ |
| 2 | {node} | {purpose} | ⬜ |
| 3 | {node} | {purpose} | ⬜ |

### Best Practices

- [ ] Nodes have descriptive names
- [ ] Notes added for complex logic
- [ ] Expressions are readable
- [ ] No hardcoded values (use env variables)
- [ ] Sticky notes for workflow sections

---

## Step 5: Data Transformation

**Agent:** Nate (Developer) 💻

### Input Data Shape

```json
{
  "expected_field": "type"
}
```

### Output Data Shape

```json
{
  "output_field": "type"
}
```

### Transformation Nodes

| Transform | Node Type | Notes |
|-----------|-----------|-------|
| {transform_1} | Set/Code/Edit Fields | {notes} |
| {transform_2} | Set/Code/Edit Fields | {notes} |

---

## Step 6: Integration Implementation

**Agent:** Nate (Developer) 💻 + Ivy (Integration) 🔌

### External Integrations

| System | Node | Credential | Status |
|--------|------|------------|--------|
| {system} | {node} | {cred_name} | ⬜ |

### Credential Setup

1. Create credential in n8n
2. Name: `cred_{system}_{env}`
3. Store secrets securely
4. Test connection

**🔀 If integration issues:** Route to Ivy with `IS`.

---

## Step 7: Error Handling

**Agent:** Nate (Developer) 💻

### Error Handling Pattern

```
[Main Path]
     ↓ (success)
[Continue]
     ↓ (error)
[Error Branch]
     ↓
[Log] → [Notify] → [Respond/Retry]
```

### Error Handling Checklist

- [ ] Error workflow attached or inline handling
- [ ] All external calls have error handling
- [ ] Validation errors caught early
- [ ] Errors logged with context
- [ ] Alerts configured for critical errors
- [ ] Graceful degradation where possible

---

## Step 8: Testing

**Agent:** Nate (Developer) 💻

### Test Cases

| # | Test Case | Input | Expected | Actual | Pass? |
|---|-----------|-------|----------|--------|-------|
| 1 | Happy path | {input} | {expected} | | ⬜ |
| 2 | Edge case | {input} | {expected} | | ⬜ |
| 3 | Error case | {input} | Error handled | | ⬜ |
| 4 | Validation | Invalid | Rejected | | ⬜ |

### Testing Process

1. **Manual Test** - Execute with test data
2. **Verify Output** - Check execution results
3. **Test Errors** - Simulate failures
4. **Load Test** - If applicable, test volume

---

## Step 9: Acceptance Criteria Verification

**Agent:** Nate (Developer) 💻

### AC Verification

For each AC from the story:

| # | AC Summary | Verified? | Evidence |
|---|------------|-----------|----------|
| 1 | {AC_1} | ⬜ | {execution_id or notes} |
| 2 | {AC_2} | ⬜ | {evidence} |
| 3 | {AC_3} | ⬜ | {evidence} |

### All AC Met?

- [ ] **Yes** - Proceed to code review
- [ ] **No** - Continue implementation or discuss with PO

---

## Step 10: Documentation

**Agent:** Nate (Developer) 💻

### Workflow Documentation

```markdown
# Workflow: {name}

## Purpose
{What this workflow does}

## Trigger
{How it's triggered}

## Input
{Expected input format}

## Output
{Output format}

## Dependencies
- {credential_1}
- {external_system_1}

## Error Handling
{How errors are handled}

## Notes
{Any special considerations}
```

### Update Story

1. Mark subtasks complete
2. Update story status to "Review"
3. Link to workflow

---

## Step 11: Code Review Request

**Agent:** Nate (Developer) 💻

### Ready for Review

- [ ] All tests passing
- [ ] AC verified
- [ ] Documentation complete
- [ ] Workflow exported (if needed)

**🔀 Request code review:** Route to Quinn (QA) with `CR`.

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Story unclear | Victor (PO) | `VS` or discussion |
| Architecture questions | Winston (Architect) | `CA` |
| Integration issues | Ivy (Integration) | `IS` |
| Security concerns | Sierra (Security) | `SR` |
| AI components | Petra (Prompt Engineer) | `AA` |
| Code review | Quinn (QA) | `CR` |

---

## Quick Reference

**Inputs:**
- User story (Ready status)
- Architecture (if exists)

**Outputs:**
- Implemented workflow
- Tests passing
- Documentation

**Duration:** Variable (depends on story complexity)

**Story Status Flow:**
```
Ready → In Progress → Review
```
