---
template: prd
version: "1.0"
category: project
---

# Product Requirements Document (PRD)

## Document Information

| Field | Value |
|-------|-------|
| **Product Name** | {product_name} |
| **Version** | {version} |
| **Author** | {author} |
| **Date** | {date} |
| **Status** | Draft / In Review / Approved |

---

## Executive Summary

{Brief overview of the product/feature and its value proposition. 2-3 sentences.}

---

## Problem Statement

### Current State
{Describe the current situation and pain points.}

### Impact
{Quantify the impact of the current problem.}
- Time lost: {hours/week}
- Errors: {error_rate}
- Cost: {cost_impact}

---

## Goals and Objectives

### Primary Goal
{The main objective this product/feature aims to achieve.}

### Success Metrics
| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| {metric_1} | {current} | {target} | {method} |
| {metric_2} | {current} | {target} | {method} |

### Non-Goals
{Explicitly state what is NOT in scope.}
- {non_goal_1}
- {non_goal_2}

---

## User Personas

### Primary Persona: {persona_name}
- **Role:** {role}
- **Goals:** {goals}
- **Pain Points:** {pain_points}
- **Technical Proficiency:** {level}

### Secondary Persona: {persona_name}
- **Role:** {role}
- **Goals:** {goals}

---

## Requirements

### Functional Requirements

#### FR-001: {requirement_title}
- **Priority:** Must Have / Should Have / Could Have
- **Description:** {detailed_description}
- **Acceptance Criteria:**
  - [ ] Given {precondition}, when {action}, then {result}
  - [ ] {additional_criteria}

#### FR-002: {requirement_title}
- **Priority:** {priority}
- **Description:** {description}
- **Acceptance Criteria:**
  - [ ] {criteria}

### Non-Functional Requirements

#### Performance
- Maximum execution time: {time}
- Throughput: {volume} per {period}
- Availability: {percentage}

#### Security
- Authentication: {requirements}
- Data protection: {requirements}
- Compliance: {frameworks}

#### Scalability
- Expected growth: {projection}
- Scaling strategy: {approach}

---

## Workflow Specification

### Trigger
- **Type:** {webhook | schedule | manual | event}
- **Configuration:** {details}

### Data Sources
| Source | Type | Authentication | Data Format |
|--------|------|----------------|-------------|
| {source} | {API | Database | File} | {auth_type} | {format} |

### Data Destinations
| Destination | Type | Authentication | Data Format |
|-------------|------|----------------|-------------|
| {destination} | {type} | {auth_type} | {format} |

### Process Flow
```
1. {step_1}
2. {step_2}
3. {step_3}
```

### Error Handling
- **Retry Strategy:** {strategy}
- **Error Notification:** {method}
- **Fallback:** {fallback_approach}

---

## Dependencies

### External Systems
| System | Purpose | Owner | SLA |
|--------|---------|-------|-----|
| {system} | {purpose} | {owner} | {sla} |

### Credentials Required
| Credential | Type | Owner | Rotation |
|------------|------|-------|----------|
| {credential} | {type} | {owner} | {schedule} |

---

## Timeline and Milestones

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| Requirements Complete | {date} | Approved PRD |
| Development Complete | {date} | Working workflow |
| Testing Complete | {date} | Test report |
| Production Release | {date} | Live workflow |

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| {risk} | High/Medium/Low | High/Medium/Low | {mitigation} |

---

## Appendix

### Glossary
| Term | Definition |
|------|------------|
| {term} | {definition} |

### References
- {reference_1}
- {reference_2}

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Technical Lead | | | |
| Stakeholder | | | |
