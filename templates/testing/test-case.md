---
template: test-case
version: "1.0"
category: testing
---

# Test Case: {test_id}

## Test Information

| Field | Value |
|-------|-------|
| **Test ID** | {test_id} |
| **Title** | {test_title} |
| **Workflow** | {workflow_name} |
| **Type** | Unit / Integration / E2E / Performance |
| **Priority** | Critical / High / Medium / Low |
| **Status** | Not Run / Pass / Fail / Blocked |
| **Automated** | Yes / No |

---

## Description

{Brief description of what this test case validates.}

---

## Prerequisites

- [ ] {prerequisite_1}
- [ ] {prerequisite_2}
- [ ] Workflow deployed to test environment
- [ ] Test credentials configured

---

## Test Data

### Input Data
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Expected Output
```json
{
  "result": "expected_value"
}
```

---

## Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | {action_1} | {expected_1} |
| 2 | {action_2} | {expected_2} |
| 3 | {action_3} | {expected_3} |
| 4 | {action_4} | {expected_4} |

---

## Detailed Steps

### Step 1: {step_title}
**Action:** {detailed_action}

**Expected Result:** {detailed_expected}

**Verification:**
- [ ] {verification_point_1}
- [ ] {verification_point_2}

### Step 2: {step_title}
**Action:** {detailed_action}

**Expected Result:** {detailed_expected}

---

## Postconditions

- [ ] {cleanup_step_1}
- [ ] {cleanup_step_2}

---

## Execution History

| Date | Tester | Environment | Result | Notes |
|------|--------|-------------|--------|-------|
| {date} | {name} | {env} | Pass/Fail | {notes} |

---

## Defects

| Defect ID | Title | Status |
|-----------|-------|--------|
| {defect_id} | {title} | {status} |

---

## Notes

{Additional notes or observations.}
