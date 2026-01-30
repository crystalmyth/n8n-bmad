---
template: disaster-recovery
version: "1.0"
category: operations
---

# Disaster Recovery Plan: n8n Workflow Platform

## Document Information

| Field | Value |
|-------|-------|
| **Version** | {version} |
| **Last Updated** | {date} |
| **Owner** | {owner} |
| **Review Frequency** | Quarterly |
| **Last Test Date** | {date} |

---

## Recovery Objectives

| Objective | Target | Current Capability |
|-----------|--------|-------------------|
| **RTO** (Recovery Time Objective) | {hours} hours | {current} |
| **RPO** (Recovery Point Objective) | {hours} hours | {current} |
| **MTTR** (Mean Time to Recover) | {hours} hours | {current} |

---

## Scope

### Systems Covered
| System | Criticality | RTO | RPO |
|--------|-------------|-----|-----|
| n8n Instance | Critical | 2h | 1h |
| Workflow Database | Critical | 2h | 1h |
| Credential Store | Critical | 1h | 1h |
| External Integrations | High | 4h | N/A |

### Out of Scope
- {out_of_scope_item}

---

## Disaster Scenarios

### Scenario 1: n8n Instance Failure
**Description:** Primary n8n instance becomes unavailable.

**Indicators:**
- Health check failures
- Unable to access UI
- API unresponsive

**Impact:**
- All workflows stop executing
- No new triggers processed

**Recovery Strategy:** Failover to standby or restore from backup

### Scenario 2: Database Corruption/Loss
**Description:** Workflow database is corrupted or lost.

**Indicators:**
- Database connection errors
- Missing workflows
- Execution history lost

**Impact:**
- Workflow definitions lost
- Execution history unavailable

**Recovery Strategy:** Restore from database backup

### Scenario 3: Credential Compromise
**Description:** Credentials are compromised or exposed.

**Indicators:**
- Unauthorized access detected
- Credential abuse alerts

**Impact:**
- Security breach
- Potential data exposure

**Recovery Strategy:** Rotate all credentials immediately

### Scenario 4: Complete Infrastructure Loss
**Description:** Cloud region or data center failure.

**Indicators:**
- Multiple service failures
- Provider status page alerts

**Impact:**
- Total platform outage

**Recovery Strategy:** Deploy to alternate region/provider

---

## Backup Strategy

### Workflow Backups
| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Full export | Daily | 30 days | {location} |
| Incremental | Hourly | 7 days | {location} |
| On-change | Real-time | 90 days | Git repository |

### Database Backups
| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Full | Daily | 30 days | {location} |
| Transaction logs | Continuous | 7 days | {location} |
| Snapshots | Weekly | 90 days | {location} |

### Credential Backups
| Method | Frequency | Location | Encryption |
|--------|-----------|----------|------------|
| Encrypted export | Daily | {location} | AES-256 |

---

## Recovery Procedures

### Procedure 1: n8n Instance Recovery

**Prerequisites:**
- Access to backup storage
- Infrastructure provisioning access
- Current configuration documentation

**Steps:**
1. **Assess (5 min)**
   - Confirm instance is unrecoverable
   - Identify last good backup

2. **Provision (15 min)**
   ```bash
   # Provision new instance
   {provisioning_command}
   ```

3. **Restore Configuration (10 min)**
   ```bash
   # Restore n8n configuration
   {restore_config_command}
   ```

4. **Restore Database (20 min)**
   ```bash
   # Restore database from backup
   {restore_db_command}
   ```

5. **Restore Workflows (15 min)**
   ```bash
   # Import workflows
   {import_workflows_command}
   ```

6. **Restore Credentials (10 min)**
   - Import encrypted credential backup
   - Verify credential connectivity

7. **Verify (15 min)**
   - Test critical workflows
   - Verify integrations
   - Check monitoring

8. **Activate (5 min)**
   - Enable workflows
   - Update DNS/routing
   - Notify stakeholders

**Total Estimated Time:** 95 minutes

---

### Procedure 2: Database Recovery

**Steps:**
1. Stop n8n service
2. Restore database from backup
   ```bash
   {database_restore_command}
   ```
3. Verify data integrity
4. Restart n8n service
5. Verify workflows

---

### Procedure 3: Credential Rotation

**Steps:**
1. Identify all affected credentials
2. Generate new credentials at source systems
3. Update credentials in n8n
4. Verify workflow connectivity
5. Revoke old credentials
6. Document changes

---

## Communication Plan

### Notification Matrix
| Severity | Who to Notify | When | How |
|----------|---------------|------|-----|
| SEV1 | Leadership, All stakeholders | Immediate | Phone + Slack |
| SEV2 | Tech team, Key stakeholders | 15 min | Slack + Email |
| SEV3 | Tech team | 30 min | Slack |

### Communication Templates

**Initial Notification:**
```
INCIDENT: n8n Platform Disaster Recovery Initiated

Status: Recovery in progress
Impact: {impact_description}
ETA to Recovery: {eta}
Updates: Every 30 minutes via {channel}

Incident Commander: {name}
```

**Resolution Notification:**
```
RESOLVED: n8n Platform Recovered

Recovery Time: {duration}
Current Status: Operational
Data Loss: {yes/no - details}
Post-mortem: Scheduled for {date}
```

---

## Team Responsibilities

| Role | Primary | Backup | Responsibilities |
|------|---------|--------|------------------|
| Incident Commander | {name} | {name} | Overall coordination |
| Infrastructure Lead | {name} | {name} | System recovery |
| Database Admin | {name} | {name} | Data recovery |
| Security Lead | {name} | {name} | Credential management |
| Communications | {name} | {name} | Stakeholder updates |

---

## Testing Schedule

| Test Type | Frequency | Last Test | Next Test |
|-----------|-----------|-----------|-----------|
| Backup verification | Weekly | {date} | {date} |
| Recovery drill | Quarterly | {date} | {date} |
| Full DR test | Annually | {date} | {date} |

### Test Checklist
- [ ] Backup restoration successful
- [ ] All workflows recovered
- [ ] Credentials functional
- [ ] Integrations working
- [ ] RTO/RPO met
- [ ] Documentation current

---

## Resources

### External Resources
| Resource | Contact | SLA |
|----------|---------|-----|
| Cloud Provider | {contact} | {sla} |
| n8n Support | {contact} | {sla} |
| Database Provider | {contact} | {sla} |

### Documentation Links
- Infrastructure runbook: {link}
- Database admin guide: {link}
- Security procedures: {link}

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | {date} | {author} | Initial version |
