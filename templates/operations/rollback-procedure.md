---
template: rollback-procedure
version: "1.0"
category: operations
---

# Rollback Procedure: {workflow_name}

## Quick Reference

| Field | Value |
|-------|-------|
| **Workflow** | {workflow_name} |
| **Environment** | {environment} |
| **Last Updated** | {date} |
| **Owner** | {owner} |
| **Max Rollback Time** | {time_estimate} |

---

## When to Rollback

### Rollback Triggers
- [ ] Critical functionality broken
- [ ] Error rate exceeds {threshold}%
- [ ] Data integrity issues detected
- [ ] Performance degradation > {threshold}%
- [ ] Security vulnerability discovered

### Decision Authority
| Severity | Who Can Decide | Contact |
|----------|----------------|---------|
| SEV1 | On-call + Manager | {contact} |
| SEV2 | On-call | {contact} |
| SEV3 | Tech Lead | {contact} |

---

## Pre-Rollback Checklist

- [ ] Confirm rollback is necessary (vs. hotfix)
- [ ] Identify version to rollback to
- [ ] Verify backup exists and is valid
- [ ] Notify stakeholders
- [ ] Prepare communication
- [ ] Confirm team availability

---

## Rollback Procedure

### Step 1: Prepare for Rollback
```bash
# Document current state
curl -X GET "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -o workflow-current-backup.json
```

### Step 2: Deactivate Current Workflow
```bash
# Deactivate the workflow
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

**Manual Steps (via UI):**
1. Open n8n UI
2. Navigate to workflow: {workflow_name}
3. Click the Active toggle to deactivate
4. Confirm deactivation

### Step 3: Retrieve Previous Version

**Option A: From Version Control**
```bash
# Get previous version from git
git checkout HEAD~1 -- workflows/{workflow_file}.json
```

**Option B: From n8n Backup**
```bash
# List available backups
ls -la backups/{workflow_name}/

# Select appropriate backup
cp backups/{workflow_name}/{backup_file}.json workflow-restore.json
```

### Step 4: Import Previous Version
```bash
# Import the previous version
curl -X PUT "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @workflow-restore.json
```

**Manual Steps (via UI):**
1. Open n8n UI
2. Go to Workflows > Import
3. Select the backup file
4. Review imported workflow
5. Save changes

### Step 5: Verify Configuration
- [ ] Check workflow settings match expected
- [ ] Verify credential references are valid
- [ ] Confirm trigger configuration
- [ ] Review node configurations

### Step 6: Reactivate Workflow
```bash
# Activate the restored workflow
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

### Step 7: Verify Rollback
- [ ] Trigger test execution
- [ ] Verify successful completion
- [ ] Check data output is correct
- [ ] Monitor error rates
- [ ] Confirm downstream systems receive data

---

## Post-Rollback Actions

### Immediate (Within 30 minutes)
- [ ] Confirm workflow is stable
- [ ] Update status page/communication
- [ ] Document rollback in incident log

### Short-term (Within 24 hours)
- [ ] Root cause analysis of failed deployment
- [ ] Create incident report
- [ ] Plan corrective action

### Follow-up
- [ ] Post-mortem meeting scheduled
- [ ] Fix validated in non-production
- [ ] Re-deployment plan created

---

## Rollback Verification

### Health Checks
| Check | Expected | Command |
|-------|----------|---------|
| Workflow active | true | Check n8n UI |
| Test execution | Success | Trigger test |
| Error rate | < {threshold}% | Check monitoring |

### Monitoring Points
- Execution success rate
- Execution duration
- Error count
- Downstream system status

---

## Communication Template

### Rollback Started
```
Subject: [ROLLBACK] {workflow_name} - Rollback Initiated

Team,

We are initiating a rollback of {workflow_name} due to {reason}.

Impact: {impact}
Expected Duration: {duration}
Status Updates: {channel}

We will provide updates as the rollback progresses.

- {name}
```

### Rollback Complete
```
Subject: [RESOLVED] {workflow_name} - Rollback Complete

Team,

The rollback of {workflow_name} has been completed successfully.

Duration: {duration}
Current Status: Operational
Next Steps: {next_steps}

A post-mortem will be scheduled to review this incident.

- {name}
```

---

## Troubleshooting Rollback Issues

### Issue: Cannot deactivate workflow
**Resolution:**
1. Check n8n service status
2. Verify API credentials
3. Try via UI instead of API
4. Restart n8n service if needed

### Issue: Backup file corrupted
**Resolution:**
1. Try alternative backup
2. Check version control history
3. Manually reconstruct from documentation

### Issue: Credential mismatch
**Resolution:**
1. Check credential IDs in backup vs current
2. Update credential references
3. Recreate credentials if needed

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call | {name} | {phone} | {email} |
| Tech Lead | {name} | {phone} | {email} |
| Manager | {name} | {phone} | {email} |
