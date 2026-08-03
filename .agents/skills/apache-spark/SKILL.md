---
name: apache-spark
description: Big data processing with Apache Spark - RDDs, DataFrames, Spark SQL, streaming, performance tuning.
---

# Apache Spark

## When to Apply
Use this skill for big data processing, ETL jobs, real-time streaming, machine learning pipelines, or Spark optimization.

## Core Concepts
- RDDs, DataFrames, Datasets
- Spark SQL and Catalyst optimizer
- Structured Streaming
- MLlib for machine learning
- GraphX for graph processing
- Cluster management (YARN, Mesos, K8s)

## Best Practices
- Prefer DataFrames over RDDs (Catalyst optimization)
- Use broadcast joins for small-large table joins
- Partition data appropriately
- Cache frequently accessed data
- Use checkpointing for fault tolerance
- Monitor Spark UI for bottlenecks
- Avoid UDFs when built-in functions suffice

## DataFrame Operations
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum, avg

spark = SparkSession.builder.appName("ETL").getOrCreate()

# Read
df = spark.read.parquet("s3://data/events/")

# Transform
result = df.filter(col("event_type") == "purchase") \
    .groupBy("user_id") \
    .agg(sum("amount").alias("total_spent"))

# Write
result.write.mode("overwrite").parquet("s3://data/user_spending/")
```

## Performance Tuning
- Increase parallelism with repartition()
- Use coalesce() to reduce partitions
- Avoid shuffles with bucketing
- Use Kryo serialization
- Tune executor memory and cores
- Monitor skew in groupBy operations
