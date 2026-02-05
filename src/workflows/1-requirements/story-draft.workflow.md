# Story Draft Workflow [SD]

> **Agent:** Sam (SM) 🏃
> **Trigger:** `SD` or `story-draft`
> **Output:** Draft story ready for PO validation

---

## Overview

**⚠️ Single Story Mode:** This workflow drafts ONE story per invocation.
Call `SD` again for each additional story.

Draft a user story after reviewing full project context: PRD, epic, and existing stories. This ensures stories are consistent, non-duplicative, and aligned with project direction.

**Flow:**
```
SD (Sam drafts) → VS (Victor validates) → Ready for implementation
```

---

## Step 0: Story Selection (Auto-Detection)

**Agent:** Sam (SM) 🏃

### 0.1 Read Source Documents

**Read and extract story candidates from:**

1. **PRD** (`./docs/prd.md` or `./docs/prd/index.md`)
   - Extract all features, requirements, or user stories listed
   - Note section where each appears
   - Look for: "User Stories", "Features", "Requirements", "Scope" sections

2. **Epic** (`./docs/backlog/epics/*.md`) if exists
   - Extract planned stories from epic breakdown
   - Note story titles/IDs mentioned in epic
   - Look for: story lists, breakdown sections, scope items

### 0.2 Read Existing Stories

**Path:** `./docs/backlog/stories/`

**For each existing story file:**
- Extract story title from filename or `# Story:` header
- Build list of already-drafted stories

### 0.3 Cross-Reference & Identify Gaps

**Compare and identify undrafted stories:**

**If epics exist** (epic-scoped stories):
```
Epic 1: {epic_name}
├── story-1.1-xxx.md ✅ Drafted
├── story-1.2-xxx.md ✅ Drafted
└── {PRD item 3} ⏳ Needs Draft → will be story-1.3-*

Epic 2: {epic_name}
├── story-2.1-xxx.md ✅ Drafted
└── {PRD item 2} ⏳ Needs Draft → will be story-2.2-*
```

**If no epics** (standalone stories):
| Source Item | Existing Story Match? | Status |
|-------------|----------------------|--------|
| {PRD feature 1} | feat-001-xxx.md | ✅ Drafted |
| {PRD feature 2} | No match | ⏳ Needs Draft → will be feat-002-* |

### 0.4 Present Auto-Detected Status

```markdown
## Story Draft Status

**📋 Already drafted:** {count} stories
{list existing story files}

**⏳ Still need drafting:**
• {undrafted_1} - from {PRD section / Epic}
• {undrafted_2} - from {PRD section / Epic}

**✅ All drafted** (if none remaining)
```

### 0.5 Get User Confirmation

**If undrafted stories exist:**
- Ask: "Which story would you like me to draft next?"
- **⏸️ WAIT for user response before proceeding**
- Draft only the ONE story the user confirms

**If all stories are drafted:**
- Report: "All stories from PRD/epic have been drafted."
- Ask: "Would you like to add a new story not in the original scope?"

---

## Step 1: Gather Context

**Agent:** Sam (SM) 🏃

### 1.1 Load PRD

**Path:** `./docs/prd.md` (or `./docs/prd/index.md` if sharded)

**Extract:**
- [ ] Project goals
- [ ] Key requirements relevant to this story
- [ ] Success metrics
- [ ] Constraints

```markdown
## PRD Context

**Project:** {project_name}
**Goal:** {main_goal}
**Relevant Requirements:**
- {requirement_1}
- {requirement_2}
```

**🔀 If no PRD exists:** Route to Paula (PM) with `PRD` first.

---

### 1.2 Load Epic (if applicable)

**Path:** `./docs/backlog/epics/epic-{id}-{name}.md`

**Extract:**
- [ ] Epic goals
- [ ] Scope boundaries (in/out)
- [ ] Related stories already defined
- [ ] Success criteria

```markdown
## Epic Context

**Epic:** {EPIC-ID} - {epic_name}
**Goal:** {epic_goal}
**Scope:** {in_scope}
**Existing Stories:** {story_count}
```

**Skip if:** Project doesn't use epics (< 6 stories).

---

### 1.3 Review Existing Stories

