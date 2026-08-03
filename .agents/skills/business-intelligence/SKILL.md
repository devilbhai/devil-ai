---
name: business-intelligence
description: BI systems. Dashboard design, KPI tracking, report generation, data visualization.
---

# Business Intelligence

## When to Apply
Use this skill when building business intelligence systems, including dashboards, KPI tracking, automated reports, data visualization, and executive reporting.

## Core Concepts
- **Dashboard Design**: Layout principles, information hierarchy, responsive design, real-time updates
- **KPI Tracking**: Metric definitions, targets, thresholds, trend indicators, drill-down analysis
- **Report Generation**: Automated scheduling, PDF/Excel export, email distribution, template engines
- **Data Visualization**: Chart selection, color theory, storytelling, interactive elements
- **ETL Pipelines**: Data extraction, transformation, loading, scheduling, monitoring
- **Data Modeling**: Star schema, snowflake schema, dimensional modeling, slowly changing dimensions
- **Tools**: Apache Superset, Metabase, Grafana, Tableau, Power BI, custom React dashboards

## Implementation
```python
import pandas as pd
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

@dataclass
class KPI:
    name: str
    value: float
    target: Optional[float]
    previous_value: Optional[float]
    unit: str = ""
    format: str = "number"

class DashboardBuilder:
    def __init__(self, data_source):
        self.data_source = data_source

    def calculate_kpis(
        self, metrics: List[Dict], period: str = "30d"
    ) -> List[KPI]:
        kpis = []
        end_date = datetime.now()
        start_date = end_date - self._parse_period(period)

        for metric in metrics:
            current = self._query_metric(metric["name"], start_date, end_date)
            previous = self._query_metric(
                metric["name"],
                start_date - (end_date - start_date),
                start_date
            )

            kpi = KPI(
                name=metric["name"],
                value=current,
                target=metric.get("target"),
                previous_value=previous,
                unit=metric.get("unit", ""),
                format=metric.get("format", "number")
            )
            kpis.append(kpi)

        return kpis

    def _query_metric(self, name: str, start: datetime, end: datetime) -> float:
        query = f"""
            SELECT SUM(value) as total
            FROM metrics
            WHERE name = '{name}'
              AND timestamp BETWEEN '{start}' AND '{end}'
        """
        result = self.data_source.execute(query)
        return result[0]["total"] if result else 0

    def _parse_period(self, period: str) -> timedelta:
        unit = period[-1]
        value = int(period[:-1])
        if unit == 'd':
            return timedelta(days=value)
        elif unit == 'w':
            return timedelta(weeks=value)
        elif unit == 'm':
            return timedelta(days=value * 30)
        return timedelta(days=30)

    def generate_chart_config(self, chart_type: str, data: pd.DataFrame) -> Dict:
        configs = {
            "line": {
                "type": "line",
                "data": {
                    "labels": data["date"].tolist(),
                    "datasets": [{
                        "label": data.columns[1],
                        "data": data.iloc[:, 1].tolist(),
                        "borderColor": "#3B82F6",
                        "tension": 0.4
                    }]
                },
                "options": {
                    "responsive": True,
                    "plugins": {
                        "legend": {"position": "top"}
                    },
                    "scales": {
                        "y": {"beginAtZero": False}
                    }
                }
            },
            "bar": {
                "type": "bar",
                "data": {
                    "labels": data["category"].tolist(),
                    "datasets": [{
                        "label": "Count",
                        "data": data["value"].tolist(),
                        "backgroundColor": [
                            "#3B82F6", "#10B981", "#F59E0B",
                            "#EF4444", "#8B5CF6", "#EC4899"
                        ]
                    }]
                }
            },
            "pie": {
                "type": "pie",
                "data": {
                    "labels": data["label"].tolist(),
                    "datasets": [{
                        "data": data["value"].tolist(),
                        "backgroundColor": [
                            "#3B82F6", "#10B981", "#F59E0B",
                            "#EF4444", "#8B5CF6"
                        ]
                    }]
                }
            }
        }
        return configs.get(chart_type, configs["bar"])

class ReportGenerator:
    def __init__(self, template_dir: str = "./templates"):
        self.template_dir = template_dir

    def generate_daily_report(
        self, data: Dict, date: Optional[str] = None
    ) -> str:
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        report = f"""
# Daily Business Report - {date}

## Executive Summary
- **Revenue**: ${data['revenue']:,.2f} ({self._change_indicator(data['revenue_change'])})
- **Active Users**: {data['active_users']:,} ({self._change_indicator(data['users_change'])})
- **Conversion Rate**: {data['conversion_rate']:.1%} ({self._change_indicator(data['conversion_change'])})

## Key Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Revenue | ${data['revenue']:,.2f} | ${data['revenue_target']:,.2f} | {'✅' if data['revenue'] >= data['revenue_target'] else '❌'} |
| Users | {data['active_users']:,} | {data['users_target']:,} | {'✅' if data['active_users'] >= data['users_target'] else '❌'} |
| Orders | {data['orders']:,} | {data['orders_target']:,} | {'✅' if data['orders'] >= data['orders_target'] else '❌'} |

## Top Performing Products
{self._format_table(data['top_products'])}

## Alerts
{self._format_alerts(data.get('alerts', []))}
"""
        return report

    def _change_indicator(self, change: float) -> str:
        if change > 0:
            return f"↑ {abs(change):.1f}%"
        elif change < 0:
            return f"↓ {abs(change):.1f}%"
        return "→ 0%"

    def _format_table(self, data: List[Dict]) -> str:
        if not data:
            return "No data available"

        headers = data[0].keys()
        rows = [list(d.values()) for d in data]

        header_line = "| " + " | ".join(headers) + " |"
        separator = "| " + " | ".join(["---"] * len(headers)) + " |"
        body_lines = ["| " + " | ".join(str(v) for v in row) + " |" for row in rows]

        return '\n'.join([header_line, separator] + body_lines)

    def _format_alerts(self, alerts: List[Dict]) -> str:
        if not alerts:
            return "No alerts"

        alert_lines = []
        for alert in alerts:
            icon = "🔴" if alert["severity"] == "critical" else "🟡" if alert["severity"] == "warning" else "ℹ️"
            alert_lines.append(f"- {icon} **{alert['title']}**: {alert['message']}")

        return '\n'.join(alert_lines)

    def export_to_excel(self, data: Dict[str, pd.DataFrame], filename: str):
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            for sheet_name, df in data.items():
                df.to_excel(writer, sheet_name=sheet_name, index=False)

    def export_to_pdf(self, content: str, filename: str):
        from weasyprint import HTML
        HTML(string=content).write_pdf(filename)

class AlertManager:
    def __init__(self, rules: List[Dict]):
        self.rules = rules

    def evaluate(self, kpis: List[KPI]) -> List[Dict]:
        alerts = []

        for kpi in kpis:
            for rule in self.rules:
                if rule["metric"] == kpi.name:
                    if "threshold" in rule:
                        if kpi.value > rule["threshold"]:
                            alerts.append({
                                "severity": rule.get("severity", "info"),
                                "title": f"{kpi.name} exceeds threshold",
                                "message": f"{kpi.name} is {kpi.value}{kpi.unit}, "
                                          f"above threshold of {rule['threshold']}{kpi.unit}",
                                "metric": kpi.name,
                                "value": kpi.value
                            })

                    if "decrease_pct" in rule and kpi.previous_value:
                        change = (kpi.value - kpi.previous_value) / kpi.previous_value
                        if change < -rule["decrease_pct"] / 100:
                            alerts.append({
                                "severity": rule.get("severity", "warning"),
                                "title": f"{kpi.name} significant decrease",
                                "message": f"{kpi.name} decreased by {abs(change):.1%}",
                                "metric": kpi.name,
                                "value": kpi.value
                            })

        return alerts

# Usage
builder = DashboardBuilder(data_source)
kpis = builder.calculate_kpis([
    {"name": "revenue", "target": 100000, "unit": "$"},
    {"name": "active_users", "target": 10000},
    {"name": "conversion_rate", "target": 0.05, "format": "percent"}
])

report_gen = ReportGenerator()
report = report_gen.generate_daily_report({
    "revenue": 125000,
    "revenue_target": 100000,
    "revenue_change": 12.5,
    "active_users": 15000,
    "users_target": 10000,
    "users_change": 8.2,
    "conversion_rate": 0.062,
    "conversion_target": 0.05,
    "conversion_change": -2.1,
    "orders": 3200,
    "orders_target": 2500,
    "top_products": [
        {"Product": "Pro Plan", "Revenue": "$45,000", "Growth": "+15%"},
        {"Product": "Enterprise", "Revenue": "$38,000", "Growth": "+22%"}
    ]
})
```

## Best Practices
- Design dashboards with the "above the fold" principle — most important KPIs at top
- Use consistent color coding: green = positive, red = negative, gray = neutral
- Provide drill-down capability from summary to detailed views
- Automate report generation and distribution on a fixed schedule
- Set up alert thresholds based on historical data and business context
- Use responsive design for dashboards that work on all devices
- Document metric definitions and calculation methods
- Cache expensive queries and refresh at appropriate intervals
