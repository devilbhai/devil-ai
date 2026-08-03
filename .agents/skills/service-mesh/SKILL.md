---
name: service-mesh
description: Service mesh with Istio/Linkerd - traffic management, security, observability in microservices.
---

# Service Mesh

## When to Apply
Use this skill when implementing service mesh, managing traffic flow, setting up mTLS, or configuring observability in microservices.

## Core Concepts
- Sidecar proxy pattern
- Traffic management (routing, retries, timeouts)
- mTLS and service identity
- Load balancing strategies
- Circuit breaking
- Distributed tracing
- Fault injection for testing

## Istio Key Resources
- VirtualService - traffic routing rules
- DestinationRule - load balancing, circuit breaking
- Gateway - ingress/egress management
- PeerAuthentication - mTLS settings
- AuthorizationPolicy - access control

## Traffic Management
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v2
      weight: 90
    - destination:
        host: reviews
        subset: v3
      weight: 10
```

## mTLS Configuration
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
```

## Best Practices
- Start with permissive mode, then enforce STRICT
- Use destination rules for circuit breaking
- Implement retry policies with budgets
- Use fault injection for chaos testing
- Monitor with Kiali, Jaeger, Prometheus
- Gradually roll out mTLS namespace by namespace
