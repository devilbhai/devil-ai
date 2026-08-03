---
name: docker-security
description: Docker container security - image scanning, container hardening, runtime security, and Dockerfile best practices.
---

# Docker Security

## When to Apply
Use this skill for Docker container security assessments, image vulnerability scanning, container hardening, and Dockerfile security review.

## Core Concepts
- Container image vulnerability scanning
- Dockerfile security best practices
- Container runtime security
- Docker daemon configuration
- Registry security
- Orchestration security (Docker Swarm)

## Dockerfile Security
- Use minimal base images (Alpine, distroless)
- Run as non-root user
- Don't store secrets in images
- Use multi-stage builds
- Pin package versions
- Use COPY instead of ADD
- Scan images before pushing

## Container Runtime Security
- Read-only root filesystem
- Drop all capabilities, add only needed
- No privileged containers
- Resource limits (CPU, memory)
- Seccomp profiles
- AppArmor/SELinux profiles

## Docker Daemon Security
- TLS for Docker API
- User namespace remapping
- Content trust (Docker Content Trust)
- Log rotation
- Live restore

## Image Security
- Vulnerability scanning (Trivy, Grype)
- Image signing and verification
- Base image updates
- Secret scanning in images
- SBOM generation

## Common Vulnerabilities
- Running as root
- Exposed Docker daemon
- Insecure registries
- Privileged containers
- Host path mounts
- Sensitive data in images
- Outdated packages

## Tools
- Trivy - Image vulnerability scanning
- Grype - Container image scanner
- Syft - SBOM generation
- Dockle - Dockerfile best practices
- Hadolint - Dockerfile linter
- Docker Bench Security - CIS benchmark
- Clair - Container analysis

## Best Practices
- Use trusted base images
- Implement image scanning in CI/CD
- Use Docker secrets or external secret management
- Limit container resources
- Use network segmentation
- Monitor container runtime
- Implement logging and auditing