---
template: credential-rotation
version: "1.0"
category: security
---

# Credential Rotation Procedure: {credential_name}

## Credential Information

| Property | Value |
|----------|-------|
| **Credential** | {credential_name} |
| **Type** | {OAuth2 / API Key / Database / etc} |
| **Service** | {service_name} |
| **Last Rotated** | {date} |
| **Rotation Frequency** | {90 days / etc} |
| **Owner** | {owner} |

---

## Pre-Rotation Checklist

- [ ] Rotation window confirmed
- [ ] Stakeholders notified
- [ ] Rollback plan ready
- [ ] Access to both n8n and source service
- [ ] Test environment available

---

## Affected Workflows

| Workflow | Environment | Active | Notes |
|----------|-------------|--------|-------|
| {workflow} | {env} | Yes/No | {notes} |

---

## Rotation Procedure

### Step 1: Generate New Credential

**For API Key:**
1. Log into {service_name} admin console
2. Navigate to API Keys / Credentials
3. Generate new API key
4. Copy and securely store the new key
5. Note: Old key should remain active until rotation complete

**For OAuth2:**
1. Log into {service_name} admin console
2. Navigate to OAuth Applications
3. Generate new client secret (keep old active)
4. Copy and securely store new secret

### Step 2: Add New Credential to n8n

1. Open n8n UI
2. Navigate to Settings > Credentials
3. Click "Add Credential"
4. Select type: {credential_type}
5. Name: `{credential_name}_new` (temporary name)
6. Enter new credential details:
   ```
   {specific_fields_to_configure}
   ```
7. Click "Test Connection"
8. Verify: Connection successful
9. Save credential

### Step 3: Update Workflows (Development)

1. For each affected workflow in development:
   - Open workflow
   - Select node using credential
   - Change to new credential
   - Save workflow
   - Test execution

### Step 4: Test in Staging

1. Update staging workflows to new credential
2. Execute test cases:
   - [ ] Happy path execution
   - [ ] Error handling
   - [ ] All integration points
3. Verify all tests pass

### Step 5: Update Production

1. During maintenance window:
   - Update production workflows to new credential
   - Test each workflow
   - Monitor for errors

### Step 6: Verify and Clean Up

1. Monitor production for 24-48 hours
2. Verify no errors related to authentication
3. Confirm all workflows functioning normally

### Step 7: Deactivate Old Credential

1. In {service_name}:
   - Revoke/delete old API key/secret
2. In n8n:
   - Delete old credential
3. Rename new credential:
   - Remove `_new` suffix

---

## Verification Checklist

- [ ] New credential created in source service
- [ ] New credential added to n8n
- [ ] Connection test passed
- [ ] Development workflows updated
- [ ] Staging tests passed
- [ ] Production workflows updated
- [ ] Production monitoring clean for 24h
- [ ] Old credential deactivated
- [ ] Credential manifest updated
- [ ] Rotation logged

---

## Rollback Procedure

If issues occur during rotation:

1. Immediately revert workflows to old credential
2. Test reverted workflows
3. Investigate failure cause
4. Do NOT deactivate old credential until resolved

---

## Communication

### Pre-Rotation (24h before)
```
Subject: Scheduled Credential Rotation: {credential_name}

Team,

We will be rotating the {credential_name} credential on {date} at {time}.

Impact: Minimal - workflows will use new credential
Action Required: None

Contact {owner} with questions.
```

### Post-Rotation
```
Subject: Completed: Credential Rotation {credential_name}

Team,

Credential rotation completed successfully.

- All workflows using new credential
- Old credential deactivated
- Next rotation: {next_date}

No action required.
```

---

## Documentation Updates

After rotation, update:
- [ ] Credential Manifest
- [ ] Environment Configuration
- [ ] This rotation procedure (if process changed)

---

## Rotation Log

| Date | Performed By | Old Credential | New Credential | Status |
|------|--------------|----------------|----------------|--------|
| {date} | {person} | {old_id} | {new_id} | Success |

---

## Emergency Contact

If issues during rotation:
- Primary: {name} - {contact}
- Backup: {name} - {contact}
