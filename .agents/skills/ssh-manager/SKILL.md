---
name: ssh-manager
description: SSH connection management. Covers key-based auth, tunneling, jump hosts, config management, agent forwarding, security.
---

# SSH Manager

## When to Apply
Use this skill when managing SSH connections, setting up secure remote access, configuring SSH keys, establishing tunnels, or troubleshooting SSH-related issues.

## Core Concepts
- Key-based Authentication: Public/private key pairs for secure login
- SSH Config: ~/.ssh/config for connection shortcuts and defaults
- SSH Tunneling: Local, remote, and dynamic port forwarding
- Jump Hosts: Proxying connections through bastion servers
- SSH Agent: Managing keys in memory for convenience
- Security: Hardening SSH configuration, disabling password auth
- Port Forwarding: Redirecting network traffic through SSH connections
- Host Keys: Understanding and managing server host keys

## Implementation
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@host

# SSH Config example
Host production
    HostName 192.168.1.100
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_ed25519

Host bastion
    HostName bastion.example.com
    User admin
    ForwardAgent yes

Host internal-*
    ProxyJump bastion
    User admin

# Local tunnel (access remote service locally)
ssh -L 5432:localhost:5432 user@remote-server

# Remote tunnel (expose local service remotely)
ssh -R 8080:localhost:3000 user@remote-server

# Dynamic SOCKS proxy
ssh -D 1080 user@server

# SSH agent management
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Check agent keys
ssh-add -l
```

## Best Practices
- Use Ed25519 keys (more secure than RSA)
- Always use key-based authentication, disable password auth
- Use SSH config files for complex connection patterns
- Forward agent only when needed, never on untrusted hosts
- Set appropriate file permissions (700 for .ssh, 600 for keys)
- Use jump hosts for accessing private networks
- Regularly rotate SSH keys
- Use ssh-audit to check server security
- Keep SSH client and server updated
- Use strong passphrases on private keys