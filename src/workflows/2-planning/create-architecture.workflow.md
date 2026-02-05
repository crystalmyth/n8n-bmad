# Create Architecture Workflow [CA]

> **Agent:** Winston (Architect) 🏗️
> **Trigger:** `CA` or `create-architecture`
> **Output:** Architecture document and ADRs

---

## Overview

Design the technical architecture for n8n workflows. Creates architecture documentation, identifies patterns, and documents key decisions as ADRs (Architecture Decision Records).

---

## Step 1: Architecture Context

**Agent:** Winston (Architect) 🏗️

### Input Review

| Input | Location |
|-------|----------|
| PRD | `./docs/requirements/{product}-prd.md` |
| Epics | `./docs/backlog/epics/` |
| Existing Architecture | `./docs/architecture/` |

### Architecture Scope

- [ ] **New Project** - Starting from scratch
- [ ] **Feature Addition** - Adding to existing architecture
- [ ] **Refactor** - Improving existing workflows

---

## Step 2: Requirements Analysis

**Agent:** Winston (Architect) 🏗️

### Functional Requirements Summary

| Requirement | Priority | Complexity |
|-------------|----------|------------|
| {req_1} | Must | Low/Med/High |
| {req_2} | Must | Low/Med/High |
| {req_3} | Should | Low/Med/High |

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | {e.g., < 5s response time} |
| Scalability | {e.g., 1000 executions/hour} |
| Reliability | {e.g., 99.9% uptime} |
| Security | {e.g., OAuth2, encrypted at rest} |

---

## Step 3: Workflow Architecture Design

**Agent:** Winston (Architect) 🏗️

### Workflow Decomposition

Break down into separate workflows:

| Workflow | Trigger Type | Purpose |
|----------|--------------|---------|
| {wf_1} | Webhook/Schedule/Manual | {purpose} |
| {wf_2} | Webhook/Schedule/Manual | {purpose} |

### Workflow Interaction Pattern

```
[Trigger] → [Workflow A] → [Workflow B] → [Output]
                ↓
           [Error Handler]
```

### Pattern Selection

| Pattern | Use Case | Selected? |
|---------|----------|-----------|
| Sequential | Steps must run in order | ⬜ |
| Parallel | Independent operations | ⬜ |
| Fan-out/Fan-in | Process multiple items | ⬜ |
| Event-driven | Async communication | ⬜ |
| Saga | Distributed transactions | ⬜ |

---

## Step 4: Node Architecture

**Agent:** Winston (Architect) 🏗️

### Core Node Selection

| Purpose | Node Type | Configuration Notes |
|---------|-----------|---------------------|
| Trigger | {node} | {notes} |
| Data Transform | {node} | {notes} |
| Integration | {node} | {notes} |
| Logic | {node} | {notes} |
| Output | {node} | {notes} |

### n8n-Specific Considerations

- [ ] Use Execute Workflow for sub-workflows
- [ ] Use Function nodes sparingly (prefer built-in)
- [ ] Consider HTTP Request vs native nodes
- [ ] Plan credential management

---

## Step 5: Data Flow Design

**Agent:** Winston (Architect) 🏗️

### Data Model

| Entity | Fields | Source |
|--------|--------|--------|
| {entity_1} | {field_list} | {source} |
| {entity_2} | {field_list} | {source} |

### Data Transformation Points

```
[Input Schema] → [Transform 1] → [Internal Schema] → [Transform 2] → [Output Schema]
```

### Data Validation

| Point | Validation | Action on Fail |
|-------|------------|----------------|
| Input | {validation} | Reject / Default |
| Process | {validation} | Retry / Skip |
| Output | {validation} | Alert / Fail |

---

## Step 6: Integration Architecture

**Agent:** Winston (Architect) 🏗️ + Ivy (Integration) 🔌

### External Integrations

| System | Type | Auth | Rate Limits |
|--------|------|------|-------------|
| {system_1} | API | OAuth2/API Key | {limits} |
| {system_2} | Webhook | HMAC | N/A |

