# Implementation Readiness Workflow [IR]

> **Agent:** Winston (Architect) 🏗️
> **Trigger:** `IR` or `implementation-readiness`
> **Output:** Readiness checklist with go/no-go decision

---

## Overview

Verify that all prerequisites are in place before starting development. This gate ensures the team has everything needed to implement successfully.

---

## Step 1: Readiness Context

**Agent:** Winston (Architect) 🏗️

### Readiness Check For

| Item | Reference |
|------|-----------|
| PRD | `./docs/requirements/{product}-prd.md` |
| Architecture | `./docs/architecture/{name}-architecture.md` |
| Stories | `./docs/backlog/stories/` |
| Backlog | `./docs/backlog/stories/` |

### Check Type

- [ ] **Pre-Epic** - Before major epic begins
- [ ] **Pre-Story** - Before complex story starts
- [ ] **Pre-Milestone** - Before major milestone

---

## Step 2: Requirements Readiness

**Agent:** Winston (Architect) 🏗️

### Requirements Check

| Check | Status | Notes |
|-------|--------|-------|
| PRD exists and validated | ⬜ | |
| All user stories created | ⬜ | |
| Stories pass DoR | ⬜ | |
| Acceptance criteria clear | ⬜ | |
| Edge cases documented | ⬜ | |
| No open questions | ⬜ | |

### Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | {question} | {owner} | Open/Resolved |

**🔀 If requirements unclear:** Route to Victor (PO) for clarification.

---

## Step 3: Architecture Readiness

**Agent:** Winston (Architect) 🏗️

### Architecture Check

| Check | Status | Notes |
|-------|--------|-------|
| Architecture document exists | ⬜ | |
| ADRs for key decisions | ⬜ | |
| Workflow design approved | ⬜ | |
| Integration patterns defined | ⬜ | |
| Error handling strategy set | ⬜ | |
| Security reviewed | ⬜ | |

### Technical Decisions Confirmed

| Decision | ADR | Status |
|----------|-----|--------|
| {decision_1} | ADR-{X} | Approved |
| {decision_2} | ADR-{X} | Approved |

---

## Step 4: Environment Readiness

**Agent:** Winston (Architect) 🏗️ + Rex (DevOps) 🚀

### Development Environment

| Check | Status |
|-------|--------|
| n8n development instance available | ⬜ |
| Access credentials configured | ⬜ |
| Test data available | ⬜ |
| Sandbox APIs accessible | ⬜ |

### Staging Environment

| Check | Status |
|-------|--------|
| n8n staging instance available | ⬜ |
| Staging credentials configured | ⬜ |
| Staging data seeded | ⬜ |

### Production Readiness (for deployment)

| Check | Status |
|-------|--------|
| Production credentials ready | ⬜ |
| Deployment pipeline working | ⬜ |
| Rollback procedure documented | ⬜ |
| Monitoring configured | ⬜ |

---

## Step 5: Integration Readiness

**Agent:** Winston (Architect) 🏗️ + Ivy (Integration) 🔌

### External Systems

| System | Access | Credentials | Docs | Ready |
|--------|--------|-------------|------|-------|
| {system_1} | ⬜ | ⬜ | ⬜ | ⬜ |
| {system_2} | ⬜ | ⬜ | ⬜ | ⬜ |

### API Readiness

| API | Endpoint | Auth | Rate Limits | Status |
|-----|----------|------|-------------|--------|
| {api_1} | {url} | {type} | {limits} | Ready/Pending |

### Integration Blockers

| Blocker | Owner | ETA |
|---------|-------|-----|
| {blocker} | {owner} | {date} |

**🔀 If integration blockers:** Route to Ivy (Integration) with `IS`.

---

## Step 6: Team Readiness

**Agent:** Winston (Architect) 🏗️ + Paula (PM) 📋

### Team Availability

| Role | Person | Available | Notes |
|------|--------|-----------|-------|
| Developer | {name} | ⬜ | |
| QA | {name} | ⬜ | |
| DevOps | {name} | ⬜ | |

### Skills Check

| Skill Required | Available | Training Needed |
|----------------|-----------|-----------------|
| {skill_1} | ⬜ | {if needed} |
| {skill_2} | ⬜ | {if needed} |

