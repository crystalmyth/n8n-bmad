# Course Correction Workflow [CC]

> **Agent:** Atlas (n8n-master) 🎯 → Routes to appropriate specialist
> **Trigger:** `CC` or `correct-course`
> **Output:** Updated documents and adjusted plans

---

## Overview

Handle mid-project changes by routing to the appropriate agent based on what needs to change. This is the multi-agent routing workflow that coordinates course corrections.

---

## Step 1: Identify Change Type

**Agent:** Atlas (n8n-master) 🎯

### What needs to change?

| Change Type | Description | Route To |
|-------------|-------------|----------|
| **PRD Change** | Requirements changed | Victor (PO) 📦 |
| **Epic Change** | Epic scope changed | Victor (PO) 📦 |
| **Story Change** | Story details changed | Victor (PO) 📦 |
| **Architecture Change** | Technical design changed | Winston (Architect) 🏗️ |
| **Security Issue** | Security concern discovered | Sierra (Security) 🔒 |
| **Technical Blocker** | Can't implement as designed | Winston (Architect) 🏗️ |

### Select Change Type

- [ ] PRD Change → Go to **Route A**
- [ ] Epic Change → Go to **Route B**
- [ ] Story Change → Go to **Route C**
- [ ] Architecture Change → Go to **Route D**
- [ ] Security Issue → Go to **Route E**
- [ ] Technical Blocker → Go to **Route F**

---

## Route A: PRD Change

**🔀 Agent:** Victor (PO) 📦

### Trigger
Requirements have fundamentally changed.

### Process

1. **Assess Impact**
   - Which sections of PRD affected?
   - Are existing epics/stories still valid?
   - Does timeline change?

2. **Update PRD**
   ```
   EP {prd-file}  # Edit PRD command
   ```

3. **Document Change**
   ```markdown
   ## Change Log
   | Date | Section | Change | Reason | Impact |
   |------|---------|--------|--------|--------|
   | {date} | {section} | {what_changed} | {why} | {impact} |
   ```

4. **Notify Stakeholders**
   - PM (Paula) - timeline impact
   - Architect (Winston) - if technical impact
   - Team - if active work affected

5. **Cascade Updates**
   - Update affected epics (`EE`)
   - Update affected stories (`XS`)
   - Notify PM if timeline impacted

### Exit
Return to Atlas with summary of changes.

---

## Route B: Epic Change

**🔀 Agent:** Victor (PO) 📦

### Trigger
Epic scope, goals, or success metrics changed.

### Process

1. **Load Epic**
   ```
   ./docs/backlog/epics/epic-{id}-{name}.md
   ```

2. **Update Epic**
   ```
   EE {epic-file}  # Edit Epic command
   ```

3. **Impact Assessment**
   - Stories affected: {list}
   - Stories to add: {list}
   - Stories to remove: {list}

4. **Update Stories**
   For each affected story:
   ```
   XS {story-file}  # Edit Story command
   ```

5. **Notify**
   - PM if timeline affected
   - Team members assigned to stories

### Exit
Return to Atlas with summary.

---

## Route C: Story Change

**🔀 Agent:** Victor (PO) 📦

### Trigger
Story requirements, AC, or scope changed.

### Process

1. **Check Story Status**
   - Backlog → Simple update
   - Ready → Update, may need re-validation
   - In Progress → **Alert developer first**
   - Review → **Discuss before changing**

2. **If In Progress or Review**
   ```
   ⚠️ Story is being worked on!

   Before changing:
   1. Notify assigned developer (Nate)
   2. Discuss impact of change
   3. Agree on approach
   ```

3. **Update Story**
   ```
   XS {story-file}  # Edit Story command
   ```

4. **Re-validate if needed**
   ```
   VS {story-file}  # Validate Story
   ```

5. **Notify PM if timeline affected**

### Exit
Return to Atlas with summary.

---

## Route D: Architecture Change

