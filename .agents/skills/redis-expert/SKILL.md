---
name: redis-expert
description: Redis expert. Covers data structures, caching strategies, pub/sub, sessions, rate limiting,排行榜, distributed locks, Redis Cluster, Lua scripting.
---

# Redis Expert

## When to Apply
Use this skill when working with Redis for caching, messaging, or data storage. Apply when:
- Implementing caching strategies (cache-aside, write-through, write-behind)
- Using Redis data structures (strings, hashes, lists, sets, sorted sets)
- Building real-time features with pub/sub or streams
- Implementing rate limiting or throttling
- Managing distributed locks or leaderboards
- Working with sessions or token storage
- Configuring Redis Cluster or Sentinel for high availability
- Writing Lua scripts for atomic operations
- Debugging Redis performance issues or memory usage
- Integrating Redis with application frameworks

## Core Patterns

### Data Structures
- **Strings**: Use for simple key-value caching, counters, and rate limiters
- **Hashes**: Use for object storage — more memory-efficient than multiple strings
- **Lists**: Use for queues (LPUSH + BRPOP) and recent-item feeds
- **Sets**: Use for unique collections, membership checks, and set operations
- **Sorted Sets**: Use for leaderboards, priority queues, and time-series data
- **Streams**: Use for event sourcing, message queues, and audit logs
- **HyperLogLog**: Use for cardinality estimation (unique visitors) with fixed memory

### Caching Strategies
- **Cache-Aside**: Application checks cache first, falls back to DB, writes to cache
- **Write-Through**: Write to cache and DB simultaneously on every write
- **Write-Behind**: Write to cache, asynchronously flush to DB
- **Read-Through**: Cache layer handles DB reads automatically
- Use TTL on all cache keys — never cache indefinitely
- Use `EX` (seconds) or `PX` (milliseconds) for TTL
- Implement cache warming for cold starts
- Use `SCAN` over `KEYS` for production key enumeration
- Use `SET key value EX 3600 NX` for cache-aside with atomic set-if-not-exists

### Rate Limiting
- Use sorted sets with timestamps for sliding window rate limiting
- Use `INCR` + `EXPIRE` for fixed window rate limiting
- Use token bucket algorithm with Lua scripts for smooth limiting
- Store rate limit keys with TTL equal to the window duration
- Return remaining count in response headers (`X-RateLimit-Remaining`)
- Use separate Redis databases or key prefixes for different rate limit tiers

### Pub/Sub & Streams
- Use `PUBLISH` / `SUBSCRIBE` for lightweight real-time messaging
- Use Redis Streams (`XADD`, `XREAD`) for durable message queues
- Use consumer groups with Streams for parallel processing
- Use `XACK` to acknowledge processed messages
- Use `XPENDING` to monitor unacknowledged messages
- Set `MAXLEN` on streams to cap memory usage
- Use `XTRIM` to remove old entries from streams

### Distributed Locks
- Use `SET key value NX EX` for basic distributed locks
- Use Redlock algorithm for multi-node distributed locks
- Always set an expiration on lock keys to prevent deadlocks
- Store a unique value (UUID) to ensure only the lock owner can release
- Use `DEL` with Lua script for atomic check-and-delete
- Use `SETNX` sparingly — prefer `SET NX EX` which is atomic
- Implement lock renewal (watchdog) for long-running operations

### Lua Scripting
- Use `EVAL` for atomic multi-step operations
- Use `EVALSHA` with `SCRIPT LOAD` for cached Lua scripts
- Lua scripts execute atomically — no other commands run during execution
- Keep scripts short and fast — they block all Redis operations
- Use `redis.call()` for commands, `redis.pcall()` for error-tolerant calls
- Return Lua arrays as `redis.call()` returns table types
- Use `redis.status_reply()` and `redis.error_reply()` for typed responses

### Sessions & Token Storage
- Use hashes to store session data: `HSET session:{id} user_id 123`
- Set session TTL with `EXPIRE` to auto-cleanup expired sessions
- Use `SETEX` for simple token-to-user mappings
- Implement session refresh on activity (extend TTL on access)
- Use `SCAN` with pattern matching for session cleanup jobs
- Store minimal data in Redis — reference DB for full records

