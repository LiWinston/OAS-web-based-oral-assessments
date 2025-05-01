# Request Tracing System

## Architecture

The system uses TransmittableThreadLocal (TTL) to propagate trace context across different execution environments:

```
Request → TracingFilter → [TTL Context] → Async Operations → Database
```

### Key Components

- **TracingFilter**: Generates unique trace ID per request and adds to MDC + response headers
- **TraceContext**: Stores request metadata with TTL propagation
- **ReactorContextHook**: Ensures trace ID propagation in reactive streams
- **TtlExecutors**: Wraps thread pools for automatic context propagation

## Implementation

### Thread Context Propagation

```java
// All executors are automatically wrapped with TTL
executor.execute(() -> {
    // TraceID is automatically available here
    String traceId = TraceUtils.getTraceId();
    log.info("Current traceId: {}", traceId);
});
```

### Async Mechanisms Support

| Mechanism | Implementation | Automatic Propagation |
|-----------|----------------|----------------------|
| Thread Pool | TtlExecutors.getTtlExecutor() | ✓ |
| CompletableFuture | Uses wrapped executors | ✓ |
| @Async | AsyncTaskExecutor configured with TTL | ✓ |
| Reactor | ReactorContextHook + Scheduler hooks | ✓ |
| Timer Tasks | AsyncManager uses TTL-wrapped scheduledExecutorService | ✓ |

### Database Integration

Operation logs include `trace_id` column to correlate records with requests:

```sql
SELECT * FROM sys_oper_log WHERE trace_id = 'abc123'
```

## Advanced Usage

### Core API

```java
// Get current trace ID (available anywhere in the application)
String traceId = TraceUtils.getTraceId();

// For rare cases with non-TTL executors
executor.execute(TraceUtils.traceRunnable(() -> {
    // Manually wrapped task
}));
```

### Thread Pool Configuration

All thread pools are configured in `application.yml`:

```yaml
spring:
  thread-pool:
    # Default thread pool
    default:
      core-pool-size: 10
      max-pool-size: 50
      queue-capacity: 200
      keep-alive-seconds: 300
    # Async executor (@Async annotation)
    async:
      core-pool-size: 5
      max-pool-size: 10
      queue-capacity: 100
      keep-alive-seconds: 60
      thread-name-prefix: Async-
```

### Distributed Tracing

The system supports distributed tracing across service boundaries:

```
Service A → Service B → Service C
   │           │           │
   └─traceId───┴─traceId───┘
```

#### Client-Side Integration

The trace ID is included in responses as `X-Trace-ID` header:

```javascript
// Extract trace ID from response
const traceId = response.headers.get('X-Trace-ID');
```

#### Cross-Service Propagation

For rare cases, the client can include the trace ID to maintain correlation across service calls:

```javascript
// Include in subsequent requests to maintain trace across services
fetch('/api/data', {
  headers: { 'X-Trace-ID': traceId }
});
```

**Note**: Client-provided trace IDs are validated before acceptance:
- Must match pattern: `^[a-zA-Z0-9-]+$` (alphanumeric and hyphens only)
- Maximum length: 64 characters

Invalid trace IDs are rejected, and a new ID is generated automatically.

### Testing Endpoints

| Endpoint | Description | Method |
|----------|-------------|--------|
| `/api/tracing/thread-pool` | Tests thread pool propagation | POST |
| `/api/tracing/completable-future` | Tests CompletableFuture | POST |
| `/api/tracing/async-annotation` | Tests @Async methods | POST |
| `/api/tracing/reactor` | Tests Reactor streams | POST |
| `/api/tracing/test-all` | Tests all mechanisms together | GET |

## Troubleshooting

### Stack Overflow in Reactor

**Problem**: StackOverflowError with Reactor operations

**Solution**: ReactorContextHook uses ThreadLocal flag to prevent recursive calls:

```java
// From ReactorContextHook.java
if (Boolean.TRUE.equals(HOOK_EXECUTING.get())) {
    return source; // Prevent recursive hook execution
}
```

### Trace ID Not Available in Async Operations

**Problem**: Trace ID missing in async thread

**Solution**: Verify executor is properly wrapped with TTL:

```java
// Check thread pool configuration
Executor executor = TtlExecutors.getTtlExecutor(originalExecutor);
```

### UTF-8 Encoding Issues

**Problem**: Non-ASCII trace IDs corrupted in logs

**Solution**: Set proper file encoding in application.yml:

```yaml
logging:
  file:
    charset: UTF-8
``` 