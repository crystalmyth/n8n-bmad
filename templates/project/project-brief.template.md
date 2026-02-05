# Project Brief

> **Last Updated:** ${TIMESTAMP}

## Overview

**Project:** ${PROJECT_NAME}
**Goal:** ${PROJECT_GOAL}
**Scale:** ${SCALE_PROFILE} (${STORY_COUNT} stories estimated)

## Completed Phases

<!-- Phase summaries auto-appended here on finalize -->

## Current Phase: ${CURRENT_PHASE}

**Working On:** ${CURRENT_TASK}
**Blockers:** ${BLOCKERS_OR_NONE}

**Next Steps:**
1. ${NEXT_STEP_1}
2. ${NEXT_STEP_2}

## Key Decisions

<!-- Key decisions accumulated here - add with UB -->

1. ${DECISION_1}

## Documents

| Document | Path |
|----------|------|
| PRD | `./docs/prd.md` |
| Architecture | `./docs/architecture.md` |
| Stories | `./docs/backlog/stories/` |
| Epics | `./docs/backlog/epics/` |

---

## Phase Summary Templates

<!-- Used when appending phase summaries -->

### PRD Summary Template
```
### PRD (${DATE}) ✓
- **Problem:** ${PROBLEM_STATEMENT}
- **Users:** ${TARGET_USERS}
- **Requirements:** ${KEY_REQUIREMENTS}
- **Success Criteria:** ${SUCCESS_METRICS}
- **Out of Scope:** ${OUT_OF_SCOPE}
```

### Architecture Summary Template
```
### Architecture (${DATE}) ✓
- **Pattern:** ${ARCHITECTURE_PATTERN}
- **Trigger:** ${TRIGGER_TYPE}
- **Integrations:** ${INTEGRATIONS_LIST}
- **Data Flow:** ${DATA_FLOW_SUMMARY}
- **Error Handling:** ${ERROR_STRATEGY}
```

### Stories Summary Template
```
### Stories (${DATE}) ✓
- **Total:** ${STORY_COUNT} stories
- **Epics:** ${EPIC_COUNT} (if any)
- **Priority:** ${HIGH_PRIORITY_STORIES}
```

### Milestone Summary Template
```
### Milestone ${N} (${DATE}) ✓
- **Goal:** ${MILESTONE_GOAL}
- **Epic:** ${EPIC_NAME}
- **Stories:** ${STORIES_IN_MILESTONE}
- **Completed:** ${COMPLETED_STORIES}
```
