---
name: chart-generation
description: Data visualization and chart generation. Covers Chart.js, D3.js, Plotly, Recharts, graph types, interactive charts, responsive design.
---

# Chart Generation

## When to Apply
Use this skill when creating data visualizations, charts, graphs, or interactive dashboards. Applies to reports, analytics pages, real-time monitoring, and data exploration tools.

## Core Concepts
- **Chart Libraries**: Chart.js (simple), D3.js (custom), Plotly (scientific), Recharts (React)
- **Chart Types**: Line, bar, pie, scatter, heatmap, treemap, sankey, gauge
- **Interactivity**: Tooltips, zoom, pan, click handlers, crossfiltering
- **Responsiveness**: Viewport-based sizing, touch support, adaptive legends
- **Data Formats**: Arrays, time series, hierarchical, streaming

## Implementation
```typescript
// Recharts pattern (React)
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

function DataChart({ data, dataKey, color }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Chart.js pattern (vanilla)
const chart = new Chart(ctx, {
  type: "bar",
  data: { labels, datasets: [{ data, backgroundColor }] },
  options: { responsive: true, maintainAspectRatio: false },
})
```

## Best Practices
- Choose chart type based on data relationship (comparison, distribution, composition, trend)
- Use colorblind-friendly palettes
- Provide alt text and ARIA labels for accessibility
- Debounce chart updates during rapid data changes
- Lazy-load heavy chart libraries (D3, Plotly)
- Export charts as PNG/SVG for reports
