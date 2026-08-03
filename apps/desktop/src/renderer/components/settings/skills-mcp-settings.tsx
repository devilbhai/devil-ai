import { useState, useMemo, useEffect, useCallback } from "react"
import { Input } from "@devil-ai/ui/components/input"
import { Badge } from "@devil-ai/ui/components/badge"
import { ScrollArea } from "@devil-ai/ui/components/scroll-area"
import { Button } from "@devil-ai/ui/components/button"
import {
	SearchIcon,
	ZapIcon,
	ShieldIcon,
	BrainIcon,
	NetworkIcon,
	GlobeIcon,
	CodeIcon,
	LockIcon,
	FingerprintIcon,
	CloudIcon,
	DatabaseIcon,
	ServerIcon,
	KeyIcon,
	FileSearchIcon,
	ActivityIcon,
	AlertTriangleIcon,
	WrenchIcon,
	TerminalIcon,
	SparklesIcon,
	SmartphoneIcon,
	XIcon,
	PlugIcon,
	PlusIcon,
	RefreshCwIcon,
	ExternalLinkIcon,
	CheckCircleIcon,
	TrashIcon,
	XCircleIcon,
	ChevronRightIcon,
} from "lucide-react"
import {
	fetchAwesomeServers,
	type AwesomeMCPServer,
} from "../../lib/awesome-mcp-servers"
import {
	getAddedServers,
	addServer,
	removeServer,
	type AddedMCPServer,
} from "../../lib/mcp-storage"

// ============================================================
// MCP Tools Data
// ============================================================

interface McpTool {
	command: string[]
	description: string
	category: string
	dangerous: boolean
}

