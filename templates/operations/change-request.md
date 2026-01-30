---
template: change-request
version: "1.0"
category: operations
---

# Change Request

## Change Information

| Field | Value |
|-------|-------|
| **Change ID** | CR-{id} |
| **Title** | {change_title} |
| **Type** | Standard / Normal / Emergency |
| **Priority** | Critical / High / Medium / Low |
| **Status** | Draft / Pending / Approved / Scheduled / Implemented / Closed |
| **Requester** | {name} |
| **Date Requested** | {date} |

---

## Change Description

### Summary
{Brief description of the change.}

### Detailed Description
{Detailed explanation of what will be changed.}

### Reason for Change
{Why is this change needed?}

### Business Justification
{Business case for the change.}

---

## Scope

### Systems Affected
| System | Impact Level | Owner |
|--------|--------------|-------|
| {system} | High/Medium/Low | {owner} |

### Workflows Affected
| Workflow | Change Type | Notes |
|----------|-------------|-------|
| {workflow} | {Modify/Replace/New} | {notes} |

### Dependencies
- {dependency_1}
- {dependency_2}

---

## Risk Assessment

### Risk Level
{High / Medium / Low}

### Potential Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| {risk} | H/M/L | H/M/L | {mitigation} |

### Impact Analysis
- **If successful:** {positive_impact}
- **If failed:** {negative_impact}

---

## Implementation Plan

### Pre-Implementation
- [ ] {pre_step_1}
- [ ] {pre_step_2}
- [ ] Backup current state

### Implementation Steps
1. {step_1}
2. {step_2}
3. {step_3}
4. {step_4}

### Post-Implementation
- [ ] Verify change successful
- [ ] Monitor for issues
- [ ] Update documentation

---

## Rollback Plan

### Rollback Decision Criteria
{When should we rollback?}

### Rollback Steps
1. {rollback_step_1}
2. {rollback_step_2}
3. {rollback_step_3}

### Rollback Time Estimate
{Expected time to rollback}

---

## Testing Plan

### Pre-Change Testing
- [ ] {test_1}
- [ ] {test_2}

### Post-Change Testing
- [ ] {test_1}
- [ ] {test_2}

### Success Criteria
- {criterion_1}
- {criterion_2}

---

## Schedule

| Phase | Start | End | Owner |
|-------|-------|-----|-------|
| Preparation | {datetime} | {datetime} | {owner} |
| Implementation | {datetime} | {datetime} | {owner} |
| Verification | {datetime} | {datetime} | {owner} |

### Maintenance Window
- **Date:** {date}
- **Time:** {start_time} - {end_time}
- **Timezone:** {timezone}

### Blackout Periods
{Times when change cannot be made}

---

## Communication Plan

### Pre-Change
| Audience | Channel | Timing | Message |
|----------|---------|--------|---------|
| {audience} | {channel} | {timing} | {message} |

### Post-Change
| Audience | Channel | Timing |
|----------|---------|--------|
| {audience} | {channel} | {timing} |

---

## Resources Required

### Personnel
| Role | Name | Availability |
|------|------|--------------|
| Implementer | {name} | {time} |
| Approver | {name} | {time} |
| Support | {name} | On-call |

### Technical Resources
- {resource_1}
- {resource_2}

---

## Approval

### Technical Approval
| Role | Name | Date | Status |
|------|------|------|--------|
| Tech Lead | | | Pending |
| DevOps | | | Pending |

### Business Approval
| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | | | Pending |
| Stakeholder | | | Pending |

---

## Post-Implementation Review

### Outcome
{Successful / Partially Successful / Failed / Rolled Back}

### Issues Encountered
- {issue_1}
- {issue_2}

### Lessons Learned
- {lesson_1}
- {lesson_2}

---

## Attachments

- [ ] Technical documentation
- [ ] Test results
- [ ] Screenshots
