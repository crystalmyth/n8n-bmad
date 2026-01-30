---
template: runbook
version: "1.0"
category: operations
---

# Runbook: {workflow_name}

## Quick Reference

| Field | Value |
|-------|-------|
| **Workflow ID** | {workflow_id} |
| **Environment** | {environment} |
| **Criticality** | High / Medium / Low |
| **On-Call Team** | {team} |
| **Escalation** | {contact} |

---

## Overview

### Purpose
{What this workflow does in one sentence.}

### Schedule
- **Frequency:** {cron_description}
- **Timezone:** {timezone}
- **Expected Duration:** {duration}

### Dependencies
| System | Type | Contact |
|--------|------|---------|
| {system} | {API/DB/etc} | {contact} |

---

## Normal Operation

### Expected Behavior
{Describe what normal, successful operation looks like.}

### Success Indicators
- [ ] Execution completes within {time}
- [ ] No error nodes triggered
- [ ] Expected output count: {count}
- [ ] Downstream systems updated

### Monitoring Dashboard
{Link to monitoring dashboard}

---

## Common Issues and Resolution

### Issue 1: {issue_title}

**Symptoms:**
- {symptom_1}
- {symptom_2}

**Cause:**
{Root cause description}

**Resolution:**
1. {step_1}
2. {step_2}
3. {step_3}

**Prevention:**
{How to prevent this issue}

---

### Issue 2: {issue_title}

**Symptoms:**
- {symptom}

**Cause:**
{cause}

**Resolution:**
1. {step}

---

### Issue 3: API Rate Limiting

**Symptoms:**
- HTTP 429 errors in execution logs
- Incomplete data processing

**Cause:**
External API rate limit exceeded

**Resolution:**
1. Check execution logs for rate limit details
2. Wait for rate limit window to reset
3. Consider adjusting workflow schedule to reduce frequency
4. Re-run failed items manually if needed

---

### Issue 4: Authentication Failure

**Symptoms:**
- HTTP 401 or 403 errors
- "Unauthorized" error messages

**Cause:**
Expired or invalid credentials

**Resolution:**
1. Navigate to n8n Credentials
2. Locate credential: {credential_name}
3. Test connection
4. If failed, update with new credentials
5. Re-activate workflow

---

## Troubleshooting Steps

### Step 1: Check Execution Status
```bash
# View recent executions via API
curl -X GET "${N8N_URL}/api/v1/executions?workflowId=${WORKFLOW_ID}&limit=10" \
  -H "X-N8N-API-KEY: ${API_KEY}"
```

### Step 2: Review Execution Logs
1. Open n8n UI
2. Navigate to Executions
3. Filter by workflow: {workflow_name}
4. Click on failed execution
5. Review error details in failed node

### Step 3: Check External Systems
| System | Health Check | Expected |
|--------|--------------|----------|
| {system} | {endpoint} | {response} |

### Step 4: Validate Data
```javascript
// Check input data format
console.log(JSON.stringify($input.all(), null, 2));
```

---

## Recovery Procedures

### Restart Workflow
1. Deactivate workflow
2. Wait 30 seconds
3. Reactivate workflow
4. Monitor first execution

### Reprocess Failed Items
1. Export failed items from error workflow
2. Format as input for retry
3. Trigger manual execution with failed items

### Rollback
1. Deactivate current workflow
2. Export workflow as backup
3. Import previous version from backup
4. Activate restored workflow
5. Verify operation

---

## Emergency Procedures

### Complete Outage
1. **Immediately:** Disable workflow to prevent data issues
2. **Notify:** Alert team via {channel}
3. **Assess:** Check all dependent systems
4. **Communicate:** Update status page/stakeholders
5. **Resolve:** Follow troubleshooting steps
6. **Verify:** Test before re-enabling

### Data Integrity Issue
1. Stop workflow immediately
2. Identify scope of affected data
3. Notify data owners
4. Implement fix
5. Plan data remediation
6. Execute remediation
7. Verify data integrity

---

## Maintenance Procedures

### Scheduled Maintenance
1. Notify stakeholders 24h in advance
2. Deactivate workflow at scheduled time
3. Perform maintenance
4. Test in staging
5. Reactivate workflow
6. Monitor for issues
7. Notify stakeholders of completion

### Credential Rotation
1. Create new credentials in source system
2. Add new credentials to n8n
3. Update workflow to use new credentials
4. Test workflow execution
5. Deactivate old credentials
6. Remove old credentials from n8n

---

## Contact Information

### Primary Contacts
| Role | Name | Contact | Hours |
|------|------|---------|-------|
| On-Call | {name} | {phone/slack} | {hours} |
| Tech Lead | {name} | {contact} | {hours} |
| Product Owner | {name} | {contact} | Business hours |

### Escalation Path
```
Level 1: On-Call Engineer ({response_time})
    ↓
Level 2: Tech Lead ({response_time})
    ↓
Level 3: Engineering Manager ({response_time})
```

---

## Appendix

### Related Documentation
- Workflow Architecture: {link}
- Integration Spec: {link}
- Test Plan: {link}

### Change Log
| Date | Change | Author |
|------|--------|--------|
| {date} | Initial version | {author} |
