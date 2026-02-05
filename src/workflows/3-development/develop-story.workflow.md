# Develop Story Workflow [DV]

> **Agent:** Nate (Developer) 💻
> **Trigger:** `DV` or `develop-story`
> **Input:** Story file or ID
> **Output:** Implemented workflow + updated story file

---

## Overview

Developer-centric story implementation. Unlike `DS` (orchestrated by Barry/Quick Flow), this gives Nate direct control over the implementation workflow. Best for solo developers who want a streamlined flow without Quick Flow overhead.

**Workflow Chain:**
```
┌────┐       ┌────┐       ┌────┐
│ DV │ ───▶  │ RV │ ───▶  │ DW │  (if approved)
└────┘       └────┘       └────┘
Nate         Quinn        Rex
  ▲            │
  │            │ (if needs changes)
  │            ▼
  │         ┌────┐
  └──────── │ RQ │
            └────┘
            Nate
```

**Agent Roles:**
- **Nate (💻):** Developer - implements story, full control
- **Quinn (🧪):** Reviewer - reviews code with `RV`
- **Rex (🚀):** DevOps - deploys with `DW` after approval

---

## Step 1: Load Story

**Agent:** Nate 💻

### 1.1 Identify Story

**Provide one of:**
- Story file: `./docs/backlog/stories/{story-file}.md`
- Story ID: `story-X.Y` (epic-scoped) or `feat-XXX` (standalone)

### 1.2 Read Story Content

**Extract from story:**
- [ ] Title and description
- [ ] Acceptance criteria
- [ ] Subtasks (if defined)
- [ ] Technical notes
- [ ] Dependencies

### 1.3 Update Story Status

**Set status to In Progress:**
```markdown
| **Status** | 🔄 In Progress |
```

---

## Step 2: Plan Implementation

**Agent:** Nate 💻

### 2.1 Data Flow Analysis

```
[Trigger] → [Input] → [Process] → [Output]
              ↓
        [Error Handler]
```

**Map the workflow:**
- Trigger type: {webhook | schedule | manual | n8n-trigger}
- Input validation: What checks are needed?
- Core logic: What transformations/integrations?
- Output: What response/action?
- Errors: How to handle failures?

### 2.2 Implementation Checklist

Based on story requirements:

| # | Task | Node(s) | Status |
|---|------|---------|--------|
| 1 | Configure trigger | {trigger_node} | ⬜ |
| 2 | Validate input | Set/If | ⬜ |
| 3 | Core logic | {logic_nodes} | ⬜ |
| 4 | Error handling | Error Trigger + handler | ⬜ |
| 5 | Output/response | {output_nodes} | ⬜ |
| 6 | Test execution | Manual run | ⬜ |

---

## Step 3: Implement

**Agent:** Nate 💻

### 3.1 Build Workflow

For each checklist item:

1. **Add node(s)** with descriptive names
2. **Configure** parameters and credentials
3. **Connect** to flow
4. **Test** individual node execution
5. **Mark complete** in story subtasks

### 3.2 Error Handling Pattern

**Ensure error workflow is configured:**
```
Main Flow → [Error Trigger] → [Log Error] → [Notify/Retry]
```

**Handle common failures:**
- [ ] API timeout
- [ ] Invalid input
- [ ] Credential errors
- [ ] Rate limiting

### 3.3 Update Subtasks

As work progresses, update story file:
```markdown
## Subtasks
- [x] Configure webhook trigger ✓
- [x] Add validation node ✓
- [ ] Handle errors ← Current
- [ ] Test with sample data
```

---

## Step 4: Test

**Agent:** Nate 💻

### 4.1 Test Cases

| Test | Input | Expected | Actual | Pass? |
|------|-------|----------|--------|-------|
| Happy path | Valid payload | Success response | | ⬜ |
| Invalid input | Malformed data | Error handled | | ⬜ |
| Empty input | `{}` | Graceful error | | ⬜ |
| Edge case | {edge_case} | {expected} | | ⬜ |

### 4.2 Run Workflow

```bash
# Manual execution in n8n
# Use test data that covers AC
```

### 4.3 Verify All AC

Check each acceptance criterion:
- [ ] AC 1: {criterion} → Verified
- [ ] AC 2: {criterion} → Verified
- [ ] AC 3: {criterion} → Verified

---

## Step 5: Complete Implementation

**Agent:** Nate 💻

### 5.1 Update Story Status

**Mark all subtasks complete:**
```markdown
## Subtasks
- [x] Configure webhook trigger ✓
- [x] Add validation node ✓
- [x] Handle errors ✓
- [x] Test with sample data ✓
```

**Set status to Review:**
```markdown
| **Status** | 👀 Review |
```

### 5.2 Document Implementation

Add implementation notes to story:
```markdown
## Implementation Notes
- Workflow: `{workflow_name}`
- Trigger: {trigger_type}
- Key nodes: {list_main_nodes}
- Test data: {where_to_find_test_data}
```

### 5.3 Update File List

```markdown
## File List
| File | Action |
|------|--------|
| `workflows/{name}.json` | Created |
| `{other_files}` | Modified |
```

---

## Step 6: Request Review

**Agent:** Nate 💻

### 6.1 Hand Off to QA

> 📍 **Next:** Request review with `RV` or `/n8n:qa *review`

**Provide to reviewer:**
- Workflow name/location
- Story file reference
- Test data location
- Any special considerations

---

## Review Loop

### If Review Needs Changes

> 📍 **Route to:** `RQ` (Review QA) to fix issues
>
> After fixes, re-submit with `RV`

### If Review Approved

> 📍 **Route to:** `DW` (Deploy Workflow)
>
> ```
> DW {workflow_name} --env staging
> ```

---

## DV vs DS Comparison

| Aspect | DV (This Workflow) | DS (Quick Flow) |
|--------|-------------------|-----------------|
| Agent | Nate (Developer) | Barry (Quick Flow) |
| Orchestration | Solo, direct control | Barry coordinates |
| Persistence | Updates story file only | Auto-saves to quick-brief.md |
| Best for | Solo dev, simple flow | Team work, needs checkpoints |
| Review command | `RV` | `CR` |

---

## Quick Reference

**Inputs:**
- Story file or ID

**Outputs:**
- Implemented workflow
- Updated story file (status, subtasks, notes)

**Chain:**
```
DV → RV → (RQ → RV)* → DW
```

**Duration:** Varies by story complexity

**Related Commands:**
- `RV` - Request code review (next step)
- `RQ` - Fix review feedback (if needed)
- `DW` - Deploy workflow (after approval)
- `NW` - New workflow (alternate starting point)
