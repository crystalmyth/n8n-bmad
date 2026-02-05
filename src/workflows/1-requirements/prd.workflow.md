# Create PRD Workflow [PRD]

> **Agent:** Paula (PM) + Barry (Quick Flow)
> **Trigger:** `PRD` or `create-prd`
> **Output:** PRD document (auto-scales based on complexity)

---

## Overview

Single entry point for all requirements gathering. Automatically scales between lean and comprehensive PRD based on detected project complexity.

**You don't choose the format - the framework adapts to your project.**

---

## Step 0: Method Selection

**Agent:** Paula (PM) 📋

### Choose Your Approach

| Method | Description | Best For |
|--------|-------------|----------|
| `incremental` | Guided questions, step-by-step | New projects, unclear scope |
| `yolo` | Dump all at once, I structure it | Clear vision, quick capture |

**Type `incremental` or `yolo`** (default: incremental)

### YOLO Mode Flow

If `yolo` selected:

1. **Receive Dump**
   > User pastes everything: problem, requirements, users, integrations, constraints.

2. **Parse & Structure**
   - Extract problem statement
   - Identify requirements (functional + non-functional)
   - Note integrations and external systems
   - Capture constraints and risks

3. **Gap Analysis**
   - What's missing for a complete PRD?
   - Ask targeted questions for critical gaps only

4. **Present Draft**
   - Show structured PRD draft
   - Get user confirmation
   - Proceed to Step 4 (Complexity Analysis)

### Incremental Mode

Continue to Step 1 for guided discovery.

---

## Step 1: Context Discovery

**Action:** Check for existing project context.

```
Look for:
- **/project-context.md
- **/README.md
- ./docs/*.md (existing docs)
```

**If found:** Read and summarize relevant context.
**If not found:** Proceed - we'll capture what we need.

---

## Step 2: Problem Discovery

**Action:** Understand the problem (conversational).

### Core Questions

1. **What problem are we solving?**
   > Describe the pain point in one sentence.

2. **Who has this problem?**
   > Be specific about the user/role.

3. **What's the impact of NOT solving it?**
   > Quantify if possible (time, money, errors).

---

## Step 3: Requirements Capture

**Action:** Gather requirements through conversation.

### Workflow Questions

1. **What triggers this workflow?**
   - [ ] Webhook (external system calls us)
   - [ ] Schedule (runs on timer)
   - [ ] Manual (user clicks button)
   - [ ] n8n Trigger (another workflow)

2. **What's the input?**
   > What data comes in? From where?

3. **What's the output?**
   > What should happen when it's done?

4. **What could go wrong?**
   > Error scenarios to handle.

5. **What external systems are involved?**
   > APIs, databases, services to integrate with.

---

## Step 4: Complexity Analysis (Automatic)

**Action:** Analyze project complexity to determine PRD depth.

### Complexity Check

| Metric | Count | Threshold | Status |
|--------|-------|-----------|--------|
| Stories estimated | {n} | ≤ 5 | {OK/EXCEEDS} |
| Integrations | {n} | ≤ 3 | {OK/EXCEEDS} |
| Stakeholders | {n} | ≤ 2 | {OK/EXCEEDS} |
| Compliance needs | {y/n} | None | {OK/EXCEEDS} |

### Auto-Scale Decision

```
IF all thresholds OK:
  → LEAN PRD (Quick Flow style)
  → Skip to Step 6 (Technical Breakdown)

IF any threshold EXCEEDS:
  → COMPREHENSIVE PRD (Full style)
  → Continue to Step 5 (Extended Sections)
```

**Note:** This happens automatically. Users don't choose.

---

## Step 5: Extended Sections (Complex Projects Only)

> **Skip this step for simple projects (auto-detected)**

### 5a. Stakeholder Analysis

| Stakeholder | Role | Interest | Influence |
|-------------|------|----------|-----------|
| {name/role} | {what they do} | High/Med/Low | High/Med/Low |

### 5b. User Personas

```markdown
## Persona: {Name}

**Role:** {job_title}
**Goal:** {what they want to achieve}
**Pain Points:**
- {pain_1}
- {pain_2}
```

### 5c. Success Metrics

| Metric | Current State | Target | How to Measure |
|--------|---------------|--------|----------------|
| {metric} | {baseline} | {target} | {measurement} |

### 5d. Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-001 | Performance | Response time | < {X} seconds |
| NFR-002 | Reliability | Uptime | {X}% |

### 5e. Risks & Constraints

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {risk} | High/Med/Low | High/Med/Low | {mitigation} |

---

## Step 6: Technical Breakdown

**Action:** Decompose into implementation components.

| Component | Approach | Nodes Likely | Complexity |
|-----------|----------|--------------|------------|
| Trigger | {type} | {node} | S / M / L |
| Input Validation | {approach} | If, Code | S / M / L |
| Core Logic | {approach} | {nodes} | S / M / L |
| Output | {approach} | {nodes} | S / M / L |
| Error Handling | {approach} | Error Trigger | S / M / L |

---