const MCP_TOOLS: Record<string, McpTool> = {
	nmap: { command: ["nmap"], description: "Network discovery and security auditing tool", category: "information-gathering", dangerous: false },
	nuclei: { command: ["nuclei"], description: "Fast vulnerability scanner based on templates", category: "web-attack", dangerous: false },
	sqlmap: { command: ["sqlmap"], description: "Automatic SQL injection and database takeover tool", category: "sql-injection", dangerous: true },
	ffuf: { command: ["ffuf"], description: "Fast web fuzzer for directory and parameter discovery", category: "web-attack", dangerous: false },
	nikto: { command: ["nikto"], description: "Web server vulnerability scanner", category: "web-attack", dangerous: false },
	hashcat: { command: ["hashcat"], description: "Advanced password recovery utility", category: "wordlist", dangerous: false },
	john: { command: ["john"], description: "Password cracker", category: "wordlist", dangerous: false },
	hydra: { command: ["hydra"], description: "Network logon cracker", category: "wordlist", dangerous: true },
	wafw00f: { command: ["wafw00f"], description: "Web Application Firewall fingerprinting tool", category: "web-attack", dangerous: false },
	subfinder: { command: ["subfinder"], description: "Subdomain discovery tool", category: "information-gathering", dangerous: false },
	amass: { command: ["amass"], description: "In-depth attack surface mapping and asset discovery", category: "information-gathering", dangerous: false },
	masscan: { command: ["masscan"], description: "TCP port scanner", category: "information-gathering", dangerous: false },
	rustscan: { command: ["rustscan"], description: "Fast port scanner written in Rust", category: "information-gathering", dangerous: false },
	theharvester: { command: ["theHarvester"], description: "Email, subdomain and name harvester", category: "information-gathering", dangerous: false },
	gobuster: { command: ["gobuster"], description: "Directory/file, DNS and VHost busting tool", category: "web-attack", dangerous: false },
	dirsearch: { command: ["dirsearch"], description: "Web path scanner", category: "web-attack", dangerous: false },
	feroxbuster: { command: ["feroxbuster"], description: "Fast, simple, recursive content discovery tool", category: "web-attack", dangerous: false },
	dalfox: { command: ["dalfox"], description: "Powerful open-source XSS scanning tool", category: "xss", dangerous: false },
	xsstrike: { command: ["xsstrike"], description: "Most advanced XSS scanner", category: "xss", dangerous: false },
	bettercap: { command: ["bettercap"], description: "Swiss Army knife for WiFi, BLE and network attacks", category: "wireless", dangerous: true },
	wifite: { command: ["wifite"], description: "Automated wireless attack tool", category: "wireless", dangerous: true },
	responder: { command: ["responder"], description: "LLMNR, NBT-NS and MDNS poisoner", category: "active-directory", dangerous: true },
	bloodhound: { command: ["bloodhound-python"], description: "Active Directory attack path finder", category: "active-directory", dangerous: false },
	impacket: { command: ["impacket-smbclient"], description: "Network protocol tools", category: "active-directory", dangerous: true },
	prowler: { command: ["prowler"], description: "AWS security assessment tool", category: "cloud", dangerous: false },
	trivy: { command: ["trivy"], description: "Container vulnerability scanner", category: "cloud", dangerous: false },
	ghidra: { command: ["ghidra"], description: "Software reverse engineering framework", category: "reverse-engineering", dangerous: false },
	radare2: { command: ["r2"], description: "Reverse engineering framework", category: "reverse-engineering", dangerous: false },
	frida: { command: ["frida"], description: "Dynamic instrumentation toolkit", category: "mobile", dangerous: false },
	sherlock: { command: ["sherlock"], description: "Username OSINT tool", category: "information-gathering", dangerous: false },
	setoolkit: { command: ["setoolkit"], description: "Social engineering toolkit", category: "phishing", dangerous: true },
	mitmproxy: { command: ["mitmproxy"], description: "Interactive HTTPS proxy", category: "web-attack", dangerous: false },
	wireshark: { command: ["wireshark"], description: "Network protocol analyzer", category: "forensics", dangerous: false },
	autopsy: { command: ["autopsy"], description: "Digital forensics platform", category: "forensics", dangerous: false },
	volatility: { command: ["vol3"], description: "Memory forensics framework", category: "forensics", dangerous: false },
	binwalk: { command: ["binwalk"], description: "Firmware analysis tool", category: "forensics", dangerous: false },
	metasploit: { command: ["msfconsole"], description: "Penetration testing framework", category: "exploit-framework", dangerous: true },
	sliver: { command: ["sliver"], description: "Adversary emulation / red team framework", category: "post-exploitation", dangerous: true },
	pwncat: { command: ["pwncat-cs"], description: "Reverse shell manager", category: "post-exploitation", dangerous: true },
	chisel: { command: ["chisel"], description: "Fast TCP/UDP tunnel over HTTP", category: "post-exploitation", dangerous: false },
	cupp: { command: ["cupp"], description: "Common User Passwords Profiler", category: "wordlist", dangerous: false },
	slowloris: { command: ["slowloris"], description: "HTTP DoS tool", category: "ddos", dangerous: true },
	stegcracker: { command: ["stegcracker"], description: "Steganography brute-force tool", category: "steganography", dangerous: false },
	certipy: { command: ["certipy"], description: "Active Directory Certificate Services abuse tool", category: "active-directory", dangerous: true },
	kerbrute: { command: ["kerbrute"], description: "Kerberos brute-force tool", category: "active-directory", dangerous: true },
	pacu: { command: ["pacu"], description: "AWS exploitation framework", category: "cloud", dangerous: true },
	scoutsuite: { command: ["scout"], description: "Multi-cloud security auditing tool", category: "cloud", dangerous: false },
	mobsf: { command: ["mobsf"], description: "Mobile Security Framework", category: "mobile", dangerous: false },
	objection: { command: ["objection"], description: "Runtime mobile exploration", category: "mobile", dangerous: false },
	httpx: { command: ["httpx"], description: "Fast HTTP probing and technology detection", category: "information-gathering", dangerous: false },
	katana: { command: ["katana"], description: "Web crawler by ProjectDiscovery", category: "information-gathering", dangerous: false },
	waybackurls: { command: ["waybackurls"], description: "Fetch URLs from Wayback Machine", category: "information-gathering", dangerous: false },
	gau: { command: ["gau"], description: "Fetch known URLs from AlienVault OTX, Wayback Machine, Common Crawl", category: "information-gathering", dangerous: false },
	subjack: { command: ["subjack"], description: "Subdomain takeover vulnerability scanner", category: "information-gathering", dangerous: false },
	kiterunner: { command: ["kr"], description: "API endpoint discovery and fuzzing tool", category: "web-attack", dangerous: false },
	dnsx: { command: ["dnsx"], description: "DNS toolkit with brute force and resolution", category: "information-gathering", dangerous: false },
	uncover: { command: ["uncover"], description: "Discover exposed hosts from multiple search engines", category: "information-gathering", dangerous: false },
	wapiti: { command: ["wapiti"], description: "Web application vulnerability scanner", category: "web-attack", dangerous: false },
	wfuzz: { command: ["wfuzz"], description: "Web application fuzzer", category: "web-attack", dangerous: false },
	arjun: { command: ["arjun"], description: "HTTP parameter discovery suite", category: "web-attack", dangerous: false },
	cewl: { command: ["cewl"], description: "Custom wordlist generator from websites", category: "wordlist", dangerous: false },
	crunch: { command: ["crunch"], description: "Wordlist generator based on character sets", category: "wordlist", dangerous: false },
	grype: { command: ["grype"], description: "Container image vulnerability scanner", category: "cloud", dangerous: false },
	syft: { command: ["syft"], description: "Software Bill of Materials (SBOM) generator", category: "cloud", dangerous: false },
	checkov: { command: ["checkov"], description: "Infrastructure as Code security scanner", category: "cloud", dangerous: false },
	semgrep: { command: ["semgrep"], description: "Static analysis (SAST) for finding bugs and vulnerabilities", category: "sast", dangerous: false },
	bandit: { command: ["bandit"], description: "Python security linter", category: "sast", dangerous: false },
	gitleaks: { command: ["gitleaks"], description: "Secrets detection in git repositories", category: "secrets", dangerous: false },
	trufflehog: { command: ["trufflehog"], description: "Deep secret scanning in git repos and files", category: "secrets", dangerous: false },
	apktool: { command: ["apktool"], description: "Android APK reverse engineering tool", category: "reverse-engineering", dangerous: false },
	jadx: { command: ["jadx"], description: "Java and Android source code decompiler", category: "reverse-engineering", dangerous: false },
	zmap: { command: ["zmap"], description: "Fast single-packet network scanner", category: "information-gathering", dangerous: false },
	unicornscan: { command: ["unicornscan"], description: "Asynchronous TCP and UDP scanner", category: "information-gathering", dangerous: false },
	netdiscover: { command: ["netdiscover"], description: "ARP scan for network discovery", category: "information-gathering", dangerous: false },
	ligolo: { command: ["ligolo-proxy"], description: "Tunneling tool for pentesting (alternative to chisel)", category: "post-exploitation", dangerous: false },
	sleuthkit: { command: ["fls"], description: "Disk forensics suite", category: "forensics", dangerous: false },
	"bulk-extractor": { command: ["bulk_extractor"], description: "Extract emails, URLs, credit cards from disk images", category: "forensics", dangerous: false },
	foremost: { command: ["foremost"], description: "File carving and recovery tool", category: "forensics", dangerous: false },
	cloud_enum: { command: ["cloud_enum"], description: "Multi-cloud OSINT enumeration", category: "cloud", dangerous: false },
	"meterpreter": { command: ["meterpreter"], description: "Advanced payload for Metasploit sessions", category: "exploit-framework", dangerous: true },
	"empire": { command: ["powershell-empire"], description: "Post-exploitation framework with PowerShell agents", category: "post-exploitation", dangerous: true },
	"covenant": { command: ["covenant"], description: "Collaborative C# .NET command and control framework", category: "exploit-framework", dangerous: true },
	"shellteaser": { command: ["shellteaser"], description: "Automated shell script generator for reverse shells", category: "post-exploitation", dangerous: true },
	"weevely": { command: ["weevely"], description: "Web shell for PHP backdoor access", category: "web-attack", dangerous: true },
	"commix": { command: ["commix"], description: "Automated command injection and exploitation tool", category: "web-attack", dangerous: true },
	"routersploit": { command: ["routersploit"], description: "Exploitation framework for embedded devices", category: "exploit-framework", dangerous: true },
	"wifipumpkin3": { command: ["wifipumpkin3"], description: "Rogue access point framework for MITM attacks", category: "wireless", dangerous: true },
	"fluxion": { command: ["fluxion"], description: "WPA social engineering attack tool", category: "wireless", dangerous: true },
	"kismet": { command: ["kismet"], description: "Wireless network detector, sniffer, and IDS", category: "wireless", dangerous: false },
	"aircrack-ng": { command: ["aircrack-ng"], description: "WiFi security auditing tool suite", category: "wireless", dangerous: true },
	"reaver": { command: ["reaver"], description: "WPS brute force attack tool", category: "wireless", dangerous: true },
	"hashcat-advanced": { command: ["hashcat"], description: "Advanced GPU-based password recovery", category: "wordlist", dangerous: true },
	"medusa": { command: ["medusa"], description: "Fast, massively parallel, modular, login brute-forcer", category: "wordlist", dangerous: true },
	"ncrack": { command: ["ncrack"], description: "High-speed network authentication cracking", category: "wordlist", dangerous: true },
	"ophcrack": { command: ["ophcrack"], description: "Windows password cracker using rainbow tables", category: "wordlist", dangerous: true },
	"burpsuite": { command: ["burpsuite"], description: "Integrated platform for web application security testing", category: "web-attack", dangerous: true },
	"owasp-zap": { command: ["zap-cli"], description: "OWASP ZAP automated web application scanner", category: "web-attack", dangerous: true },
	"dirbuster": { command: ["dirb"], description: "Web content scanner and directory brute-forcer", category: "web-attack", dangerous: false },
	"skipfish": { command: ["skipfish"], description: "Active web application security reconnaissance tool", category: "web-attack", dangerous: false },
	"lynis": { command: ["lynis"], description: "Security auditing tool for Unix-based systems", category: "forensics", dangerous: false },
	"openvas": { command: ["openvas"], description: "Full-featured vulnerability scanner", category: "web-attack", dangerous: false },
	"nessus": { command: ["nessus"], description: "Comprehensive vulnerability scanner", category: "web-attack", dangerous: false },
	"snort": { command: ["snort"], description: "Network intrusion detection and prevention system", category: "forensics", dangerous: false },
	"suricata": { command: ["suricata"], description: "High performance Network IDS, IPS, and NSM engine", category: "forensics", dangerous: false },
	"ossec": { command: ["ossec"], description: "Open source Host-based Intrusion Detection System", category: "forensics", dangerous: false },
	"wazuh": { command: ["wazuh"], description: "Open source security platform for threat detection", category: "forensics", dangerous: false },
	"arkime": { command: ["arkime"], description: "Full packet capture and search tool", category: "forensics", dangerous: false },
	"networkminer": { command: ["networkminer"], description: "Network forensic analysis tool", category: "forensics", dangerous: false },
	"dnsrecon": { command: ["dnsrecon"], description: "DNS enumeration and reconnaissance tool", category: "information-gathering", dangerous: false },
	"fierce": { command: ["fierce"], description: "DNS reconnaissance tool for locating non-contiguous IP space", category: "information-gathering", dangerous: false },
	"enum4linux": { command: ["enum4linux"], description: "Tool for enumerating information from Windows/Samba systems", category: "information-gathering", dangerous: false },
	"smbclient": { command: ["smbclient"], description: "SMB/CIFS client for file sharing", category: "information-gathering", dangerous: false },
	"nbtscan": { command: ["nbtscan"], description: "Scan for NetBIOS names on a network", category: "information-gathering", dangerous: false },
	"onesixtyone": { command: ["onesixtyone"], description: "SNMP community string scanner", category: "information-gathering", dangerous: false },
	"snmpcheck": { command: ["snmpcheck"], description: "SNMP enumeration tool", category: "information-gathering", dangerous: false },
}