## Code Examples

### Cache-Aside Pattern
```python
import redis
import json

r = redis.Redis()

def get_user(user_id: int) -> dict:
    cache_key = f"user:{user_id}"

    # Check cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Fall back to database
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)

    # Write to cache with 1-hour TTL
    r.setex(cache_key, 3600, json.dumps(user))
    return user

def invalidate_user(user_id: int):
    r.delete(f"user:{user_id}")
```

### Sliding Window Rate Limiter (Lua)
```lua
-- rate_limit.lua
local key = KEYS[1]
local window = tonumber(ARGV[1])  -- window in seconds
local limit = tonumber(ARGV[2])   -- max requests
local now = tonumber(ARGV[3])     -- current timestamp ms

-- Remove entries outside the window
redis.call('ZREMRANGEBYSCORE', key, 0, now - window * 1000)

-- Count requests in current window
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('PEXPIRE', key, window * 1000)
    return {1, limit - count - 1}  -- allowed, remaining
else
    return {0, 0}  -- denied, remaining
end
```

### Leaderboard with Sorted Sets
```python
def update_score(user_id: str, score: float):
    r.zadd("leaderboard", {user_id: score})

def get_top_users(n: int = 10) -> list[dict]:
    return r.zrevrange("leaderboard", 0, n - 1, withscores=True)

def get_user_rank(user_id: str) -> int:
    rank = r.zrevrank("leaderboard", user_id)
    return rank + 1 if rank is not None else -1

def get_users_in_range(start: int, stop: int) -> list[dict]:
    return r.zrevrange("leaderboard", start, stop, withscores=True)
```

### Distributed Lock with Watchdog
```python
import uuid
import time
import threading

class RedisLock:
    def __init__(self, redis_client, lock_key: str, ttl: int = 10):
        self.r = redis_client
        self.lock_key = f"lock:{lock_key}"
        self.ttl = ttl
        self.lock_value = str(uuid.uuid4())
        self._watchdog = None
        self._running = False

    def acquire(self, timeout: int = 10) -> bool:
        end = time.time() + timeout
        while time.time() < end:
            if self.r.set(self.lock_key, self.lock_value, nx=True, ex=self.ttl):
                self._start_watchdog()
                return True
            time.sleep(0.1)
        return False

    def release(self) -> bool:
        self._stop_watchdog()
        # Atomic check-and-delete with Lua
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        return bool(self.r.eval(script, 1, self.lock_key, self.lock_value))

    def _start_watchdog(self):
        self._running = True
        def renew():
            while self._running:
                time.sleep(self.ttl / 3)
                if self._running:
                    self.r.expire(self.lock_key, self.ttl)
        self._watchdog = threading.Thread(target=renew, daemon=True)
        self._watchdog.start()

    def _stop_watchdog(self):
        self._running = False
```

### Stream Consumer Group
```python
import redis

r = redis.Redis()

# Create stream and consumer group
r.xadd("orders", {"item": "widget", "qty": "5"})
r.xgroup_create("orders", "processors", id="0", mkstream=True)

# Read messages as consumer
messages = r.xreadgroup(
    "processors", "worker-1",
    {"orders": ">"},
    count=10,
    block=5000,
)

for stream, msgs in messages:
    for msg_id, data in msgs:
        process_order(data)
        r.xack("orders", "processors", msg_id)
```

## Best Practices
- Always set TTLs on cache keys — never cache indefinitely
- Use hashes over multiple strings for storing objects
- Use `SCAN` instead of `KEYS` in production
- Keep Lua scripts short — they block the entire Redis server
- Use `UNLINK` over `DEL` for large keys to avoid blocking
- Monitor memory usage with `INFO memory` and `MEMORY USAGE key`
- Use connection pooling — never create new connections per request
- Use `MAXLEN` on streams to prevent unbounded memory growth
- Implement distributed locks with expiration to prevent deadlocks
- Use Redis Sentinel for high availability, Cluster for horizontal scaling
- Separate caching, sessions, and queues into different Redis databases or prefixes
- Use `OBJECT IDLETIME` to find keys that haven't been accessed recently
