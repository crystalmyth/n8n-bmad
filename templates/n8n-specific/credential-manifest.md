---
template: credential-manifest
version: "1.0"
category: n8n-specific
---

# Credential Manifest

## Document Information

| Field | Value |
|-------|-------|
| **Project** | {project_name} |
| **Environment** | {environment} |
| **Last Updated** | {date} |
| **Owner** | {owner} |

---

## Credential Inventory

### Active Credentials

| ID | Name | Type | Service | Workflows Using | Last Rotated | Next Rotation |
|----|------|------|---------|-----------------|--------------|---------------|
| 1 | {cred_name} | {OAuth2/API Key} | {service} | {workflow_list} | {date} | {date} |
| 2 | {cred_name} | {type} | {service} | {workflows} | {date} | {date} |

---

## Credential Details

### Credential: {credential_name}

| Property | Value |
|----------|-------|
| **ID** | {id} |
| **Type** | {type} |
| **Service** | {service_name} |
| **Owner** | {owner} |
| **Created** | {date} |
| **Last Rotated** | {date} |
| **Rotation Schedule** | {schedule} |

**Used In Workflows:**
- {workflow_1}
- {workflow_2}

**Scope/Permissions:**
- {permission_1}
- {permission_2}

**Notes:**
{Additional notes about this credential.}

---

### Credential: {credential_name}

| Property | Value |
|----------|-------|
| **ID** | {id} |
| **Type** | {type} |
| **Service** | {service_name} |

**Used In Workflows:**
- {workflow_list}

---

## Credential Types

### OAuth2 Credentials
| Name | Provider | Scopes | Token Expiry |
|------|----------|--------|--------------|
| {name} | {provider} | {scopes} | {expiry} |

### API Key Credentials
| Name | Service | Location | Rate Limits |
|------|---------|----------|-------------|
| {name} | {service} | Header/Query | {limits} |

### Database Credentials
| Name | Database | Type | Host |
|------|----------|------|------|
| {name} | {db_name} | {type} | {host} |

---

## Rotation Schedule

### Upcoming Rotations
| Credential | Type | Due Date | Owner | Status |
|------------|------|----------|-------|--------|
| {name} | {type} | {date} | {owner} | Pending |

### Rotation History
| Credential | Date | Performed By | Notes |
|------------|------|--------------|-------|
| {name} | {date} | {person} | {notes} |

---

## Rotation Procedures

### Standard API Key Rotation
1. Generate new key in service provider
2. Create new credential in n8n
3. Update workflow(s) to use new credential
4. Test workflow(s)
5. Deactivate old key in service provider
6. Remove old credential from n8n
7. Update this manifest

### OAuth2 Token Refresh
- Automatic via n8n OAuth2 handling
- Manual refresh if: {conditions}

---

## Access Control

### Credential Access
| Role | Can View | Can Use | Can Edit | Can Delete |
|------|----------|---------|----------|------------|
| Admin | Yes | Yes | Yes | Yes |
| Developer | Yes | Yes | No | No |
| Viewer | No | No | No | No |

### Service Account Owners
| Service | Owner | Backup Owner |
|---------|-------|--------------|
| {service} | {owner} | {backup} |

---

## Security Notes

### Best Practices
- [ ] All credentials stored in n8n credential store
- [ ] No credentials in workflow JSON
- [ ] No credentials in expressions
- [ ] Minimum required permissions granted
- [ ] Regular rotation scheduled

### Compliance Requirements
- {compliance_requirement_1}
- {compliance_requirement_2}

---

## Emergency Procedures

### Credential Compromise Response
1. Immediately disable compromised credential at source
2. Create new credential
3. Update workflows
4. Audit access logs
5. Document incident

### Emergency Contacts
| Service | Contact | Method |
|---------|---------|--------|
| {service} | {contact} | {phone/email} |

---

## Appendix

### Environment Mapping
| Credential | Development | Staging | Production |
|------------|-------------|---------|------------|
| {service} | {dev_cred} | {stg_cred} | {prod_cred} |
