# Code Review Workflow [CR]

> **Agent:** Quinn (QA) 🧪 + Barry (Quick Flow) ⚡
> **Trigger:** `CR` or `code-review`
> **Input:** Workflow name or file
> **Output:** Review verdict + updated quick-brief.md

---

## Overview

Comprehensive quality review of an n8n workflow. Checks functionality, error handling, security, performance, and maintainability. **Saves verdict to quick-brief.md for persistence.**

**Agent Roles:**
- **Quinn (🧪):** Reviewer - conducts review, provides verdict
- **Barry (⚡):** Coordinator - updates quick-brief.md with results

---

## Step 1: Load Context

**Agent:** Quinn 🧪

### 1.1 Identify Workflow

**Provide one of:**
- Workflow name: `{workflow_name}`
- Workflow file: `./workflows/{name}.json`
- Story reference: Quick brief story

### 1.2 Check Quick Brief

```
./docs/quick-brief.md exists?
├── YES → Load story context
└── NO  → Proceed without (standalone review)
```

**If quick-brief exists:**
- Load story acceptance criteria
- Check expected behavior
- Review implementation notes

### 1.3 Log Activity

**Update quick-brief.md:**
```markdown
## Activity Log
| {timestamp} | Quinn | Started code review (CR) |
```

---

## Step 2: Review Checklist

**Agent:** Quinn 🧪

### 2.1 Structure Review

| Check | Status | Notes |
|-------|--------|-------|
| Nodes have descriptive names | ⬜ | |
| Workflow has description/notes | ⬜ | |
| No orphaned/disconnected nodes | ⬜ | |
| Logical flow structure | ⬜ | |
| Appropriate use of sub-workflows | ⬜ | |

### 2.2 Error Handling Review

| Check | Status | Notes |
|-------|--------|-------|
| Error workflow configured | ⬜ | |
| External API calls have error handling | ⬜ | |
| Invalid input scenarios handled | ⬜ | |
| Timeout handling present | ⬜ | |
| Meaningful error messages | ⬜ | |

**🔀 If security-sensitive:** Route to Sierra (Security) with `SR`

### 2.3 Data Handling Review

| Check | Status | Notes |
|-------|--------|-------|
| No sensitive data in logs | ⬜ | |
| Input validation present | ⬜ | |
| Data transformations correct | ⬜ | |
| Null/empty values handled | ⬜ | |
| Output schema matches spec | ⬜ | |

### 2.4 Performance Review

| Check | Status | Notes |
|-------|--------|-------|
| No unnecessary API calls | ⬜ | |
| Batch processing for large data | ⬜ | |
| Efficient expressions | ⬜ | |
| Appropriate timeout settings | ⬜ | |
| Memory-conscious design | ⬜ | |

### 2.5 Security Review (Quick)

| Check | Status | Notes |
|-------|--------|-------|
| Credentials in credential store | ⬜ | |
| No hardcoded secrets | ⬜ | |
| Webhook authentication configured | ⬜ | |
| Input sanitization present | ⬜ | |

**🔴 If any security check fails:** Stop review, route to Sierra (Security).

### 2.6 Maintainability Review

| Check | Status | Notes |
|-------|--------|-------|
| Naming conventions followed | ⬜ | |
| Complex logic documented | ⬜ | |
| Magic values extracted | ⬜ | |
| Single responsibility per workflow | ⬜ | |

---

## Step 3: Test Execution

**Agent:** Quinn 🧪

**Run the workflow with test data.**

### Test Cases

| Test | Input | Expected | Actual | Pass? |
|------|-------|----------|--------|-------|
| Happy path | {valid_input} | {expected} | | ⬜ |
| Invalid input | {invalid_input} | Error handled | | ⬜ |
| Empty input | `{}` or `null` | Graceful handling | | ⬜ |
| Edge case | {edge_case} | {expected} | | ⬜ |

---

## Step 4: Issues Summary

**Agent:** Quinn 🧪

### Critical Issues 🔴
*Must fix before approval*

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| {issue} | {node/line} | {impact} | {fix} |

### Warnings 🟡
*Should fix, can ship with acknowledgment*

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| {issue} | {node/line} | {impact} | {fix} |

### Suggestions 🟢
*Nice to have, optional*

