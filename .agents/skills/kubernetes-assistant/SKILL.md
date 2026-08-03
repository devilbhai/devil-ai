---
name: kubernetes-assistant
description: Kubernetes management. Pod management, service configuration, deployment strategies.
---

# Kubernetes Assistant

## When to Apply
Use this skill when managing Kubernetes: deploying pods, configuring services, managing deployments, or troubleshooting cluster issues.

## Core Concepts
- Pod: smallest deployable unit (one or more containers)
- Deployment: manages replica sets and rolling updates
- Service: network endpoint for pod access (ClusterIP, NodePort, LoadBalancer)
- ConfigMap/Secret: externalized configuration
- Ingress: HTTP routing to services

## Implementation

### Deployment Manifest
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
```

### Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### kubectl Commands
```bash
# Get resources
kubectl get pods -l app=my-app
kubectl get services
kubectl get deployments

# Logs
kubectl logs -f deployment/my-app

# Debug
kubectl describe pod <pod-name>
kubectl exec -it <pod-name> -- /bin/sh

# Scale
kubectl scale deployment my-app --replicas=5

# Rolling update
kubectl set image deployment/my-app app=my-app:v2

# Rollback
kubectl rollout undo deployment/my-app
```

### ConfigMap and Secret
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DATABASE_URL: <base64-encoded>
```

### Resource Quotas
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: my-team
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
```

## Best Practices
- Always set resource requests and limits on containers
- Use liveness and readiness probes for health checking
- Use namespaces for multi-tenancy and organization
- Store configuration in ConfigMaps, secrets in Secrets (externalized)
- Use `kubectl apply -f` for declarative management
- Monitor with `kubectl top pods` and Prometheus/Grafana
