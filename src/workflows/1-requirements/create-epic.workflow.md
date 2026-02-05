# Create Epic Workflow [CE]

> **Agent:** Victor (PO) 📦
> **Trigger:** `CE` or `create-epic`
> **Output:** Epic file in backlog

---

## Overview

Create an epic from a PRD or standalone. Epics group related user stories that deliver a significant feature or capability.

---

## Step 1: Epic Context

**Agent:** Victor (PO) 📦

### Epic Source

- [ ] **From PRD** - Breaking down a validated PRD
- [ ] **Standalone** - New epic without PRD

### If From PRD

```
Load PRD: ./docs/requirements/{product}-prd.md
```

Identify which PRD section(s) this epic covers.

---

## Step 2: Epic Definition

**Agent:** Victor (PO) 📦

### Epic Information

| Field | Value |
|-------|-------|
| **Epic ID** | EPIC-{number} |
| **Title** | {descriptive_title} |
| **Owner** | {product_owner} |
| **Priority** | P1 / P2 / P3 |

### Epic Statement

**Format:**
> As a {user_type}, I want {capability} so that {business_value}.

### Business Value

Describe why this epic matters:
- What problem does it solve?
- What value does it deliver?
- How does it align with product goals?

---

## Step 3: Scope Definition

**Agent:** Victor (PO) 📦

### In Scope

List what IS included in this epic:
- {feature_1}
- {feature_2}
- {feature_3}

### Out of Scope

List what is NOT included:
- {exclusion_1}
- {exclusion_2}

### Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| {dependency} | Epic / External / Technical | Ready / Pending |

---

## Step 4: Success Criteria

**Agent:** Victor (PO) 📦

### Definition of Done for Epic

- [ ] All stories completed
- [ ] All acceptance criteria met
- [ ] Integration tested
- [ ] Documentation complete
- [ ] Stakeholder sign-off

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| {metric_1} | {target} | {how_to_measure} |
| {metric_2} | {target} | {how_to_measure} |

---

## Step 5: Story Breakdown

**Agent:** Victor (PO) 📦

### Identify Stories

Break the epic into stories:

### Dependency Analysis

Before listing stories, analyze inter-story dependencies:
1. Identify what each story produces and requires
2. Common patterns: setup/config before logic, core path before error handling, data source before consumer
3. Order so no story depends on a later story
4. Verify: walk the list top-to-bottom -- every dependency resolves earlier

| # | Story Title | Depends On | Priority | Points (Est) |
|---|-------------|------------|----------|--------------|
| 1 | {story_1} | - | Must | ? |
| 2 | {story_2} | #1 | Must | ? |
| 3 | {story_3} | #1 | Should | ? |

### Story Sizing Guidelines

| Size | Points | Characteristics |
|------|--------|-----------------|
| XS | 1 | Trivial, < 1 hour |
| S | 2 | Simple, few hours |
| M | 3 | Moderate, 1-2 days |
| L | 5 | Complex, 3-5 days |
| XL | 8 | Very complex, needs breakdown |

**🔀 For each story:** Create with `CS` (Create Story)

---

## Step 6: Timeline Estimation

**Agent:** Victor (PO) 📦 + Paula (PM) 📋

### Rough Estimates

| Phase | Duration |
|-------|----------|
| Design | {X} weeks |
| Development | {X} weeks |
| Testing | {X} weeks |
| **Total** | **{X} weeks** |

### Milestones

| Milestone | Target Date |
|-----------|-------------|
| Epic started | {date} |
| MVP complete | {date} |
| Epic done | {date} |

---

## Step 7: Save Epic

**Agent:** Victor (PO) 📦

### Epic File Template

```markdown
# Epic: {Title}

| Field | Value |
|-------|-------|
| **Epic ID** | {EPIC-XXX} |
| **Status** | Draft / Ready / In Progress / Done |
| **Priority** | {P1/P2/P3} |
| **Owner** | {name} |
| **PRD** | {link if applicable} |
| **Created** | {date} |

---

## Epic Statement

> As a {user}, I want {capability} so that {value}.

---

## Business Value

{description}

---

## Scope

### In Scope
- {item}

### Out of Scope
- {item}

---

## Success Criteria

- [ ] {criterion_1}
- [ ] {criterion_2}

---

## Stories

| # | ID | Title | Depends On | Status | Points |
|---|-----|-------|------------|--------|--------|
| 1 | {STORY-ID} | {title} | - | Backlog | {pts} |

---

## Timeline

| Milestone | Date |
|-----------|------|
| {milestone} | {date} |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| {date} | Created | {name} |
```

### Save Location

```
./docs/backlog/epics/epic-{id}-{slug}.md
```

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Need PRD first | Victor (PO) | `CP` |
| Architecture questions | Winston (Architect) | `CA` |
| Story creation | Victor (PO) | `CS` |
| Implementation | Nate (Developer) | `DS` |

---

## Quick Reference

**Inputs:**
- PRD (optional)
- Epic requirements

**Outputs:**
- Epic file in `./docs/backlog/epics/`
- Story placeholders

**Duration:** 30-60 minutes

**Next Steps:**
- Create stories with `CS`
- Validate epic with `VE`