// ============================================================
// Categories with icons and colors
// ============================================================

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof NetworkIcon; color: string; gradient: string }> = {
	"information-gathering": { label: "Recon", icon: SearchIcon, color: "text-blue-500", gradient: "from-blue-500/10 to-blue-500/5" },
	"web-attack": { label: "Web", icon: GlobeIcon, color: "text-orange-500", gradient: "from-orange-500/10 to-orange-500/5" },
	"sql-injection": { label: "SQLi", icon: DatabaseIcon, color: "text-red-500", gradient: "from-red-500/10 to-red-500/5" },
	xss: { label: "XSS", icon: CodeIcon, color: "text-yellow-500", gradient: "from-yellow-500/10 to-yellow-500/5" },
	wireless: { label: "Wireless", icon: NetworkIcon, color: "text-cyan-500", gradient: "from-cyan-500/10 to-cyan-500/5" },
	"active-directory": { label: "AD", icon: ServerIcon, color: "text-purple-500", gradient: "from-purple-500/10 to-purple-500/5" },
	cloud: { label: "Cloud", icon: CloudIcon, color: "text-sky-500", gradient: "from-sky-500/10 to-sky-500/5" },
	"reverse-engineering": { label: "Reverse", icon: WrenchIcon, color: "text-pink-500", gradient: "from-pink-500/10 to-pink-500/5" },
	mobile: { label: "Mobile", icon: SmartphoneIcon, color: "text-green-500", gradient: "from-green-500/10 to-green-500/5" },
	phishing: { label: "Phishing", icon: FingerprintIcon, color: "text-amber-500", gradient: "from-amber-500/10 to-amber-500/5" },
	forensics: { label: "Forensics", icon: FileSearchIcon, color: "text-teal-500", gradient: "from-teal-500/10 to-teal-500/5" },
	"exploit-framework": { label: "Exploit", icon: ShieldIcon, color: "text-red-600", gradient: "from-red-600/10 to-red-600/5" },
	"post-exploitation": { label: "Post-Exploit", icon: LockIcon, color: "text-rose-500", gradient: "from-rose-500/10 to-rose-500/5" },
	wordlist: { label: "Wordlist", icon: KeyIcon, color: "text-lime-500", gradient: "from-lime-500/10 to-lime-500/5" },
	ddos: { label: "DDoS", icon: ActivityIcon, color: "text-red-400", gradient: "from-red-400/10 to-red-400/5" },
	steganography: { label: "Stego", icon: FileSearchIcon, color: "text-violet-500", gradient: "from-violet-500/10 to-violet-500/5" },
	sast: { label: "SAST", icon: CodeIcon, color: "text-indigo-500", gradient: "from-indigo-500/10 to-indigo-500/5" },
	secrets: { label: "Secrets", icon: LockIcon, color: "text-amber-600", gradient: "from-amber-600/10 to-amber-600/5" },
}

// ============================================================
// Skill categories
// ============================================================

const SKILL_CATEGORIES = [
	{ id: "security", label: "Security", icon: ShieldIcon, color: "text-red-500", gradient: "from-red-500/10 to-red-500/5", skills: ["hacking-tools", "red-team-ops", "penetration-testing", "bug-bounty", "security-audit", "blue-team-defense", "purple-team", "malware-analysis", "digital-forensics", "incident-response", "social-engineering", "web-application-security", "mobile-security", "cloud-security", "iot-security", "scada-ics-security", "osint", "cryptography", "zero-trust-architecture", "threat-modeling", "supply-chain-security"] },
	{ id: "ai-ml", label: "AI & ML", icon: BrainIcon, color: "text-purple-500", gradient: "from-purple-500/10 to-purple-500/5", skills: ["ai-tutor", "ai-vision", "model-finetuning", "model-routing", "llm-deployment", "llm-evaluation", "prompt-engineering", "prompt-optimization", "rag-advanced", "rag-builder", "embedding-manager", "deep-thinking", "reasoning-engine", "multi-agent", "agent-reach", "pi-computer-use", "agent-builder"] },
	{ id: "agent-frameworks", label: "Agents", icon: NetworkIcon, color: "text-indigo-500", gradient: "from-indigo-500/10 to-indigo-500/5", skills: ["langgraph", "autogen", "crewai", "smolagents", "langflow", "llama-index-agents"] },
	{ id: "claude-skills", label: "Claude", icon: SparklesIcon, color: "text-amber-500", gradient: "from-amber-500/10 to-amber-500/5", skills: ["anthropic-skills", "openskills", "awesome-claude-skills", "claude-agent-skills"] },
	{ id: "memory", label: "Memory", icon: DatabaseIcon, color: "text-emerald-500", gradient: "from-emerald-500/10 to-emerald-500/5", skills: ["mem0", "chroma", "qdrant"] },
	{ id: "sandboxing", label: "Sandbox", icon: ShieldIcon, color: "text-cyan-500", gradient: "from-cyan-500/10 to-cyan-500/5", skills: ["e2b", "openhands"] },
	{ id: "observability", label: "Observability", icon: ActivityIcon, color: "text-orange-500", gradient: "from-orange-500/10 to-orange-500/5", skills: ["langfuse"] },
	{ id: "rag-tools", label: "RAG", icon: FileSearchIcon, color: "text-blue-500", gradient: "from-blue-500/10 to-blue-500/5", skills: ["haystack"] },
	{ id: "web-scraping", label: "Scraping", icon: GlobeIcon, color: "text-pink-500", gradient: "from-pink-500/10 to-pink-500/5", skills: ["firecrawl"] },
	{ id: "development", label: "Dev", icon: CodeIcon, color: "text-green-500", gradient: "from-green-500/10 to-green-500/5", skills: ["react-best-practices", "typescript-patterns", "nextjs-developer", "vue-expert", "angular-expert", "flutter-expert", "swift-swiftui", "kotlin-compose", "go-developer", "rust-expert", "cpp-expert", "csharp-expert", "java-expert", "javascript-expert", "python-automation", "php-expert", "nodejs-expert", "express-expert", "nestjs-expert", "laravel-expert", "mongodb-expert", "mysql-expert", "redis-expert", "sql-postgresql", "sqlite-bun"] },
	{ id: "devops", label: "DevOps", icon: ServerIcon, color: "text-cyan-500", gradient: "from-cyan-500/10 to-cyan-500/5", skills: ["docker-patterns", "kubernetes-assistant", "kubernetes-advanced", "kubernetes-security", "ci-cd-pipeline", "terraform-expert", "ansible-automation", "prometheus-grafana", "nginx-litespeed", "service-mesh", "cloudflare-management", "vps-management", "ssh-manager", "ssl-certificates"] },
	{ id: "data", label: "Data", icon: DatabaseIcon, color: "text-amber-500", gradient: "from-amber-500/10 to-amber-500/5", skills: ["data-analysis", "data-cleaning", "data-pipeline", "database-designer", "database-migrator", "dbt-transformations", "snowflake-warehouse", "csv-processing", "excel-automation", "business-intelligence"] },
	{ id: "productivity", label: "Productivity", icon: ZapIcon, color: "text-yellow-500", gradient: "from-yellow-500/10 to-yellow-500/5", skills: ["calendar-assistant", "meeting-recorder", "meeting-scheduler", "task-manager", "project-manager", "sprint-planning", "okr-management", "kanban-manager", "time-tracker", "habit-tracker", "reminder-manager", "planning-engine"] },
	{ id: "content", label: "Content", icon: SparklesIcon, color: "text-pink-500", gradient: "from-pink-500/10 to-pink-500/5", skills: ["blog-writer", "content-writer", "copywriter", "email-writer", "technical-architecture", "documentation-writer", "report-generator", "proposal-writer", "ad-copy-writer", "social-media-writer", "seo-expert", "keyword-research"] },
	{ id: "creative", label: "Creative", icon: SparklesIcon, color: "text-violet-500", gradient: "from-violet-500/10 to-violet-500/5", skills: ["image-generator", "image-editor", "image-processing", "video-editor", "video-generator", "music-generator", "animation", "animation-advanced", "motion-design", "ui-ux-pro-designer", "figma-to-code", "3d-model-viewer"] },
]

// ============================================================
// Skill details (what each skill does)
// ============================================================

