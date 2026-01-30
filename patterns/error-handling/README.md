# Error Handling Patterns

This directory contains reusable n8n workflow patterns for robust error handling.

## Available Patterns

| Pattern | File | Description |
|---------|------|-------------|
| Retry with Backoff | `retry-with-backoff.json` | Exponential backoff for transient failures |
| Dead Letter Queue | `dead-letter-queue.json` | Capture and process failed items |
| Circuit Breaker | `circuit-breaker.json` | Prevent cascade failures |
| Error Notification | `error-notification.json` | Alert on workflow failures |

## When to Use

### Retry with Backoff
- Transient network failures
- API rate limiting (429 errors)
- Temporary service unavailability
- Database connection timeouts

### Dead Letter Queue
- Batch processing where some items may fail
- When failed items need manual review
- When you can't lose data even on error
- Asynchronous processing with guaranteed delivery

### Circuit Breaker
- Calling unreliable external services
- When failures can cascade to other systems
- High-volume workflows that could overwhelm failed services
- When you need graceful degradation

### Error Notification
- Production workflows that need monitoring
- Critical business processes
- When immediate human attention is required
- Compliance/audit requirements

## Integration

These patterns can be combined:

```
Trigger → Process → [Retry with Backoff]
                         ↓ (on failure after retries)
                    [Dead Letter Queue]
                         ↓
                    [Error Notification]
```

## Usage

1. Import the pattern JSON file into n8n
2. Customize for your use case:
   - Adjust retry counts and delays
   - Configure notification channels
   - Set circuit breaker thresholds
3. Integrate into your workflow

## Best Practices

1. **Always have an error strategy** - Don't let errors fail silently
2. **Log meaningful context** - Include execution ID, input data, error details
3. **Set appropriate timeouts** - Don't wait forever for failed services
4. **Monitor error rates** - Set up alerts for unusual error patterns
5. **Test error paths** - Verify error handling works as expected
