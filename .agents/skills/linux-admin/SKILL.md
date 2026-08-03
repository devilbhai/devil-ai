---
name: linux-admin
description: Linux/Ubuntu system administration. Covers shell scripting, process management, file permissions, networking, systemd, cron, package management, security hardening.
---

# Linux/Ubuntu System Administration

## When to Apply
Use this skill when working with Linux/Ubuntu systems. Apply when:
- Writing or maintaining shell scripts (bash, zsh)
- Managing services with systemd
- Configuring file permissions and ownership
- Setting up cron jobs or scheduled tasks
- Troubleshooting system issues or performance
- Configuring networking, firewalls, or DNS
- Managing users and groups
- Setting up SSH access and key management
- Hardening system security
- Managing packages with apt, dpkg, or snap
- Configuring log rotation and monitoring
- Setting up Docker or container runtimes
- Managing disk usage and storage

## Core Patterns

### Shell Scripting
- Always start scripts with `#!/usr/bin/env bash` (portable shebang)
- Use `set -euo pipefail` at the top of every script for safety
- Quote all variables: `"$var"` — never `$var` unquoted
- Use `[[ ]]` over `[ ]` for conditional expressions
- Use `$()` over backticks for command substitution
- Check exit codes: `command || { echo "Failed"; exit 1; }`
- Use `shellcheck` to lint scripts before deployment
- Use `mktemp` for temporary files — never hardcode `/tmp` paths
- Prefer `printf` over `echo` for portable output

### Process Management
- Use `systemctl` to manage services: `start`, `stop`, `enable`, `status`
- Use `journalctl -u <service>` to view service logs
- Use `top` or `htop` for real-time process monitoring
- Use `ps aux | grep <name>` to find running processes
- Use `kill -9 <pid>` only as last resort — prefer `kill <pid>` (SIGTERM)
- Use `nice` / `renice` to adjust process priority
- Use `nohup` or `tmux` for long-running background processes
- Use `systemd-run` to run transient services

### File Permissions
- Use `chmod 755` for directories, `644` for regular files
- Use `chown user:group` to change ownership
- Use `umask` to set default permissions for new files
- Understand setuid (`4`), setgid (`2`), sticky bit (`1`) in `chmod`
- Use `find /path -perm -o+w -type f` to find world-writable files
- Use `setfacl` / `getfacl` for fine-grained access control lists
- Avoid `chmod 777` — it's a security risk

### Networking
- Use `ip addr` or `ip a` to show network interfaces (not `ifconfig`)
- Use `ss -tlnp` to show listening TCP ports
- Use `curl -v` or `wget` for HTTP debugging
- Use `dig` or `nslookup` for DNS queries
- Use `traceroute` or `mtr` for network path analysis
- Use `iptables` or `ufw` for firewall management
- Configure static IPs in `/etc/netplan/` on Ubuntu
- Use `nmcli` for NetworkManager command-line management

### Cron & Scheduling
- Use `crontab -e` to edit user cron jobs
- Use `crontab -l` to list current cron jobs
- Cron format: `minute hour day month day-of-week command`
- Use `@reboot` to run a command at startup
- Use `@daily`, `@weekly`, `@monthly` for common intervals
- Redirect output: `command >> /var/log/cron.log 2>&1`
- Use systemd timers as modern alternative to cron
- Always test cron commands manually before adding to crontab

### Package Management
- Use `apt update && apt upgrade` for system updates
- Use `apt install <pkg>` to install packages
- Use `apt remove` (keep config) or `apt purge` (remove config) to uninstall
- Use `apt autoremove` to clean up unused dependencies
- Use `dpkg -l | grep <pkg>` to check installed packages
- Use `apt-cache search <query>` to find packages
- Hold packages with `apt-mark hold <pkg>` to prevent upgrades
- Use `apt list --upgradable` to see available updates

### Security Hardening
- Use `ufw` (Uncomplicated Firewall) for firewall management
- Disable root SSH login: `PermitRootLogin no` in `/etc/ssh/sshd_config`
- Use SSH key authentication — disable password auth where possible
- Use `fail2ban` to block brute-force attacks
- Set `umask 027` for restrictive default permissions
- Use `auditd` for system call auditing
- Keep systems updated: `unattended-upgrades` for automatic security patches
- Use `chroot` or containers for isolating services
- Review `/var/log/auth.log` for unauthorized access attempts
- Use `chmod 600` for sensitive config files

