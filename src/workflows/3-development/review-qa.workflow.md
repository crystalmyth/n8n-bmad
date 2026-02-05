# Review QA Workflow [RQ]

> **Agent:** Nate (Developer) 💻
> **Trigger:** `RQ` or `review-qa`
> **Input:** Review feedback from QA
> **Output:** Fixed issues + ready for re-review

---

## Overview

Address issues identified during QA code review. This is the fix step in the developer-centric workflow chain when the review verdict is "Needs Changes."

**Workflow Chain Position:**
```
┌────┐       ┌────┐       ┌────┐
│ DV │ ───▶  │ RV │ ───▶  │ DW │
└────┘       └────┘       └────┘
              │
              │ 🟡 Needs Changes
              ▼
           ┌────┐
           │ RQ │  ← You are here
           └────┘
              │
              │ Fixes complete
              ▼
           ┌────┐
           │ RV │  (re-review)
           └────┘
```

**Agent Role:**
- **Nate (💻):** Developer - fixes all issues, runs regression tests, re-submits

---

## Step 1: Load Review Feedback

**Agent:** Nate 💻

### 1.1 Identify Feedback Source

**Check these locations:**
1. Story file → Review Feedback section
2. `./docs/quick-brief.md` → Review Status (if using Quick Flow)
3. Most recent `RV`/`CR` output

### 1.2 Extract Issues

**Critical Issues 🔴 (Must Fix)**
| # | Issue | Location | Required Fix |
|---|-------|----------|--------------|
| 1 | {issue} | {node/line} | {fix} |

**Warnings 🟡 (Should Fix)**
| # | Issue | Location | Required Fix |
|---|-------|----------|--------------|
| 1 | {issue} | {node/line} | {fix} |

**Suggestions 🟢 (Optional)**
| # | Suggestion | Location | Benefit |
|---|------------|----------|---------|
| 1 | {suggestion} | {node/line} | {benefit} |

---

## Step 2: Plan Fixes

**Agent:** Nate 💻

### 2.1 Prioritize Issues

**Fix order:**
1. 🔴 Critical issues first (blockers)
2. 🟡 Warnings second (quality)
3. 🟢 Suggestions if time permits

### 2.2 Create Fix Checklist

| # | Priority | Issue | Fix Plan | Status |
|---|----------|-------|----------|--------|
| 1 | 🔴 | {issue} | {plan} | ⬜ |
| 2 | 🔴 | {issue} | {plan} | ⬜ |
| 3 | 🟡 | {issue} | {plan} | ⬜ |

---

## Step 3: Fix Issues

**Agent:** Nate 💻

### 3.1 For Each Issue

**Process:**
1. **Locate** - Find the problem node/expression
2. **Understand** - Why did this fail review?
3. **Fix** - Apply the correction
4. **Test** - Verify the specific scenario
5. **Mark** - Check off in fix list

### 3.2 Common Fix Patterns

**Error Handling Issues:**
```
Add Error Trigger node + error handling branch
Configure retry logic for API calls
Add timeout configuration
```

**Data Handling Issues:**
```
Add null checks: {{ $json.field ?? 'default' }}
Validate input at workflow start
Remove sensitive data from logs
```

**Security Issues:**
```
Move secrets to credential store
Add webhook authentication
Validate/sanitize input
```

**Performance Issues:**
```
Add batch processing for arrays
Remove unnecessary API calls
Optimize expressions
```

### 3.3 Update Fix Checklist

As fixes are applied:
```markdown
| # | Priority | Issue | Fix Plan | Status |
|---|----------|-------|----------|--------|
| 1 | 🔴 | Missing error handler | Added Error Trigger | ✅ |
| 2 | 🔴 | No input validation | Added validation Set node | ✅ |
| 3 | 🟡 | Unclear node names | Renamed all nodes | ✅ |
```

---

## Step 4: Regression Test

**Agent:** Nate 💻

### 4.1 Re-run Original Tests

Ensure fixes didn't break existing functionality:

| Test | Before Fix | After Fix | Pass? |
|------|------------|-----------|-------|
| Happy path | ✅ | | ⬜ |
| Invalid input | ✅ | | ⬜ |
| Edge case | ✅ | | ⬜ |

### 4.2 Test Fixed Scenarios

Verify each fix works:

| Issue Fixed | Test Scenario | Expected | Actual | Pass? |
|-------------|---------------|----------|--------|-------|
| Error handling | Trigger API error | Handled gracefully | | ⬜ |
| Input validation | Send invalid data | Rejected with message | | ⬜ |

### 4.3 Verify All Critical Issues Resolved

- [ ] All 🔴 Critical issues fixed and tested
- [ ] All 🟡 Warnings addressed
- [ ] No new issues introduced

---

## Step 5: Update Story

**Agent:** Nate 💻

### 5.1 Mark Feedback Resolved

Update story file feedback section:
```markdown
**Review Feedback (resolved):**
- [x] Missing error handler ✓ Added Error Trigger
- [x] No input validation ✓ Added validation node
- [x] Unclear node names ✓ Renamed for clarity
```

### 5.2 Add Fix Notes

```markdown
## Implementation Notes (Updated)
- Fixed: {summary_of_fixes}
- Regression: All original tests pass
- Ready for re-review
```

### 5.3 Keep Status as In Progress

```markdown
| **Status** | 🔄 In Progress |
```

Status will change to `👀 Review` when re-submitting.

---

## Step 6: Re-Submit for Review

**Agent:** Nate 💻

### 6.1 Pre-Submission Checklist

Before requesting re-review:
- [ ] All critical issues fixed
- [ ] All warnings addressed
- [ ] Regression tests pass
- [ ] Fix notes documented
- [ ] Story file updated

### 6.2 Request Re-Review

> 📍 **Next:** Re-submit with `RV` or `/n8n:qa *review`

**Provide to reviewer:**
- Summary of fixes applied
- Any remaining warnings/suggestions not addressed (with justification)
- Test results showing fixes work

### 6.3 Update Status

```markdown
| **Status** | 👀 Review |
```

---

## Review Outcomes

### If Approved ✅

> 📍 **Route to:** `DW` (Deploy Workflow)
>
> The fix cycle is complete. Proceed to deployment.

### If Still Needs Changes 🟡

> 📍 **Route to:** `RQ` again (this workflow)
>
> Review the new feedback and repeat the fix cycle.

### If Rejected 🔴

> 📍 **Escalate to:** Winston (Architect) with `RA`
>
> Fundamental design issues may require architectural review.

---

## Quick Reference

**Inputs:**
- Review feedback (from RV/CR output, story file, or quick-brief.md)

**Outputs:**
- Fixed workflow
- Updated story with fix notes
- Ready for re-review

**Chain Position:**
```
DV → RV → RQ → RV → (repeat if needed) → DW
              ^^
```

**Duration:** Depends on issue complexity

**Related Commands:**
- `RV` - Re-submit for review (next step)
- `DV` - If major rework needed, restart implementation
- `DW` - Deploy after approval
- `DB` - Debug mode for tricky issues
