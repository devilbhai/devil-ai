---
name: kubernetes-advanced
description: Advanced Kubernetes - operators, helm charts, service mesh, RBAC, networking, storage.
---

# Kubernetes Advanced

## When to Apply
Use this skill for advanced K8s topics - operators, custom resources, networking policies, RBAC, storage classes, or cluster management.

## Core Concepts
- Custom Resource Definitions (CRDs)
- Operators and controllers
- Helm charts and packaging
- RBAC and security contexts
- Network policies
- Storage classes and PVCs
- Ingress controllers
- Service mesh (Istio/Linkerd)

## Best Practices
- Use namespaces for isolation
- Resource requests and limits on all pods
- Network policies for zero-trust
- RBAC with least privilege
- Pod security standards
- Use operators for complex stateful apps
- Helm charts for deployment consistency
- GitOps with ArgoCD/Flux

## Helm Chart Structure
```
chart/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    _helpers.tpl
```

## Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-only
spec:
  podSelector:
    matchLabels:
      app: web
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - port: 8080
```

## RBAC Pattern
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```