| Suggestion | Location | Benefit |
|------------|----------|---------|
| {suggestion} | {node/line} | {benefit} |

---

## Step 5: Verdict

**Agent:** Quinn 🧪

### Scoring

| Category | Score (1-5) | Weight |
|----------|-------------|--------|
| Functionality | {score} | 30% |
| Error Handling | {score} | 25% |
| Security | {score} | 20% |
| Performance | {score} | 15% |
| Maintainability | {score} | 10% |
| **Weighted Total** | **{total}** | |

### Decision

- [ ] **✅ APPROVED** - Ready to deploy
  - No critical issues
  - Score ≥ 4.0

- [ ] **🟡 NEEDS CHANGES** - Fix and re-review
  - Has critical or multiple warnings
  - Score 3.0 - 3.9

- [ ] **🔴 REJECTED** - Significant rework needed
  - Fundamental issues
  - Score < 3.0

---

## Step 6: Update Quick Brief

**Agent:** Quinn 🧪 updates, Barry ⚡ saves

### 6.1 Update Review Status

**Update quick-brief.md:**

```markdown
## Review Status

| Field | Value |
|-------|-------|
| **Reviewed** | {today's date} |
| **Verdict** | {✅ APPROVED / 🟡 NEEDS CHANGES / 🔴 REJECTED} |
| **Reviewer** | Quinn |

**Review Notes:**
- Score: {weighted_total}/5
- {key_feedback_1}
- {key_feedback_2}
```

### 6.2 Update Story Status

**If APPROVED:**
```markdown
### Story 1: {story_title}

| Field | Value |
|-------|-------|
| **Status** | ✅ Done |
| **Reviewed** | {today's date} |
```

**If NEEDS CHANGES:**
```markdown
### Story 1: {story_title}

| Field | Value |
|-------|-------|
| **Status** | 🔄 In Progress |

**Review Feedback (must fix):**
- [ ] {issue_1}
- [ ] {issue_2}
```

**If REJECTED:**
```markdown
### Story 1: {story_title}

| Field | Value |
|-------|-------|
| **Status** | 📋 Backlog |
| **Note** | Rejected - needs redesign |
```

### 6.3 Log Activity

```markdown
## Activity Log
| {timestamp} | Quinn | Code review complete: {VERDICT} |
```

### 6.4 Update Next Session

**If APPROVED:**
```markdown
## Next Session
**Continue From:** Deploy workflow
**Next Steps:**
1. Deploy to staging with `DW`
2. Start next story (if any)
```

**If NEEDS CHANGES:**
```markdown
## Next Session
**Continue From:** Fix review feedback
**Current Subtask:** Address CR feedback
**Next Steps:**
1. Fix: {issue_1}
2. Fix: {issue_2}
3. Re-run CR
```

---

## Step 7: Next Steps

**Agent:** Quinn 🧪

### If Approved ✅
> 📍 **Continue with:** `DW` (Deploy Workflow) via Rex (DevOps)
>
> ```
> DW {workflow_name} --env staging
> ```

### If Needs Changes 🟡
> 📍 **Return to:** `DS` (Dev Story) to fix issues
>
> Fix the issues listed in quick-brief.md, then re-run `CR`.

### If Rejected 🔴
> 📍 **Escalate to:** Winston (Architect) for design review
>
> ```
> RA {workflow_name}
> ```

---

## Specialist Routing

| Finding | Route To | Command |
|---------|----------|---------|
| Security vulnerability | Sierra (Security) | `SR` |
| Architecture concerns | Winston (Architect) | `RA` |
| Complex data issues | Dana (Data Analyst) | `AD` |
| Integration problems | Ivy (Integration) | `AA` |
| Performance critical | Winston (Architect) | `FA` |

---

## Quick Reference

**Inputs:**
- Workflow to review
- Quick-brief.md context (if exists)

**Outputs:**
- Review report
- Verdict (Approved/Changes/Rejected)
- Updated quick-brief.md with results

**Persistence File:** `./docs/quick-brief.md`

**Duration:** 15-30 minutes typical

**Related Commands:**
- `DS` - Dev Story (if needs changes)
- `DW` - Deploy Workflow (if approved)
- `SR` - Security Review (if security concerns)
- `SB` - Save Brief (manual checkpoint)
