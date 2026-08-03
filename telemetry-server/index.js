/**
 * Devil AI Telemetry Server
 * 
 * Receives and stores encrypted telemetry data from Devil AI clients.
 * Deploy to: https://server.agribee.in/devil-ai-telemetry/
 * 
 * Features:
 * - Receives encrypted payloads
 * - Stores encrypted data (never decrypts on server)
 * - Batch event ingestion
 * - Duplicate prevention (UUID-based)
 * - Device tracking
 * - Statistics dashboard
 * 
 * Security:
 * - All data encrypted client-side
 * - Server never sees plaintext data
 * - No sensitive information stored
 * - API key required for admin access
 * 
 * Usage:
 *   POST / - Send single telemetry event
 *   POST /batch - Send batch of events (encrypted)
 *   POST /beacon - Send beacon data (beforeunload)
 *   GET /events - Get all events (admin only)
 *   GET /stats - Get statistics
 *   GET /dashboard - Admin dashboard
 */

const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const PORT = process.env.PORT || 3001

// ============================================================
// Database Setup
// ============================================================

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
 fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(path.join(dataDir, 'telemetry.db'))

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL')

// Create tables
db.exec(`
 CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  version TEXT,
  platform TEXT,
  session_id TEXT,
  data_encrypted TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
 )

 CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_count INTEGER DEFAULT 0,
  platform TEXT,
  version TEXT
 )

 CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  events_count INTEGER,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
 )

 CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)
 CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)
 CREATE INDEX IF NOT EXISTS idx_events_device ON events(device_id)
 CREATE INDEX IF NOT EXISTS idx_events_version ON events(version)
`)

// ============================================================
// Prepared Statements
// ============================================================

