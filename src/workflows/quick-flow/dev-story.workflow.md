# Dev Story Workflow [DS]

> **Agent:** Barry (Quick Flow) ⚡ orchestrates → Nate (Developer) 💻 implements
> **Trigger:** `DS` or `dev-story`
> **Input:** Story requirements (from PRD or quick-brief)
> **Output:** Implemented workflow + updated quick-brief.md

---

## Overview

Implement a story from start to finish with automatic persistence. Barry orchestrates the workflow, delegating implementation details to Nate and routing to Quinn for review.

**Agent Roles:**
- **Barry (⚡):** Orchestrator - loads context, tracks progress, saves checkpoints
- **Nate (💻):** Implementer - builds nodes, configures expressions, handles errors
- **Quinn (🧪):** Reviewer - code review after implementation complete

**Persistence:** Work auto-saves to `./docs/quick-brief.md` after each subtask.

---

## Step 1: Load Context

**Agent:** Barry ⚡

### 1.1 Check for Quick Brief

```
./docs/quick-brief.md exists?
├── YES → Load and display current state
└── NO  → Create new quick-brief from template
```

**If creating new:**
- Use template: `templates/quick-flow/quick-brief.template.md`
- Save to: `./docs/quick-brief.md`
- Initialize with project info

### 1.2 Pre-flight Checklist

- [ ] Quick-brief loaded or created
- [ ] Story defined (in quick-brief or provided)
- [ ] Acceptance criteria clear
- [ ] Subtasks defined

**If story not defined:**
> Ask user: "What are you building? I'll help define the story."

### 1.3 Log Activity

```markdown
## Activity Log
| {timestamp} | Barry | Started DS, loaded context |
```

---

## Step 2: Update Status

**Agent:** Barry ⚡

**Update quick-brief.md:**

```markdown
### Story 1: {story_title}

| Field | Value |
|-------|-------|
| **Status** | 🔄 In Progress |
| **Started** | {today's date} |
```

**Log:**
```markdown
| {timestamp} | Barry | Set story status to In Progress |
```

---

## Step 3: Implementation Loop

**Agent:** Barry ⚡ coordinates, Nate 💻 implements

### 3.1 Load Current Subtask (Barry)

**Read from quick-brief:**
```markdown
## Subtasks
- [x] Configure webhook trigger     ✓
- [ ] Implement validation          ← Current
- [ ] Build core logic
- [ ] Add error handling
- [ ] Test workflow
```

### 3.2 Handoff to Nate (Barry → Nate)

**Barry says:**
> "→ Nate, implement subtask: {subtask_name}"
>
> Requirements:
> - {requirement_1}
> - {requirement_2}

### 3.3 Implement Subtask (Nate)

**Agent:** Nate 💻

| Subtask Type | Nate's Actions |
|--------------|----------------|
| **Configure trigger** | Set up Webhook/Schedule/Manual node |
| **Validation** | Add If nodes, schema checks |
| **Core logic** | Build the main node sequence |
| **Error handling** | Add Error Trigger, notifications |
| **Testing** | Execute with test data |
| **Documentation** | Add workflow notes |

**Implementation guidance:**
- Follow n8n best practices
- Use expressions correctly
- Handle errors gracefully
- Test after building

### 3.4 Test Subtask (Nate)

**Before marking complete:**
- [ ] Node executes without error
- [ ] Output matches expected
- [ ] Edge case handled (if applicable)

### 3.5 Mark Subtask Complete & AUTO-SAVE (Barry)

**Agent:** Barry ⚡

**Update quick-brief.md immediately after each subtask:**

```markdown
## Subtasks
- [x] Configure webhook trigger     ✓
- [x] Implement validation          ✓  ← Just completed
- [ ] Build core logic              ← Next
- [ ] Add error handling
```

**Log activity:**
```markdown
## Activity Log
| {timestamp} | Nate | Implemented validation logic |
| {timestamp} | Barry | Saved checkpoint |
```

**Update Next Session:**
```markdown
## Next Session
**Continue From:** Build core logic
**Current Subtask:** 3 of 5
```

### 3.6 Repeat

Continue until all subtasks complete.

---

## Step 4: Verify Acceptance Criteria

**Agent:** Barry ⚡ coordinates, Nate 💻 tests

**Test each AC:**

```markdown
## Acceptance Criteria

- [x] **AC1:** Given valid input, when triggered, then processes correctly ✓
- [x] **AC2:** Given invalid input, when triggered, then returns error ✓
- [ ] **AC3:** Given timeout, then retries 3 times ← Testing
```

**If AC fails:**
1. Barry identifies the gap
2. Nate fixes the implementation
3. Re-test
4. Update subtask if needed

---

## Step 5: Final Testing

**Agent:** Nate 💻

### Test Checklist

- [ ] Happy path works
- [ ] Error handling works
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] No sensitive data in logs

**If issues found:**
> Fix and re-test. Do not proceed until all tests pass.

---

## Step 6: Final Save

**Agent:** Barry ⚡

**Update quick-brief.md:**

```markdown
### Story 1: {story_title}

| Field | Value |
|-------|-------|
| **Status** | 👀 Review |
| **Completed** | {today's date} |

## Activity Log
| {timestamp} | Nate | Final testing complete |
| {timestamp} | Barry | Implementation complete, ready for CR |

## Next Session
**Continue From:** Code Review
**Current Subtask:** All complete - awaiting CR

## Implementation Notes
- {note_1}
- {note_2}

## Files Changed
- workflows/{workflow_name}.json
```

---

## Step 7: Route to Code Review

**Agent:** Barry ⚡ → Quinn 🧪

**Handoff:**
> "→ Routing to Quinn (QA) for code review"

**Log:**
```markdown
| {timestamp} | Barry | Handed off to Quinn for CR |
```

**Next command:**
```
CR {workflow_name}
```

---

## Decision Points During Implementation

| Situation | Action |
|-----------|--------|
| **Stuck on node configuration** | Nate handles: "How do I configure {node}?" |
| **Need expression help** | Nate handles: Expression syntax |
| **Architecture question** | Escalate to Winston (Architect) |
| **API integration unclear** | Escalate to Ivy (Integration) |
| **Data transformation complex** | Escalate to Dana (Data Analyst) |
| **AI/prompt needed** | Escalate to Petra (Prompt Engineer) |

---

## Specialist Routing

| Finding | Route To | Command |
|---------|----------|---------|
| Complex expressions | Nate (Developer) | `EH` |
| Architecture concerns | Winston (Architect) | `RA` |
| Security questions | Sierra (Security) | `QC` |
| API integration | Ivy (Integration) | `AA` |
| Data transformation | Dana (Data Analyst) | `DT` |

---

## Quick Brief Updates Summary

| Phase | Update | Auto-Save? |
|-------|--------|------------|
| Start | Status → In Progress | Yes |
| Each subtask | Check off `[x]`, log activity | **Yes (AUTO)** |
| AC verified | Check off AC `[x]` | Yes |
| Complete | Status → Review, notes | Yes |
| After CR | Status → Done | By Quinn |

---

## Quick Reference

**Inputs:**
- Story requirements (from PRD or user)
- Existing quick-brief.md (if resuming)

**Outputs:**
- Implemented workflow
- Updated quick-brief.md with full history
- Ready for code review

**Persistence File:** `./docs/quick-brief.md`

**Duration:** Varies by complexity
- Simple (3 pts): 1-2 hours
- Medium (5 pts): 2-4 hours
- Complex (8 pts): 4-8 hours

**Related Commands:**
- `SB` - Manual save checkpoint
- `LB` - Load brief to resume
- `CR` - Code review (next step)
