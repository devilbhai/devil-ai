/**
 * Finds an available TCP port on localhost.
 *
 * Uses the OS-assigned ephemeral port trick: bind to port 0, read the
 * assigned port, then close the server before returning.
 */

import { createServer } from "node:net"

export function findFreePort(hostname = "127.0.0.1"): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer()
		server.unref()
		server.on("error", reject)
		server.listen(0, hostname, () => {
			const addr = server.address()
			if (!addr || typeof addr === "string") {
				server.close()
				reject(new Error("Could not determine assigned port"))
				return
			}
			const port = addr.port
			server.close(() => resolve(port))
		})
	})
}

/**
 * Checks if a specific port is available on localhost.
 * Returns true if the port is free, false if it's in use.
 */
export function isPortAvailable(port: number, hostname = "127.0.0.1"): Promise<boolean> {
	return new Promise((resolve) => {
		const server = createServer()
		server.unref()
		server.on("error", () => resolve(false))
		server.listen(port, hostname, () => {
			server.close(() => resolve(true))
		})
	})
}