### Integration Patterns

| Pattern | Use For |
|---------|---------|
| Request/Response | Synchronous calls |
| Webhook | Event notifications |
| Polling | No webhook support |
| Queue | High volume, async |

**🔀 For complex integrations:** Route to Ivy with `IS` for detailed spec.

---

## Step 7: Error Handling Architecture

**Agent:** Winston (Architect) 🏗️

### Error Handling Strategy

| Error Type | Handling | Notification |
|------------|----------|--------------|
| Transient (network) | Retry with backoff | After max retries |
| Validation | Reject, log | Immediate |
| Business logic | Custom handling | Depends on severity |
| System | Fail workflow | Critical alert |

### Error Workflow Pattern

```
[Main Workflow]
      ↓ (on error)
[Error Handler Workflow]
      ↓
  [Log] → [Notify] → [Retry or Fail]
```

---

## Step 8: Security Architecture

**Agent:** Winston (Architect) 🏗️ + Sierra (Security) 🔒

### Security Measures

- [ ] Credentials in n8n credential store
- [ ] Webhook authentication (HMAC, API key)
- [ ] Input validation on all external data
- [ ] No sensitive data in workflow logs
- [ ] Encryption for data at rest (if applicable)

**🔀 If handling sensitive data:** Route to Sierra with `SR` for security review.

---

## Step 9: Create ADRs

**Agent:** Winston (Architect) 🏗️

### ADR Template

For each significant decision, create an ADR:

```markdown
# ADR-{number}: {Title}

## Status
Proposed / Accepted / Deprecated

## Context
{Why this decision is needed}

## Decision
{What was decided}

## Consequences

### Positive
- {positive_1}

### Negative
- {negative_1}

### Risks
- {risk_1}

## Alternatives Considered
1. {alternative_1}
   - Pros: {pros}
   - Cons: {cons}
```

### Save Location

```
./docs/architecture/decisions/adr-{number}-{slug}.md
```

---

## Step 10: Generate Architecture Document

**Agent:** Winston (Architect) 🏗️

### Architecture Document Template

```markdown
# Architecture: {Project/Feature Name}

## Overview
{High-level description}

## Architecture Diagram
{ASCII or reference to diagram}

## Workflows

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| {name} | {purpose} | {trigger} |

## Data Flow
{Description of data flow}

## Integrations
{External systems}

## Error Handling
{Strategy summary}

## Security
{Security measures}

## Performance
{Expected performance characteristics}

## Related ADRs
- ADR-001: {title}
- ADR-002: {title}

## Open Questions
- {question_1}
```

### Save Location

```
./docs/architecture/{project}-architecture.md
```

---

## Step 11: Save Architecture Document

**Agent:** Winston (Architect) 🏗️

### ⚠️ IMPORTANT: Save Before Proceeding

Before moving to the next step, save the architecture document:

**Command:** `SA` (Save Architecture)

### Save Checklist

- [ ] Architecture document saved to `./docs/architecture/{project}-architecture.md`
- [ ] ADRs saved to `./docs/architecture/decisions/`
- [ ] Create `docs/architecture/` directory if it doesn't exist

### Document Saved?

Once saved, you can:
- **Validate architecture:** `VA` - Check against requirements
- **Start development:** `DS` - Hand off to Nate with Story 1
- **Review with team:** Share document link for feedback

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Integration complexity | Ivy (Integration) | `IS` |
| Security concerns | Sierra (Security) | `SR` |
| Implementation start | Nate (Developer) | `NW` or `DS` |
| AI components | Petra (Prompt Engineer) | `AA` |

---

## Quick Reference

**Inputs:**
- PRD
- Requirements
- Existing architecture (if any)

**Outputs:**
- Architecture document
- ADRs
- Workflow diagrams

**Duration:** 1-3 hours depending on complexity

**Next Steps:**
- Implementation Readiness Check: `IR`
- Start Development: `NW` or `DS`
