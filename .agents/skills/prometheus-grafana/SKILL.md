---
name: prometheus-grafana
description: Monitoring and observability with Prometheus and Grafana - metrics, alerts, dashboards.
---

# Prometheus & Grafana

## When to Apply
Use this skill when setting up monitoring, creating dashboards, configuring alerts, or troubleshooting system metrics.

## Core Concepts
- Prometheus metrics collection and storage
- PromQL query language
- Grafana dashboard creation
- Alert manager configuration
- Service discovery
- Exporters (node, mysql, redis, etc.)
- Long-term storage (Thanos, Cortex)

## Best Practices
- Use labels consistently across services
- Keep metric names descriptive
- Set appropriate scrape intervals
- Use recording rules for expensive queries
- Alert on symptoms, not causes
- Dashboard as code (JSON provisioning)
- Use variables for dashboard reusability

## PromQL Examples
```promql
# CPU usage rate
rate(cpu_seconds_total[5m])

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Request rate by status
sum(rate(http_requests_total[5m])) by (status)

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Alert Rules
```yaml
groups:
  - name: alerts
    rules:
      - alert: HighCPU
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
```

## Dashboard Best Practices
- Use row panels for organization
- Add variables for environment selection
- Include text panels for context
- Use consistent color coding
- Set appropriate time ranges
- Export dashboards as JSON for version control