**Path:** `./docs/backlog/stories/`

**Check for:**
- [ ] Duplicate functionality
- [ ] Conflicting requirements
- [ ] Dependencies (stories that must complete first)
- [ ] Related stories (similar domain/feature)
- [ ] This story's position in dependency order identified
- [ ] Which existing stories this story depends on
- [ ] Which future stories would depend on this story

```markdown
## Existing Stories Check

**Total Stories:** {count}
**Related Stories:**
- {STORY-ID}: {title} - {status}
- {STORY-ID}: {title} - {status}

**Potential Conflicts:** {none | list}
**Dependencies:** {none | list}
```

---

## Step 2: Define Story Scope

**Agent:** Sam (SM) 🏃

### 2.1 Story Identification

**Story ID Generation:**

1. **If epic exists** (`./docs/backlog/epics/epic-{N}-*.md`):
   - Determine epic number (N) from epic filename
   - Count existing stories for this epic: `story-{N}.*-*.md`
   - ID: `story-{N}.{next}-{slug}`
   - Example: `story-1.3-webhook-setup`

2. **If no epic (standalone):**
   - Determine type based on story nature:
     - `feat` - New feature/capability
     - `bug` - Bug fix
     - `hotfix` - Urgent production fix
     - `chore` - Maintenance/cleanup
   - Count existing: `{type}-*.md`
   - ID: `{type}-{next:03d}-{slug}`
   - Example: `feat-001-crm-sync`

Based on context review, define:

| Field | Value |
|-------|-------|
| **Story ID** | {story-X.Y-slug or type-NNN-slug} |
| **Epic** | {EPIC-ID or "-"} |
| **Source** | {PRD section / User request / Epic breakdown} |

### 2.2 User Story Format

**The Three Questions:**

1. **WHO** is the user?
   > Be specific: "Operations team member" not "user"

2. **WHAT** do they want?
   > One clear action/capability

3. **WHY** does it matter?
   > Business value from PRD, not technical benefit

```markdown
As a {specific_user_role},
I want {clear_capability},
So that {business_value_from_PRD}.
```

### 2.3 Alignment Check

Before proceeding, verify alignment:

- [ ] Story supports PRD goals
- [ ] Story fits epic scope (if applicable)
- [ ] Story aligns with epic goal (if applicable)
- [ ] No duplicate with existing stories
- [ ] Dependencies are identified

**🔀 If misalignment found:** Discuss with Victor (PO) before proceeding.

---

## Step 3: Draft Acceptance Criteria

**Agent:** Sam (SM) 🏃

### 3.1 Given-When-Then Format

```markdown
**AC1:** Given {precondition from PRD},
        When {user action},
        Then {expected outcome per requirements}.
```

### 3.2 Coverage Requirements

- [ ] **Happy path** - Main success scenario
- [ ] **Error handling** - What happens when things fail
- [ ] **Edge cases** - Boundary conditions
- [ ] **PRD compliance** - Criteria that verify PRD requirements

### 3.3 Draft AC

```markdown
## Acceptance Criteria

- [ ] **AC1 (Happy Path):** Given {context},
      When {action},
      Then {success_outcome}.

- [ ] **AC2 (Error Case):** Given {error_condition},
      When {action},
      Then {error_handling_per_PRD}.

- [ ] **AC3 (Edge Case):** Given {boundary_condition},
      When {action},
      Then {expected_behavior}.
```

---

## Step 4: Technical Context

**Agent:** Sam (SM) 🏃

### 4.1 n8n Workflow Details

Based on PRD and architecture (if exists):

| Aspect | Details |
|--------|---------|
| **Trigger Type** | Webhook / Schedule / Manual |
| **Key Nodes** | {from architecture or PRD} |
| **Integrations** | {external services} |
| **Data Flow** | {input → process → output} |

### 4.2 Dependencies

#### Story Dependencies
| Story ID | Title | Status | Why Required |
|----------|-------|--------|--------------|
| {STORY-ID} | {title} | {status} | {what this story needs from it} |

#### External Dependencies
| Dependency | Type | Status |
|------------|------|--------|
| {API/Service} | External | {Available/Needed} |
| {Credential} | Credential | {Have/Need} |

