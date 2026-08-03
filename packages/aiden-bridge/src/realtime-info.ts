/**
 * Real-time Information System for Devil AI
 *
 * Provides live updates on weather, news, calendar, and system status
 */

export interface WeatherData {
	temperature: number
	condition: string
	humidity: number
	windSpeed: number
	location: string
	forecast: WeatherForecast[]
}

export interface WeatherForecast {
	day: string
	high: number
	low: number
	condition: string
}

export interface NewsItem {
	id: string
	title: string
	summary: string
	source: string
	url: string
	publishedAt: Date
	category: string
}

export interface CalendarEvent {
	id: string
	title: string
	description: string
	startTime: Date
	endTime: Date
	location?: string
	attendees?: string[]
}

export interface SystemStatus {
	cpu: number
	memory: number
	disk: number
	network: NetworkStatus
	uptime: number
	processes: number
}

export interface NetworkStatus {
	connected: boolean
	speed: number
	latency: number
}

export class RealtimeInfo {
	private cache: Map<string, { data: any; expiry: Date }> = new Map()
	private updateInterval: NodeJS.Timeout | null = null

	constructor() {
		this.initializeCache()
	}

	/**
	 * Initialize cache with default data
	 */
	private initializeCache(): void {
		// Default weather
		this.cache.set("weather", {
			data: {
				temperature: 72,
				condition: "Sunny",
				humidity: 45,
				windSpeed: 8,
				location: "Current Location",
				forecast: [
					{ day: "Today", high: 75, low: 62, condition: "Sunny" },
					{ day: "Tomorrow", high: 78, low: 64, condition: "Partly Cloudy" },
					{ day: "Wednesday", high: 70, low: 58, condition: "Rain" },
				],
			},
			expiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
		})

		// Default news
		this.cache.set("news", {
			data: [
				{
					id: "1",
					title: "Tech News Update",
					summary: "Latest technology developments",
					source: "TechCrunch",
					url: "https://techcrunch.com",
					publishedAt: new Date(),
					category: "technology",
				},
				{
					id: "2",
					title: "World News",
					summary: "Important global events",
					source: "Reuters",
					url: "https://reuters.com",
					publishedAt: new Date(),
					category: "world",
				},
			],
			expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
		})
	}

	/**
	 * Get weather information
	 */
	async getWeather(location?: string): Promise<WeatherData> {
		const cacheKey = `weather_${location || "current"}`
		const cached = this.cache.get(cacheKey)

		if (cached && cached.expiry > new Date()) {
			return cached.data
		}

		// Simulate fetching weather data
		const weather: WeatherData = {
			temperature: 72 + Math.floor(Math.random() * 10) - 5,
			condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][Math.floor(Math.random() * 4)],
			humidity: 40 + Math.floor(Math.random() * 20),
			windSpeed: 5 + Math.floor(Math.random() * 15),
			location: location || "Current Location",
			forecast: [
				{ day: "Today", high: 75, low: 62, condition: "Sunny" },
				{ day: "Tomorrow", high: 78, low: 64, condition: "Partly Cloudy" },
				{ day: "Wednesday", high: 70, low: 58, condition: "Rain" },
			],
		}

		this.cache.set(cacheKey, {
			data: weather,
			expiry: new Date(Date.now() + 30 * 60 * 1000),
		})