### System Monitoring
- Use `df -h` to check disk usage
- Use `du -sh /path` to check directory sizes
- Use `free -h` to check memory usage
- Use `uptime` to check load average
- Use `vmstat 1` for real-time system statistics
- Use `iostat -x 1` for disk I/O monitoring
- Use `dmesg | tail` for kernel messages
- Use `journalctl --since "1 hour ago"` for recent logs
- Set up `logrotate` for automatic log management

## Code Examples

### Robust Shell Script
```bash
#!/usr/bin/env bash
set -euo pipefail

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/deploy.log"
readonly BACKUP_DIR="/var/backups/$(date +%Y%m%d)"

# Functions
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

die() {
    log "ERROR" "$@"
    exit 1
}

cleanup() {
    log "INFO" "Cleaning up temporary files"
    rm -rf "${TMP_DIR:-}"
}
trap cleanup EXIT

# Main
main() {
    local env="${1:-staging}"

    [[ -d "$BACKUP_DIR" ]] || mkdir -p "$BACKUP_DIR"
    log "INFO" "Starting deployment to $env"

    # Your deployment logic here
    deploy_application "$env"
    restart_services
    verify_deployment

    log "INFO" "Deployment to $env completed successfully"
}

deploy_application() {
    local env="$1"
    log "INFO" "Deploying application to $env"

    # Add your deployment commands here
    rsync -avz --delete dist/ "app-server:/opt/app/"
}

restart_services() {
    log "INFO" "Restarting services"
    sudo systemctl restart nginx
    sudo systemctl restart app-worker
}

verify_deployment() {
    log "INFO" "Verifying deployment"
    local max_retries=5
    local retry=0

    while (( retry < max_retries )); do
        if curl -sf http://localhost/health > /dev/null; then
            log "INFO" "Health check passed"
            return 0
        fi
        (( retry++ ))
        sleep 2
    done

    die "Health check failed after $max_retries retries"
}

main "$@"
```

### Systemd Service File
```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application
After=network.target
Wants=redis.service postgresql.service

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/bin/server --config /etc/myapp/config.yaml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=myapp

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/myapp /var/log/myapp
PrivateTmp=yes

# Resource limits
LimitNOFILE=65536
MemoryMax=2G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

### Systemd Timer (Cron Alternative)
```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup daily

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target

# /etc/systemd/system/backup.service
[Unit]
Description=Backup application data

[Service]
Type=oneshot
ExecStart=/opt/scripts/backup.sh
User=backup
Group=backup
```

### User and Permission Setup
```bash
# Create dedicated application user
sudo useradd -r -s /bin/false -d /opt/myapp myapp

# Set ownership
sudo chown -R myapp:myapp /opt/myapp
sudo chmod -R 750 /opt/myapp

# Sensitive config files
sudo chmod 600 /etc/myapp/secrets.yaml
sudo chown myapp:myapp /etc/myapp/secrets.yaml

# Add user to specific group for shared access
sudo usermod -aG docker myapp
```

### UFW Firewall Rules
```bash
# Basic setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Rate limiting for SSH
sudo ufw limit ssh

# Enable
sudo ufw enable
sudo ufw status verbose
```

## Best Practices
- Always use `set -euo pipefail` in shell scripts
- Use dedicated system users for services — never run as root
- Keep `umask 027` for restrictive default permissions
- Use `ufw` or `firewalld` — never leave firewalls completely open
- Disable root SSH login and password authentication
- Use `fail2ban` to protect SSH and web services
- Monitor disk usage and set up alerts for high usage
- Use `logrotate` to manage log file rotation
- Keep systems updated — enable `unattended-upgrades` for security patches
- Use `systemctl` for service management — avoid manual process management
- Test scripts and changes in staging before production
- Document all manual steps in runbooks for repeatability
- Use `auditd` for security auditing on critical systems
- Back up configurations and test restores regularly
