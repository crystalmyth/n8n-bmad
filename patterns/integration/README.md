# Integration Patterns

This directory contains reusable n8n workflow patterns for system integrations.

## Available Patterns

| Pattern | File | Description |
|---------|------|-------------|
| API Orchestration | `api-orchestration.json` | Compose multiple API calls |
| Webhook Receiver | `webhook-receiver.json` | Handle incoming webhooks |
| Database Sync | `database-sync.json` | Synchronize data sources |
| File Processing | `file-processing.json` | Process uploaded files |

## When to Use

### API Orchestration
- Aggregating data from multiple sources
- Multi-step API workflows
- Service composition
- Data enrichment from multiple APIs

### Webhook Receiver
- Receiving events from external services
- Processing real-time notifications
- Event-driven architectures
- Third-party integrations (Stripe, GitHub, etc.)

### Database Sync
- Keeping systems in sync
- Data migration
- Periodic data refresh
- Master data management

### File Processing
- Processing uploaded documents
- ETL from file sources
- Report generation
- Data import/export

## Best Practices

1. **Validate inputs** - Always validate incoming data
2. **Handle errors gracefully** - Don't let one failure break everything
3. **Use timeouts** - Prevent hanging on slow services
4. **Log appropriately** - Track what happened for debugging
5. **Secure credentials** - Use n8n's credential store
