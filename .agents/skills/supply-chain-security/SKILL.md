---
name: supply-chain-security
description: Supply chain security - dependency analysis, SBOM generation, CI/CD pipeline security, and software integrity verification.
---

# Supply Chain Security

## When to Apply
Use this skill for software supply chain security assessments, dependency vulnerability analysis, CI/CD pipeline security, and software integrity verification.

## Core Concepts
- Software Bill of Materials (SBOM)
- Dependency vulnerability analysis
- CI/CD pipeline security
- Code signing and integrity
- Package manager security
- Open source risk assessment

## SBOM Generation
- **Syft** - SBOM generation
- **SPDX** - Standard format
- **CycloneDX** - OWASP format
- **CDXGen** - BOM generation

## Dependency Analysis
- Direct dependency vulnerabilities
- Transitive dependency risks
- License compliance
- Version pinning
- Lock files
- Private package registries

## CI/CD Security
- Pipeline configuration review
- Secret management
- Build environment security
- Artifact signing
- Deployment security
- Access control

## Package Manager Security
- **npm** - package-lock.json, .npmrc
- **pip** - requirements.txt, pip.conf
- **Maven** - pom.xml, settings.xml
- **Go** - go.sum, GOPROXY
- **Cargo** - Cargo.lock, registry

## Common Attacks
- Dependency confusion
- Typosquatting
- Malicious packages
- Build compromise
- Source code tampering
- Certificate theft
- Compromised maintainers

## Tools
- **Syft** - SBOM generation
- **Grype** - Vulnerability scanning
- **Trivy** - Multi-purpose scanner
- **Snyk** - Developer security
- **Dependabot** - Automated updates
- **Renovate** - Dependency updates
- **Cosign** - Artifact signing
- **Sigstore** - Software signing

## Verification Methods
- Hash verification
- Digital signatures
- Reproducible builds
- SLSA framework
- In-toto attestation

## Defense Strategies
- Pin dependencies
- Use lock files
- Verify signatures
- Scan before deploy
- Minimal dependencies
- Private registries
- Access control
- Regular updates
