---
name: airflow-pipeline
description: Workflow orchestration with Apache Airflow - DAGs, operators, sensors, task scheduling.
---

# Apache Airflow

## When to Apply
Use this skill for workflow orchestration, scheduling ETL jobs, data pipeline management, or dependency-based task execution.

## Core Concepts
- DAGs (Directed Acyclic Graphs)
- Operators (Python, Bash, SQL, S3, etc.)
- Sensors (file, HTTP, database)
- Task dependencies and branching
- XCom for task communication
- Connections and hooks
- Pools and queues
- Dynamic task mapping

## Best Practices
- Keep tasks atomic and idempotent
- Use variables for configuration
- Implement proper error handling
- Set appropriate retries and timeouts
- Use sensors for external dependencies
- DAG-level permissions with RBAC
- Version control all DAGs
- Test operators independently

## DAG Structure
```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG(
    'etl_pipeline',
    start_date=datetime(2024, 1, 1),
    schedule_interval='@daily',
    catchup=False
) as dag:

    extract = PythonOperator(
        task_id='extract',
        python_callable=extract_data
    )

    transform = PythonOperator(
        task_id='transform',
        python_callable=transform_data
    )

    load = PythonOperator(
        task_id='load',
        python_callable=load_data
    )

    extract >> transform >> load
```

## Task Dependencies
```python
# Chain
task1 >> task2 >> task3

# Parallel
[task1, task2] >> task3

# Branching
 branching >> [branch_a, branch_b]
```

## Best Practices
- Use Template Variables for dynamic paths
- Implement SLAs for critical tasks
- Use Connections for credentials
- Monitor with Grafana/Prometheus
- Use XCom sparingly (data should go to DB/S3)
