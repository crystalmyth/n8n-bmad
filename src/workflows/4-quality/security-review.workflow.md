# Security Review Workflow [SR]

> **Agent:** Sierra (Security) 🔒
> **Trigger:** `SR` or `security-review`
> **Output:** Security assessment report

---

## Overview

Conduct a security review of n8n workflows. Checks for vulnerabilities, credential handling, data exposure, and compliance requirements.

---

## Step 1: Security Review Context

**Agent:** Sierra (Security) 🔒

### Review Scope

| Item | Details |
|------|---------|
| Workflow(s) | {workflow_names} |
| Review Type | New / Change / Periodic |
| Data Sensitivity | Low / Medium / High / Critical |
| Compliance Requirements | {GDPR, SOC2, HIPAA, etc.} |

### Risk Level Assessment

| Factor | Assessment |
|--------|------------|
| Data handled | {type of data} |
| External integrations | {count and types} |
| Public exposure | {webhook/public API} |
| **Risk Level** | Low / Medium / High / Critical |

---

## Step 2: Credential Security Review

**Agent:** Sierra (Security) 🔒

### Credential Audit

| Check | Status | Notes |
|-------|--------|-------|
| All credentials in n8n store | ⬜ | |
| No hardcoded secrets | ⬜ | |
| No secrets in workflow JSON | ⬜ | |
| No secrets in logs | ⬜ | |
| No secrets in error messages | ⬜ | |

### Credential Inventory

| Credential | Type | Scope | Rotation Policy |
|------------|------|-------|-----------------|
| {cred_1} | API Key | {scope} | {policy} |
| {cred_2} | OAuth | {scope} | {policy} |

### Issues Found

- [ ] {issue_1}
- [ ] {issue_2}

---

## Step 3: Data Security Review

**Agent:** Sierra (Security) 🔒

### Data Classification

| Data Type | Classification | Handling Required |
|-----------|----------------|-------------------|
| {data_type_1} | Public/Internal/Confidential/Restricted | {requirements} |
| {data_type_2} | {classification} | {requirements} |

### Data Flow Analysis

```
[Input] → [Process] → [Store?] → [Output]
   ↓          ↓          ↓          ↓
{encrypted?} {logged?} {encrypted?} {exposed?}
```

### Data Security Checklist

| Check | Status |
|-------|--------|
| Sensitive data encrypted in transit | ⬜ |
| Sensitive data encrypted at rest | ⬜ |
| PII handled according to policy | ⬜ |
| Data minimization applied | ⬜ |
| Retention policies followed | ⬜ |
| No unnecessary data exposure | ⬜ |

---

## Step 4: Input Validation Review

**Agent:** Sierra (Security) 🔒

### Input Validation Checklist

| Check | Status | Severity |
|-------|--------|----------|
| All external inputs validated | ⬜ | Critical |
| SQL injection prevention | ⬜ | Critical |
| Command injection prevention | ⬜ | Critical |
| XSS prevention (if HTML output) | ⬜ | High |
| Path traversal prevention | ⬜ | High |
| Size limits enforced | ⬜ | Medium |
| Type validation | ⬜ | Medium |

### Injection Risk Assessment

| Input Point | Risk | Mitigation |
|-------------|------|------------|
| Webhook payload | {risk} | {mitigation} |
| API response | {risk} | {mitigation} |
| User input | {risk} | {mitigation} |

---

## Step 5: Authentication & Authorization

**Agent:** Sierra (Security) 🔒

### Webhook Security

| Check | Status |
|-------|--------|
| Webhook authentication enabled | ⬜ |
| Auth method appropriate for risk | ⬜ |
| IP allowlist considered | ⬜ |
| Rate limiting configured | ⬜ |
| HTTPS enforced | ⬜ |

### Auth Methods Review

| Method | Security Level | Appropriate For |
|--------|----------------|-----------------|
| None | None | Internal only |
| Header Auth | Low | Low-risk |
| Basic Auth | Low | + HTTPS only |
| API Key | Medium | Most cases |
| HMAC | High | Signed payloads |
| OAuth | High | User context needed |
| mTLS | Very High | B2B integrations |

### Authorization Check

- [ ] Workflow only accesses needed resources
- [ ] Principle of least privilege followed
- [ ] No privilege escalation possible

---

## Step 6: Integration Security Review

**Agent:** Sierra (Security) 🔒

