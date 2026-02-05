---
template: user-story
version: "1.1"
category: agile
---

<!--
Story ID Convention:

Epic-Scoped (6+ stories):
  Format: story-{epic}.{story}-{slug}.md
  Example: story-1.3-webhook-setup.md (Epic 1, Story 3)

Standalone (< 6 stories or Quick Flow):
  Format: {type}-{sequence}-{slug}.md
  Types: feat, bug, hotfix, chore
  Examples: feat-001-crm-sync.md, bug-002-timeout.md

Detection Logic:
  1. Check ./docs/backlog/epics/ for epic files
  2. If epics exist → use story-X.Y format
  3. If no epics → use feat-xxx, bug-xxx, etc.
-->

# User Story: {story_title}

## Story Information

| Field | Value |
|-------|-------|
| **Story ID** | {story_id} |
| **Epic** | {epic_id} |
| **Priority** | {P1/P2/P3} |
| **Story Points** | {points} |
| **Status** | 📋 Backlog |
| **Iteration** | - |
| **Assignee** | - |
| **Depends On** | {story_ids_or_none} |
| **Blocks** | {story_ids_or_none} |

<!-- Status Lifecycle:
  📋 Backlog    → Story created (SM *story-draft)
  ✅ Approved   → Validated by PO (PO *validate-story)
  🔄 In Progress → Developer started (Dev *dev-story)
  👀 Review     → Implementation complete, awaiting QA
  ✅ Done       → QA approved (QA *code-review)
-->

---

## User Story

```
As a {user_type}
I want to {action/goal}
So that {benefit/value}
```

---

## Description

{Detailed description of the story. Provide context and background.}

---

## Acceptance Criteria

### Scenario 1: {scenario_name}
```gherkin
Given {precondition}
When {action}
Then {expected_result}
```

### Scenario 2: {scenario_name}
```gherkin
Given {precondition}
When {action}
Then {expected_result}
```

### Additional Criteria
- [ ] {criterion_1}
- [ ] {criterion_2}
- [ ] {criterion_3}

---

## Technical Notes

### Implementation Approach
{Brief description of how this will be implemented.}

### n8n Workflow Details
- **Trigger:** {trigger_type}
- **Key Nodes:** {nodes}
- **Integrations:** {integrations}

### Data Requirements
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| {field} | {type} | {source} | {notes} |

---

## Dependencies

### Story Dependencies
| Story ID | Title | Status | Why Required |
|----------|-------|--------|--------------|
| {story_id} | {title} | {status} | {reason} |

### External Dependencies
- [ ] {dependency_1}
- [ ] {dependency_2}

---

## Subtasks

<!-- Developer updates these as work progresses -->
- [ ] {subtask_1}
- [ ] {subtask_2}
- [ ] {subtask_3}
- [ ] {subtask_4}
- [ ] {subtask_5}

---

## Definition of Done

- [ ] Code complete
- [ ] Unit tests passing
- [ ] Code reviewed
- [ ] Acceptance criteria verified
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA approved

---

## Attachments

- {link_to_mockup}
- {link_to_design}
- {link_to_spec}

---

## Discussion

### Questions
- [ ] {question_1}
- [ ] {question_2}

### Decisions
| Decision | Date | Made By |
|----------|------|---------|
| {decision} | {date} | {person} |

---

## History

| Date | Event | Author |
|------|-------|--------|
| {date} | Created | {author} |
| {date} | Refined | {author} |
