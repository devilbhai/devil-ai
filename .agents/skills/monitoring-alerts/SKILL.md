---
name: monitoring-alerts
description: System monitoring and alerting. Covers Prometheus, Grafana, uptime monitoring, log aggregation, alert rules, incident response.
---

# Monitoring & Alerts

## When to Apply
Use this skill when setting up monitoring infrastructure, configuring alerting systems, or designing incident response procedures. Apply for Prometheus/Grafana setup, log aggregation, and alerting workflows.

## Core Concepts
- Metrics Collection: Prometheus scraping, pushgateway
- Visualization: Grafana dashboards, panels, queries
- Alerting: AlertManager, alert rules, notification channels
- Log Aggregation: ELK stack, Loki, structured logging
- Uptime Monitoring: Health checks, response time tracking
- Incident Response: Severity levels, escalation procedures
- SLIs/SLOs: Service Level Indicators and Objectives
- Trace Distribution: Distributed tracing with Jaeger/Tempo

## Implementation
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'app'
    static_configs:
      - targets: ['localhost:8080']

# alert.rules.yml
groups:
  - name: alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High CPU usage on {{ $labels.instance }}
          
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 20
        for: 10m
        labels:
          severity: critical
```

```bash
# Docker compose for monitoring stack
docker-compose up -d prometheus grafana alertmanager

# Grafana dashboard import
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @dashboard.json

# Test alert
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{"labels":{"alertname":"TestAlert"}}]'
```

## Best Practices
- Start with basic health checks, expand gradually
- Set meaningful alert thresholds with appropriate durations
- Use severity levels (critical, warning, info) consistently
- Implement runbooks for common alerts
- Review and tune alert rules regularly to reduce noise
- Use labels effectively for filtering and grouping
- Monitor both infrastructure and application metrics
- Set up escalation policies for different severity levels
- Use silence/mute windows for planned maintenance
- Document monitoring setup and alert procedures
- Test alerting channels regularly
- Keep dashboards focused and actionable