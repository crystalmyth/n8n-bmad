---
template: epic
version: "1.0"
category: agile
---

# Epic: {epic_title}

## Epic Information

| Field | Value |
|-------|-------|
| **Epic ID** | {epic_id} |
| **Owner** | {owner} |
| **Status** | 📝 Draft |
| **Priority** | {priority} |
| **Created** | {date} |
| **Target Release** | {release} |

<!-- Status Lifecycle:
  📝 Draft     → Epic created (PM *create-epic)
  ✅ Approved  → Validated by PO (PO *validate-epic)
  🔄 In Progress → Stories being implemented
  ✅ Done      → All stories complete
-->

---

## Summary

{Brief description of the epic and its purpose. What big problem does this solve?}

---

## Business Value

### Problem Statement
{What problem are we solving for users/business?}

### Value Proposition
{What value does this deliver when complete?}

### Success Metrics
| Metric | Baseline | Target | Actual |
|--------|----------|--------|--------|
| {metric} | {baseline} | {target} | |

---

## Scope

### In Scope
- {feature_1}
- {feature_2}
- {feature_3}

### Out of Scope
- {exclusion_1}
- {exclusion_2}

---

## User Stories

<!--
Stories listed in DEPENDENCY ORDER (topological sort).
"Depends On" references only earlier # numbers. Use "-" for no dependencies.
-->

| # | ID | Title | Depends On | Priority | Points | Status |
|---|-----|-------|------------|----------|--------|--------|
| 1 | story-{epic_num}.1-{slug} | {title} | - | {P1/P2/P3} | {points} | {status} |
| 2 | story-{epic_num}.2-{slug} | {title} | #1 | {P1/P2/P3} | {points} | {status} |

### Story Details

#### story-{epic_num}.1-{slug}: {story_title}
```
As a {user_type}
I want to {action}
So that {benefit}
```

---

## Dependencies

### Internal Dependencies
| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| {dependency} | {Technical/Team/Data} | {status} | {notes} |

### External Dependencies
| System/Team | Dependency | Contact | Status |
|-------------|------------|---------|--------|
| {system} | {what_needed} | {contact} | {status} |

---

## Technical Considerations

### Architecture Impact
{Describe any architectural changes required.}

### Integration Points
- {integration_1}
- {integration_2}

### Technical Risks
| Risk | Mitigation |
|------|------------|
| {risk} | {mitigation} |

---

## Acceptance Criteria

The epic is complete when:
- [ ] {criterion_1}
- [ ] {criterion_2}
- [ ] {criterion_3}
- [ ] All user stories are done
- [ ] Documentation is complete
- [ ] Deployed to production

---

## Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Epic Refined | {date} | |
| Development Start | {date} | |
| Development Complete | {date} | |
| Testing Complete | {date} | |
| Release | {date} | |

---

## Notes

{Additional notes, decisions, or context.}

---

## History

| Date | Change | Author |
|------|--------|--------|
| {date} | Created | {author} |
