---
template: access-review
version: "1.0"
category: security
---

# Access Review: n8n Platform

## Review Information

| Field | Value |
|-------|-------|
| **Review Period** | {start_date} - {end_date} |
| **Reviewer** | {reviewer} |
| **Review Date** | {date} |
| **Environment** | {environment} |
| **Next Review** | {next_date} |

---

## Executive Summary

{Summary of access review findings and recommendations.}

---

## User Access Review

### Current Users

| User | Email | Role | Last Active | Status | Action |
|------|-------|------|-------------|--------|--------|
| {user} | {email} | {Admin/Editor/Viewer} | {date} | Active/Inactive | Retain/Remove/Modify |

### Role Distribution
| Role | Count | Appropriate |
|------|-------|-------------|
| Admin | {n} | Yes/No |
| Editor | {n} | Yes/No |
| Viewer | {n} | Yes/No |

### Users to Remove
| User | Reason | Approved By |
|------|--------|-------------|
| {user} | {reason} | {approver} |

### Users to Modify
| User | Current Role | New Role | Reason |
|------|--------------|----------|--------|
| {user} | {current} | {new} | {reason} |

---

## API Key Review

### Active API Keys

| Key Name | Owner | Purpose | Created | Last Used | Action |
|----------|-------|---------|---------|-----------|--------|
| {name} | {owner} | {purpose} | {date} | {date} | Retain/Revoke |

### Keys to Revoke
| Key Name | Reason |
|----------|--------|
| {name} | {reason} |

---

## Credential Access Review

### Credential Permissions

| Credential | Users with Access | Appropriate | Notes |
|------------|-------------------|-------------|-------|
| {credential} | {user_count} | Yes/No | {notes} |

### Excessive Access
| Credential | User | Issue | Action |
|------------|------|-------|--------|
| {credential} | {user} | {issue} | {action} |

---

## Workflow Access Review

### Sensitive Workflows

| Workflow | Editors | Appropriate | Notes |
|----------|---------|-------------|-------|
| {workflow} | {users} | Yes/No | {notes} |

---

## Service Account Review

| Account | Purpose | Owner | Last Reviewed | Status |
|---------|---------|-------|---------------|--------|
| {account} | {purpose} | {owner} | {date} | Active/Disable |

---

## Findings

### Critical Findings
| Finding | Risk | Recommendation |
|---------|------|----------------|
| {finding} | {risk} | {recommendation} |

### High Priority Findings
| Finding | Risk | Recommendation |
|---------|------|----------------|
| {finding} | {risk} | {recommendation} |

### Medium Priority Findings
| Finding | Risk | Recommendation |
|---------|------|----------------|
| {finding} | {risk} | {recommendation} |

---

## Action Items

| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| {action} | {owner} | {P1/P2/P3} | {date} | Open |

---

## Compliance Notes

### Principle of Least Privilege
- [ ] Users have minimum necessary access
- [ ] Admin accounts limited appropriately
- [ ] Service accounts scoped correctly

### Access Documentation
- [ ] All access is documented
- [ ] Business justification on file
- [ ] Approval records maintained

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | | | |
| System Owner | | | |
| Manager | | | |

---

## Review History

| Review Date | Reviewer | Findings | Status |
|-------------|----------|----------|--------|
| {date} | {reviewer} | {summary} | Closed |