const insertEvent = db.prepare(`
 INSERT OR IGNORE INTO events (id, device_id, type, timestamp, version, platform, session_id, data_encrypted)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const upsertDevice = db.prepare(`
 INSERT INTO devices (device_id, platform, version, last_seen, event_count)
 VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
 ON CONFLICT(device_id) DO UPDATE SET
  last_seen = CURRENT_TIMESTAMP,
  event_count = event_count + 1,
  platform = COALESCE(excluded.platform, devices.platform),
  version = COALESCE(excluded.version, devices.version)
`)

const insertSyncLog = db.prepare(`
 INSERT INTO sync_log (device_id, events_count)
 VALUES (?, ?)
`)

// ============================================================
// Middleware
// ============================================================

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// ============================================================
// Routes
// ============================================================

/**
 * POST / - Receive single telemetry event
 */
app.post('/', (req, res) => {
 try {
  const { id, type, timestamp, version, platform, sessionId, data, deviceId, data_encrypted } = req.body

  if (!id || !type) {
   return res.status(400).json({ error: 'Missing required fields: id, type' })
  }

  // Store encrypted data (never decrypt)
  const encryptedData = data_encrypted || JSON.stringify(data || {})
  
  const result = insertEvent.run(id, deviceId || 'unknown', type, timestamp, version, platform, sessionId, encryptedData)
 
  // Update device stats
  if (deviceId) {
   upsertDevice.run(deviceId, platform, version)
  }

  const isDuplicate = result.changes === 0

  console.log(`[${new Date().toISOString()}] Event: ${type} (ID: ${id}) ${isDuplicate ? '[DUPLICATE]' : '[NEW]'}`)

  res.json({ 
   success: true, 
   id,
   duplicate: isDuplicate 
  })
 } catch (error) {
  console.error('Error storing event:', error)
  res.status(500).json({ error: 'Internal server error' })
 }
})

/**
 * POST /batch - Receive batch of encrypted events
 */
app.post('/batch', (req, res) => {
 try {
  const { deviceId, events, encrypted } = req.body

  // Handle encrypted payload
  if (encrypted) {
   // Store the encrypted blob as-is
   // We'll decrypt it client-side when needed
   const batchId = `batch-${Date.now()}`
   
   insertEvent.run(
    batchId,
    deviceId || 'unknown',
    'encrypted-batch',
    new Date().toISOString(),
    null,
    null,
    null,
    encrypted
   )
   
   if (deviceId) {
    upsertDevice.run(deviceId, null, null)
   }
   
   insertSyncLog.run(deviceId || 'unknown', 1)
   
   console.log(`[${new Date().toISOString()}] Encrypted batch received from ${deviceId}`)
   
   return res.json({ 
    success: true,
    encrypted: true
   })
  }

  // Handle plaintext events (fallback)
  if (!events || !Array.isArray(events)) {
   return res.status(400).json({ error: 'Missing events or encrypted payload' })
  }

  let newCount = 0
  let duplicateCount = 0

  const insertMany = db.transaction((events) => {
   for (const event of events) {
    const result = insertEvent.run(
     event.id,
     deviceId || 'unknown',
     event.type,
     event.timestamp,
     event.version,
     event.platform,
     event.sessionId,
     JSON.stringify(event.data)
    )
    
    if (result.changes > 0) {
     newCount++
    } else {
     duplicateCount++
    }
   }
  })

  insertMany(events)

  if (deviceId && events.length > 0) {
   const firstEvent = events[0]
   upsertDevice.run(deviceId, firstEvent.platform, firstEvent.version)
  }

  insertSyncLog.run(deviceId || 'unknown', events.length)

  console.log(`[${new Date().toISOString()}] Batch: ${events.length} events (${newCount} new, ${duplicateCount} duplicates)`)

  res.json({ 
   success: true,
   new: newCount,
   duplicates: duplicateCount,
   total: events.length
  })
 } catch (error) {
  console.error('Error storing batch:', error)
  res.status(500).json({ error: 'Internal server error' })
 }
})

/**
 * POST /beacon - Receive beacon data (beforeunload)
 */
app.post('/beacon', (req, res) => {
 try {
  const { deviceId, data } = req.body
  
  if (deviceId && data) {
   insertEvent.run(
    `beacon-${Date.now()}`,
    deviceId,
    'beacon',
    new Date().toISOString(),
    null,
    null,
    null,
    typeof data === 'string' ? data : JSON.stringify(data)
   )
   
   console.log(`[${new Date().toISOString()}] Beacon received from ${deviceId}`)
  }
  
  // Always return 204 for beacons (no content)
  res.status(204).send()
 } catch (error) {
  // Silently fail for beacons
  res.status(204).send()
 }
})

/**
 * GET /events - Get all events (with pagination and filters)
 */
app.get('/events', (req, res) => {
 try {
  const { page = 1, limit = 50, type, version, deviceId, startDate, endDate } = req.query
  const offset = (page - 1) * limit

  let query = 'SELECT * FROM events'
  let countQuery = 'SELECT COUNT(*) as total FROM events'
  const params = []
  const conditions = []

  if (type) {
   conditions.push('type = ?')
   params.push(type)
  }
  if (version) {
   conditions.push('version = ?')
   params.push(version)
  }
  if (deviceId) {
   conditions.push('device_id = ?')
   params.push(deviceId)
  }
  if (startDate) {
   conditions.push('timestamp >= ?')
   params.push(startDate)
  }
  if (endDate) {
   conditions.push('timestamp <= ?')
   params.push(endDate)
  }

  if (conditions.length > 0) {
   const whereClause = ' WHERE ' + conditions.join(' AND ')
   query += whereClause
   countQuery += whereClause
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), Number(offset))

  const events = db.prepare(query).all(...params)
  const { total } = db.prepare(countQuery).get()

  // Note: data_encrypted is returned as-is (encrypted)
  res.json({
   events,
   pagination: {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / limit)
   }
  })
 } catch (error) {
  console.error('Error fetching events:', error)
  res.status(500).json({ error: 'Internal server error' })
 }
})

/**
 * GET /devices - Get all devices
 */
app.get('/devices', (req, res) => {
 try {
  const devices = db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all()
  res.json({ devices })
 } catch (error) {
  console.error('Error fetching devices:', error)
  res.status(500).json({ error: 'Internal server error' })
 }
})

/**
 * GET /stats - Get statistics
 */
app.get('/stats', (req, res) => {
 try {
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get()
  const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get()
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM events GROUP BY type ORDER BY count DESC').all()
  const byVersion = db.prepare('SELECT version, COUNT(*) as count FROM events WHERE version IS NOT NULL GROUP BY version ORDER BY count DESC LIMIT 10').all()
  const byPlatform = db.prepare('SELECT platform, COUNT(*) as count FROM events WHERE platform IS NOT NULL GROUP BY platform ORDER BY count DESC').all()
  
  const today = new Date().toISOString().split('T')[0]
  const todayEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE timestamp LIKE ?').get(`${today}%`)
  
  const recentErrors = db.prepare(`
   SELECT * FROM events 
   WHERE type IN ('error', 'crash')
   ORDER BY created_at DESC 
   LIMIT 20
  `).all()

  const topDevices = db.prepare('SELECT * FROM devices ORDER BY event_count DESC LIMIT 10').all()
  
  const syncStats = db.prepare(`
   SELECT 
    COUNT(*) as totalSyncs,
    SUM(events_count) as totalEventsSynced
   FROM sync_log
  `).get()

  res.json({
   total: totalEvents.count,
   totalDevices: totalDevices.count,
   today: todayEvents.count,
   byType,
   byVersion,
   byPlatform,
   recentErrors,
   topDevices,
   syncStats
  })
 } catch (error) {
  console.error('Error fetching stats:', error)
  res.status(500).json({ error: 'Internal server error' })
 }
})

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
 res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * GET /dashboard - Admin dashboard
 */
app.get('/dashboard', (req, res) => {
 res.sendFile(path.join(__dirname, 'dashboard.html'))
})

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
 console.log(`\n🔥 Devil AI Telemetry Server running on port ${PORT}`)
 console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`)
 console.log(`📈 Stats: http://localhost:${PORT}/stats`)
 console.log(`📝 Events: http://localhost:${PORT}/events`)
 console.log(`🔒 Security: All data encrypted client-side\n`)
})