### 4.3 Subtasks (Initial)

```markdown
## Subtasks

- [ ] Set up {trigger_type} trigger
- [ ] Implement core logic
- [ ] Add error handling
- [ ] Write tests
- [ ] Document workflow
```

---

## Step 5: Compile Draft Story

**Agent:** Sam (SM) 🏃

### Draft Story Document

```markdown
# Story: {STORY-ID} - {Title}

| Field | Value |
|-------|-------|
| **ID** | {STORY-ID} |
| **Epic** | {EPIC-ID or "-"} |
| **Priority** | {P1/P2/P3} |
| **Points** | {estimate or "TBD"} |
| **Status** | Draft |
| **Depends On** | {story_ids_or_none} |
| **Blocks** | {story_ids_or_none} |
| **Iteration** | - |
| **Drafted By** | Sam (SM) |
| **Created** | {date} |

---

## Context

**PRD Requirement:** {relevant_requirement}
**Epic Goal:** {epic_goal or "N/A"}
**Epic Alignment:** {epic_goal or "N/A"}
**Related Stories:** {story_ids or "None"}

---

## User Story

As a {user_role},
I want {capability},
So that {business_value}.

---

## Acceptance Criteria

- [ ] **AC1:** {criterion_1}
- [ ] **AC2:** {criterion_2}
- [ ] **AC3:** {criterion_3}

---

## Technical Notes

**Trigger:** {type}
**Key Nodes:** {nodes}
**Integrations:** {services}
**Depends On:** {story_ids or "None"}
**Blocks:** {story_ids or "None"}

### Dependencies
{dependency_list}

---

## Subtasks

- [ ] {subtask_1}
- [ ] {subtask_2}
- [ ] {subtask_3}

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Workflow tested
- [ ] Error handling verified
- [ ] Documentation complete
- [ ] Code review passed

---

## Draft Notes

**Context reviewed:**
- [x] PRD
- [{x or " "}] Epic
- [{x or " "}] Epic
- [x] Existing stories

**Ready for PO validation:** Yes
```

---

## Step 6: Save Draft

**Agent:** Sam (SM) 🏃

### Save Location

**Epic-scoped stories:**
- Path: `./docs/backlog/stories/story-{epic}.{story}-{slug}.md`
- Example: `./docs/backlog/stories/story-1.3-webhook-retry-logic.md`

**Standalone stories:**
- Path: `./docs/backlog/stories/{type}-{sequence}-{slug}.md`
- Example: `./docs/backlog/stories/feat-003-webhook-retry-logic.md`

### Status

Set status to `Draft` (not `Backlog` - PO promotes after validation).

---

## Step 7: Handoff to PO

**Agent:** Sam (SM) 🏃 → Victor (PO) 📦

### Validation Request

```markdown
## Story Ready for Validation

**Story:** {STORY-ID} - {title}
**Path:** ./docs/backlog/stories/{filename}

**Context Reviewed:**
- PRD: ✅
- Epic: {✅ or N/A}
- Existing Stories: ✅

**Draft Summary:**
- User: {role}
- Capability: {what}
- Value: {why}
- ACs: {count}
```

### ⛔ STOP - One Story Complete

✅ **ONE story drafted and saved.**

**Next options:**
- `/n8n:po *validate-story` (`VS`) - Validate this story (recommended)
- `/n8n:sm *story-draft` (`SD`) - Draft another story

**Do NOT continue to draft additional stories without explicit user request.**

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| No PRD exists | Paula (PM) | `PRD` |
| Technical questions | Winston (Architect) | Discussion |
| Story too large | Split into multiple | Re-draft |
| Scope unclear | Victor (PO) | Discuss before draft |
| Ready for validation | Victor (PO) | `VS` |

---

## Quick Reference

**Inputs:**
- Feature/requirement description
- Access to PRD, epic, stories

**Outputs:**
- Draft story file (status: Draft)
- Ready for PO validation

**Context Review:**
1. PRD → requirements alignment
2. Epic → scope boundaries
3. Epic → goal alignment
4. Stories → no duplicates/conflicts

**Duration:** 20-40 minutes per story

**Next Step:** `VS` (Validate Story) with Victor (PO)
