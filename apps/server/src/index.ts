import { Hono } from "hono"
import { cors } from "hono/cors"
import auth, { authMiddleware } from "./routes/auth"
import connectors from "./routes/connectors"
import health from "./routes/health"
import legal from "./routes/legal"
import modelState from "./routes/model-state"
import servers from "./routes/servers"
import { ensureSingleServer } from "./services/server-manager"

// ============================================================
// App — CORS middleware applied first, then routes chained for RPC
// ============================================================

const app = new Hono()

// Security headers
app.use("*", async (c, next) => {
	await next()
	c.header("X-Content-Type-Options", "nosniff")
	c.header("X-Frame-Options", "DENY")
	c.header("X-XSS-Protection", "1; mode=block")
	c.header("Referrer-Policy", "strict-origin-when-cross-origin")
})

// CORS — restrict to known origins
const ALLOWED_ORIGINS = [
	"http://localhost:1420",
	"http://127.0.0.1:1420",
	"http://localhost:5173",
	process.env.PRODUCTION_ORIGIN,
].filter(Boolean) as string[]

app.use(
	"*",
	cors({
		origin: ALLOWED_ORIGINS,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
)

// Auth middleware — protect all API endpoints except auth, health, and legal
app.use("/api/*", async (c, next) => {
	const path = new URL(c.req.url).pathname
	if (path.startsWith("/api/connectors/") && path.includes("/auth")) return next()
	if (path.startsWith("/api/connectors/") && path.includes("/callback")) return next()
	if (path === "/api/connectors/all-configs") return next()
	if (path === "/api/connectors/config/definitions") return next()
	return authMiddleware(c, next)
})

// Routes — chained for Hono RPC type inference
const routes = app
	.route("/api/servers", servers)
	.route("/api/model-state", modelState)
	.route("/api/connectors", connectors)
	.route("/", legal)
	.route("/health", health)
	.route("/auth", auth)

export type AppType = typeof routes

// ============================================================
// Start
// ============================================================

const port = Number(process.env.PORT) || 3100

console.log(`Devil AI server starting on port ${port}`)

// Eagerly start the single engine server in the background
ensureSingleServer()
	.then((server) => {
		console.log(`Engine server ready at ${server.url}`)
	})
	.catch((err) => {
		console.error("Failed to start engine server on boot:", err)
	})

// Export for testing or other environments
export default {
	port,
	fetch: app.fetch,
}

// PM2 executes Bun scripts via a require() wrapper which bypasses Bun's auto-server
// feature (where exporting an object with fetch starts the server).
// We explicitly start it here if it's the main module or if PM2 is running it.
if (process.env.PM2_HOME || require.main === module || import.meta.main) {
	Bun.serve({
		port,
		fetch: app.fetch,
	})
}
