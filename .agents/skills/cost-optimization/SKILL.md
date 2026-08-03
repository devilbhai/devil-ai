---
name: cost-optimization
description: Cloud cost optimization - resource sizing, reserved instances, spot instances, cost monitoring.
---

# Cost Optimization

## When to Apply
Use this skill for reducing cloud costs, optimizing resource usage, or managing budgets.

## Core Concepts
- Resource rightsizing
- Reserved instances and savings plans
- Spot instances
- Cost allocation tags
- Budget alerts
- Idle resource cleanup

## Best Practices
- Monitor costs continuously
- Right-size resources
- Use reserved instances for steady workloads
- Use spot for batch processing
- Clean up idle resources
- Implement cost alerts
- Use cost allocation tags

## Resource Sizing
```bash
# AWS CLI - Check unused EBS volumes
aws ec2 describe-volumes --filters Name=status,Values=available

# Find idle load balancers
aws elb describe-load-balancers --query 'LoadBalancerDescriptions[?DNSName==`null`]'

# Check low-utilization instances
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --period 86400 \
  --statistics Average \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z
```

## Cost Allocation Tags
```yaml
Tags:
  - Key: Environment
    Value: Production
  - Key: Team
    Value: Engineering
  - Key: Project
    Value: Auth Service
  - Key: CostCenter
    Value: CC-12345
```

## Budget Alerts
```json
{
  "BudgetName": "Monthly Budget",
  "BudgetLimit": {
    "Amount": "1000",
    "Unit": "USD"
  },
  "CostFilters": {
    "TagKeyValue": ["user:Team$Engineering"]
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "NotificationsWithSubscribers": [
    {
      "Notification": {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80
      },
      "Subscribers": [
        {
          "SubscriptionType": "EMAIL",
          "Address": "team@example.com"
        }
      ]
    }
  ]
}
```

## Cost Optimization Checklist
- [ ] Right-size underutilized instances
- [ ] Delete unused EBS volumes
- [ ] Release unattached Elastic IPs
- [ ] Stop idle development environments
- [ ] Use S3 Intelligent-Tiering
- [ ] Enable CloudWatch billing alerts
- [ ] Review Reserved Instance coverage
