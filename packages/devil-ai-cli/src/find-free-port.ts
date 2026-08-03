import net from "node:net"

export function findFreePort(hostname = "127.0.0.1"): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = net.createServer()
		server.listen(0, hostname, () => {
			const addr = server.address()
			if (addr && typeof addr === "object") {
				server.close(() => resolve(addr.port))
			} else {
				server.close()
				reject(new Error("Failed to get free port"))
			}
		})
		server.on("error", reject)
	})
}
