# Deploy Workflow [DW]

> **Agent:** Rex (DevOps) 🚀 + Sierra (Security) 🔒
> **Trigger:** `DW` or `deploy-workflow`
> **Output:** Deployed workflow in target environment

---

## Overview

Deploy an n8n workflow to the target environment with proper validation, rollback planning, and monitoring setup.

---

## Step 1: Pre-Deployment Checklist

**Agent:** Rex (DevOps) 🚀

### Workflow Identification

| Field | Value |
|-------|-------|
| Workflow Name | {name} |
| Version | {version} |
| Source Environment | {dev/staging} |
| Target Environment | {staging/production} |

### Pre-Deployment Checks

- [ ] Code review passed (`CR` completed)
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Story status is "Review" or "Done"
- [ ] No blocking issues open

**If any check fails:** Stop and resolve before proceeding.

---

## Step 2: Security Review

**Agent:** Sierra (Security) 🔒

### Security Checklist

- [ ] Credentials in credential store (not hardcoded)
- [ ] No sensitive data in workflow JSON
- [ ] Webhook authentication configured
- [ ] Appropriate access controls set
- [ ] No exposed secrets in logs

**🔀 If deploying to production:** Run full security review with `SR`

### Compliance Check (if applicable)

- [ ] SOC2 requirements met
- [ ] GDPR considerations addressed
- [ ] Data retention policies followed

---

## Step 3: Backup Current State

**Agent:** Rex (DevOps) 🚀

### Export Current Workflow

**If updating existing workflow:**

```bash
# Export current version as backup
curl -X GET "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -o "backups/workflow-${NAME}-${DATE}-backup.json"
```

### Backup Checklist

- [ ] Current workflow exported
- [ ] Backup file stored safely
- [ ] Backup verified (can be imported)

**Backup Location:** `./backups/workflow-{name}-{date}-backup.json`

---

## Step 4: Deployment Plan

**Agent:** Rex (DevOps) 🚀

### Deployment Strategy

| Strategy | Use When | Rollback Speed |
|----------|----------|----------------|
| **Direct** | Low risk, non-critical | Minutes |
| **Blue-Green** | Zero downtime needed | Seconds |
| **Canary** | High risk, gradual rollout | Minutes |

**Selected Strategy:** {strategy}

### Deployment Window

| Field | Value |
|-------|-------|
| Scheduled Time | {datetime} |
| Expected Duration | {minutes} |
| Rollback Deadline | {datetime} |
| On-Call Contact | {name/channel} |

---

## Step 5: Environment Preparation

**Agent:** Rex (DevOps) 🚀

### Target Environment Checks

- [ ] Environment accessible
- [ ] Required credentials exist in target
- [ ] Environment variables configured
- [ ] Connected services available
- [ ] Sufficient resources (memory, CPU)

### Credential Sync

| Credential | Source | Target | Status |
|------------|--------|--------|--------|
| {cred_1} | {env} | {env} | ✅/❌ |
| {cred_2} | {env} | {env} | ✅/❌ |

**If credentials missing:** Add to target environment before deploying.

---

## Step 6: Deploy Workflow

**Agent:** Rex (DevOps) 🚀

### Deployment Steps

#### Step 6.1: Deactivate (if updating)
```bash
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

#### Step 6.2: Import/Update Workflow
```bash
# For new workflow
curl -X POST "${N8N_URL}/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @workflow.json

# For existing workflow
curl -X PUT "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

#### Step 6.3: Activate
```bash
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

### Deployment Status

- [ ] Workflow imported successfully
- [ ] Workflow activated
- [ ] No import errors

---

## Step 7: Post-Deployment Verification

**Agent:** Rex (DevOps) 🚀

### Smoke Tests

| Test | Expected | Actual | Pass? |
|------|----------|--------|-------|
| Workflow appears in list | Yes | | ⬜ |
| Workflow is active | Yes | | ⬜ |
| Trigger test (if safe) | Success | | ⬜ |
| First execution succeeds | Success | | ⬜ |

### Monitoring Verification

- [ ] Workflow appears in monitoring
- [ ] Alerts configured
- [ ] Logs flowing
- [ ] Metrics collecting

---

## Step 8: Rollback Plan

**Agent:** Rex (DevOps) 🚀

### Rollback Triggers

Initiate rollback if:
- [ ] Error rate > 5% in first 15 minutes
- [ ] No successful executions in 30 minutes
- [ ] Critical alert fires
- [ ] Customer-reported issues

### Rollback Procedure

```bash
# 1. Deactivate current
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -d '{"active": false}'

# 2. Import backup
curl -X PUT "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -d @backups/workflow-${NAME}-backup.json

# 3. Activate backup
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -d '{"active": true}'
```

**🔀 If rollback needed:** Execute immediately, then investigate.

---

## Step 9: Communication

**Agent:** Rex (DevOps) 🚀

### Stakeholder Notification

**On successful deployment:**
```
✅ Deployed: {workflow_name} v{version}
Environment: {environment}
Time: {timestamp}
Status: Active

Release notes: {link_or_summary}
```

**On rollback:**
```
⚠️ Rolled back: {workflow_name}
Environment: {environment}
Reason: {reason}
Status: Previous version active

Investigation: {incident_link}
```

### Channels to Notify

- [ ] Team Slack channel
- [ ] Stakeholders (if production)
- [ ] On-call (if after hours)

---

## Step 10: Documentation Update

**Agent:** Rex (DevOps) 🚀 → Tara (Tech Writer) 📝

### Update Records

- [ ] Deployment log updated
- [ ] Version history updated
- [ ] Runbook updated (if changed)
- [ ] Story marked as "Done"

### Deployment Log Entry

```markdown
## Deployment: {workflow_name}

| Field | Value |
|-------|-------|
| Date | {date} |
| Version | {version} |
| Environment | {env} |
| Deployed By | {name} |
| Duration | {minutes} |
| Status | Success/Rolled Back |

### Changes
- {change_1}
- {change_2}

### Notes
{any_issues_or_observations}
```

---

## Step 11: Monitoring Period

**Agent:** Rex (DevOps) 🚀

### First Hour Monitoring

| Metric | Threshold | Status |
|--------|-----------|--------|
| Error rate | < 5% | ⬜ |
| Execution count | > 0 | ⬜ |
| Response time | < baseline + 20% | ⬜ |
| Memory usage | < 80% | ⬜ |

### Actions if Issues

| Issue | Action |
|-------|--------|
| High error rate | Investigate logs, consider rollback |
| No executions | Verify trigger, check connectivity |
| Slow performance | Check resources, optimize if minor |
| Memory spike | Monitor, rollback if critical |

---

## Decision Points

| Situation | Route To | Command |
|-----------|----------|---------|
| Security concern | Sierra (Security) | `SR` |
| Incident during deploy | Rex (DevOps) | `IC` |
| Performance issue | Winston (Architect) | Investigation |
| Need to communicate broadly | Paula (PM) | Stakeholder update |

---

## Quick Reference

**Inputs:**
- Approved workflow
- Target environment
- Deployment window

**Outputs:**
- Deployed workflow
- Verified and monitored
- Documentation updated

**Duration:** 15-30 minutes (excluding monitoring period)

**Rollback command:**
```
RB {workflow_name}
```