const SKILL_DETAILS: Record<string, { title: string; description: string; useCases: string[] }> = {
	"hacking-tools": { title: "Hacking Tools", description: "Master 72+ security tools including nmap, sqlmap, metasploit, burpsuite, and more.", useCases: ["Pentesting", "Vulnerability assessment", "Security auditing"] },
	"red-team-ops": { title: "Red Team Operations", description: "Advanced adversary simulation tactics, techniques, and procedures.", useCases: ["Adversary emulation", "Red team exercises", "Attack simulation"] },
	"penetration-testing": { title: "Penetration Testing", description: "Structured methodology for testing systems, networks, and applications.", useCases: ["Network pentesting", "Web app testing", "API security"] },
	"bug-bounty": { title: "Bug Bounty Hunting", description: "Strategies for finding and reporting security bugs in bug bounty programs.", useCases: ["Finding vulnerabilities", "Writing reports", "Maximizing payouts"] },
	"security-audit": { title: "Security Audit", description: "Comprehensive security assessment methodology for organizations.", useCases: ["Compliance checks", "Risk assessment", "Policy review"] },
	"blue-team-defense": { title: "Blue Team Defense", description: "Defensive security operations, monitoring, and incident response.", useCases: ["SOC operations", "Threat detection", "Incident handling"] },
	"purple-team": { title: "Purple Team", description: "Collaborative approach combining offensive and defensive teams.", useCases: ["Team collaboration", "Gap analysis", "Security improvement"] },
	"malware-analysis": { title: "Malware Analysis", description: "Static and dynamic analysis of malicious software.", useCases: ["Reverse engineering", "IOC extraction", "Threat intelligence"] },
	"digital-forensics": { title: "Digital Forensics", description: "Investigation techniques for collecting digital evidence.", useCases: ["Incident investigation", "Evidence collection", "Legal proceedings"] },
	"incident-response": { title: "Incident Response", description: "Structured approach to handling security breaches.", useCases: ["Breach handling", "Recovery planning", "Post-incident review"] },
	"social-engineering": { title: "Social Engineering", description: "Psychological manipulation techniques in security testing.", useCases: ["Phishing tests", "Awareness training", "Security assessments"] },
	"web-application-security": { title: "Web App Security", description: "OWASP Top 10 and beyond - securing web applications.", useCases: ["XSS prevention", "CSRF protection", "SQL injection defense"] },
	"mobile-security": { title: "Mobile Security", description: "Security testing for Android and iOS applications.", useCases: ["App testing", "API security", "Data protection"] },
	"cloud-security": { title: "Cloud Security", description: "Security best practices for AWS, Azure, and GCP.", useCases: ["IAM policies", "Storage security", "Network config"] },
	"iot-security": { title: "IoT Security", description: "Security testing for IoT devices and protocols.", useCases: ["Device testing", "Protocol analysis", "Firmware analysis"] },
	"scada-ics-security": { title: "SCADA/ICS Security", description: "Industrial control system security.", useCases: ["PLC testing", "OT security", "Critical infrastructure"] },
	"osint": { title: "OSINT", description: "Open Source Intelligence gathering techniques.", useCases: ["Reconnaissance", "Information gathering", "Investigation"] },
	"cryptography": { title: "Cryptography", description: "Cryptographic algorithms and protocols.", useCases: ["Encryption", "Key management", "Protocol analysis"] },
	"zero-trust-architecture": { title: "Zero Trust", description: "Implementing zero trust security models.", useCases: ["Network segmentation", "Identity verification", "Access control"] },
	"threat-modeling": { title: "Threat Modeling", description: "Systematic approach to identifying security threats.", useCases: ["Risk assessment", "Architecture review", "Security design"] },
	"supply-chain-security": { title: "Supply Chain Security", description: "Securing software supply chain.", useCases: ["Dependency auditing", "Build security", "CI/CD security"] },
	"ai-tutor": { title: "AI Tutor", description: "Personalized AI-powered learning assistant.", useCases: ["Learning concepts", "Explaining topics", "Study materials"] },
	"ai-vision": { title: "AI Vision", description: "Image analysis and visual understanding using AI.", useCases: ["Image classification", "OCR", "Visual Q&A"] },
	"model-finetuning": { title: "Model Fine-tuning", description: "Fine-tuning pre-trained models for specific tasks.", useCases: ["Custom training", "Domain adaptation", "Optimization"] },
	"model-routing": { title: "Model Routing", description: "Intelligent routing to optimal AI models.", useCases: ["Cost optimization", "Performance tuning", "Task matching"] },
	"llm-deployment": { title: "LLM Deployment", description: "Deploying large language models in production.", useCases: ["API setup", "Scaling", "Cost management"] },
	"llm-evaluation": { title: "LLM Evaluation", description: "Evaluating language model performance.", useCases: ["Benchmarking", "Quality assessment", "A/B testing"] },
	"prompt-engineering": { title: "Prompt Engineering", description: "Crafting effective prompts for better AI responses.", useCases: ["Better outputs", "Task automation", "Chain of thought"] },
	"prompt-optimization": { title: "Prompt Optimization", description: "Improving prompt effectiveness systematically.", useCases: ["Testing prompts", "Iterative improvement", "Performance tracking"] },
	"rag-advanced": { title: "Advanced RAG", description: "Retrieval-Augmented Generation with advanced techniques.", useCases: ["Document Q&A", "Knowledge bases", "Context enhancement"] },
	"rag-builder": { title: "RAG Builder", description: "Building production-ready RAG systems.", useCases: ["Vector databases", "Embedding pipelines", "Search optimization"] },
	"embedding-manager": { title: "Embedding Manager", description: "Managing text embeddings for search and retrieval.", useCases: ["Vector storage", "Similarity search", "Batch processing"] },
	"deep-thinking": { title: "Deep Thinking", description: "Advanced reasoning for complex problems.", useCases: ["Problem solving", "Decision making", "Critical analysis"] },
	"reasoning-engine": { title: "Reasoning Engine", description: "Logical reasoning and problem decomposition.", useCases: ["Algorithm design", "Logic puzzles", "Complex analysis"] },
	"multi-agent": { title: "Multi-Agent Systems", description: "Coordinating multiple AI agents.", useCases: ["Task delegation", "Parallel processing", "Agent orchestration"] },
	"agent-reach": { title: "Agent Reach", description: "Access internet, search web, scrape websites.", useCases: ["Web search", "Social media", "Data extraction"] },
	"pi-computer-use": { title: "Computer Use", description: "Control desktop applications and automate GUI.", useCases: ["Desktop automation", "App control", "GUI testing"] },
	"agent-builder": { title: "Agent Builder", description: "Create and deploy custom AI agents.", useCases: ["Agent creation", "Tool integration", "Workflow automation"] },
	"langgraph": { title: "LangGraph", description: "Build stateful applications with LLMs using graphs.", useCases: ["State machines", "Multi-agent", "Complex workflows"] },
	"autogen": { title: "AutoGen", description: "Microsoft's multi-agent conversation framework.", useCases: ["Multi-agent chat", "Code generation", "Problem solving"] },
	"crewai": { title: "CrewAI", description: "Orchestrating role-playing AI agents.", useCases: ["Role-based agents", "Team collaboration", "Task delegation"] },
	"smolagents": { title: "Smolagents", description: "Minimalist framework for AI agents.", useCases: ["Simple agents", "Tool usage", "Quick prototyping"] },
	"langflow": { title: "Langflow", description: "Visual framework for building multi-agent systems.", useCases: ["Visual workflows", "No-code", "Rapid prototyping"] },
	"llama-index-agents": { title: "LlamaIndex Agents", description: "Production-ready multi-agent systems with RAG.", useCases: ["RAG agents", "Document agents", "Data workflows"] },
	"anthropic-skills": { title: "Anthropic Skills", description: "Official Anthropic skills for Claude Code.", useCases: ["Best practices", "Official patterns", "Claude optimization"] },
	"openskills": { title: "OpenSkills", description: "Universal skill loader for AI agents.", useCases: ["Cross-platform", "Skill sharing", "Universal loading"] },
	"awesome-claude-skills": { title: "Awesome Claude Skills", description: "Curated list of Claude Code skills.", useCases: ["Community skills", "Best practices", "Discovery"] },
	"claude-agent-skills": { title: "Claude Agent Skills", description: "Claude skills examples with API usage.", useCases: ["API patterns", "Examples", "Integration"] },
	"react-best-practices": { title: "React Best Practices", description: "Modern React patterns, hooks, performance.", useCases: ["Component design", "State management", "Performance"] },
	"typescript-patterns": { title: "TypeScript Patterns", description: "Advanced TypeScript patterns and type safety.", useCases: ["Type safety", "Code quality", "API contracts"] },
	"nextjs-developer": { title: "Next.js Developer", description: "Full-stack Next.js with App Router.", useCases: ["Web apps", "SSR/SSG", "API routes"] },
	"vue-expert": { title: "Vue.js Expert", description: "Vue 3 composition API and ecosystem.", useCases: ["SPA development", "Component design", "State management"] },
	"angular-expert": { title: "Angular Expert", description: "Angular 17+ with signals and standalone.", useCases: ["Enterprise apps", "Component architecture", "State management"] },
	"flutter-expert": { title: "Flutter Expert", description: "Cross-platform mobile with Flutter.", useCases: ["Mobile apps", "UI design", "Platform integration"] },
	"swift-swiftui": { title: "Swift & SwiftUI", description: "Native iOS development.", useCases: ["iOS apps", "UI design", "Platform features"] },
	"kotlin-compose": { title: "Kotlin & Compose", description: "Android with Kotlin and Compose.", useCases: ["Android apps", "UI design", "Platform features"] },
	"go-developer": { title: "Go Developer", description: "Go best practices and concurrency.", useCases: ["Backend services", "CLI tools", "Microservices"] },
	"rust-expert": { title: "Rust Expert", description: "Systems programming with Rust.", useCases: ["System tools", "WebAssembly", "Performance code"] },
	"cpp-expert": { title: "C++ Expert", description: "Modern C++17/20/23 patterns.", useCases: ["Game engines", "Embedded systems", "HPC"] },
	"csharp-expert": { title: "C# Expert", description: "Modern C# with .NET.", useCases: [".NET apps", "Desktop development", "Game development"] },
	"java-expert": { title: "Java Expert", description: "Enterprise Java with Spring Boot.", useCases: ["Enterprise apps", "Microservices", "Android backend"] },
	"javascript-expert": { title: "JavaScript Expert", description: "Modern JavaScript/ES2024+.", useCases: ["Web development", "Node.js", "Cross-platform"] },
	"python-automation": { title: "Python Automation", description: "Automating tasks with Python.", useCases: ["Task automation", "Scripting", "Data processing"] },
	"php-expert": { title: "PHP Expert", description: "Modern PHP 8+ and Laravel.", useCases: ["Web apps", "APIs", "WordPress"] },
	"nodejs-expert": { title: "Node.js Expert", description: "Server-side JavaScript with Node.js.", useCases: ["APIs", "Real-time apps", "Microservices"] },
	"express-expert": { title: "Express.js Expert", description: "Express.js middleware and routing.", useCases: ["REST APIs", "Web servers", "Middleware"] },
	"nestjs-expert": { title: "NestJS Expert", description: "Enterprise Node.js framework.", useCases: ["Enterprise APIs", "Microservices", "GraphQL"] },
	"laravel-expert": { title: "Laravel Expert", description: "PHP framework with Eloquent.", useCases: ["Web apps", "APIs", "E-commerce"] },
	"mongodb-expert": { title: "MongoDB Expert", description: "Document database design.", useCases: ["NoSQL design", "Query optimization", "Scaling"] },
	"mysql-expert": { title: "MySQL Expert", description: "Relational database optimization.", useCases: ["Database design", "Query tuning", "Replication"] },
	"redis-expert": { title: "Redis Expert", description: "In-memory data store.", useCases: ["Caching", "Session storage", "Pub/Sub"] },
	"sql-postgresql": { title: "PostgreSQL Expert", description: "Advanced SQL and extensions.", useCases: ["Complex queries", "Data analysis", "Geospatial"] },
	"sqlite-bun": { title: "SQLite & Bun", description: "Lightweight database with Bun.", useCases: ["Local storage", "Embedded apps", "Testing"] },
	"docker-patterns": { title: "Docker Patterns", description: "Container best practices.", useCases: ["Containerization", "Dev environments", "Deployment"] },
	"kubernetes-assistant": { title: "Kubernetes Assistant", description: "K8s resource management.", useCases: ["Cluster management", "Debugging", "Scaling"] },
	"kubernetes-advanced": { title: "Advanced Kubernetes", description: "Service mesh and operators.", useCases: ["Complex deployments", "Operators", "Networking"] },
	"kubernetes-security": { title: "Kubernetes Security", description: "Securing K8s clusters.", useCases: ["RBAC", "Network policies", "Secret management"] },
	"ci-cd-pipeline": { title: "CI/CD Pipeline", description: "Automated build and deploy.", useCases: ["GitHub Actions", "GitLab CI", "Deployment automation"] },
	"terraform-expert": { title: "Terraform Expert", description: "Infrastructure as Code.", useCases: ["Cloud provisioning", "Resource management", "State management"] },
	"ansible-automation": { title: "Ansible Automation", description: "Configuration management.", useCases: ["Server setup", "Configuration", "Orchestration"] },
	"prometheus-grafana": { title: "Prometheus & Grafana", description: "Monitoring and visualization.", useCases: ["Metrics collection", "Dashboards", "Alerting"] },
	"nginx-litespeed": { title: "Nginx & LiteSpeed", description: "Web server configuration.", useCases: ["Reverse proxy", "Load balancing", "SSL setup"] },
	"service-mesh": { title: "Service Mesh", description: "Istio and Linkerd.", useCases: ["Traffic management", "Security", "Observability"] },
	"cloudflare-management": { title: "Cloudflare", description: "CDN, DNS, Workers.", useCases: ["Edge computing", "DDoS protection", "Analytics"] },
	"vps-management": { title: "VPS Management", description: "Server administration.", useCases: ["Server setup", "Maintenance", "Troubleshooting"] },
	"ssh-manager": { title: "SSH Manager", description: "Secure shell key management.", useCases: ["Remote access", "Tunneling", "Key management"] },
	"ssl-certificates": { title: "SSL Certificates", description: "TLS/SSL certificate management.", useCases: ["Certificate issuance", "Renewal", "Configuration"] },
	"data-analysis": { title: "Data Analysis", description: "Exploratory data analysis.", useCases: ["Business intelligence", "Trend analysis", "Decision support"] },
	"data-cleaning": { title: "Data Cleaning", description: "Data wrangling and normalization.", useCases: ["ETL pipelines", "Data preparation", "Quality assurance"] },
	"data-pipeline": { title: "Data Pipeline", description: "Building data workflows.", useCases: ["Data integration", "Automation", "Scalability"] },
	"database-designer": { title: "Database Designer", description: "Schema design and modeling.", useCases: ["New projects", "Optimization", "Migration planning"] },
	"database-migrator": { title: "Database Migrator", description: "Schema migration strategies.", useCases: ["Schema changes", "Version control", "Rollbacks"] },
	"dbt-transformations": { title: "dbt Transformations", description: "Data build tool.", useCases: ["Data modeling", "Testing", "Documentation"] },
	"snowflake-warehouse": { title: "Snowflake", description: "Cloud data warehouse.", useCases: ["Data warehousing", "Query optimization", "Cost management"] },
	"csv-processing": { title: "CSV Processing", description: "Parsing and transforming CSV.", useCases: ["Data import", "Transformation", "Analysis"] },
	"excel-automation": { title: "Excel Automation", description: "Automating Excel tasks.", useCases: ["Report generation", "Data processing", "Templates"] },
	"business-intelligence": { title: "Business Intelligence", description: "BI dashboards and KPIs.", useCases: ["Reporting", "Visualization", "Metrics tracking"] },
	"calendar-assistant": { title: "Calendar Assistant", description: "Smart scheduling.", useCases: ["Meeting scheduling", "Time blocking", "Conflict resolution"] },
	"meeting-recorder": { title: "Meeting Recorder", description: "Meeting notes and action items.", useCases: ["Note taking", "Action items", "Follow-ups"] },
	"meeting-scheduler": { title: "Meeting Scheduler", description: "Finding optimal meeting times.", useCases: ["Scheduling", "Time zone handling", "Invitations"] },
	"task-manager": { title: "Task Manager", description: "Task organization and tracking.", useCases: ["Todo management", "Prioritization", "Deadline tracking"] },
	"project-manager": { title: "Project Manager", description: "Project planning and tracking.", useCases: ["Planning", "Resource management", "Reporting"] },
	"sprint-planning": { title: "Sprint Planning", description: "Agile sprint planning.", useCases: ["Backlog grooming", "Estimation", "Retrospectives"] },
	"okr-management": { title: "OKR Management", description: "Objectives and Key Results.", useCases: ["Goal setting", "Progress tracking", "Alignment"] },
	"kanban-manager": { title: "Kanban Manager", description: "Visual workflow management.", useCases: ["Workflow visualization", "WIP limits", "Flow optimization"] },
	"time-tracker": { title: "Time Tracker", description: "Time logging and reporting.", useCases: ["Time logging", "Productivity insights", "Client billing"] },
	"habit-tracker": { title: "Habit Tracker", description: "Building productive habits.", useCases: ["Habit building", "Streak tracking", "Behavior change"] },
	"reminder-manager": { title: "Reminder Manager", description: "Smart reminders.", useCases: ["Task reminders", "Deadline alerts", "Follow-ups"] },
	"planning-engine": { title: "Planning Engine", description: "Automated planning.", useCases: ["Resource planning", "Timeline optimization", "Dependency management"] },
	"blog-writer": { title: "Blog Writer", description: "Creating engaging blog posts.", useCases: ["Content creation", "SEO writing", "Audience engagement"] },
	"content-writer": { title: "Content Writer", description: "Professional content writing.", useCases: ["Website content", "Articles", "Marketing copy"] },
	"copywriter": { title: "Copywriter", description: "Persuasive copywriting.", useCases: ["Ad copy", "Landing pages", "Email campaigns"] },
	"email-writer": { title: "Email Writer", description: "Professional email composition.", useCases: ["Cold outreach", "Newsletters", "Follow-ups"] },
	"technical-architecture": { title: "Technical Architecture", description: "System design documentation.", useCases: ["Design docs", "Architecture diagrams", "Technical specs"] },
	"documentation-writer": { title: "Documentation Writer", description: "Technical documentation.", useCases: ["API docs", "User guides", "README files"] },
	"report-generator": { title: "Report Generator", description: "Automated report generation.", useCases: ["Business reports", "Analytics", "Dashboards"] },
	"proposal-writer": { title: "Proposal Writer", description: "Business proposals.", useCases: ["Client proposals", "Project scope", "SOW documents"] },
	"ad-copy-writer": { title: "Ad Copy Writer", description: "Advertising copy.", useCases: ["Social ads", "Google ads", "Display ads"] },
	"social-media-writer": { title: "Social Media Writer", description: "Social media content.", useCases: ["Posts", "Threads", "Content calendars"] },
	"seo-expert": { title: "SEO Expert", description: "Search engine optimization.", useCases: ["Keyword research", "On-page SEO", "Content strategy"] },
	"keyword-research": { title: "Keyword Research", description: "Finding search keywords.", useCases: ["Keyword discovery", "Competition analysis", "Content planning"] },
	"image-generator": { title: "Image Generator", description: "AI-powered image creation.", useCases: ["Art generation", "Photo editing", "Design creation"] },
	"image-editor": { title: "Image Editor", description: "Advanced image editing.", useCases: ["Photo editing", "Graphic design", "Retouching"] },
	"image-processing": { title: "Image Processing", description: "Automated image pipelines.", useCases: ["Batch processing", "Filters", "Optimization"] },
	"video-editor": { title: "Video Editor", description: "Video editing and effects.", useCases: ["Video editing", "Effects", "Transitions"] },
	"video-generator": { title: "Video Generator", description: "AI-powered video creation.", useCases: ["Video creation", "Animation", "Motion graphics"] },
	"music-generator": { title: "Music Generator", description: "AI music composition.", useCases: ["Music creation", "Sound design", "Audio editing"] },
	"animation": { title: "Animation", description: "2D and 3D animation.", useCases: ["Character animation", "Motion graphics", "Visual effects"] },
	"animation-advanced": { title: "Advanced Animation", description: "Complex animation systems.", useCases: ["Rigging", "Particle systems", "Physics simulation"] },
	"motion-design": { title: "Motion Design", description: "Motion graphics for video.", useCases: ["Title sequences", "Explainers", "Promos"] },
	"ui-ux-pro-designer": { title: "UI/UX Pro Designer", description: "Professional UI/UX design.", useCases: ["Wireframing", "Prototyping", "Design systems"] },
	"figma-to-code": { title: "Figma to Code", description: "Converting Figma to code.", useCases: ["Design handoff", "Component generation", "Responsive design"] },
	"3d-model-viewer": { title: "3D Model Viewer", description: "3D model viewing.", useCases: ["3D visualization", "Model optimization", "WebGL"] },
	"mem0": { title: "Mem0", description: "Memory layer for AI agents.", useCases: ["Agent memory", "Personalization", "Context retention"] },
	"chroma": { title: "Chroma", description: "Embedding database.", useCases: ["Vector storage", "Similarity search", "Embeddings"] },
	"qdrant": { title: "Qdrant", description: "Vector similarity search.", useCases: ["Vector search", "Semantic search", "Recommendation"] },
	"e2b": { title: "E2B", description: "Cloud sandboxing.", useCases: ["Safe code execution", "Code interpreter", "Sandboxed environments"] },
	"openhands": { title: "OpenHands", description: "AI software development agent.", useCases: ["AI development", "Code generation", "Software engineering"] },
	"langfuse": { title: "Langfuse", description: "LLM engineering platform.", useCases: ["LLM tracing", "Cost tracking", "Quality monitoring"] },
	"haystack": { title: "Haystack", description: "NLP and RAG pipelines.", useCases: ["Document search", "Q&A systems", "Information retrieval"] },
	"firecrawl": { title: "Firecrawl", description: "Web scraping for AI.", useCases: ["Web scraping", "Content extraction", "Crawling"] },
}

