# Rollback Workflow [RB]

> **Agent:** Rex (DevOps) 🚀
> **Trigger:** `RB` or `rollback`
> **Output:** Restored previous workflow version

---

## Overview

Rollback a deployed workflow to a previous version. Use when a deployment causes issues in production or staging.

---

## Step 1: Incident Assessment

**Agent:** Rex (DevOps) 🚀

### Rollback Trigger

| Reason | Description |
|--------|-------------|
| **Error Spike** | Error rate > 5% |
| **No Executions** | Workflow not triggering |
| **Wrong Output** | Data issues |
| **Performance** | Response time degraded |
| **Security** | Vulnerability discovered |
| **Business** | Feature rollback requested |

### Current State

| Field | Value |
|-------|-------|
| Workflow | {name} |
| Environment | {env} |
| Deployed Version | {version} |
| Issue Started | {timestamp} |
| Impact | {description} |

### Urgency

- [ ] **Critical** - Production down, immediate rollback
- [ ] **High** - Production degraded, rollback ASAP
- [ ] **Medium** - Issues but workaround exists
- [ ] **Low** - Planned rollback, not urgent

---

## Step 2: Rollback Decision

**Agent:** Rex (DevOps) 🚀

### Decision Checklist

- [ ] Issue confirmed and reproducible
- [ ] Forward fix not feasible in acceptable time
- [ ] Previous version is known to work
- [ ] Rollback won't cause data issues
- [ ] Stakeholders notified (if time permits)

### Rollback Type

| Type | Use When |
|------|----------|
| **Version Rollback** | Previous version in backup |
| **Configuration Rollback** | Only settings changed |
| **Full Disable** | Workflow should not run at all |

---

## Step 3: Locate Backup

**Agent:** Rex (DevOps) 🚀

### Backup Location

```
./backups/workflow-{name}-{date}-backup.json
```

### Verify Backup

- [ ] Backup file exists
- [ ] Backup is valid JSON
- [ ] Backup contains complete workflow
- [ ] Backup version is correct

### Backup Selection

| Version | Date | Status | Select |
|---------|------|--------|--------|
| v{X} | {date} | Last working | ⬜ |
| v{X-1} | {date} | Previous | ⬜ |

**Selected Rollback Version:** {version}

---

## Step 4: Pre-Rollback Checks

**Agent:** Rex (DevOps) 🚀

### Environment Check

- [ ] n8n instance accessible
- [ ] API credentials valid
- [ ] Backup file accessible
- [ ] Sufficient permissions

### Impact Assessment

| Check | Status |
|-------|--------|
| Running executions? | {yes/no} |
| Queued items? | {count} |
| Dependent workflows? | {list} |

### Running Executions

**If executions are running:**
1. Wait for completion (if quick)
2. Or proceed (they will fail gracefully)

---

## Step 5: Execute Rollback

**Agent:** Rex (DevOps) 🚀

### Step 5.1: Deactivate Current Workflow

```bash
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

- [ ] Current workflow deactivated

### Step 5.2: Import Backup

```bash
curl -X PUT "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @backups/workflow-${NAME}-backup.json
```

- [ ] Backup imported successfully

### Step 5.3: Activate Restored Workflow

```bash
curl -X PATCH "${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

- [ ] Workflow activated

---

## Step 6: Verify Rollback

**Agent:** Rex (DevOps) 🚀

### Verification Checklist

| Check | Status |
|-------|--------|
| Workflow appears in n8n | ⬜ |
| Workflow is active | ⬜ |
| Version is correct | ⬜ |
| Test execution succeeds | ⬜ |
| Error rate normal | ⬜ |

### Smoke Test

Trigger a test execution:
- [ ] Execution starts
- [ ] Execution completes
- [ ] Output is correct

---

## Step 7: Post-Rollback Actions

**Agent:** Rex (DevOps) 🚀

### Immediate Actions

- [ ] Confirm rollback successful
- [ ] Update monitoring status
- [ ] Notify team of rollback
- [ ] Disable any dependent automations (if needed)

### Communication

```
⚠️ ROLLBACK COMPLETED

Workflow: {workflow_name}
Environment: {environment}
Rolled back from: v{new_version}
Rolled back to: v{old_version}
Time: {timestamp}

Reason: {reason}

Status: Workflow operational
Next steps: {next_steps}
```

### Notify

- [ ] Team Slack channel
- [ ] On-call engineer
- [ ] Stakeholders (if production)

---

## Step 8: Incident Documentation

**Agent:** Rex (DevOps) 🚀

### Incident Record

```markdown
# Rollback Incident: {workflow_name}

## Summary

| Field | Value |
|-------|-------|
| Date | {date} |
| Environment | {env} |
| Rolled Back | v{new} → v{old} |
| Duration | {time} |
| Impact | {impact} |

## Timeline

| Time | Event |
|------|-------|
| {time} | Issue detected |
| {time} | Rollback started |
| {time} | Rollback completed |
| {time} | Verification done |

## Root Cause

{description}

## Lessons Learned

1. {lesson_1}
2. {lesson_2}

## Action Items

- [ ] {action_1}
- [ ] {action_2}
```

---

## Step 9: Root Cause Analysis

**Agent:** Rex (DevOps) 🚀 → Nate (Developer) 💻

### Investigation Needed

| Question | Answer |
|----------|--------|
| What changed? | {changes} |
| Why did it fail? | {reason} |
| How was it missed? | {testing_gap} |
| How to prevent? | {prevention} |

**🔀 Route to Nate (Developer):** For code investigation and fix.

---

## Step 10: Recovery Plan

**Agent:** Rex (DevOps) 🚀

### Path Forward

| Option | Description | Timeline |
|--------|-------------|----------|
| Fix and redeploy | Address issues, test, deploy again | {timeline} |
| Stay on old version | Use previous version long-term | N/A |
| Alternative approach | Different implementation | {timeline} |

### Next Deploy Checklist

- [ ] Root cause addressed
- [ ] Tests added for failure case
- [ ] Reviewed by team
- [ ] Staged deployment first
- [ ] Rollback plan ready

---

## Decision Points

| Situation | Route To | Action |
|-----------|----------|--------|
| Need investigation | Nate (Developer) | Debug and fix |
| Security issue | Sierra (Security) | `SR` security review |
| Architecture flaw | Winston (Architect) | `CA` redesign |
| Test gap | Quinn (QA) | `TP` improve tests |

---

## Quick Reference

**Inputs:**
- Workflow ID
- Backup file
- n8n access

**Outputs:**
- Restored workflow
- Incident documentation

**Duration:** 5-15 minutes (emergency) / 30 minutes (planned)

**Critical Commands:**
```bash
# Deactivate
curl -X PATCH "${N8N_URL}/api/v1/workflows/${ID}" \
  -H "X-N8N-API-KEY: ${KEY}" \
  -d '{"active": false}'

# Restore
curl -X PUT "${N8N_URL}/api/v1/workflows/${ID}" \
  -H "X-N8N-API-KEY: ${KEY}" \
  -d @backup.json

# Activate
curl -X PATCH "${N8N_URL}/api/v1/workflows/${ID}" \
  -H "X-N8N-API-KEY: ${KEY}" \
  -d '{"active": true}'
```
