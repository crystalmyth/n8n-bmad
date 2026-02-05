# Project Context: ${PROJECT_NAME}

> Generated: ${GENERATED_DATE}
> n8n-BMAD Version: ${FRAMEWORK_VERSION}
> Scale Profile: ${SCALE_PROFILE}

## Overview

**Project Name:** ${PROJECT_NAME}
**Description:** ${PROJECT_DESCRIPTION}
**Status:** ${PROJECT_STATUS}

## n8n Environment

| Setting | Value |
|---------|-------|
| n8n Version | ${N8N_VERSION} |
| Deployment | ${DEPLOYMENT_TYPE} |
| Instance URL | ${N8N_INSTANCE_URL} |
| Environment | ${ENVIRONMENT} |

## Existing Workflows

### Production Workflows
${PRODUCTION_WORKFLOWS}

### Development Workflows
${DEVELOPMENT_WORKFLOWS}

### Error Handling Workflows
${ERROR_WORKFLOWS}

## Credential Inventory

| Name | Type | Environment | Last Rotated |
|------|------|-------------|--------------|
${CREDENTIAL_INVENTORY}

## Integration Landscape

### Connected Services
${CONNECTED_SERVICES}

### API Dependencies
| Service | Version | Rate Limit | Auth Type |
|---------|---------|------------|-----------|
${API_DEPENDENCIES}

### Webhooks (Inbound)
| Endpoint | Source | Auth | Purpose |
|----------|--------|------|---------|
${INBOUND_WEBHOOKS}

### Webhooks (Outbound)
| Target | Trigger | Purpose |
|--------|---------|---------|
${OUTBOUND_WEBHOOKS}

## Data Flows

### Primary Data Sources
${DATA_SOURCES}

### Data Destinations
${DATA_DESTINATIONS}

### Data Transformations
${DATA_TRANSFORMATIONS}

## Constraints & Requirements

### Rate Limits
${RATE_LIMITS}

### Data Residency
${DATA_RESIDENCY}

### Compliance Frameworks
${COMPLIANCE_FRAMEWORKS}

### SLAs
${SLAS}

## Technical Stack

### Primary Technologies
${TECH_STACK}

### n8n Nodes in Use
${NODES_IN_USE}

### Custom Code
${CUSTOM_CODE_NOTES}

## Team & Ownership

| Role | Owner | Contact |
|------|-------|---------|
${TEAM_OWNERSHIP}

## Project Documents

| Document | Location | Status |
|----------|----------|--------|
| PRD | ${PRD_LOCATION} | ${PRD_STATUS} |
| Architecture | ${ARCH_LOCATION} | ${ARCH_STATUS} |
| Backlog | ${BACKLOG_LOCATION} | ${BACKLOG_STATUS} |

## Notes

${PROJECT_NOTES}

---

*This context file helps AI assistants understand your project. Keep it updated as your project evolves.*

---

## How to Use This File

1. **For AI Assistants**: This file provides context about the project. Reference it when helping with implementation decisions.

2. **For Developers**: Update this file when:
   - Adding new integrations
   - Changing data flows
   - Rotating credentials
   - Modifying compliance requirements

3. **For Automation**: This file can be auto-generated with:
   ```bash
   n8n-bmad context generate
   ```

## Template Variables

When generating, replace these placeholders:

- `${PROJECT_NAME}` - Your project name
- `${N8N_VERSION}` - n8n version (e.g., "1.25.0")
- `${DEPLOYMENT_TYPE}` - "Cloud" or "Self-hosted"
- `${ENVIRONMENT}` - "development", "staging", "production"
- `${SCALE_PROFILE}` - "quick", "standard", "enterprise"

Lists should be formatted as:
- Markdown tables for structured data
- Bullet lists for simple enumerations
- Empty sections can use "None" or "N/A"
