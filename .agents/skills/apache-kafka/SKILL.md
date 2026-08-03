---
name: apache-kafka
description: Event streaming with Apache Kafka - producers, consumers, topics, streams, exactly-once semantics.
---

# Apache Kafka

## When to Apply
Use this skill for event-driven architecture, real-time data pipelines, message queues, log aggregation, or stream processing.

## Core Concepts
- Topics, partitions, offsets
- Producers and consumers
- Consumer groups
- Kafka Streams
- Kafka Connect
- Schema Registry
- Exactly-once semantics

## Best Practices
- Design topics with partitioning strategy
- Use consumer groups for parallel processing
- Implement idempotent consumers
- Monitor consumer lag
- Use compacted topics for state
- Schema evolution with Avro/Protobuf
- Retention policies based on use case

## Producer Pattern
```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("acks", "all");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

Producer<String, String> producer = new KafkaProducer<>(props);
producer.send(new ProducerRecord<>("orders", orderId, orderJson));
```

## Consumer Pattern
```java
Properties props = new Properties();
props.put("group.id", "order-processor");
props.put("enable.auto.commit", "false");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
consumer.subscribe(Arrays.asList("orders"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        processOrder(record.value());
    }
    consumer.commitSync();
}
```

## Kafka Streams
```java
StreamsBuilder builder = new StreamsBuilder();
builder.stream("orders")
    .filter((key, value) -> value.contains("priority"))
    .groupByKey()
    .count();
```
