---
template: environment-config
version: "1.0"
category: n8n-specific
---

# Environment Configuration: {environment_name}

## Environment Overview

| Property | Value |
|----------|-------|
| **Environment** | {Development/Staging/Production} |
| **Instance URL** | {url} |
| **Version** | {n8n_version} |
| **Owner** | {owner} |
| **Last Updated** | {date} |

---

## n8n Configuration

### General Settings
| Setting | Value | Notes |
|---------|-------|-------|
| `N8N_HOST` | {host} | |
| `N8N_PORT` | {port} | |
| `N8N_PROTOCOL` | {http/https} | |
| `WEBHOOK_URL` | {url} | External webhook URL |
| `N8N_TIMEZONE` | {timezone} | |

### Database
| Setting | Value |
|---------|-------|
| `DB_TYPE` | {postgres/mysql/sqlite} |
| `DB_HOST` | {host} |
| `DB_PORT` | {port} |
| `DB_NAME` | {database} |
| `DB_USER` | {user} |

### Execution Settings
| Setting | Value | Purpose |
|---------|-------|---------|
| `EXECUTIONS_DATA_SAVE_ON_ERROR` | {all/none} | |
| `EXECUTIONS_DATA_SAVE_ON_SUCCESS` | {all/none} | |
| `EXECUTIONS_DATA_SAVE_ON_PROGRESS` | {true/false} | |
| `EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS` | {true/false} | |
| `EXECUTIONS_DATA_PRUNE` | {true/false} | |
| `EXECUTIONS_DATA_MAX_AGE` | {hours} | |

### Security Settings
| Setting | Value |
|---------|-------|
| `N8N_ENCRYPTION_KEY` | {configured/not_configured} |
| `N8N_BASIC_AUTH_ACTIVE` | {true/false} |
| `N8N_JWT_AUTH_ACTIVE` | {true/false} |

---

## Credentials Configured

| Credential | Type | Status | Last Verified |
|------------|------|--------|---------------|
| {name} | {type} | Active/Expired | {date} |

---

## Workflows Deployed

| Workflow | ID | Active | Last Modified |
|----------|----|----|---------------|
| {name} | {id} | Yes/No | {date} |

---

## Integration Endpoints

### External Services
| Service | Endpoint | Status |
|---------|----------|--------|
| {service} | {endpoint} | Reachable/Unreachable |

### Databases
| Database | Connection | Status |
|----------|------------|--------|
| {db_name} | {connection_string_masked} | Connected |

---

## Environment Variables

### Required
```bash
# Core
N8N_HOST=
N8N_PORT=
N8N_PROTOCOL=
WEBHOOK_URL=

# Database
DB_TYPE=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASS=

# Security
N8N_ENCRYPTION_KEY=
```

### Optional
```bash
# Execution
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168

# Logging
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console
```

---

## Access Control

### Users
| User | Role | Access Level |
|------|------|--------------|
| {user} | {Admin/Editor/Viewer} | {level} |

### API Keys
| Key Name | Purpose | Expiry |
|----------|---------|--------|
| {name} | {purpose} | {date} |

---

## Monitoring

### Health Check
- URL: `{url}/healthz`
- Expected Response: `{"status":"ok"}`

### Metrics Endpoint
- URL: `{url}/metrics`

### Alerts Configured
| Alert | Condition | Notification |
|-------|-----------|--------------|
| {alert} | {condition} | {method} |

---

## Backup Configuration

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Workflows | {frequency} | {retention} | {location} |
| Database | {frequency} | {retention} | {location} |
| Credentials | {frequency} | {retention} | {location} |

---

## Network Configuration

### Firewall Rules
| Rule | Source | Destination | Port | Action |
|------|--------|-------------|------|--------|
| {rule} | {source} | {dest} | {port} | Allow/Deny |

### DNS
| Record | Type | Value |
|--------|------|-------|
| {hostname} | {A/CNAME} | {value} |

---

## Differences from Other Environments

### vs Production
| Setting | This Env | Production |
|---------|----------|------------|
| {setting} | {value} | {prod_value} |

### vs Staging
| Setting | This Env | Staging |
|---------|----------|---------|
| {setting} | {value} | {stg_value} |

---

## Maintenance Notes

### Scheduled Maintenance
- {maintenance_schedule}

### Known Issues
- {known_issue}

### Upcoming Changes
- {planned_change}

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| {date} | Initial setup | {author} |
