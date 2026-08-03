---
name: nginx-litespeed
description: Nginx and OpenLiteSpeed web server configuration. Covers reverse proxy, SSL setup, load balancing, caching, security headers, rewrite rules, performance tuning.
---

# Nginx & OpenLiteSpeed Web Server Configuration

## When to Apply

- Configuring Nginx or OpenLiteSpeed as a reverse proxy for Node.js/Bun/Hono backends
- Setting up SSL/TLS with Let's Encrypt or custom certificates
- Implementing load balancing across multiple upstream servers
- Configuring HTTP caching (proxy cache, FastCGI cache)
- Adding security headers (CSP, HSTS, X-Frame-Options)
- Writing rewrite rules for clean URLs or SPA routing
- Tuning worker connections, buffer sizes, and keepalive settings
- Migrating between Nginx and OpenLiteSpeed configurations

## Core Patterns

### Reverse Proxy

```nginx
location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### SSL Setup (Let's Encrypt)

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

### Load Balancing

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:3101;
    server 127.0.0.1:3102;
    server 127.0.0.1:3103 backup;
    keepalive 32;
}
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### SPA Routing (Catch-All)

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### OpenLiteSpeed Equivalent

```
<virtualHost *:443>
    docRoot /var/www/html
    sslCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    sslCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem

    rewrite {
        rules
        rewriteFile .htaccess
    }
</virtualHost>
```

## Configuration

### Worker Tuning

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 256;
}
```

### Proxy Cache

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location /api/public {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_use_stale error timeout updating;
    add_header X-Cache-Status $upstream_cache_status;
    proxy_pass http://backend;
}
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend;
}
```

## Best Practices

- Always redirect HTTP to HTTPS in production
- Use `proxy_set_header Host $host` to preserve the original Host header
- Enable gzip/brotli compression for text-based assets
- Set appropriate `worker_rlimit_nofile` and `worker_connections` for high-traffic
- Use `least_conn` for load balancing when request times vary
- Place static files outside the proxy pass location for better caching
- Use `ssl_session_cache` to avoid TLS handshake overhead on repeat visitors
- Monitor with `stub_status` module or Prometheus nginx exporter
- Keep OpenLiteSpeed configs in `/usr/local/lsws/conf/` and use `.htaccess` for rewrite rules
- Test configs with `nginx -t` before reloading to avoid downtime