### External Integration Audit

| Integration | Security Check | Status |
|-------------|----------------|--------|
| {system_1} | TLS verified | ⬜ |
| {system_1} | Creds scoped correctly | ⬜ |
| {system_2} | TLS verified | ⬜ |
| {system_2} | Response validated | ⬜ |

### API Security

| Check | Status |
|-------|--------|
| All API calls use HTTPS | ⬜ |
| Certificate validation enabled | ⬜ |
| API keys have minimal scope | ⬜ |
| Timeout configured | ⬜ |
| Retries don't leak info | ⬜ |

---

## Step 7: Error Handling Security

**Agent:** Sierra (Security) 🔒

### Error Handling Review

| Check | Status |
|-------|--------|
| Errors don't expose secrets | ⬜ |
| Errors don't expose stack traces | ⬜ |
| Errors don't expose internal paths | ⬜ |
| Error messages are generic externally | ⬜ |
| Detailed errors logged internally only | ⬜ |

### Error Response Analysis

| Error Type | External Response | Internal Log |
|------------|-------------------|--------------|
| Auth failure | "Unauthorized" | Full details |
| Validation | "Invalid input" | Specific field |
| System error | "Internal error" | Stack trace |

---

## Step 8: Logging & Monitoring Security

**Agent:** Sierra (Security) 🔒

### Logging Security

| Check | Status |
|-------|--------|
| No secrets logged | ⬜ |
| No PII logged (or masked) | ⬜ |
| No full payloads logged | ⬜ |
| Logs stored securely | ⬜ |
| Log retention policy set | ⬜ |

### Monitoring Configuration

| Check | Status |
|-------|--------|
| Security alerts configured | ⬜ |
| Anomaly detection enabled | ⬜ |
| Failed auth attempts monitored | ⬜ |
| Rate limit breaches alerted | ⬜ |

---

## Step 9: Compliance Check

**Agent:** Sierra (Security) 🔒

### GDPR Compliance (if applicable)

| Requirement | Status |
|-------------|--------|
| Data minimization | ⬜ |
| Purpose limitation | ⬜ |
| Storage limitation | ⬜ |
| Right to deletion supported | ⬜ |
| Data processing documented | ⬜ |

### SOC2 Compliance (if applicable)

| Control | Status |
|---------|--------|
| Access controls | ⬜ |
| Encryption | ⬜ |
| Logging | ⬜ |
| Incident response | ⬜ |

---

## Step 10: Generate Security Report

**Agent:** Sierra (Security) 🔒

### Security Report Template

```markdown
# Security Review Report

## Summary

| Field | Value |
|-------|-------|
| Workflow | {name} |
| Reviewed By | Sierra (Security) |
| Date | {date} |
| Risk Level | Low / Medium / High / Critical |
| Status | ✅ Approved / ⚠️ Conditional / ❌ Blocked |

---

## Findings Summary

| Severity | Count |
|----------|-------|
| Critical | {X} |
| High | {X} |
| Medium | {X} |
| Low | {X} |

---

## Detailed Findings

### Finding 1: {Title}

| Field | Value |
|-------|-------|
| Severity | {level} |
| Category | {category} |
| Status | Open / Mitigated |

**Description:** {description}

**Recommendation:** {recommendation}

---

## Recommendations

### Immediate (Critical/High)
1. {recommendation}

### Short-term (Medium)
1. {recommendation}

### Long-term (Low/Improvements)
1. {recommendation}

---

## Approval

- [ ] Approved for production
- [ ] Approved with conditions: {conditions}
- [ ] Not approved: {blockers}

Reviewed by: Sierra (Security) 🔒
Date: {date}
```

### Save Location

```
./docs/security/security-review-{workflow}-{date}.md
```

---

## Decision Points

| Situation | Action |
|-----------|--------|
| Critical finding | Block deployment, immediate fix |
| High finding | Fix before production |
| Medium finding | Fix within iteration |
| Low finding | Track in backlog |

---

## Quick Reference

**Inputs:**
- Workflow (export or access)
- Architecture documentation
- Data classification

**Outputs:**
- Security report
- Finding list
- Approval status

**Duration:** 1-2 hours per workflow

**Severity Levels:**
- **Critical:** Immediate exploitation risk
- **High:** Significant vulnerability
- **Medium:** Security weakness
- **Low:** Hardening recommendation
