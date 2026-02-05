# Create Test Plan Workflow [TP]

> **Agent:** Quinn (QA) 🧪
> **Trigger:** `TP` or `create-test-plan`
> **Output:** Comprehensive test plan document

---

## Overview

Create a test plan for n8n workflows. Covers unit testing, integration testing, and end-to-end validation strategies.

---

## Step 1: Test Context

**Agent:** Quinn (QA) 🧪

### Inputs

| Input | Location |
|-------|----------|
| Workflow | n8n instance or export |
| Requirements | Story or PRD |
| Architecture | `./docs/architecture/` |

### Test Scope

| In Scope | Out of Scope |
|----------|--------------|
| {workflow_name} | {exclusions} |
| {integration_1} | {exclusions} |

---

## Step 2: Test Strategy

**Agent:** Quinn (QA) 🧪

### Testing Levels

| Level | Description | Approach |
|-------|-------------|----------|
| **Unit** | Individual node logic | Manual execution with test data |
| **Integration** | External API calls | Mock or sandbox environments |
| **End-to-End** | Complete workflow | Full execution with real data |
| **Performance** | Load and stress | High-volume test data |
| **Security** | Vulnerability scan | Security review checklist |

### Test Environment

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Unit tests | Mock data |
| Staging | Integration tests | Sanitized data |
| Production | Smoke tests only | Real data (read-only) |

---

## Step 3: Test Case Design

**Agent:** Quinn (QA) 🧪

### Test Case Template

| ID | Category | Description | Preconditions | Steps | Expected | Priority |
|----|----------|-------------|---------------|-------|----------|----------|
| TC-001 | Happy Path | {desc} | {prereq} | {steps} | {expected} | High |
| TC-002 | Error | {desc} | {prereq} | {steps} | {expected} | High |
| TC-003 | Edge | {desc} | {prereq} | {steps} | {expected} | Medium |

### Test Categories

#### Happy Path Tests
Tests that verify normal, expected behavior.

| TC ID | Scenario | Input | Expected Output |
|-------|----------|-------|-----------------|
| TC-HP-001 | {scenario} | {input} | {output} |
| TC-HP-002 | {scenario} | {input} | {output} |

#### Error Handling Tests
Tests that verify error handling.

| TC ID | Error Type | Trigger | Expected Behavior |
|-------|------------|---------|-------------------|
| TC-ERR-001 | API Failure | {trigger} | {behavior} |
| TC-ERR-002 | Invalid Input | {trigger} | {behavior} |
| TC-ERR-003 | Timeout | {trigger} | {behavior} |

#### Edge Case Tests
Tests for boundary conditions.

| TC ID | Edge Case | Input | Expected |
|-------|-----------|-------|----------|
| TC-EDGE-001 | Empty input | `{}` | {expected} |
| TC-EDGE-002 | Max size | Large payload | {expected} |
| TC-EDGE-003 | Special chars | Unicode/HTML | {expected} |

---

## Step 4: Integration Test Design

**Agent:** Quinn (QA) 🧪

### External Integration Tests

| Integration | Test Approach | Mock/Real |
|-------------|---------------|-----------|
| {system_1} | {approach} | Mock |
| {system_2} | {approach} | Sandbox |

### Integration Test Cases

| TC ID | Integration | Scenario | Verification |
|-------|-------------|----------|--------------|
| TC-INT-001 | {system} | {scenario} | {verification} |
| TC-INT-002 | {system} | {scenario} | {verification} |

---

## Step 5: Data Preparation

**Agent:** Quinn (QA) 🧪

### Test Data Requirements

| Data Type | Source | Quantity | Notes |
|-----------|--------|----------|-------|
| Happy path | Manual/Generated | 5+ cases | Cover all paths |
| Error cases | Manual | 3+ cases | Each error type |
| Edge cases | Manual | 3+ cases | Boundaries |
| Performance | Generated | 100+ | Bulk testing |

### Test Data Location

```
./tests/data/{workflow_name}/
├── happy_path/
├── error_cases/
├── edge_cases/
└── performance/
```

---

## Step 6: Acceptance Criteria Mapping

**Agent:** Quinn (QA) 🧪

### AC to Test Case Mapping

| AC # | AC Description | Test Cases |
|------|----------------|------------|
| AC-1 | {description} | TC-001, TC-002 |
| AC-2 | {description} | TC-003 |
| AC-3 | {description} | TC-004, TC-005 |

### Coverage Check

- [ ] All ACs have at least one test case
- [ ] Critical ACs have multiple test cases
- [ ] No orphan test cases (tests without AC)

---

## Step 7: Performance Test Plan

**Agent:** Quinn (QA) 🧪

### Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response time | < {X}ms | Average execution time |
| Throughput | {X}/minute | Executions per minute |
| Error rate | < {X}% | Failed executions |
| Memory | < {X}MB | Node memory usage |

### Performance Test Cases

| TC ID | Scenario | Load | Duration | Target |
|-------|----------|------|----------|--------|
| TC-PERF-001 | Normal load | {X} req/min | 5 min | < {X}ms |
| TC-PERF-002 | Peak load | {X} req/min | 5 min | < {X}ms |
| TC-PERF-003 | Sustained | {X} req/min | 1 hour | No degradation |

---

## Step 8: Generate Test Plan Document

**Agent:** Quinn (QA) 🧪

### Test Plan Template

```markdown
# Test Plan: {Workflow Name}

## Overview

| Field | Value |
|-------|-------|
| Workflow | {name} |
| Version | {version} |
| Author | Quinn (QA) |
| Date | {date} |
| Status | Draft / Active / Complete |

---

## Scope

### In Scope
- {item}

### Out of Scope
- {item}

---

## Test Strategy

### Levels
{testing levels}

### Environments
{environment details}

---

## Test Cases

### Summary

| Category | Count | Priority |
|----------|-------|----------|
| Happy Path | {X} | High |
| Error Handling | {X} | High |
| Edge Cases | {X} | Medium |
| Integration | {X} | High |
| Performance | {X} | Medium |

### Detailed Test Cases

{test case tables}

---

## Test Data

{data requirements}

---

## Entry/Exit Criteria

### Entry Criteria
- [ ] Workflow deployed to test environment
- [ ] Test data prepared
- [ ] Dependencies available

### Exit Criteria
- [ ] All high-priority tests pass
- [ ] No critical defects open
- [ ] Coverage > 80%

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk} | {impact} | {mitigation} |

---

## Schedule

| Phase | Start | End |
|-------|-------|-----|
| Preparation | {date} | {date} |
| Execution | {date} | {date} |
| Reporting | {date} | {date} |
```

### Save Location

```
./docs/testing/test-plan-{workflow}.md
```

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Security testing | Sierra (Security) | `SR` |
| Performance concerns | Winston (Architect) | Review |
| Story clarification | Victor (PO) | Discussion |
| Test execution | Quinn (QA) | Execute tests |

---

## Quick Reference

**Inputs:**
- Workflow (implementation)
- Requirements (story/PRD)
- Architecture docs

**Outputs:**
- Test plan document
- Test cases
- Test data specifications

**Duration:** 1-2 hours

**Next Steps:**
- Execute test plan
- Report bugs with `BR`
- Code review with `CR`