### Capacity Check

- [ ] Team has capacity for this work
- [ ] No conflicting priorities
- [ ] Support/on-call covered

---

## Step 7: Dependency Check

**Agent:** Winston (Architect) 🏗️

### Internal Dependencies

| Dependency | Type | Status | ETA |
|------------|------|--------|-----|
| {dep_1} | Story/Epic | Ready/Blocked | {date} |
| {dep_2} | Code/Library | Ready/Blocked | {date} |

### External Dependencies

| Dependency | Owner | Status | Risk |
|------------|-------|--------|------|
| {ext_dep_1} | {owner} | Ready/Pending | Low/Med/High |
| {ext_dep_2} | {owner} | Ready/Pending | Low/Med/High |

### Blocked Dependencies

| Dependency | Blocker | Mitigation |
|------------|---------|------------|
| {dep} | {blocker} | {mitigation} |

---

## Step 8: Risk Assessment

**Agent:** Winston (Architect) 🏗️

### Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {risk_1} | Low/Med/High | Low/Med/High | {mitigation} |
| {risk_2} | Low/Med/High | Low/Med/High | {mitigation} |

### Unknowns

| Unknown | Impact | Investigation Needed |
|---------|--------|---------------------|
| {unknown_1} | {impact} | {action} |

### Risk Decision

- [ ] Risks acceptable, proceed
- [ ] Risks need mitigation first
- [ ] Too risky, don't proceed

---

## Step 9: Generate Readiness Report

**Agent:** Winston (Architect) 🏗️

### Readiness Report Template

```markdown
# Implementation Readiness Report

## Summary

| Field | Value |
|-------|-------|
| Project/Epic | {name} |
| Assessed By | Winston (Architect) |
| Date | {date} |
| Decision | ✅ GO / ⚠️ CONDITIONAL / ❌ NO-GO |

---

## Readiness Scores

| Category | Score | Status |
|----------|-------|--------|
| Requirements | {X}/6 | ✅/❌ |
| Architecture | {X}/6 | ✅/❌ |
| Environment | {X}/4 | ✅/❌ |
| Integrations | {X}/4 | ✅/❌ |
| Team | {X}/3 | ✅/❌ |
| Dependencies | {X}/4 | ✅/❌ |
| **Overall** | **{X}%** | **{status}** |

---

## Blockers

{list of blockers if any}

## Conditions (if conditional go)

{conditions that must be met}

## Risks Accepted

{risks proceeding with}

---

## Recommendation

{recommendation text}

---

## Sign-off

- [ ] Architect (Winston)
- [ ] PM (Paula)
- [ ] Tech Lead / Developer (Nate)
```

---

## Step 10: Readiness Decision

**Agent:** Winston (Architect) 🏗️

### Decision Matrix

| Score | Decision | Action |
|-------|----------|--------|
| 90-100% | ✅ GO | Proceed with implementation |
| 70-89% | ⚠️ CONDITIONAL | Address conditions, then proceed |
| 50-69% | ⚠️ DELAYED | Resolve blockers first |
| < 50% | ❌ NO-GO | Not ready, significant work needed |

### If GO

- [ ] Notify team to start
- [ ] Update story statuses
- [ ] Begin first story

### If CONDITIONAL

- [ ] Document conditions
- [ ] Assign condition owners
- [ ] Set condition deadlines
- [ ] Monitor condition resolution

### If NO-GO

- [ ] Document blockers
- [ ] Assign resolution owners
- [ ] Schedule re-assessment

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Requirements gaps | Victor (PO) | `VS` or `CS` |
| Architecture gaps | Winston (Architect) | `CA` |
| Environment issues | Rex (DevOps) | Setup |
| Integration issues | Ivy (Integration) | `IS` |
| Capacity issues | Paula (PM) | `CE` |

---

## Quick Reference

**Inputs:**
- PRD
- Architecture docs
- Stories
- Epic plan (if applicable)

**Outputs:**
- Readiness report
- Go/No-Go decision
- Blocker list (if any)

**Duration:** 30-60 minutes

**Thresholds:**
- GO: 90%+
- CONDITIONAL: 70-89%
- NO-GO: < 70%
