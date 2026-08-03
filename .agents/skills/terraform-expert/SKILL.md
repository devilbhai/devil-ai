---
name: terraform-expert
description: Infrastructure as Code with Terraform - AWS, GCP, Azure resource provisioning, modules, state management.
---

# Terraform Expert

## When to Apply
Use this skill when writing Terraform configs, provisioning cloud infrastructure, managing state, or building reusable modules.

## Core Concepts
- HCL syntax and best practices
- Provider configuration (AWS, GCP, Azure, Kubernetes)
- Resource definitions and data sources
- Modules - local and remote
- State management (local, S3, GCS, Terraform Cloud)
- Workspaces for environment separation
- Import and migration strategies
- Plan/apply/destroy lifecycle

## Best Practices
- Always use variables for configurable values
- Use modules for reusable components
- Tag all resources consistently
- Use data sources to reference existing resources
- Never store secrets in Terraform files
- Use terraform fmt and validate in CI
- Lock state files to prevent concurrent modifications
- Use -target for selective resource management

## Common Patterns
```hcl
# Provider
provider "aws" {
  region = var.aws_region
}

# Variable
variable "instance_type" {
  type = string
  default = "t3.micro"
}

# Resource
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  tags = {
    Name = "web-server"
  }
}

# Module
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}
```

## State Management
- Use remote state (S3 + DynamoDB for locking)
- Never commit state files to git
- Use workspaces for dev/staging/prod separation
- Import existing resources when adopting Terraform

## CI/CD Integration
- Run terraform plan on PR
- Apply only on merge to main
- Use Atlantis or Terraform Cloud for automation
- Store plan output as artifact for audit