**🔀 Agent:** Winston (Architect) 🏗️

### Trigger
Technical design needs to change.

### Process

1. **Document Current State**
   - What was the original design?
   - What's driving the change?

2. **Design New Approach**
   ```
   CA  # If major redesign needed
   ```

3. **Create/Update ADR**
   ```
   AD  # Create Architecture Decision Record
   ```

4. **Impact Assessment**
   - Stories affected: {list}
   - Effort change: {estimate}
   - Timeline impact: {assessment}

5. **Notify**
   - Developer (Nate) - implementation changes
   - PM (Paula) - if timeline affected
   - PO (Victor) - if scope affected

### Exit
Return to Atlas with summary and ADR reference.

---

## Route E: Security Issue

**🔀 Agent:** Sierra (Security) 🔒

### Trigger
Security vulnerability or concern discovered.

### Process

1. **Assess Severity**
   - Critical: Stop work, fix immediately
   - High: Prioritize fix, may block release
   - Medium: Add to backlog, fix soon
   - Low: Track, fix when convenient

2. **If Critical/High**
   ```
   ⚠️ SECURITY ISSUE

   1. Stop affected work
   2. Do not deploy
   3. Document issue
   4. Create fix story
   ```

3. **Document Issue**
   ```
   SR  # Security Review to document
   ```

4. **Create Fix Story**
   Route to Victor (PO):
   ```
   CS  # Create high-priority story
   ```

5. **Notify**
   - PM (Paula) - timeline impact
   - DevOps (Rex) - if production affected
   - Leadership - if critical

### Exit
Return to Atlas with security issue summary.

---

## Route F: Technical Blocker

**🔀 Agent:** Winston (Architect) 🏗️ + Nate (Developer) 💻

### Trigger
Implementation is blocked by technical issue.

### Process

1. **Identify Blocker Type**
   - API limitation
   - n8n capability gap
   - Performance issue
   - Integration problem
   - Unknown technical challenge

2. **Assess Options**

   | Option | Description |
   |--------|-------------|
   | Workaround | Different approach, same outcome |
   | Descope | Reduce requirements |
   | Defer | Move to backlog |
   | Research | Need spike to investigate |

3. **If Workaround Possible**
   - Document decision (ADR)
   - Update story with new approach
   - Continue implementation

4. **If Spike Needed**
   - Create spike story
   - Timebox investigation
   - Report findings

5. **If Must Descope**
   Route to Victor (PO):
   - Discuss reduced scope
   - Update requirements
   - Update story

6. **Notify**
   - SM (Sam) - log as impediment
   - PM (Paula) - if timeline impacted

### Exit
Return to Atlas with resolution.

---

## Step 2: Document Change

**Agent:** Atlas (n8n-master) 🎯

### Change Request Record

```markdown
## Change Request: {title}

| Field | Value |
|-------|-------|
| Date | {date} |
| Type | {PRD/Epic/Story/Arch/Security/Blocker} |
| Requested By | {name} |
| Handled By | {agent} |

### Summary
{what_changed}

### Reason
{why_it_changed}

### Impact
- Documents updated: {list}
- Stories affected: {list}
- Timeline impact: {description}
- Stakeholders notified: {list}

### Resolution
{how_it_was_resolved}
```

---

## Step 3: Resume Work

**Agent:** Atlas (n8n-master) 🎯

### After Course Correction

| Situation | Next Step |
|-----------|-----------|
| Story updated | Continue with `DS` |
| Epic updated | Continue with epic |
| Architecture changed | Update stories, continue |
| Security fix needed | Prioritize fix story |
| Blocked resolved | Resume implementation |

---

## Quick Reference

**Trigger:** `CC`

**This workflow routes to:**
- Victor (PO) - requirement changes
- Paula (PM) - timeline changes
- Winston (Architect) - design changes
- Sierra (Security) - security issues

**Always document:**
- What changed
- Why it changed
- What was impacted
- Who was notified
