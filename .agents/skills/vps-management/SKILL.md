---
name: vps-management
description: VPS/server management. Covers provisioning, user management, service configuration, monitoring, backups, security hardening.
---

# VPS Management

## When to Apply
Use this skill when managing virtual private servers, setting up new servers, configuring services, or maintaining server infrastructure. Apply for provisioning, security hardening, monitoring, and backup configuration.

## Core Concepts
- Server Provisioning: Initial setup and configuration
- User Management: Creating users, sudo access, SSH keys
- Service Management: systemd services, process management
- Security Hardening: Firewall, fail2ban, unattended upgrades
- Monitoring: System metrics, log analysis, alerting
- Backups: Automated backups, restoration procedures
- Performance Tuning: Resource optimization, caching
- Network Configuration: DNS, firewall rules, load balancing

## Implementation
```bash
# Initial server setup (Ubuntu/Debian)
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
echo "public_key" > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# SSH hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall setup (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban installation
apt install fail2ban -y
systemctl enable fail2ban

# Service management
systemctl status nginx
systemctl enable nginx
journalctl -u nginx -f

# Disk usage check
df -h
du -sh /var/log/*

# Memory and CPU
free -h
htop

# Automatic security updates
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

## Best Practices
- Always use SSH keys, disable password authentication
- Create non-root users with sudo privileges
- Set up UFW firewall with minimal required ports
- Enable automatic security updates
- Configure fail2ban for brute-force protection
- Set up automated backups with rotation
- Monitor disk space, memory, and CPU usage
- Use systemd for service management
- Keep system logs centralized and monitored
- Document all server configurations and changes
- Test backup restoration procedures regularly
- Use environment variables for sensitive configuration