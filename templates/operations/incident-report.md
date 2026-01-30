---
template: incident-report
version: "1.0"
category: operations
---

# Incident Report

## Incident Summary

| Field | Value |
|-------|-------|
| **Incident ID** | INC-{id} |
| **Title** | {incident_title} |
| **Severity** | SEV1 / SEV2 / SEV3 / SEV4 |
| **Status** | Open / Investigating / Mitigated / Resolved / Closed |
| **Incident Commander** | {name} |
| **Date Opened** | {datetime} |
| **Date Resolved** | {datetime} |

---

## Impact Summary

### Systems Affected
- {system_1}
- {system_2}

### User Impact
{Description of impact on users/business.}

### Scope
- Users affected: {number/percentage}
- Duration: {duration}
- Data impact: {none/partial/full}

---

## Timeline

| Time | Event | Actor |
|------|-------|-------|
| {time} | Incident detected via {method} | {system/person} |
| {time} | On-call alerted | {system} |
| {time} | Incident acknowledged | {person} |
| {time} | Investigation started | {person} |
| {time} | Root cause identified | {person} |
| {time} | Mitigation implemented | {person} |
| {time} | Service restored | {person} |
| {time} | Incident resolved | {person} |

---

## Detection

### How was the incident detected?
{Alert / User report / Monitoring / Other}

### Detection Details
{Describe how the incident was first noticed.}

### Time to Detection
{Duration from incident start to detection}

---

## Root Cause

### Summary
{Brief description of the root cause.}

### Technical Details
{Detailed technical explanation.}

### Contributing Factors
1. {factor_1}
2. {factor_2}
3. {factor_3}

---

## Resolution

### Immediate Actions Taken
1. {action_1}
2. {action_2}
3. {action_3}

### Resolution Details
{Describe how the incident was resolved.}

### Verification
{How was resolution verified?}

---

## Lessons Learned

### What Went Well
- {positive_1}
- {positive_2}

### What Could Be Improved
- {improvement_1}
- {improvement_2}

---

## Action Items

| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| {action} | {owner} | P1/P2/P3 | {date} | Open |

### Preventive Actions
| Action | Description | Owner | Due Date |
|--------|-------------|-------|----------|
| {action} | {description} | {owner} | {date} |

---

## Communication Log

| Time | Channel | Message | Sender |
|------|---------|---------|--------|
| {time} | {Slack/Email/etc} | {summary} | {sender} |

---

## Metrics

| Metric | Value |
|--------|-------|
| Time to Detection (TTD) | {duration} |
| Time to Acknowledge (TTA) | {duration} |
| Time to Mitigate (TTM) | {duration} |
| Time to Resolve (TTR) | {duration} |
| Total Incident Duration | {duration} |

---

## Attachments

- [ ] Error logs
- [ ] Screenshots
- [ ] Monitoring graphs
- [ ] Communication transcripts

---

## Approval

| Role | Name | Date |
|------|------|------|
| Incident Commander | | |
| Engineering Lead | | |
