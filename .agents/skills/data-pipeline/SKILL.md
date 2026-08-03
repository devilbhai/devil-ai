---
name: data-pipeline
description: ETL/ELT pipeline design - data ingestion, transformation, validation, orchestration patterns.
---

# Data Pipeline

## When to Apply
Use this skill for designing data pipelines, ETL/ELT processes, data validation, or building data platforms.

## Core Concepts
- ETL vs ELT patterns
- Batch vs streaming processing
- Data validation and quality
- Schema evolution
- Error handling and retry
- Monitoring and alerting
- Data lineage tracking

## Best Practices
- Implement data quality checks
- Use schema-on-read for flexibility
- Design for idempotency
- Handle late-arriving data
- Implement dead letter queues
- Track data lineage
- Use incremental processing
- Monitor pipeline health

## ETL Pattern
```python
class ETLPipeline:
    def extract(self, source):
        """Extract data from source"""
        return source.read()

    def transform(self, data):
        """Apply transformations"""
        data = self.clean(data)
        data = self.enrich(data)
        data = self.validate(data)
        return data

    def load(self, data, target):
        """Load to target"""
        target.write(data)
```

## Data Validation
```python
def validate_data(df):
    checks = [
        Check(lambda df: df["amount"] > 0, "positive_amount"),
        Check(lambda df: df["user_id"].notna(), "valid_user"),
        Check(lambda df: df["date"] <= datetime.now(), "no_future_dates"),
    ]
    return all(check(df) for check in checks)
```

## Error Handling
```python
try:
    pipeline.run()
except PipelineError as e:
    log.error(f"Pipeline failed: {e}")
    send_alert("Pipeline failed", str(e))
    dead_letter_queue.push(failed_records)
finally:
    metrics.record_run(pipeline.status)
```

## Monitoring
- Track record counts
- Monitor processing time
- Alert on failures
- Dashboard for visibility
- Log all transformations