## Step 7: Story Generation

**Action:** Generate stories from requirements.

### Dependency-Aware Story Ordering

**Before listing stories, analyze inter-story dependencies:**

1. **Identify** all candidate stories from requirements
2. **For each story, determine:**
   - What it PRODUCES (endpoints, credentials, data schemas, triggers, base workflows)
   - What it REQUIRES (other stories' outputs, external systems, credentials)
3. **Link dependencies:** If Story B requires what Story A produces, B depends on A
   - Common patterns: setup before logic, credentials before usage, core path before error handling, base workflow before enhancements
4. **Order using dependency-first sort:**
   - Stories with no dependencies first (foundational)
   - Then stories depending only on earlier ones
   - Same depth: order by priority (P1 > P2 > P3), then by points (smaller first)
5. **Verify:** Walk the list top-to-bottom -- every dependency resolves to an earlier story
6. **Circular deps:** Break by identifying which story can be partially implemented independently

### Story ID Convention

**Epic-Scoped (6+ stories):**
- Format: `story-{epic}.{story}-{slug}`
- Example: `story-1.3-webhook-setup` (Epic 1, Story 3)
- Stories grouped by epic in PRD

**Standalone (< 6 stories):**
- Format: `{type}-{sequence}-{slug}`
- Types: `feat`, `bug`, `hotfix`, `chore`
- Examples: `feat-001-crm-sync`, `bug-002-timeout`

### Story Template

```markdown
# Story: {STORY-ID} - {Title}

| Field | Value |
|-------|-------|
| **ID** | {story-X.Y-slug or feat-NNN-slug} |
| **Epic** | {epic_id or "-"} |
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

## Subtasks

- [ ] Configure {trigger_type} trigger
- [ ] Implement input validation
- [ ] Build core logic
- [ ] Add error handling
- [ ] Test with sample data
```

---

## Step 8: Save PRD

**Action:** Save PRD document.

**Path:** `./docs/prd.md`

### PRD Template

```markdown
# PRD: {Project Name}

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Date** | {date} |
| **Status** | Draft |
| **Scale** | {Lean/Comprehensive} |
| **Epics** | {epic_count or "None"} |

## 1. Problem Statement

{problem_description}

## 2. Requirements

### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | {requirement} | Must/Should/Could |

### Workflow Specification
- **Trigger:** {type}
- **Input:** {description}
- **Output:** {description}
- **Error Handling:** {approach}

## 3. Stories

<!-- For 6+ stories, group by epic -->

### Epic 1: {Epic Name} (if applicable)
| # | ID | Title | Depends On | Priority | Points |
|---|-----|-------|------------|----------|--------|
| 1 | story-1.1-{slug} | {title} | - | P1 | {est} |
| 2 | story-1.2-{slug} | {title} | #1 | P2 | {est} |

### Epic 2: {Epic Name} (if applicable)
| # | ID | Title | Depends On | Priority | Points |
|---|-----|-------|------------|----------|--------|
| 1 | story-2.1-{slug} | {title} | - | P1 | {est} |

<!-- For < 6 stories, flat list -->
| # | ID | Title | Depends On | Priority | Points |
|---|-----|-------|------------|----------|--------|
| 1 | feat-001-{slug} | {title} | - | P1 | {est} |
| 2 | feat-002-{slug} | {title} | #1 | P2 | {est} |

> **Story Ordering:** Listed in dependency order. Each story's "Depends On" references only earlier # numbers. Developers implement top-to-bottom without hitting unresolved dependencies.

---

<!-- Extended sections below only for Comprehensive PRDs -->

## 4. User Personas (if applicable)

{personas}

## 5. Success Metrics (if applicable)

{metrics}

## 6. Non-Functional Requirements (if applicable)

{nfr}

## 7. Risks & Constraints (if applicable)

{risks}
```

---

## Step 9: Next Steps

### After PRD Saved

**Scale determines next step:**

| PRD Scale | Stories | Next Step | Command |
|-----------|---------|-----------|---------|
| Lean | 1-2 | Implement directly | `DS` |
| Lean | 3-5, has APIs | Architecture first | `CA` |
| Comprehensive | 6-15 | Architecture + Stories | `CA` → `CS` |
| Comprehensive | 15+ | Architecture + Epics | `CA` → `CE` |

> **Recommended Flow:**
> ```
> PRD (done) → CA (architecture) → CS (stories) → DS (implement)
> ```

✅ **Project brief auto-updated** with PRD summary.

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Simple, no integrations | Implement directly | `DS` |
| Has integrations/APIs | Architecture first | `CA` |
| Complex requirements | Victor (PO) for stories | `CS` |
| Security concerns | Sierra (Security) | `SR` |

---

## Quick Reference

**Inputs:**
- User requirements (conversational)
- Optional: existing context files

**Outputs:**
- PRD document in `./docs/prd.md`
- Stories embedded in PRD
- Ready for `CA` or `DS`

**Duration:**
- Lean: 10-20 minutes
- Comprehensive: 30-60 minutes
