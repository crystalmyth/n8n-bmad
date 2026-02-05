# Validate PRD Workflow [VP]

> **Agent:** Victor (PO) 📦
> **Trigger:** `VP` or `validate-prd`
> **Output:** Validation report with pass/fail status

---

## Overview

Validate a Product Requirements Document against the Definition of Ready checklist. Ensures PRD is complete, clear, and ready for epic/story breakdown.

---

## Step 1: Load PRD

**Agent:** Victor (PO) 📦

### PRD Location

```
./docs/requirements/{product}-prd.md
```

### Confirm PRD Exists

- [ ] PRD file found
- [ ] PRD is not empty
- [ ] PRD follows template structure

**If PRD not found:** Use `CP` to create a new PRD first.

---

## Step 2: Structure Validation

**Agent:** Victor (PO) 📦

### Required Sections Checklist

| Section | Present? | Complete? |
|---------|----------|-----------|
| Executive Summary | ⬜ | ⬜ |
| Problem Statement | ⬜ | ⬜ |
| Goals & Success Metrics | ⬜ | ⬜ |
| User Personas | ⬜ | ⬜ |
| Functional Requirements | ⬜ | ⬜ |
| Non-Functional Requirements | ⬜ | ⬜ |
| Scope (In/Out) | ⬜ | ⬜ |
| Timeline | ⬜ | ⬜ |

### Validation Rules

- [ ] All required sections are present
- [ ] Each section has meaningful content (not just placeholders)
- [ ] No TODO markers remaining
- [ ] No TBD placeholders remaining

---

## Step 3: Content Quality Check

**Agent:** Victor (PO) 📦

### Problem Statement Quality

- [ ] Clearly defines the problem being solved
- [ ] Explains why this problem matters
- [ ] Quantifies impact if possible

### Goals Quality

- [ ] Goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Success metrics are defined
- [ ] Metrics are measurable

### Requirements Quality

- [ ] Requirements are atomic (one requirement per item)
- [ ] Requirements are testable
- [ ] Requirements have priority (Must/Should/Could)
- [ ] Dependencies are identified

### Story Ordering Quality (if stories present)
- [ ] Stories include "Depends On" column
- [ ] Stories listed in dependency order (foundational first)
- [ ] No story depends on a later story

---

## Step 4: Technical Feasibility Check

**Agent:** Victor (PO) 📦 → Winston (Architect) 🏗️

### Architecture Alignment

- [ ] Requirements align with n8n capabilities
- [ ] No impossible technical requirements
- [ ] Integration points are feasible

**🔀 If technical concerns:** Route to Winston (Architect) for architecture review with `CA`.

---

## Step 5: Validation Result

**Agent:** Victor (PO) 📦

### Generate Validation Report

```markdown
## Validation Report: {prd_name}

**Document:** `./docs/prd.md`
**Validated By:** Victor (PO) 📦

---

**Status:** ✅ Approved | 📝 Draft (issues found)
**Score:** {passed}/{total} checks passed

---

### Checklist Summary

| Category | Score |
|----------|-------|
| Structure | {X}/{Y} |
| Content Quality | {X}/{Y} |
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

**Approval Rule:** Zero issues = Approved; Any issues = Stay Draft
```

---

## Step 6: Update Status & Next Steps

**Agent:** Victor (PO) 📦

### If NO Issues (Approved)

Update `./docs/prd.md` status field:
```markdown
| **Status** | ✅ Approved |
```

| Next Step | Trigger | Description |
|-----------|---------|-------------|
| Architecture | `CA` | Design technical architecture |
| Create Epic | `CE` | Break PRD into epics (6+ stories) |

### If ANY Issues Found (Stays Draft)

Keep status as Draft (no change):
```markdown
| **Status** | 📝 Draft |
```

Then:
1. Address 🔴 critical issues first
2. Then 🟡 should-fix items
3. Then 🟢 nice-to-have items
4. Edit PRD: `/n8n:pm *edit-prd` (EP)
5. Re-validate: `/n8n:po *validate-prd` (VP)

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| PRD needs editing | Victor (PO) | `EP` |
| Technical concerns | Winston (Architect) | `CA` |
| Business clarification needed | Mary (BA) | Stakeholder interview |

---

## Quick Reference

**Inputs:**
- Existing PRD file

**Outputs:**
- Validation report
- Pass/Fail status

**Duration:** 15-30 minutes

**Passing Threshold:** 80% checklist items complete
