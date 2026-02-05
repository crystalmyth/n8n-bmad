# Load Brief Workflow [LB]

> **Agent:** Barry (Quick Flow) ⚡
> **Trigger:** `LB` or `load-brief`
> **Input:** None (reads `./docs/quick-brief.md`)
> **Output:** Loaded context, ready to continue

---

## Overview

Resume Quick Flow work from a previous session. Loads the quick-brief.md file and restores context for seamless continuation.

**Why Load Brief:**
- Restore context after session break
- Continue exactly where you left off
- No re-explaining project to AI
- Activity log shows what was done

---

## Step 1: Check for Quick Brief

**Agent:** Barry ⚡

**Look for:** `./docs/quick-brief.md`

| Result | Action |
|--------|--------|
| **File exists** | Proceed to Step 2 |
| **File missing** | Go to Step 5 (No Brief Found) |

---

## Step 2: Read Quick Brief

**Agent:** Barry ⚡

**Parse sections:**

| Section | Extract |
|---------|---------|
| **Project** | Goal, context |
| **Stories** | All stories with status |
| **Activity Log** | Recent actions (last 5-10) |
| **Decisions** | Key choices made |
| **Review Status** | CR verdict if done |
| **Next Session** | Continue point, blockers |

---

## Step 3: Display Context Summary

**Agent:** Barry ⚡

**Output format:**

```
📋 Quick Brief Loaded
━━━━━━━━━━━━━━━━━━━━━━━

## Project
**Goal:** {project_goal}
**Context:** {project_context}

## Current Story
**Title:** {story_title}
**Status:** {status}

**Subtasks:**
- [x] {completed_subtask_1} ✓
- [x] {completed_subtask_2} ✓
- [ ] {current_subtask} ← Continue here
- [ ] {remaining_subtask}

## Recent Activity
| Time | Agent | Action |
|------|-------|--------|
| {time_1} | {agent_1} | {action_1} |
| {time_2} | {agent_2} | {action_2} |
| {time_3} | {agent_3} | {action_3} |

## Key Decisions
1. {decision_1}
2. {decision_2}

## Blockers
{blockers_or_none}

━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 4: Recommend Next Action

**Agent:** Barry ⚡

**Based on status:**

| Story Status | Recommended Action |
|--------------|-------------------|
| **Backlog** | "Ready to start? Run `DS` to begin implementation" |
| **Ready** | "Story validated. Run `DS` to implement" |
| **In Progress** | "Continue implementing. Run `DS` to resume subtask: {current_subtask}" |
| **Review** | "Implementation complete. Run `CR` for code review" |
| **Done** | "This story is complete. Start next story or new project" |

**Output:**

```
📍 Next Action
━━━━━━━━━━━━━━

Status: {status}
Continue from: {current_subtask}

**Recommended:** {recommended_command}

**Options:**
- `DS` - Continue/start implementation
- `CR` - Code review (if status is Review)
- `SB` - Save checkpoint
- `PRD` - Start new project
```

---

## Step 5: No Brief Found

**Agent:** Barry ⚡

**If `./docs/quick-brief.md` doesn't exist:**

```
⚠️ No Quick Brief Found
━━━━━━━━━━━━━━━━━━━━━━━

No quick-brief.md found at ./docs/quick-brief.md

**This could mean:**
1. No Quick Flow project started yet
2. Using full process (project-brief.md instead)
3. Brief was deleted or moved

**Options:**

| Situation | Command |
|-----------|---------|
| **Start new project** | `/n8n:pm *create-prd` (PRD) |
| **Check full process** | `/n8n:master *resume-context` (RC) |
| **Already have story** | Start `DS` to create new quick-brief |

**Quick Flow vs Full Process:**
- Quick Flow: 1-5 stories, solo, minimal ceremony → `quick-brief.md`
- Full Process: 6+ stories, team, full documentation → `project-brief.md`
```

---

## Step 6: Log Resume

**Agent:** Barry ⚡

**Add activity log entry:**

```markdown
| {timestamp} | Barry | Resumed session (LB) |
```

**Update quick-brief.md with log entry.**

---

## Decision Points

| Finding | Action |
|---------|--------|
| **Multiple incomplete stories** | Ask which to continue |
| **Story blocked** | Highlight blocker, ask how to proceed |
| **Review pending** | Route to CR |
| **Conflicting state** | Ask user to clarify |

---

## Quick Reference

**Inputs:**
- None (reads from file)

**Outputs:**
- Loaded context summary
- Recommended next action
- Updated activity log

**File Location:** `./docs/quick-brief.md`

**Related Commands:**
- `SB` - Save Brief
- `DS` - Dev Story
- `RC` - Resume Context (full process)
- `PRD` - Start new project
