/**
 * Smart Home Control System for Devil AI
 *
 * Control lights, temperature, media, and other smart devices
 */

export interface SmartDevice {
	id: string
	name: string
	type: "light" | "thermostat" | "speaker" | "camera" | "lock" | "switch" | "sensor"
	location: string
	state: Record<string, any>
	online: boolean
	lastUpdated: Date
}

export interface LightControl {
	brightness: number // 0-100
	color: string // hex color
	temperature: number // color temperature in Kelvin
	power: boolean
}

export interface ThermostatControl {
	temperature: number
	mode: "heat" | "cool" | "auto" | "off"
	fanSpeed: "auto" | "low" | "medium" | "high"
}

export interface MediaControl {
	playing: boolean
	volume: number // 0-100
	source: string
	track?: string
	artist?: string
}

export class SmartHomeControl {
	private devices: Map<string, SmartDevice> = new Map()
	private scenes: Map<string, Record<string, any>> = new Map()

	constructor() {
		this.initializeDefaultDevices()
		this.initializeDefaultScenes()
	}

	/**
	 * Initialize default devices
	 */
	private initializeDefaultDevices(): void {
		// Living room lights
		this.addDevice({
			id: "living-room-light-1",
			name: "Living Room Main",
			type: "light",
			location: "Living Room",
			state: { power: true, brightness: 80, color: "#ffffff", temperature: 4000 },
			online: true,
			lastUpdated: new Date(),
		})

		// Bedroom lights
		this.addDevice({
			id: "bedroom-light-1",
			name: "Bedroom Light",
			type: "light",
			location: "Bedroom",
			state: { power: false, brightness: 50, color: "#ffffff", temperature: 3000 },
			online: true,
			lastUpdated: new Date(),
		})

		// Thermostat
		this.addDevice({
			id: "thermostat-1",
			name: "Main Thermostat",
			type: "thermostat",
			location: "Hallway",
			state: { temperature: 72, mode: "auto", fanSpeed: "auto" },
			online: true,
			lastUpdated: new Date(),
		})

		// Smart speaker
		this.addDevice({
			id: "speaker-1",
			name: "Living Room Speaker",
			type: "speaker",
			location: "Living Room",
			state: { playing: false, volume: 50, source: "spotify" },
			online: true,
			lastUpdated: new Date(),
		})
	}

	/**
	 * Initialize default scenes
	 */
	private initializeDefaultScenes(): void {
		// Morning scene
		this.scenes.set("morning", {
			"living-room-light-1": { power: true, brightness: 100, color: "#ffffff" },
			"thermostat-1": { temperature: 72, mode: "auto" },
			"speaker-1": { playing: true, volume: 30, source: "morning-playlist" },
		})

		// Movie scene
		this.scenes.set("movie", {
			"living-room-light-1": { power: true, brightness: 20, color: "#ff6b00" },
			"speaker-1": { playing: true, volume: 70, source: "movie-audio" },
		})

		// Night scene
		this.scenes.set("night", {
			"living-room-light-1": { power: false },
			"bedroom-light-1": { power: true, brightness: 10, color: "#ff9900" },
			"thermostat-1": { temperature: 68, mode: "cool" },
		})

		// Away scene
		this.scenes.set("away", {
			"living-room-light-1": { power: false },
			"bedroom-light-1": { power: false },
			"thermostat-1": { temperature: 65, mode: "auto" },
		})
	}

	/**
	 * Add device
	 */
	addDevice(device: SmartDevice): void {
		this.devices.set(device.id, device)
	}

	/**
	 * Remove device
	 */
	removeDevice(deviceId: string): void {
		this.devices.delete(deviceId)
	}

	/**
	 * Get device
	 */
	getDevice(deviceId: string): SmartDevice | undefined {
		return this.devices.get(deviceId)
	}

	/**
	 * Get all devices
	 */
	getAllDevices(): SmartDevice[] {
		return Array.from(this.devices.values())
	}

	/**
	 * Get devices by type
	 */
	getDevicesByType(type: SmartDevice["type"]): SmartDevice[] {
		return this.getAllDevices().filter((d) => d.type === type)
	}

	/**
	 * Get devices by location
	 */
	getDevicesByLocation(location: string): SmartDevice[] {
		return this.getAllDevices().filter((d) => d.location === location)
	}

	/**
	 * Control light
	 */
	async controlLight(deviceId: string, control: Partial<LightControl>): Promise<boolean> {
		const device = this.devices.get(deviceId)
		if (!device || device.type !== "light") {
			return false
		}

		device.state = { ...device.state, ...control }
		device.lastUpdated = new Date()
		return true
	}

	/**
	 * Control thermostat
	 */
	async controlThermostat(deviceId: string, control: Partial<ThermostatControl>): Promise<boolean> {
		const device = this.devices.get(deviceId)
		if (!device || device.type !== "thermostat") {
			return false
		}

		device.state = { ...device.state, ...control }
		device.lastUpdated = new Date()
		return true
	}

	/**
	 * Control media
	 */
	async controlMedia(deviceId: string, control: Partial<MediaControl>): Promise<boolean> {
		const device = this.devices.get(deviceId)
		if (!device || device.type !== "speaker") {
			return false
		}

		device.state = { ...device.state, ...control }
		device.lastUpdated = new Date()
		return true
	}

