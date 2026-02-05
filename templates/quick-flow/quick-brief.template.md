# Quick Brief

> **Last Updated:** ${TIMESTAMP}
> **Session:** ${SESSION_NUMBER}

## Project

**Goal:** ${PROJECT_GOAL}
**Context:** ${PROJECT_CONTEXT}

---

## Stories

<!-- Stories tracked inline - all in one place for minimal ceremony -->

### Story 1: ${STORY_TITLE}

| Field | Value |
|-------|-------|
| **Status** | ${STATUS} |
| **Trigger** | ${TRIGGER_TYPE} |
| **Priority** | ${PRIORITY} |
| **Depends On** | ${DEPENDS_ON_OR_NONE} |

**Acceptance Criteria:**
- [ ] ${AC_1}
- [ ] ${AC_2}
- [ ] ${AC_3}

**Subtasks:**
- [ ] ${SUBTASK_1}
- [ ] ${SUBTASK_2}
- [ ] ${SUBTASK_3}
- [ ] ${SUBTASK_4}

**Notes:**
- ${NOTE_1}

---

## Activity Log

<!-- Who did what - tracks agent collaboration -->

| Time | Agent | Action |
|------|-------|--------|
| ${TIMESTAMP} | Barry | Initialized quick-brief |

---

## Decisions

<!-- Key choices made during implementation -->

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | ${DECISION_1} | ${RATIONALE_1} |

---

## Review Status

<!-- Updated by Quinn after CR -->

| Field | Value |
|-------|-------|
| **Reviewed** | ${REVIEW_DATE_OR_PENDING} |
| **Verdict** | ${VERDICT_OR_PENDING} |
| **Reviewer** | ${REVIEWER_OR_PENDING} |

**Review Notes:**
${REVIEW_NOTES_OR_NONE}

---

## Next Session

<!-- What to continue when resuming -->

**Continue From:** ${CONTINUE_POINT}
**Current Subtask:** ${CURRENT_SUBTASK}
**Blockers:** ${BLOCKERS_OR_NONE}

**Next Steps:**
1. ${NEXT_STEP_1}
2. ${NEXT_STEP_2}

---

## Files

| Type | Path |
|------|------|
| Workflow | `./workflows/${WORKFLOW_NAME}.json` |
| Quick Brief | `./docs/quick-brief.md` |

---

## Template Notes

<!--
Quick Brief Design Principles:
1. Single file for everything - minimal ceremony
2. Stories inline, not separate files
3. Activity log tracks agent collaboration
4. "Next Session" is the resume point
5. Auto-saved after each subtask completion

Status Values: Backlog | Ready | In Progress | Review | Done
Verdict Values: Pending | Approved | Needs Changes | Rejected

Agent Roles in Quick Flow:
- Barry: Orchestrator (owns DS, coordinates)
- Nate: Implementer (builds nodes, expressions)
- Quinn: Reviewer (code review, quality)
-->
