---
name: ansible-automation
description: Configuration management with Ansible - playbooks, roles, inventory, automation at scale.
---

# Ansible Automation

## When to Apply
Use this skill when automating server configuration, deploying applications, managing multiple servers, or writing playbooks.

## Core Concepts
- YAML playbooks and tasks
- Inventory (static and dynamic)
- Roles and collections
- Variables and facts
- Handlers and notifications
- Templates (Jinja2)
- Vault for secrets
- Ad-hoc commands

## Best Practices
- Use roles for reusable components
- Store inventory in version control
- Use Ansible Vault for secrets
- Idempotent tasks - safe to run multiple times
- Use handlers for service restarts
- Tag tasks for selective execution
- Test with --check mode first
- Use ansible-lint for validation

## Common Patterns
```yaml
# Playbook
- hosts: web_servers
  become: yes
  vars:
    http_port: 80
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present
      notify: Restart nginx

  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
```

## Inventory Management
- Group hosts by role (web, db, cache)
- Use group_vars and host_vars
- Dynamic inventory for cloud providers
- Limit execution with --limit

## Roles Structure
```
roles/
  common/
    tasks/main.yml
    handlers/main.yml
    templates/
    files/
    vars/main.yml
    defaults/main.yml
    meta/main.yml
```
