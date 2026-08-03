export interface ServerConfig {
	id: string
	name: string
	type: "local"
	hostname?: string
	port?: number
	hasPassword?: boolean
	mdns?: boolean
	mdnsDomain?: string
}

export interface AppSettings {
	servers: {
		servers: ServerConfig[]
		activeServerId: string
	}
	masterPassword?: string
	telegramBotToken?: string
	model?: string
}

export interface OpenCodeServer {
	url: string
	pid: number | null
	managed: boolean
}

export interface TelegramBotStatus {
	running: boolean
	botToken: boolean
	tunnelUrl: string | null
	userCount: number
}