	/**
	 * Activate scene
	 */
	async activateScene(sceneName: string): Promise<boolean> {
		const scene = this.scenes.get(sceneName)
		if (!scene) {
			return false
		}

		for (const [deviceId, state] of Object.entries(scene)) {
			const device = this.devices.get(deviceId)
			if (device) {
				device.state = { ...device.state, ...state }
				device.lastUpdated = new Date()
			}
		}

		return true
	}

	/**
	 * Create custom scene
	 */
	createScene(name: string, deviceStates: Record<string, any>): void {
		this.scenes.set(name, deviceStates)
	}

	/**
	 * Get available scenes
	 */
	getScenes(): string[] {
		return Array.from(this.scenes.keys())
	}

	/**
	 * Process voice command
	 */
	async processVoiceCommand(command: string): Promise<string> {
		const lowerCommand = command.toLowerCase()

		// Light commands
		if (lowerCommand.includes("light") || lowerCommand.includes("lamp")) {
			if (lowerCommand.includes("turn on") || lowerCommand.includes("on")) {
				const lights = this.getDevicesByType("light")
				for (const light of lights) {
					await this.controlLight(light.id, { power: true })
				}
				return "Turning on all lights"
			}

			if (lowerCommand.includes("turn off") || lowerCommand.includes("off")) {
				const lights = this.getDevicesByType("light")
				for (const light of lights) {
					await this.controlLight(light.id, { power: false })
				}
				return "Turning off all lights"
			}

			if (lowerCommand.includes("dim")) {
				const brightness = this.extractBrightness(lowerCommand)
				const lights = this.getDevicesByType("light")
				for (const light of lights) {
					await this.controlLight(light.id, { brightness })
				}
				return `Dimming lights to ${brightness}%`
			}
		}

		// Temperature commands
		if (lowerCommand.includes("temperature") || lowerCommand.includes("thermostat")) {
			const temp = this.extractTemperature(lowerCommand)
			if (temp) {
				const thermostats = this.getDevicesByType("thermostat")
				for (const thermo of thermostats) {
					await this.controlThermostat(thermo.id, { temperature: temp })
				}
				return `Setting temperature to ${temp}°F`
			}
		}

		// Media commands
		if (
			lowerCommand.includes("music") ||
			lowerCommand.includes("play") ||
			lowerCommand.includes("pause")
		) {
			const speakers = this.getDevicesByType("speaker")
			for (const speaker of speakers) {
				if (lowerCommand.includes("play")) {
					await this.controlMedia(speaker.id, { playing: true })
				} else if (lowerCommand.includes("pause") || lowerCommand.includes("stop")) {
					await this.controlMedia(speaker.id, { playing: false })
				}

				if (lowerCommand.includes("volume")) {
					const volume = this.extractVolume(lowerCommand)
					if (volume !== null) {
						await this.controlMedia(speaker.id, { volume })
					}
				}
			}
			return "Adjusting media"
		}

		// Scene commands
		if (lowerCommand.includes("scene") || lowerCommand.includes("mode")) {
			if (lowerCommand.includes("morning")) {
				await this.activateScene("morning")
				return "Activating morning scene"
			}
			if (lowerCommand.includes("movie") || lowerCommand.includes("film")) {
				await this.activateScene("movie")
				return "Activating movie scene"
			}
			if (lowerCommand.includes("night") || lowerCommand.includes("sleep")) {
				await this.activateScene("night")
				return "Activating night scene"
			}
			if (lowerCommand.includes("away") || lowerCommand.includes("leave")) {
				await this.activateScene("away")
				return "Activating away scene"
			}
		}

		return 'Command not recognized. Try: "turn on lights", "set temperature to 72", or "play music"'
	}

	/**
	 * Extract brightness from command
	 */
	private extractBrightness(command: string): number {
		const match = command.match(/(\d+)%?/)
		return match ? parseInt(match[1], 10) : 50
	}

	/**
	 * Extract temperature from command
	 */
	private extractTemperature(command: string): number | null {
		const match = command.match(/(\d+)\s*(?:degrees?|°|fahrenheit|celsius)?/)
		return match ? parseInt(match[1], 10) : null
	}

	/**
	 * Extract volume from command
	 */
	private extractVolume(command: string): number | null {
		const match = command.match(/(\d+)%?/)
		return match ? parseInt(match[1], 10) : null
	}

	/**
	 * Get device status summary
	 */
	getStatusSummary(): string {
		const devices = this.getAllDevices()
		const lights = devices.filter((d) => d.type === "light")
		const thermostats = devices.filter((d) => d.type === "thermostat")
		const speakers = devices.filter((d) => d.type === "speaker")

		const lightsOn = lights.filter((d) => d.state.power).length
		const avgTemp =
			thermostats.length > 0
				? Math.round(
						thermostats.reduce((sum, t) => sum + t.state.temperature, 0) / thermostats.length,
					)
				: 0
		const playing = speakers.filter((d) => d.state.playing).length

		return `Smart Home Status:
• Lights: ${lightsOn}/${lights.length} on
• Temperature: ${avgTemp}°F
• Speakers: ${playing} playing
• Total devices: ${devices.length}`
	}
}

export default SmartHomeControl
