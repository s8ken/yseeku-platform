# ADR 002: Prometheus for Metrics Collection

## Status
Accepted

## Context
Need production-grade monitoring for workflows, agents, trust scores, and HTTP requests.

## Decision
Use Prometheus client library for metrics collection with standard metric types.

### Metric Types Used
- **Counters**: Total operations (receipts, failures, requests)
- **Histograms**: Duration and size distributions
- **Gauges**: Current state (active workflows, agents)

## Consequences

### Positive
- Industry standard, wide tooling support
- Native Kubernetes/Grafana integration
- Efficient time-series storage
- Powerful query language (PromQL)

### Negative
- Pull-based model requires /metrics endpoint
- Additional memory for metric storage

## Implementation
See packages/core/src/monitoring/metrics.ts

