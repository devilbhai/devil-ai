---
name: zero-trust-architecture
description: Zero Trust security model - identity verification, micro-segmentation, least privilege access.
---

# Zero Trust Architecture

## When to Apply
Use this skill for implementing Zero Trust security, network segmentation, or identity-based access control.

## Core Concepts
- Never trust, always verify
- Least privilege access
- Micro-segmentation
- Identity verification
- Continuous monitoring
- Assume breach

## Zero Trust Principles
1. **Verify Explicitly**
 - Authenticate and authorize all requests
 - Use all available data points
 - Validate identity, location, device

2. **Use Least Privilege Access**
 - Limit user access with just-in-time
 - Limit resource access with just-enough
 - Use risk-based adaptive policies

3. **Assume Breach**
 - Minimize blast radius
 - Segment access
 - Use end-to-end encryption
 - Use analytics for threat detection

## Implementation
```yaml
# Network Segmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: zero-trust
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - port: 5432
```

## Identity Verification
```python
def verify_request(request):
    # Verify identity
    identity = verify_token(request.headers.get("Authorization"))
    if not identity:
        return 401
    
    # Check permissions
    if not has_permission(identity, request.resource, request.action):
        return 403
    
    # Log access
    log_access(identity, request)
    
    return allow_request(request)
```

## Device Trust
- Check device health
- Verify device certificates
- Check device compliance
- Use device posture assessment

## Monitoring
- Log all access attempts
- Monitor for anomalies
- Alert on suspicious activity
- Regular access reviews