// ============================================================
// All skills list
// ============================================================

const ALL_SKILLS = SKILL_CATEGORIES.flatMap((cat) =>
	cat.skills.map((skill) => ({
		name: skill,
		category: cat.id,
		categoryLabel: cat.label,
		details: SKILL_DETAILS[skill] || { title: skill, description: "Skill details loading...", useCases: [] },
	}))
)

// ============================================================
// Helper: get unique categories from MCP tools
// ============================================================

const MCP_CATEGORIES = [...new Set(Object.values(MCP_TOOLS).map((t) => t.category))]

// ============================================================
// Main Component
// ============================================================

type TabType = "skills" | "mcp" | "servers"

type FilterType = "all" | "dangerous"

export function SkillsMcpSettings() {
	const [activeTab, setActiveTab] = useState<TabType>("skills")
	const [search, setSearch] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
	const [filterType, setFilterType] = useState<FilterType>("all")

	// Filter skills
	const filteredSkills = useMemo(() => {
		let result = ALL_SKILLS
		if (search) {
			const q = search.toLowerCase()
			result = result.filter((s) => s.name.toLowerCase().includes(q) || s.categoryLabel.toLowerCase().includes(q))
		}
		if (selectedCategory) {
			result = result.filter((s) => s.category === selectedCategory)
		}
		return result
	}, [search, selectedCategory])

	// Filter MCP tools
	const filteredMcpTools = useMemo(() => {
		let result = Object.entries(MCP_TOOLS).map(([name, tool]) => ({ name, ...tool }))
		if (search) {
			const q = search.toLowerCase()
			result = result.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
		}
		if (selectedCategory) {
			result = result.filter((t) => t.category === selectedCategory)
		}
		if (filterType === "dangerous") {
			result = result.filter((t) => t.dangerous)
		}
		return result
	}, [search, selectedCategory, filterType])

	// Stats
	const totalSkills = ALL_SKILLS.length
	const totalMcpTools = Object.keys(MCP_TOOLS).length
	const dangerousTools = Object.values(MCP_TOOLS).filter((t) => t.dangerous).length

	// Get selected skill details
	const selectedSkillData = selectedSkill ? ALL_SKILLS.find((s) => s.name === selectedSkill) : null

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-xl font-semibold flex items-center gap-2">
					<ZapIcon className="size-5 text-red-500" />
					Skills & MCP Tools
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Explore all {totalSkills} skills and {totalMcpTools} MCP tools available in Devil AI.
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-4 gap-3">
				<button
					type="button"
					onClick={() => { setActiveTab("skills"); setSelectedCategory(null); setFilterType("all"); setSearch("") }}
					className={`rounded-xl border border-border bg-gradient-to-br from-red-500/10 to-red-500/5 p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-red-500/10 hover:border-red-500/30 ${
						activeTab === "skills" && filterType === "all" ? "ring-2 ring-red-500/50 border-red-500/50" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
							<BrainIcon className="h-5 w-5 text-red-500" />
						</div>
						<div>
							<p className="text-2xl font-bold text-foreground">{totalSkills}</p>
							<p className="text-xs text-muted-foreground">Skills</p>
						</div>
					</div>
				</button>
				<button
					type="button"
					onClick={() => { setActiveTab("mcp"); setSelectedCategory(null); setFilterType("all"); setSearch("") }}
					className={`rounded-xl border border-border bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-500/30 ${
						activeTab === "mcp" && filterType === "all" ? "ring-2 ring-blue-500/50 border-blue-500/50" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
							<TerminalIcon className="h-5 w-5 text-blue-500" />
						</div>
						<div>
							<p className="text-2xl font-bold text-foreground">{totalMcpTools}</p>
							<p className="text-xs text-muted-foreground">MCP Tools</p>
						</div>
					</div>
				</button>
				<button
					type="button"
					onClick={() => { setActiveTab("mcp"); setFilterType(filterType === "dangerous" ? "all" : "dangerous"); setSelectedCategory(null); setSearch("") }}
					className={`rounded-xl border border-border bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-amber-500/10 hover:border-amber-500/30 ${
						filterType === "dangerous" ? "ring-2 ring-amber-500/50 border-amber-500/50" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
							<AlertTriangleIcon className="h-5 w-5 text-amber-500" />
						</div>
						<div>
							<p className="text-2xl font-bold text-foreground">{dangerousTools}</p>
							<p className="text-xs text-muted-foreground">Dangerous</p>
						</div>
					</div>
				</button>
				<button
					type="button"
					onClick={() => { setActiveTab("servers"); setSearch("") }}
					className={`rounded-xl border border-border bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 text-left transition-all duration-200 hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-500/30 ${
						activeTab === "servers" ? "ring-2 ring-purple-500/50 border-purple-500/50" : ""
					}`}
				>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
							<PlugIcon className="h-5 w-5 text-purple-500" />
						</div>
						<div>
							<p className="text-2xl font-bold text-foreground">Add</p>
							<p className="text-xs text-muted-foreground">MCP Server</p>
						</div>
					</div>
				</button>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-xl border border-border bg-muted p-1">
				<button
					type="button"
					onClick={() => { setActiveTab("skills"); setSelectedCategory(null); setSearch("") }}
					className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
						activeTab === "skills"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground hover:bg-background/50"
					}`}
				>
					<span className="flex items-center justify-center gap-2">
						<BrainIcon className="size-4" />
						Skills ({totalSkills})
					</span>
				</button>
				<button
					type="button"
					onClick={() => { setActiveTab("mcp"); setSelectedCategory(null); setSearch("") }}
					className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
						activeTab === "mcp"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground hover:bg-background/50"
					}`}
				>
					<span className="flex items-center justify-center gap-2">
						<TerminalIcon className="size-4" />
						MCP Tools ({totalMcpTools})
					</span>
				</button>
				<button
					type="button"
					onClick={() => { setActiveTab("servers"); setSearch("") }}
					className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
						activeTab === "servers"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground hover:bg-background/50"
					}`}
				>
					<span className="flex items-center justify-center gap-2">
						<PlugIcon className="size-4" />
						MCP Servers
					</span>
				</button>
			</div>

			{/* Search */}
			{activeTab !== "servers" && (
				<div className="relative">
					<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={activeTab === "skills" ? "Search skills..." : "Search MCP tools..."}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9 h-11"
					/>
				</div>
			)}

			{/* Category Filter */}
			{activeTab !== "servers" && (
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setSelectedCategory(null)}
						className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
							selectedCategory === null
								? "bg-red-500 text-white shadow-sm"
								: "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
						}`}
					>
						All
					</button>
					{activeTab === "skills"
						? SKILL_CATEGORIES.map((cat) => {
								const Icon = cat.icon
								return (
									<button
										key={cat.id}
										type="button"
										onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
										className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
											selectedCategory === cat.id
												? "bg-red-500 text-white shadow-sm"
												: "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
										}`}
									>
										<Icon className="size-3" />
										{cat.label}
									</button>
								)
							})
						: MCP_CATEGORIES.map((cat) => {
								const config = CATEGORY_CONFIG[cat] || { label: cat, icon: WrenchIcon, color: "text-gray-500", gradient: "from-gray-500/10 to-gray-500/5" }
								const Icon = config.icon
								return (
									<button
										key={cat}
										type="button"
										onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
										className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
											selectedCategory === cat
												? "bg-red-500 text-white shadow-sm"
												: "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
										}`}
									>
										<Icon className="size-3" />
										{config.label}
									</button>
								)
							})}
				</div>
			)}

			{/* Content */}
			{activeTab === "servers" ? (
				<McpServersTab />
			) : (
				<ScrollArea className="h-[450px]">
					{activeTab === "skills" ? (
						<div className="grid grid-cols-2 gap-3">
							{filteredSkills.map((skill) => {
								const catConfig = SKILL_CATEGORIES.find((c) => c.id === skill.category)
								const Icon = catConfig?.icon || ZapIcon
								const gradient = catConfig?.gradient || "from-red-500/10 to-red-500/5"
								return (
									<button
										type="button"
										key={skill.name}
										onClick={() => setSelectedSkill(selectedSkill === skill.name ? null : skill.name)}
										className={`group rounded-xl border border-border bg-gradient-to-br ${gradient} p-4 text-left transition-all duration-200 hover:shadow-md hover:border-border/60 ${
											selectedSkill === skill.name
												? "border-red-500/50 shadow-md shadow-red-500/10"
												: ""
										}`}
									>
										<div className="flex items-start gap-3">
											<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
												selectedSkill === skill.name ? "bg-red-500/30 scale-110" : "bg-red-500/10 group-hover:bg-red-500/20"
											}`}>
												<Icon className="h-5 w-5 text-red-500" />
											</div>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-medium text-foreground truncate">{skill.details.title}</p>
												<p className="text-xs text-muted-foreground mt-1 line-clamp-1">{skill.details.description}</p>
												<div className="flex items-center gap-2 mt-2">
													<Badge variant="outline" className="text-[10px]">{skill.categoryLabel}</Badge>
													{skill.details.useCases.length > 0 && (
														<span className="text-[10px] text-muted-foreground">{skill.details.useCases.length} use cases</span>
													)}
												</div>
											</div>
											<ChevronRightIcon className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
										</div>
									</button>
								)
							})}
						</div>
					) : (
						<div className="space-y-3">
							{filteredMcpTools.map((tool) => {
								const catConfig = CATEGORY_CONFIG[tool.category] || { label: tool.category, icon: WrenchIcon, color: "text-gray-500", gradient: "from-gray-500/10 to-gray-500/5" }
								const CatIcon = catConfig.icon
								return (
									<div
										key={tool.name}
										className={`group rounded-xl border border-border bg-gradient-to-br ${catConfig.gradient} p-4 transition-all duration-200 hover:shadow-md hover:border-border/60`}
									>
										<div className="flex items-center gap-4">
											<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110 ${
												tool.dangerous ? "bg-amber-500/20" : "bg-blue-500/20"
											}`}>
												<TerminalIcon className={`h-6 w-6 ${tool.dangerous ? "text-amber-500" : "text-blue-500"}`} />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<p className="text-sm font-semibold text-foreground">{tool.name}</p>
													{tool.dangerous && (
														<Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500 bg-amber-500/10">
															<AlertTriangleIcon className="size-2.5 mr-0.5" />
															Dangerous
														</Badge>
													)}
												</div>
												<p className="text-xs text-muted-foreground mt-1 line-clamp-1">{tool.description}</p>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium bg-background/50 ${catConfig.color}`}>
													<CatIcon className="size-3" />
													{catConfig.label}
												</span>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}

					{(activeTab === "skills" && filteredSkills.length === 0) ||
					(activeTab === "mcp" && filteredMcpTools.length === 0) ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
								<SearchIcon className="size-8 text-muted-foreground/40" />
							</div>
							<p className="text-sm font-medium text-muted-foreground">No results found</p>
							<p className="text-xs text-muted-foreground/60 mt-1">Try a different search term or category</p>
						</div>
					) : null}
				</ScrollArea>
			)}

			{/* Skill Detail Panel */}
			{selectedSkillData && (
				<div className="rounded-xl border border-border bg-gradient-to-br from-red-500/5 to-transparent p-5">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
									<ZapIcon className="h-5 w-5 text-red-500" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-foreground">{selectedSkillData.details.title}</h3>
									<Badge variant="outline" className="text-xs mt-1">{selectedSkillData.categoryLabel}</Badge>
								</div>
							</div>
							<p className="text-sm text-muted-foreground mb-4">{selectedSkillData.details.description}</p>
							{selectedSkillData.details.useCases.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-foreground mb-2">Use Cases</p>
									<div className="flex flex-wrap gap-2">
										{selectedSkillData.details.useCases.map((useCase) => (
											<Badge key={useCase} variant="secondary" className="text-xs">
												{useCase}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={() => setSelectedSkill(null)}
							className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
						>
							<XIcon className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

// ============================================================
// MCP Servers Tab (awesome-mcp-servers)
// ============================================================

function McpServersTab() {
	const [allServers, setAllServers] = useState<AwesomeMCPServer[]>([])
	const [addedServers, setAddedServers] = useState<AddedMCPServer[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState("All")
	const [copiedId, setCopiedId] = useState<string | null>(null)

	// Load servers on mount
	useEffect(() => {
		loadServers()
		setAddedServers(getAddedServers())
	}, [])

	// Load servers
	const loadServers = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await fetchAwesomeServers()
			setAllServers(data.servers)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load servers")
		} finally {
			setLoading(false)
		}
	}, [])

	// Get categories
	const categories = useMemo(() => {
		const cats = [...new Set(allServers.map((s) => s.category))].sort()
		return ["All", ...cats]
	}, [allServers])

	// Filter servers (exclude already added)
	const filteredServers = useMemo(() => {
		let result = allServers.filter((s) => !addedServers.some((a) => a.id === s.id))

		if (selectedCategory !== "All") {
			result = result.filter((s) => s.category === selectedCategory)
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase()
			result = result.filter(
				(s) =>
					s.name.toLowerCase().includes(q) ||
					s.description.toLowerCase().includes(q) ||
					s.id.toLowerCase().includes(q)
			)
		}

		return result
	}, [allServers, addedServers, selectedCategory, searchQuery])

	// Filter added servers
	const filteredAddedServers = useMemo(() => {
		let result = addedServers

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase()
			result = result.filter(
				(s) =>
					s.name.toLowerCase().includes(q) ||
					s.description.toLowerCase().includes(q)
			)
		}

		return result
	}, [addedServers, searchQuery])

	// Add server
	const handleAddServer = useCallback((server: AwesomeMCPServer) => {
		const updated = addServer(server)
		setAddedServers(updated)
	}, [])

	// Remove server
	const handleRemoveServer = useCallback((serverId: string) => {
		const updated = removeServer(serverId)
		setAddedServers(updated)
	}, [])

	// Copy install command
	const handleCopyInstall = useCallback(async (server: AwesomeMCPServer) => {
		if (!server.install) return
		try {
			await navigator.clipboard.writeText(server.install)
			setCopiedId(server.id)
			setTimeout(() => setCopiedId(null), 2000)
		} catch {
			// Fallback: select text
		}
	}, [])

	// Language badge color
	const getLanguageColor = (lang: string) => {
		switch (lang) {
			case "typescript": return "bg-blue-500/10 text-blue-500"
			case "python": return "bg-yellow-500/10 text-yellow-500"
			case "go": return "bg-cyan-500/10 text-cyan-500"
			case "rust": return "bg-orange-500/10 text-orange-500"
			default: return "bg-muted text-muted-foreground"
		}
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium flex items-center gap-2">
						<PlugIcon className="h-5 w-5 text-purple-500" />
						MCP Servers Directory
					</h3>
					<p className="text-xs text-muted-foreground mt-1">
						{addedServers.length} added • {allServers.length.toLocaleString()}+ available
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={loadServers} size="sm" variant="outline" className="gap-1.5">
						<RefreshCwIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
						Refresh
					</Button>
					<a
						href="https://github.com/punkpeye/awesome-mcp-servers"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button size="sm" variant="outline" className="gap-1.5">
							<ExternalLinkIcon className="h-4 w-4" />
							GitHub
						</Button>
					</a>
				</div>
			</div>

			{/* Search & Filters */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search servers (e.g., github, postgres, notion)..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-11"
					/>
				</div>
				<select
					value={selectedCategory}
					onChange={(e) => setSelectedCategory(e.target.value)}
					className="rounded-lg border border-border bg-card px-3 py-2 text-sm h-11"
				>
					{categories.map((cat) => (
						<option key={cat} value={cat}>{cat}</option>
					))}
				</select>
			</div>

			{/* Error Message */}
			{error && (
				<div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 flex items-center gap-2">
					<XCircleIcon className="h-4 w-4 shrink-0" />
					{error}
					<button onClick={() => setError(null)} className="ml-auto">
						<XIcon className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Added Servers */}
			{filteredAddedServers.length > 0 && (
				<div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-4">
					<h4 className="text-sm font-medium mb-3 flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						Added ({filteredAddedServers.length})
					</h4>
					<div className="space-y-2">
						{filteredAddedServers.map((server) => (
							<div
								key={server.id}
								className="flex items-center justify-between rounded-lg border border-green-500/20 bg-card/50 p-3"
							>
								<div className="min-w-0 flex-1 mr-3">
									<div className="flex items-center gap-2 flex-wrap">
										<a
											href={server.github}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm font-medium hover:underline truncate"
										>
											{server.name}
										</a>
										<Badge variant="outline" className="text-[10px] shrink-0">
											{server.category}
										</Badge>
										{server.language !== "unknown" && (
											<span className={`text-[10px] px-1.5 py-0.5 rounded ${getLanguageColor(server.language)}`}>
												{server.language}
											</span>
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
										{server.description}
									</p>
									{server.install && (
										<div className="mt-2 flex items-center gap-2">
											<code className="text-[10px] bg-muted px-2 py-1 rounded font-mono truncate max-w-[300px]">
												{server.install}
											</code>
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2"
												onClick={() => handleCopyInstall(server)}
											>
												{copiedId === server.id ? (
													<CheckCircleIcon className="h-3 w-3 text-green-500" />
												) : (
													<TerminalIcon className="h-3 w-3" />
												)}
											</Button>
										</div>
									)}
								</div>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleRemoveServer(server.id)}
									className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
								>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Available Servers */}
			<div className="rounded-xl border border-border bg-card p-4">
				<h4 className="text-sm font-medium mb-3 flex items-center gap-2">
					<PlugIcon className="h-4 w-4 text-purple-500" />
					Available ({filteredServers.length})
				</h4>
				<ScrollArea className="h-[350px]">
					<div className="space-y-2">
						{filteredServers.map((server) => (
							<div
								key={server.id}
								className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
							>
								<div className="min-w-0 flex-1 mr-3">
									<div className="flex items-center gap-2 flex-wrap">
										<a
											href={server.github}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm font-medium hover:underline truncate"
										>
											{server.name}
										</a>
										<Badge variant="outline" className="text-[10px] shrink-0">
											{server.category}
										</Badge>
										{server.language !== "unknown" && (
											<span className={`text-[10px] px-1.5 py-0.5 rounded ${getLanguageColor(server.language)}`}>
												{server.language}
											</span>
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
										{server.description}
									</p>
									{server.install && (
										<div className="mt-2 flex items-center gap-2">
											<code className="text-[10px] bg-muted px-2 py-1 rounded font-mono truncate max-w-[300px]">
												{server.install}
											</code>
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2"
												onClick={() => handleCopyInstall(server)}
											>
												{copiedId === server.id ? (
													<CheckCircleIcon className="h-3 w-3 text-green-500" />
												) : (
													<TerminalIcon className="h-3 w-3" />
												)}
											</Button>
										</div>
									)}
								</div>
								<Button
									size="sm"
									onClick={() => handleAddServer(server)}
									className="shrink-0 gap-1"
								>
									<PlusIcon className="h-4 w-4" />
									Add
								</Button>
							</div>
						))}
					</div>
					{filteredServers.length === 0 && !loading && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
								<PlugIcon className="size-6 text-muted-foreground/40" />
							</div>
							<p className="text-sm text-muted-foreground">
								{addedServers.length > 0
									? "All servers added!"
									: "No servers found. Try a different search."}
							</p>
						</div>
					)}
				</ScrollArea>
			</div>
		</div>
	)
}
