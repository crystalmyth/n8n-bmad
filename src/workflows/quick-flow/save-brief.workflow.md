# Save Brief Workflow [SB]

> **Agent:** Barry (Quick Flow) ⚡
> **Trigger:** `SB` or `save-brief`
> **Input:** Current session state
> **Output:** Updated `./docs/quick-brief.md`

---

## Overview

Persist Quick Flow work to a single file for session continuity. This enables resuming work later without context loss.

**Quick Flow Persistence Philosophy:**
- Single file (`quick-brief.md`) contains everything
- Auto-saves after each subtask during DS
- Manual save with SB for explicit checkpoints
- No separate story files - minimal ceremony

---

## Step 1: Check Current State

**Agent:** Barry ⚡

**Gather information:**

| What | Source |
|------|--------|
| Current story | Active story being worked on |
| Story status | Backlog/Ready/In Progress/Review/Done |
| Completed subtasks | Checkboxes in subtask list |
| Current subtask | Next unchecked subtask |
| Decisions made | Any architectural/implementation choices |
| Blockers | Issues preventing progress |

---

## Step 2: Determine Save Type

**Agent:** Barry ⚡

| Scenario | Action |
|----------|--------|
| **New project** | Create `./docs/quick-brief.md` from template |
| **Existing quick-brief** | Update existing file |
| **No active work** | Warn user, nothing to save |

**Template location:** `templates/quick-flow/quick-brief.template.md`

---

## Step 3: Update Quick Brief

**Agent:** Barry ⚡

### 3.1 Update Story Section

```markdown
### Story 1: {story_title}

| Field | Value |
|-------|-------|
| **Status** | {current_status} |
| **Trigger** | {trigger_type} |
| **Priority** | {priority} |

**Subtasks:**
- [x] Configure webhook trigger ✓
- [x] Implement validation ✓
- [ ] Build core logic ← Current
- [ ] Add error handling
```

### 3.2 Append Activity Log

```markdown
## Activity Log

| Time | Agent | Action |
|------|-------|--------|
| {previous entries...} |
| {now} | Barry | Saved checkpoint (SB) |
```

### 3.3 Update Decisions (if any)

```markdown
## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | {existing decisions} |
| 2 | {new_decision} | {new_rationale} |
```

### 3.4 Update Next Session

```markdown
## Next Session

**Continue From:** {next_action_description}
**Current Subtask:** {current_subtask_or_none}
**Blockers:** {blockers_or_none}

**Next Steps:**
1. {next_step_1}
2. {next_step_2}
```

### 3.5 Update Timestamp

```markdown
> **Last Updated:** {now}
> **Session:** {session_number}
```

---

## Step 4: Save File

**Agent:** Barry ⚡

**Save to:** `./docs/quick-brief.md`

**Create docs directory if needed:**
```bash
mkdir -p ./docs
```

---

## Step 5: Confirm Save

**Agent:** Barry ⚡

**Output:**

```
✅ Quick Brief saved: ./docs/quick-brief.md

📋 Summary:
   Story: {story_title}
   Status: {status}
   Current: {current_subtask}

📍 To resume later: LB (Load Brief)
```

---

## When to Use SB

| Situation | Use SB? |
|-----------|---------|
| **Ending session** | Yes - explicit save |
| **Before complex operation** | Yes - checkpoint |
| **After important decision** | Yes - capture decision |
| **Mid-subtask** | Optional - DS auto-saves after subtasks |
| **After each subtask** | No - DS handles this automatically |

---

## Quick Reference

**Inputs:**
- Current session state
- Active story information

**Outputs:**
- Updated `./docs/quick-brief.md`

**Related Commands:**
- `LB` - Load Brief (resume)
- `DS` - Dev Story (auto-saves)
- `RC` - Resume Context (for full process)
