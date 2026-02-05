# Validate Epic Workflow [VE]

> **Agent:** Victor (PO) 📦
> **Trigger:** `VE` or `validate-epic`
> **Output:** Validation report with pass/fail status

---

## Overview

Validate an Epic document against the Definition of Ready checklist. Ensures the epic is complete, aligned with PRD goals, and ready for story breakdown. This is the **four-eyes validation** step after PM creates the epic with `CE`.

---

## Step 1: Load Epic

**Agent:** Victor (PO) 📦

### Epic Location

```
./docs/backlog/epics/epic-{id}-{name}.md
```

### Confirm Epic Exists

- [ ] Epic file found
- [ ] Epic is not empty
- [ ] Epic follows template structure

**If epic not found:** Use `CE` to create a new epic first.

---

## Step 2: PRD Alignment Check

**Agent:** Victor (PO) 📦

### PRD Reference

```
./docs/prd.md (or ./docs/prd/index.md if sharded)
```

### Alignment Checklist

- [ ] Epic goal traces back to PRD objectives
- [ ] Epic scope is within PRD boundaries
- [ ] Epic doesn't contradict PRD requirements
- [ ] Business value aligns with PRD success metrics

---

## Step 3: Scope Validation

**Agent:** Victor (PO) 📦

### Scope Clarity Checklist

| Check | Pass? |
|-------|-------|
| In-scope items are explicit | ⬜ |
| Out-of-scope items are explicit | ⬜ |
| Scope boundaries are clear | ⬜ |
| No overlap with other epics | ⬜ |

### Validation Rules

- [ ] Scope is neither too broad nor too narrow
- [ ] Epic can reasonably be completed in 2-4 sprints
- [ ] Dependencies on other epics are documented

---

## Step 4: Story Coverage Check

**Agent:** Victor (PO) 📦

### Stories Defined

- [ ] At least 6 stories outlined (epic threshold)
- [ ] Stories cover the full epic scope
- [ ] No gaps between stories and epic goal
- [ ] No duplicate functionality across stories

### Story Quality (High-Level)

| # | Story Title | Supports Epic Goal? | Dependencies Valid? |
|---|-------------|---------------------|---------------------|
| 1 | {title} | ⬜ | ⬜ |
| 2 | {title} | ⬜ | ⬜ |
| 3 | {title} | ⬜ | ⬜ |
| ... | ... | ... | ... |

---

## Step 4.5: Story Dependency Order Check

**Agent:** Victor (PO) 📦

### Dependency Ordering Validation

- [ ] Story table has `#` and `Depends On` columns
- [ ] Every "Depends On" references only stories with a LOWER `#` number
- [ ] Foundational stories (no dependencies) appear first
- [ ] No circular dependencies exist
- [ ] Dependencies are reasonable (cited story actually produces what is needed)

### Common Ordering Problems

| Problem | Fix |
|---------|-----|
| Backward dependency (#2 depends on #5) | Move #5 before #2 |
| Missing dependency (uses webhook but no setup story) | Add setup story or note dependency |
| Circular dependency | Refactor one story to break the cycle |

**If ordering issues found:** Flag as Critical Issue -- reorder before approval.

---

## Step 5: Success Metrics Validation

**Agent:** Victor (PO) 📦

### Metrics Checklist

- [ ] Success metrics are defined
- [ ] Metrics are measurable
- [ ] Metrics align with PRD goals
- [ ] Baseline values documented (where applicable)

### Metrics Review

| Metric | Measurable? | Aligned with PRD? |
|--------|-------------|-------------------|
| {metric} | ⬜ | ⬜ |

---

## Step 6: Technical Feasibility Check

**Agent:** Victor (PO) 📦 → Winston (Architect) 🏗️

### Feasibility Checklist

- [ ] Epic is technically feasible with n8n
- [ ] Required integrations are possible
- [ ] No impossible technical requirements
- [ ] Timeline is realistic given complexity

**🔀 If technical concerns:** Route to Winston (Architect) for architecture review with `CA`.

---

## Step 7: Validation Report

**Agent:** Victor (PO) 📦

### Generate Validation Report

```markdown
## Validation Report: {epic_id}

**Document:** `./docs/backlog/epics/epic-{id}-{name}.md`
**Validated By:** Victor (PO) 📦

---

**Status:** ✅ Approved | 📝 Draft (issues found)
**Score:** {passed}/{total} checks passed

---

### Checklist Summary

| Category | Score |
|----------|-------|
| PRD Alignment | {X}/{Y} |
| Scope Clarity | {X}/{Y} |
| Story Coverage | {X}/{Y} |
| Success Metrics | {X}/{Y} |
| Technical Feasibility | {X}/{Y} |
| **Total** | **{total}%** |

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

**Approval Rule:** Zero 🔴 critical issues = Approved; Any 🔴 issues = Stay Draft
```

---

## Step 8: Update Status & Next Steps

**Agent:** Victor (PO) 📦

### If NO Critical Issues (Approved)

Update `./docs/backlog/epics/epic-{id}-{name}.md` status field:
```markdown
| **Status** | ✅ Approved |
```

| Next Step | Trigger | Description |
|-----------|---------|-------------|
| Draft Stories | `SD` | SM drafts stories with full context review |
| Create Story (quick) | `CS` | PO creates story directly (skip context review) |

### If ANY Critical Issues Found (Stays Draft)

Keep status as Draft (no change):
```markdown
| **Status** | 📝 Draft |
```

Then:
1. Address 🔴 critical issues first
2. Then 🟡 should-fix items
3. Then 🟢 nice-to-have items
4. Edit epic: `/n8n:pm *edit-epic` (EE)
5. Re-validate: `/n8n:po *validate-epic` (VE)

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Epic needs editing | Paula (PM) | `EE` |
| Technical concerns | Winston (Architect) | `CA` |
| PRD needs clarification | Paula (PM) | `EP` |
| Ready for story breakdown | Sam (SM) | `SD` |

---

## Validation Criteria Reference

### 🔴 Critical Checks (blocks approval)

- Epic goal is clear and specific
- Stories are defined (at least outline)
- Aligns with PRD goals
- Business value is articulated
- Stories are in dependency order (no backward references)

### 🟡 Should Fix

- Success metrics defined
- Scope boundaries are clear
- In-scope items listed
- Out-of-scope items explicit
- Stories support epic goal
- No conflicting epics
- Story table includes "Depends On" column
- Foundational stories appear first

### 🟢 Nice to Have

- Timeline estimated
- Dependencies documented
- Risks identified
- Story point totals calculated

---

## Quick Reference

**Inputs:**
- Existing epic file
- PRD for alignment check

**Outputs:**
- Validation report
- Pass/Fail status

**Duration:** 20-40 minutes

**Passing Threshold:** Zero 🔴 critical issues
