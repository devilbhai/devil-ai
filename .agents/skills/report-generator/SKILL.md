---
name: report-generator
description: Automated report generation. Covers PDF reports, HTML reports, charts integration, templates, scheduled reports, email delivery.
---

# Report Generator

## When to Apply
Use this skill when generating automated reports in any format (PDF, HTML, CSV, Excel). Applies to periodic reports, data summaries, analytics dashboards, and scheduled report delivery.

## Core Concepts
- **Report Types**: PDF, HTML, CSV, Excel, JSON
- **Data Sources**: Database queries, API responses, file imports
- **Templates**: Reusable report layouts with dynamic data injection
- **Charts Integration**: Embed charts and visualizations into reports
- **Scheduling**: Cron-based or event-driven report generation
- **Delivery**: Email attachment, file system, API endpoint

## Implementation
```typescript
// Report generation pattern
interface ReportConfig {
  title: string
  template: string
  data: Record<string, unknown>
  format: "pdf" | "html" | "csv" | "excel"
  schedule?: string // cron expression
  delivery?: DeliveryConfig
}

// Template rendering
function generateReport(config: ReportConfig): Promise<Buffer> {
  const template = loadTemplate(config.template)
  const html = render(template, config.data)
  return convertToFormat(html, config.format)
}

// Scheduled report execution
function scheduleReport(config: ReportConfig): void {
  if (!config.schedule) return
  cron.schedule(config.schedule, () => generateAndDeliver(config))
}
```

## Best Practices
- Use template inheritance for consistent branding
- Cache compiled templates for performance
- Validate data before rendering
- Support incremental report generation for large datasets
- Log report generation metrics (time, size, success/failure)
- Implement retry logic for delivery failures
