# Create Story Workflow [CS]

> **Agent:** Victor (PO) 📦
> **Trigger:** `CS` or `create-story`
> **Output:** Complete user story file

---

## Overview

Create a well-defined user story with acceptance criteria, technical notes, and subtasks. Stories should be small enough to complete in one iteration.

---

## Step 1: Story Context

### Parent Epic (if applicable)

**Epic:** `{epic_id}` - {epic_name}
**Path:** `./docs/backlog/epics/epic-{id}-{name}.md`

### Story ID

**Format:** `STORY-{number}`
**Example:** `STORY-042`

---

## Step 2: User Story Format

**Action:** Define the user story using standard format.

### The Three Questions

1. **WHO** is the user?
   > Be specific: "Operations team member" not "user"

2. **WHAT** do they want?
   > One clear action/capability

3. **WHY** does it matter?
   > Business value, not technical benefit

### Story Template

```markdown
As a {specific_user_role},
I want {clear_capability},
So that {business_value}.
```

### Examples

✅ **Good:**
```
As a sales manager,
I want to receive daily CRM sync summaries via Slack,
So that I can quickly spot data quality issues.
```

❌ **Bad:**
```
As a user,
I want the system to work,
So that things are better.
```

---

## Step 3: Acceptance Criteria

**Action:** Define testable acceptance criteria.

### Given-When-Then Format

```markdown
**AC1:** Given {precondition/context},
        When {action_taken},
        Then {observable_result}.
```

### Requirements

- [ ] Minimum 2-3 criteria
- [ ] At least one happy path
- [ ] At least one error scenario
- [ ] All criteria are testable
- [ ] All criteria are specific

### Example Acceptance Criteria

```markdown
- [ ] **AC1:** Given valid webhook payload,
              When workflow is triggered,
              Then data is processed and stored in database.

- [ ] **AC2:** Given invalid payload (missing required fields),
              When workflow is triggered,
              Then error is logged and Slack notification sent.

- [ ] **AC3:** Given database unavailable,
              When workflow attempts to store data,
              Then retry 3 times with exponential backoff.
```

---

## Step 4: Estimation

**Action:** Estimate story complexity.

### Story Points Guide

| Points | Complexity | Examples |
|--------|------------|----------|
| 1 | Trivial | Config change, copy update |
| 2 | Simple | Single node addition, minor logic |
| 3 | Small | Few nodes, straightforward logic |
| 5 | Medium | Multiple nodes, some complexity |
| 8 | Large | Complex logic, multiple integrations |
| 13+ | Too Big | **Split the story** |

**If estimate > 8 points:**
> 🔀 Story is too large. Break it down into smaller stories.

### Estimation Questions

- How many nodes needed?
- Any complex expressions?
- External API integrations?
- Error handling complexity?
- Testing difficulty?

---

## Step 5: Technical Notes

### n8n Workflow Details

| Aspect | Details |
|--------|---------|
| **Trigger Type** | Webhook / Schedule / Manual |
| **Trigger Config** | {specifics} |
| **Key Nodes** | {node_list} |
| **Expressions** | {complex_expressions_if_any} |

### Data Requirements

| Field | Source | Type | Required |
|-------|--------|------|----------|
| {field} | {source} | {type} | Yes/No |

### Credentials/Integrations

| Service | Credential | Status |
|---------|------------|--------|
| {service} | {credential_name} | Have/Need |

### Story Dependencies
| Story ID | Title | Status | Why Required |
|----------|-------|--------|--------------|
| {story_id} | {title} | {status} | {reason} |

### External Dependencies
| Dependency | Type | Notes |
|------------|------|-------|
| {dependency} | API/Service | {notes} |

**🔀 If technical details unclear:** Route to Nate (Developer) or Winston (Architect)

---

## Step 6: Subtasks

**Action:** Break down into implementation subtasks.

### Subtask Guidelines

- Each subtask < 1 day of work
- Subtasks are sequential (mostly)
- Include testing as subtasks
- Include documentation

### Standard Subtasks

```markdown
## Subtasks

- [ ] Configure {trigger_type} trigger
- [ ] Add input validation
- [ ] Implement core logic: {description}
- [ ] Add error handling and notifications
- [ ] Write test cases
- [ ] Execute tests with sample data
- [ ] Document workflow
- [ ] Update story status
```

---

## Step 7: Definition of Done

**Standard DoD (customize if needed):**

```markdown
## Definition of Done

- [ ] All acceptance criteria met
- [ ] All subtasks completed
- [ ] Workflow tested with real data
- [ ] Error handling verified
- [ ] No hardcoded credentials
- [ ] Workflow documented
- [ ] Code review passed
- [ ] Deployed to staging (if applicable)
```

---

## Step 8: Compile Story

**Action:** Generate the complete story file.

### Story File Template

```markdown
# Story: {STORY-ID} - {Title}

| Field | Value |
|-------|-------|
| **ID** | {STORY-ID} |
| **Epic** | {EPIC-ID} |
| **Priority** | P1 / P2 / P3 |
| **Points** | {estimate} |
| **Status** | Backlog |
| **Iteration** | - |
| **Assignee** | - |
| **Depends On** | {story_ids_or_none} |
| **Blocks** | {story_ids_or_none} |
| **Created** | {date} |

---

## User Story

As a {user_role},
I want {capability},
So that {business_value}.

---

## Acceptance Criteria

- [ ] **AC1:** {criterion_1}
- [ ] **AC2:** {criterion_2}
- [ ] **AC3:** {criterion_3}

---

## Technical Notes

**Trigger:** {type} - {details}
**Key Nodes:** {nodes}
**Credentials:** {credentials}

### Data Requirements
{data_table}

### Dependencies
{dependency_list}

---

## Subtasks

- [ ] {subtask_1}
- [ ] {subtask_2}
- [ ] {subtask_3}
- [ ] {subtask_4}

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Workflow tested
- [ ] Error handling verified
- [ ] Documentation complete
- [ ] Code review passed

---

## Notes

{additional_context}

---

## Change Log

| Date | Change | By |
|------|--------|-----|
| {date} | Created | {author} |
```

---

## Step 9: Save Story

**Action:** Save to backlog.

**Path:** `./docs/backlog/stories/story-{id}-{slug}.md`

**Example:** `./docs/backlog/stories/story-042-daily-crm-sync.md`

---

## Step 10: Validate Story

**🔀 Continue with:** `VS` (Validate Story) to check Definition of Ready.

```
VS story-{id}
```

---

## Next Steps

### After Story Validated

**Options:**
1. **Create more stories:** Run `CS` again
2. **Quick implementation:** Route to Barry with `QS` then `DS`
3. **Create epic:** Group stories with `CE`

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Story too big | Victor (PO) | Split into multiple stories |
| Technical unclear | Winston (Architect) | `FA` feasibility |
| Needs estimation help | Nate (Developer) | Discuss complexity |
| AI components | Petra (Prompt Engineer) | `SP` for prompts |
| Integration heavy | Ivy (Integration) | `AA` API analysis |

---

## Quick Reference

**Inputs:**
- Epic reference (optional)
- Requirements/feature description

**Outputs:**
- Story file in `./docs/backlog/stories/`
- Ready for validation (`VS`)

**Duration:** 15-30 minutes per story