		return weather
	}

	/**
	 * Get news headlines
	 */
	async getNews(category?: string): Promise<NewsItem[]> {
		const cacheKey = `news_${category || "general"}`
		const cached = this.cache.get(cacheKey)

		if (cached && cached.expiry > new Date()) {
			return cached.data
		}

		// Simulate fetching news
		const news: NewsItem[] = [
			{
				id: "1",
				title: "Breaking: Major Tech Announcement",
				summary:
					"A major tech company has announced a revolutionary new product that could change the industry.",
				source: "TechCrunch",
				url: "https://techcrunch.com/2024/01/15/major-announcement",
				publishedAt: new Date(),
				category: "technology",
			},
			{
				id: "2",
				title: "World Leaders Meet for Climate Summit",
				summary: "Global leaders gather to discuss climate change initiatives and commitments.",
				source: "Reuters",
				url: "https://reuters.com/2024/01/15/climate-summit",
				publishedAt: new Date(),
				category: "world",
			},
			{
				id: "3",
				title: "Stock Market Hits New High",
				summary: "Major indices reach record levels amid positive economic data.",
				source: "Bloomberg",
				url: "https://bloomberg.com/2024/01/15/stock-market",
				publishedAt: new Date(),
				category: "business",
			},
		]

		this.cache.set(cacheKey, {
			data: news,
			expiry: new Date(Date.now() + 60 * 60 * 1000),
		})

		return news
	}

	/**
	 * Get calendar events
	 */
	async getCalendarEvents(days: number = 7): Promise<CalendarEvent[]> {
		const events: CalendarEvent[] = [
			{
				id: "1",
				title: "Team Standup",
				description: "Daily team sync meeting",
				startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
				endTime: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
				location: "Conference Room A",
				attendees: ["John", "Sarah", "Mike"],
			},
			{
				id: "2",
				title: "Lunch with Client",
				description: "Business lunch meeting",
				startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
				endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
				location: "Downtown Restaurant",
				attendees: ["Client Name"],
			},
			{
				id: "3",
				title: "Project Review",
				description: "Quarterly project review meeting",
				startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
				endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
				location: "Virtual Meeting",
				attendees: ["Team"],
			},
		]

		return events.filter((event) => {
			const daysUntil = (event.startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
			return daysUntil >= 0 && daysUntil <= days
		})
	}

	/**
	 * Get system status
	 */
	async getSystemStatus(): Promise<SystemStatus> {
		// Simulate system status
		return {
			cpu: 20 + Math.floor(Math.random() * 30),
			memory: 40 + Math.floor(Math.random() * 20),
			disk: 50 + Math.floor(Math.random() * 30),
			network: {
				connected: true,
				speed: 100 + Math.floor(Math.random() * 50),
				latency: 10 + Math.floor(Math.random() * 20),
			},
			uptime: Math.floor(Math.random() * 72),
			processes: 150 + Math.floor(Math.random() * 50),
		}
	}

	/**
	 * Get daily briefing
	 */
	async getDailyBriefing(): Promise<string> {
		const weather = await this.getWeather()
		const news = await this.getNews()
		const events = await this.getCalendarEvents(1)
		const system = await this.getSystemStatus()

		let briefing = `Good ${this.getTimeOfDay()}! Here's your daily briefing:\n\n`

		// Weather
		briefing += `🌤️ Weather: ${weather.temperature}°F, ${weather.condition}\n`
		briefing += `   Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} mph\n\n`

		// Calendar
		briefing += `📅 Today's Events (${events.length}):\n`
		events.forEach((event) => {
			const time = event.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
			briefing += `   • ${time} - ${event.title}\n`
		})
		briefing += "\n"

		// News
		briefing += `📰 Top News:\n`
		news.slice(0, 3).forEach((item) => {
			briefing += `   • ${item.title}\n`
		})
		briefing += "\n"

		// System
		briefing += `💻 System Status:\n`
		briefing += `   CPU: ${system.cpu}% | Memory: ${system.memory}% | Disk: ${system.disk}%\n`
		briefing += `   Network: ${system.network.connected ? "Connected" : "Disconnected"} (${system.network.speed} Mbps)\n`
		briefing += `   Uptime: ${system.uptime} hours | Processes: ${system.processes}`

		return briefing
	}

	/**
	 * Get time of day
	 */
	private getTimeOfDay(): string {
		const hour = new Date().getHours()
		if (hour >= 5 && hour < 12) return "morning"
		if (hour >= 12 && hour < 17) return "afternoon"
		if (hour >= 17 && hour < 21) return "evening"
		return "night"
	}

	/**
	 * Start auto-updates
	 */
	startAutoUpdates(intervalMs: number = 300000): void {
		this.updateInterval = setInterval(async () => {
			await this.getWeather()
			await this.getNews()
		}, intervalMs)
	}

	/**
	 * Stop auto-updates
	 */
	stopAutoUpdates(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval)
			this.updateInterval = null
		}
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		this.cache.clear()
	}

	/**
	 * Get cache status
	 */
	getCacheStatus(): Record<string, { size: number; valid: boolean }> {
		const status: Record<string, { size: number; valid: boolean }> = {}

		for (const [key, value] of this.cache.entries()) {
			status[key] = {
				size: JSON.stringify(value.data).length,
				valid: value.expiry > new Date(),
			}
		}

		return status
	}
}

export default RealtimeInfo
