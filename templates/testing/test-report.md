---
template: test-report
version: "1.0"
category: testing
---

# Test Report: {workflow_name}

## Report Information

| Field | Value |
|-------|-------|
| **Report Date** | {date} |
| **Test Period** | {start_date} - {end_date} |
| **Workflow** | {workflow_name} |
| **Version** | {version} |
| **Tester** | {tester_name} |
| **Environment** | {environment} |

---

## Executive Summary

{2-3 sentence summary of testing results and overall status.}

### Overall Status
| Metric | Value |
|--------|-------|
| **Overall Result** | Pass / Fail / Conditional Pass |
| **Recommendation** | Ready for Deployment / Needs Work / Block |

---

## Test Summary

### Test Execution Statistics
| Category | Total | Passed | Failed | Blocked | Not Run |
|----------|-------|--------|--------|---------|---------|
| Critical | {n} | {n} | {n} | {n} | {n} |
| High | {n} | {n} | {n} | {n} | {n} |
| Medium | {n} | {n} | {n} | {n} | {n} |
| Low | {n} | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** | **{n}** |

### Pass Rate
```
Pass Rate: {percentage}%
Target: {target}%
Status: {Met / Not Met}
```

---

## Test Coverage

### Coverage by Area
| Area | Planned | Executed | Coverage |
|------|---------|----------|----------|
| Trigger | {n} | {n} | {%} |
| Data Processing | {n} | {n} | {%} |
| Error Handling | {n} | {n} | {%} |
| Integration | {n} | {n} | {%} |
| **Overall** | **{n}** | **{n}** | **{%}** |

---

## Defect Summary

### Defect Statistics
| Severity | Open | Fixed | Verified | Total |
|----------|------|-------|----------|-------|
| Critical | {n} | {n} | {n} | {n} |
| High | {n} | {n} | {n} | {n} |
| Medium | {n} | {n} | {n} | {n} |
| Low | {n} | {n} | {n} | {n} |

### Open Defects
| ID | Title | Severity | Status | Impact |
|----|-------|----------|--------|--------|
| {id} | {title} | {sev} | {status} | {impact} |

---

## Detailed Results

### Happy Path Tests
| Test ID | Description | Result | Notes |
|---------|-------------|--------|-------|
| HP-01 | {description} | Pass/Fail | {notes} |
| HP-02 | {description} | Pass/Fail | {notes} |

### Error Handling Tests
| Test ID | Description | Result | Notes |
|---------|-------------|--------|-------|
| ER-01 | {description} | Pass/Fail | {notes} |

### Edge Case Tests
| Test ID | Description | Result | Notes |
|---------|-------------|--------|-------|
| EC-01 | {description} | Pass/Fail | {notes} |

---

## Performance Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Execution Time | {target} | {actual} | Pass/Fail |
| Memory Usage | {target} | {actual} | Pass/Fail |
| Throughput | {target} | {actual} | Pass/Fail |

---

## Issues and Observations

### Issues Encountered
1. {issue_1}
2. {issue_2}

### Observations
1. {observation_1}
2. {observation_2}

### Risks
| Risk | Impact | Recommendation |
|------|--------|----------------|
| {risk} | {impact} | {recommendation} |

---

## Test Environment Notes

### Environment Issues
- {issue_1}
- {issue_2}

### Data Quality
- {note_1}

---

## Recommendations

### For Deployment
- [ ] {recommendation_1}
- [ ] {recommendation_2}

### For Future Releases
- {recommendation_1}
- {recommendation_2}

---

## Conclusion

{Summary of test results, overall quality assessment, and final recommendation.}

### Sign-off
| Role | Name | Date | Decision |
|------|------|------|----------|
| QA Lead | | | Approve / Reject |
| Product Owner | | | Approve / Reject |

---

## Appendix

### Test Artifacts
- Test cases: {link}
- Test data: {link}
- Execution logs: {link}

### Defect Details
{Link to defect tracker}
