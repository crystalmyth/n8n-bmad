# n8n Credential Management Handler

> **Purpose:** Best practices for managing credentials in n8n workflows
> **Used by:** Security, DevOps, Developer agents
> **Focus:** Security, rotation, audit

## Credential Types Reference

### API Keys
```yaml
type: api_key
use_cases:
  - Third-party API authentication
  - Internal service access
  - Webhook validation
security_level: medium-high
rotation: quarterly
```

### OAuth2
```yaml
type: oauth2
use_cases:
  - Social login integrations
  - Google/Microsoft services
  - User-delegated access
security_level: high
rotation: token refresh automatic
```

### Basic Auth
```yaml
type: basic_auth
use_cases:
  - Legacy systems
  - Internal APIs
  - Simple authentication
security_level: medium
rotation: quarterly
```

### Database Credentials
```yaml
type: database
use_cases:
  - Direct database access
  - Data warehouse connections
security_level: critical
rotation: monthly
restrictions:
  - Use read-only where possible
  - Limit to required tables/schemas
```

## Naming Conventions

```yaml
format: "cred_{service}_{environment}_{purpose}"
examples:
  - cred_slack_prod_notifications
  - cred_stripe_staging_payments
  - cred_postgres_prod_readonly
  - cred_openai_shared_gpt4

environments:
  - dev
  - staging
  - prod

purposes:
  - readonly
  - admin
  - webhook
  - api
```

## Security Best Practices

### 1. Principle of Least Privilege
```yaml
rules:
  - Grant minimum permissions needed
  - Use read-only credentials where possible
  - Scope API keys to specific endpoints
  - Limit database access to required tables
```

### 2. Environment Separation
```yaml
rules:
  - Never use production credentials in development
  - Use separate credentials per environment
  - Different credential names per environment
  - Environment variable interpolation for flexibility
```

### 3. Rotation Policy
```yaml
schedule:
  critical: monthly
  high: quarterly
  medium: semi-annually
  low: annually

process:
  1. Generate new credential
  2. Update n8n credential store
  3. Test affected workflows
  4. Revoke old credential
  5. Document rotation in audit log
```

### 4. Audit Requirements
```yaml
track:
  - When credential was created
  - Who created it
  - Which workflows use it
  - Last rotation date
  - Access logs if available
```

## Credential Usage in Workflows

### Referencing Credentials
```javascript
// In node configuration (built-in)
{
  "credentials": {
    "slackApi": {
      "id": "123",
      "name": "cred_slack_prod_notifications"
    }
  }
}

// Cannot access credential values in expressions (by design)
// Use environment variables for values needed in expressions
```

### Environment Variables for Secrets
```javascript
// In expressions (for non-credential secrets)
{{ $env.API_ENDPOINT }}
{{ $env.WEBHOOK_SECRET }}

// NOT for credentials - use credential store
```

## Credential Audit Workflow

```yaml
name: wf_credential_audit
schedule: weekly
steps:
  - List all credentials (via n8n API)
  - Check last rotation date
  - Identify credentials approaching rotation
  - Check for unused credentials
  - Generate audit report
  - Send to security team
```

## Security Review Checklist

```markdown
## Credential Security Review

### Inventory
- [ ] All credentials are documented
- [ ] Naming convention followed
- [ ] Owner assigned to each credential

### Access Control
- [ ] Minimum necessary permissions
- [ ] Environment separation maintained
- [ ] No production credentials in dev workflows

### Rotation
- [ ] Rotation schedule defined
- [ ] Last rotation within policy window
- [ ] Rotation process documented

### Monitoring
- [ ] Usage logging enabled
- [ ] Anomaly detection configured
- [ ] Alert on suspicious access

### Compliance
- [ ] Credentials encrypted at rest
- [ ] No credentials in workflow JSON
- [ ] No credentials logged
```

## Common Issues & Solutions

### Issue: Credential Sprawl
```yaml
problem: Too many credentials, hard to manage
solution:
  - Audit and consolidate
  - Use shared credentials where appropriate
  - Implement naming conventions
  - Regular cleanup of unused credentials
```

### Issue: Hard-coded Values
```yaml
problem: API keys or secrets in workflow JSON
solution:
  - Move to credential store
  - Use environment variables
  - Scan workflows for exposed secrets
  - Add to .gitignore if exported
```

### Issue: No Rotation
```yaml
problem: Credentials never rotated
solution:
  - Implement rotation schedule
  - Automate rotation reminders
  - Create rotation workflow
  - Document rotation process
```

## Handler Usage

When reviewing credential security:
1. Audit existing credentials
2. Check naming conventions
3. Verify environment separation
4. Review permissions/scopes
5. Check rotation status
6. Generate recommendations
