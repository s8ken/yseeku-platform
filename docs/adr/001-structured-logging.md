# ADR 001: Structured Logging with Winston

## Status
Accepted

## Context
The platform initially used console.log for debugging, which is insufficient for production monitoring and troubleshooting.

## Decision
Adopt Winston for structured logging with JSON output in production and colorized output in development.

### Key Features
- Separate loggers for security, performance, and API events
- Automatic log rotation (5MB files, 5 file retention)
- Configurable log levels via LOG_LEVEL environment variable
- Rich metadata support for context-aware logging

## Consequences

### Positive
- Centralized log aggregation (ELK, Datadog compatible)
- Better debugging with structured metadata
- Security audit trail
- Performance metrics tracking

### Negative
- Slightly more verbose logging code
- Additional dependency (winston)

## Alternatives Considered
- Pino (faster but less features)
- Bunyan (deprecated)
- console.log (insufficient)

## Implementation
See packages/core/src/logger.ts

