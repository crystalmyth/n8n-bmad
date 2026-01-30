---
template: post-mortem
version: "1.0"
category: operations
---

# Post-Mortem: {incident_title}

## Document Information

| Field | Value |
|-------|-------|
| **Incident ID** | INC-{id} |
| **Post-Mortem Date** | {date} |
| **Author** | {author} |
| **Attendees** | {attendee_list} |
| **Status** | Draft / Final |

---

## Executive Summary

{2-3 sentence summary of the incident, impact, and key learnings.}

---

## Incident Summary

### What Happened
{Brief description of the incident.}

### Impact
| Metric | Value |
|--------|-------|
| Duration | {duration} |
| Users Affected | {number} |
| Revenue Impact | {amount} |
| SLA Breach | Yes / No |

### Timeline (Key Events)
| Time | Event |
|------|-------|
| {time} | First symptoms observed |
| {time} | Alert triggered |
| {time} | Incident declared |
| {time} | Root cause identified |
| {time} | Fix deployed |
| {time} | Full recovery |

---

## Root Cause Analysis

### Root Cause
{Clear statement of the root cause.}

### Technical Details
{Detailed technical explanation of what went wrong.}

### Why Did This Happen?

**5 Whys Analysis:**
1. **Why did {symptom} occur?**
   Because {reason_1}

2. **Why did {reason_1} happen?**
   Because {reason_2}

3. **Why did {reason_2} happen?**
   Because {reason_3}

4. **Why did {reason_3} happen?**
   Because {reason_4}

5. **Why did {reason_4} happen?**
   Because {root_cause}

### Contributing Factors
- {factor_1}
- {factor_2}
- {factor_3}

---

## Response Analysis

### What Went Well
- {positive_1}
- {positive_2}
- {positive_3}

### What Went Poorly
- {negative_1}
- {negative_2}
- {negative_3}

### Where We Got Lucky
- {lucky_1}
- {lucky_2}

---

## Lessons Learned

### Key Takeaways
1. {lesson_1}
2. {lesson_2}
3. {lesson_3}

### Process Improvements
- {improvement_1}
- {improvement_2}

---

## Action Items

### Immediate (This Week)
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {action} | {owner} | {date} | Open |

### Short-Term (This Month)
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {action} | {owner} | {date} | Open |

### Long-Term (This Quarter)
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {action} | {owner} | {date} | Open |

---

## Prevention

### How Could This Have Been Prevented?
{Describe preventive measures that would have avoided this incident.}

### Detection Improvements
{How can we detect this faster in the future?}

### Monitoring Gaps
| Gap | Proposed Solution | Priority |
|-----|-------------------|----------|
| {gap} | {solution} | {P1/P2/P3} |

---

## Supporting Information

### Related Incidents
- INC-{related_id}: {brief_description}

### Documentation Updates Needed
- [ ] Runbook: {runbook_name}
- [ ] Architecture doc: {doc_name}
- [ ] Monitoring: {dashboard}

### Training Needs
- {training_item}

---

## Appendix

### Detailed Timeline
{Full detailed timeline with all events}

### Metrics and Graphs
{Include relevant monitoring graphs}

### Communication Log
{Summary of communications during incident}

---

## Sign-Off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Incident Commander | | | |
| Engineering Manager | | | |
| Product Owner | | | |
