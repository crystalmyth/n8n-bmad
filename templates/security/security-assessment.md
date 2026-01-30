---
template: security-assessment
version: "1.0"
category: security
---

# Security Assessment: {workflow_name}

## Assessment Information

| Field | Value |
|-------|-------|
| **Workflow** | {workflow_name} |
| **Assessor** | {assessor} |
| **Date** | {date} |
| **Version** | {version} |
| **Status** | Pass / Conditional Pass / Fail |

---

## Executive Summary

**Overall Risk Level:** {Critical / High / Medium / Low}

{2-3 sentence summary of assessment findings.}

---

## Assessment Scope

### Included
- Workflow configuration
- Credential usage
- Data handling
- Input validation
- Error handling

### Excluded
- {exclusion_1}
- {exclusion_2}

---

## Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | {n} | {n} open |
| High | {n} | {n} open |
| Medium | {n} | {n} open |
| Low | {n} | {n} open |
| **Total** | **{n}** | **{n} open** |

---

## Detailed Findings

### Finding 1: {finding_title}

| Property | Value |
|----------|-------|
| **Severity** | Critical / High / Medium / Low |
| **Category** | {Credentials / Data / Input / Auth / etc} |
| **Status** | Open / Fixed / Accepted Risk |

**Description:**
{Detailed description of the security issue.}

**Location:**
- Node: {node_name}
- Configuration: {specific_config}

**Evidence:**
```
{evidence_or_code_snippet}
```

**Risk:**
{Explain the risk if not addressed.}

**Recommendation:**
{How to fix this issue.}

**Remediation Steps:**
1. {step_1}
2. {step_2}

---

### Finding 2: {finding_title}

| Property | Value |
|----------|-------|
| **Severity** | {severity} |
| **Category** | {category} |
| **Status** | {status} |

**Description:**
{description}

**Recommendation:**
{recommendation}

---

## Assessment Categories

### 1. Credential Security

| Check | Status | Notes |
|-------|--------|-------|
| No hardcoded credentials | Pass/Fail | {notes} |
| Credentials in n8n store | Pass/Fail | {notes} |
| Minimum required permissions | Pass/Fail | {notes} |
| Rotation schedule defined | Pass/Fail | {notes} |

### 2. Data Protection

| Check | Status | Notes |
|-------|--------|-------|
| PII identified | Pass/Fail | {notes} |
| Sensitive data not logged | Pass/Fail | {notes} |
| Data minimization | Pass/Fail | {notes} |
| Encryption in transit | Pass/Fail | {notes} |

### 3. Input Validation

| Check | Status | Notes |
|-------|--------|-------|
| Webhook input validated | Pass/Fail | {notes} |
| Schema validation | Pass/Fail | {notes} |
| Injection prevention | Pass/Fail | {notes} |

### 4. Authentication & Authorization

| Check | Status | Notes |
|-------|--------|-------|
| Webhook authentication | Pass/Fail | {notes} |
| API authentication | Pass/Fail | {notes} |
| Access controls | Pass/Fail | {notes} |

### 5. Error Handling

| Check | Status | Notes |
|-------|--------|-------|
| Errors don't expose data | Pass/Fail | {notes} |
| Error messages appropriate | Pass/Fail | {notes} |
| Error logging secure | Pass/Fail | {notes} |

---

## Compliance Check

### Framework: {SOC2/GDPR/HIPAA/etc}

| Control | Status | Evidence |
|---------|--------|----------|
| {control_1} | Compliant/Non-Compliant | {evidence} |
| {control_2} | Compliant/Non-Compliant | {evidence} |

---

## Risk Register

| Risk | Likelihood | Impact | Risk Level | Mitigation |
|------|------------|--------|------------|------------|
| {risk} | H/M/L | H/M/L | {level} | {mitigation} |

---

## Recommendations Priority

### Immediate (Before Production)
1. {recommendation}
2. {recommendation}

### Short-term (Within 30 days)
1. {recommendation}

### Long-term (Within 90 days)
1. {recommendation}

---

## Approval

### Assessment Approval
| Role | Name | Date | Decision |
|------|------|------|----------|
| Security Lead | | | Approve / Reject |
| Tech Lead | | | Acknowledge |

### Risk Acceptance (if applicable)
| Risk | Accepted By | Date | Justification |
|------|-------------|------|---------------|
| {risk} | {name} | {date} | {justification} |

---

## Re-Assessment

**Next Assessment Due:** {date}

**Triggers for Re-Assessment:**
- Major workflow changes
- New integrations added
- Security incident
- Compliance audit
