# Validate Story Workflow [VS]

> **Agent:** Victor (PO) 📦
> **Trigger:** `VS` or `validate-story`
> **Output:** Story validation result (Ready / Not Ready)

---

## Overview

Validate a user story against the Definition of Ready (DoR). Ensures the story has enough detail for developers to implement without needing clarification.

---

## Step 1: Load Story

**Agent:** Victor (PO) 📦

### Story Location

```
./docs/backlog/stories/story-{id}-{slug}.md
```

### Confirm Story Exists

- [ ] Story file found
- [ ] Story follows template structure
- [ ] Story is not empty

---

## Step 2: INVEST Criteria Check

**Agent:** Victor (PO) 📦

### INVEST Checklist

| Criterion | Description | Pass? |
|-----------|-------------|-------|
| **I**ndependent | Can be developed independently OR has dependencies clearly documented and sequenced earlier | ⬜ |
| **N**egotiable | Not a rigid contract, open to discussion | ⬜ |
| **V**aluable | Delivers clear value to user or business | ⬜ |
| **E**stimable | Team can estimate the effort | ⬜ |
| **S**mall | Can be completed in one iteration | ⬜ |
| **T**estable | Has clear acceptance criteria to verify | ⬜ |

### Scoring

- 6/6: Excellent story
- 4-5/6: Good, minor improvements possible
- 2-3/6: Needs work before development
- 0-1/6: Not ready, requires rewriting

---

## Step 3: Acceptance Criteria Validation

**Agent:** Victor (PO) 📦

### AC Format Check

Each AC should follow Given/When/Then format:

```
Given {precondition}
When {action}
Then {expected_result}
```

### AC Quality Checklist

- [ ] At least 3 acceptance criteria
- [ ] Each AC is specific and measurable
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Edge cases considered
- [ ] No ambiguous language (avoid "should", "might", "could")

### AC Review

| # | AC Summary | Format OK? | Testable? |
|---|------------|------------|-----------|
| 1 | {summary} | ⬜ | ⬜ |
| 2 | {summary} | ⬜ | ⬜ |
| 3 | {summary} | ⬜ | ⬜ |

---

## Step 4: Technical Details Check

**Agent:** Victor (PO) 📦 → Nate (Developer) 💻

### Implementation Details

- [ ] Subtasks defined (or not needed)
- [ ] Technical approach outlined
- [ ] n8n nodes identified (or deferred to dev)
- [ ] Error handling requirements clear

### Dependencies Check

- [ ] Story dependencies listed with specific Story IDs
- [ ] Each dependency story exists in the backlog
- [ ] Dependency stories are sequenced earlier in backlog
- [ ] External API dependencies documented
- [ ] No blockers that prevent immediate work
- [ ] "Depends On" and "Blocks" fields populated in story header

**🔀 If technical questions:** Discuss with Nate (Developer) for clarity.

---

## Step 5: Estimation Validation

**Agent:** Victor (PO) 📦

### Story Points

| Estimate | Valid Range |
|----------|-------------|
| {current_estimate} | 1, 2, 3, 5, 8 |

### Estimate Validation

- [ ] Story has an estimate
- [ ] Estimate uses Fibonacci scale
- [ ] Estimate is ≤ 8 points (if > 8, split the story)
- [ ] Team agrees with estimate (or needs re-estimation)

---

## Step 6: Definition of Ready Checklist

**Agent:** Victor (PO) 📦

### Complete DoR Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | User story format complete | ⬜ |
| 2 | Business value clear | ⬜ |
| 3 | Acceptance criteria defined (3+) | ⬜ |
| 4 | AC are testable | ⬜ |
| 5 | Story is estimated | ⬜ |
| 6 | Story fits in one iteration | ⬜ |
| 7 | Dependencies identified | ⬜ |
| 8 | No blockers | ⬜ |
| 9 | Edge cases considered | ⬜ |
| 10 | Error handling defined | ⬜ |

### Threshold

- **Ready:** 8+ items checked
- **Almost Ready:** 6-7 items (minor fixes needed)
- **Not Ready:** < 6 items (significant work needed)

---

## Step 7: Validation Result

**Agent:** Victor (PO) 📦

### Generate Validation Report

```markdown
## Validation Report: {STORY-ID}

**Document:** `./docs/backlog/stories/story-{id}.md`
**Validated By:** Victor (PO) 📦

---

**Status:** ✅ Approved | 📋 Backlog (issues found)
**Score:** {passed}/{total} checks passed

---

### INVEST Score: {X}/6

### DoR Score: {X}/10

---

### 🔴 Critical Issues (must fix)
> Blocking issues that must be resolved.

- [ ] {issue}

### 🟡 Should Fix
> Important issues that should be addressed.

- [ ] {issue}

### 🟢 Nice to Have
> Suggestions for improvement.

- {suggestion}

---

**Approval Rule:** Zero issues = Approved; Any issues = Stay Backlog
```

---

## Step 8: Update Story Status

**Agent:** Victor (PO) 📦

### If NO Issues (Approved)

Update story file:
```markdown
| **Status** | ✅ Approved |
```

### If ANY Issues Found (Stays Backlog)

Keep status as Backlog (no change):
```markdown
| **Status** | 📋 Backlog |
```

Then:
1. Address 🔴 critical issues first
2. Then 🟡 should-fix items
3. Then 🟢 nice-to-have items
4. Edit story: `/n8n:po *edit-story` (XS)
5. Re-validate: `/n8n:po *validate-story` (VS)

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Story needs editing | Victor (PO) | `XS` |
| Technical clarification | Nate (Developer) | Discussion |
| Story too large | Victor (PO) | Split story |
| Ready for implementation | Nate (Developer) | `DS` |

---

## Quick Reference

**Inputs:**
- Story file

**Outputs:**
- Validation report
- Ready / Not Ready status
- Updated story file

**Duration:** 10-20 minutes per story

**Thresholds:**
- INVEST: 4+/6
- DoR: 8+/10
