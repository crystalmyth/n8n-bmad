# Scheduling Patterns

This directory contains reusable n8n workflow patterns for scheduled and triggered executions.

## Available Patterns

| Pattern | File | Description |
|---------|------|-------------|
| Cron Patterns | `cron-patterns.json` | Common scheduling configurations |
| Interval Trigger | `interval-trigger.json` | Fixed interval execution |
| Polling to Webhook | `polling-to-webhook.json` | Convert polling to event-driven |

## Common Cron Expressions

| Schedule | Cron | Description |
|----------|------|-------------|
| Every minute | `* * * * *` | Runs every minute |
| Every 5 minutes | `*/5 * * * *` | Runs every 5 minutes |
| Every hour | `0 * * * *` | Runs at minute 0 of every hour |
| Every day at midnight | `0 0 * * *` | Runs at 00:00 daily |
| Every Monday at 9am | `0 9 * * 1` | Runs at 09:00 on Mondays |
| First of month | `0 0 1 * *` | Runs at midnight on 1st of month |
| Weekdays at 8am | `0 8 * * 1-5` | Runs at 08:00 Monday-Friday |

## Best Practices

1. **Consider timezone** - Always set timezone explicitly
2. **Avoid overlapping** - Ensure execution completes before next trigger
3. **Use appropriate intervals** - Don't poll more than necessary
4. **Handle missed executions** - Plan for system downtime
5. **Monitor scheduling** - Alert on missed or failed schedules
