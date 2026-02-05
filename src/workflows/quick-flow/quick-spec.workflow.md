# Quick Spec Workflow [QS]

> **Agent:** Barry (Quick Flow) ⚡
> **Trigger:** `QS` or `quick-spec`
> **Output:** Implementation-ready story file

---

## Overview

Rapidly analyze requirements and generate a complete, implementation-ready story. This is the starting point for Quick Flow - minimal ceremony, maximum clarity.

---

## Step 1: Context Discovery

**Action:** Check for existing project context.

```
Look for these files:
- **/project-context.md
- **/README.md
- ./docs/requirements/*.md (existing PRDs)
- ./docs/backlog/stories/*.md (existing stories)
```

**If found:** Read and summarize relevant context.
**If not found:** Proceed without - we'll capture what we need.

---

## Step 2: Requirements Capture

**Action:** Gather requirements through conversation.

### Questions to answer:

1. **What needs to happen?**
   > Describe the workflow in one sentence.

2. **What triggers it?**
   - [ ] Webhook (external system calls us)
   - [ ] Schedule (runs on timer)
   - [ ] Manual (user clicks button)
   - [ ] n8n Trigger (another workflow calls us)

3. **What's the input?**
   > What data comes in? From where?

4. **What's the output?**
   > What should happen when it's done?

5. **What could go wrong?**
   > Error scenarios to handle.

---

## Step 3: Technical Breakdown

**Action:** Decompose into implementation components.

| Component | Approach | Nodes Likely | Complexity |
|-----------|----------|--------------|------------|
| Trigger | {webhook/schedule/manual} | {node} | S / M / L |
| Input Validation | {approach} | If, Code | S / M / L |
| Core Logic | {approach} | {nodes} | S / M / L |
| Output | {approach} | {nodes} | S / M / L |
| Error Handling | {approach} | Error Trigger | S / M / L |

### Architecture Decision

**If complexity > Medium on any component:**
> 🔀 **Consult Winston (Architect):** "I need a design review for {component}. Here's what I'm thinking: {approach}. Any concerns?"

**Otherwise:** Proceed with implementation plan.

---

## Step 4: Story Generation

**Action:** Generate the story file.

### Story Template

```markdown
# Story: {STORY-ID} - {Title}

| Field | Value |
|-------|-------|
| **ID** | STORY-{number} |
| **Epic** | {epic_id or "Standalone"} |
| **Priority** | {P1/P2/P3} |
| **Points** | {estimate} |
| **Status** | Ready |

## User Story

As a {specific_user},
I want {capability},
So that {business_value}.

## Acceptance Criteria

- [ ] **AC1:** Given {context}, when {action}, then {result}
- [ ] **AC2:** Given {context}, when {action}, then {result}
- [ ] **AC3:** Given {error_condition}, then {error_handling}

## Technical Notes

**Trigger:** {type} - {details}
**Key Nodes:** {node_list}
**Credentials:** {required_credentials}
**External APIs:** {apis_if_any}

## Subtasks

- [ ] Configure {trigger_type} trigger
- [ ] Implement input validation
- [ ] Build core logic: {description}
- [ ] Add error handling
- [ ] Test with sample data
- [ ] Document workflow

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Error handling tested
- [ ] Workflow documented
- [ ] Code review passed
```

---

## Step 5: Save Story

**Action:** Save the story file.

**Path:** `./docs/backlog/stories/story-{id}-{slug}.md`

**Example:** `./docs/backlog/stories/story-042-crm-sync.md`

---

## Step 6: Ready for Implementation

**Output:** Story file created and ready.

### Next Steps

> 📍 **Continue with:** `DS` (Dev Story) to implement this story.
>
> ```
> DS story-{id}
> ```

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Complex architecture needed | Winston (Architect) | `CA` |
| Unclear requirements | Victor (PO) | `CS` |
| Security concerns | Sierra (Security) | `SR` |
| AI/LLM components | Petra (Prompt Engineer) | `SP` |

---

## Quick Reference

**Inputs:**
- User requirements (conversational)
- Optional: existing context files

**Outputs:**
- Story file in `./docs/backlog/stories/`
- Status: Ready for `DS`

**Duration:** 10-20 minutes typical
