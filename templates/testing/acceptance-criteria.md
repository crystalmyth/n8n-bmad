---
template: acceptance-criteria
version: "1.0"
category: testing
---

# Acceptance Criteria: {feature_name}

## Feature Information

| Field | Value |
|-------|-------|
| **Feature** | {feature_name} |
| **Story** | {story_id} |
| **Author** | {author} |
| **Date** | {date} |
| **Status** | Draft / Reviewed / Approved |

---

## User Story

```
As a {user_type}
I want to {action}
So that {benefit}
```

---

## Acceptance Criteria

### AC-1: {criteria_title}

**Given** {precondition}
**When** {action}
**Then** {expected_result}

**Additional Checks:**
- [ ] {check_1}
- [ ] {check_2}

---

### AC-2: {criteria_title}

**Given** {precondition}
**When** {action}
**Then** {expected_result}

---

### AC-3: {criteria_title}

**Given** {precondition}
**When** {action}
**Then** {expected_result}

---

## Error Scenarios

### ES-1: {error_scenario_title}

**Given** {precondition}
**When** {error_trigger}
**Then** {error_handling}

---

### ES-2: {error_scenario_title}

**Given** {precondition}
**When** {error_trigger}
**Then** {error_handling}

---

## Edge Cases

| Case | Input | Expected Output |
|------|-------|-----------------|
| Empty input | `null` or `{}` | {behavior} |
| Maximum size | {max_value} | {behavior} |
| Special characters | {special_chars} | {behavior} |
| Concurrent access | Multiple triggers | {behavior} |

---

## Performance Criteria

| Metric | Requirement |
|--------|-------------|
| Execution time | < {time} |
| Memory usage | < {memory} |
| Throughput | > {rate} per {period} |

---

## Security Criteria

- [ ] No credentials exposed in logs
- [ ] Input validation implemented
- [ ] Proper error messages (no sensitive data)
- [ ] Authentication required for webhooks

---

## Data Criteria

| Field | Type | Validation | Required |
|-------|------|------------|----------|
| {field} | {type} | {rule} | Yes/No |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All error scenarios handled
- [ ] Edge cases verified
- [ ] Performance criteria met
- [ ] Security criteria met
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging
- [ ] QA approved

---

## Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | | | Approved / Rejected |
| QA Lead | | | Reviewed |
