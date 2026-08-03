/**
 * Security Testing Utilities for Devil AI
 * 
 * This module provides helper functions for authorized security testing.
 * Only use with proper authorization and in compliance with all laws.
 * 
 * @module security-testing
 * @license MIT
 * @warning Unauthorized access to computer systems is illegal
 */

import { createLogger } from '../logger'
import { spawn } from 'node:child_process'

const logger = createLogger('security-testing')

// ============================================================
// Types
// ============================================================

export interface ScanResult {
  tool: string
  target: string
  command: string
  output: string
  exitCode: number | null
  timestamp: Date
  duration: number
}

export interface AuthorizationCheck {
  target: string
  authorized: boolean
  authorizedBy?: string
  expiresAt?: Date
  scope: string[]
}

export interface SecurityTool {
  name: string
  command: string
  category: string
  dangerous: boolean
  description: string
}

export interface WordPressScanOptions {
  target: string
  includePlugins?: boolean
  includeThemes?: boolean
  includeUsers?: boolean
  verbose?: boolean
  aggressive?: boolean
}

// ============================================================
// Tool Registry
// ============================================================

export const SECURITY_TOOLS: Record<string, SecurityTool> = {
  nmap: {
    name: 'Nmap',
    command: 'nmap',
    category: 'information-gathering',
    dangerous: false,
    description: 'Network discovery and security auditing tool',
  },
  nuclei: {
    name: 'Nuclei',
    command: 'nuclei',
    category: 'web-attack',
    dangerous: false,
    description: 'Fast vulnerability scanner based on templates',
  },
  sqlmap: {
    name: 'SQLMap',
    command: 'sqlmap',
    category: 'sql-injection',
    dangerous: true,
    description: 'Automatic SQL injection and database takeover tool',
  },
  ffuf: {
    name: 'FFUF',
    command: 'ffuf',
    category: 'web-attack',
    dangerous: false,
    description: 'Fast web fuzzer for directory and parameter discovery',
  },
  nikto: {
    name: 'Nikto',
    command: 'nikto',
    category: 'web-attack',
    dangerous: false,
    description: 'Web server vulnerability scanner',
  },
  wafw00f: {
    name: 'Wafw00f',
    command: 'wafw00f',
    category: 'web-attack',
    dangerous: false,
    description: 'Web Application Firewall fingerprinting tool',
  },
  subfinder: {
    name: 'Subfinder',
    command: 'subfinder',
    category: 'information-gathering',
    dangerous: false,
    description: 'Subdomain discovery tool',
  },
  amass: {
    name: 'Amass',
    command: 'amass',
    category: 'information-gathering',
    dangerous: false,
    description: 'In-depth attack surface mapping and asset discovery',
  },
  theharvester: {
    name: 'The Harvester',
    command: 'theHarvester',
    category: 'information-gathering',
    dangerous: false,
    description: 'Email, subdomain and name harvester',
  },
  gobuster: {
    name: 'Gobuster',
    command: 'gobuster',
    category: 'web-attack',
    dangerous: false,
    description: 'Directory/file, DNS and VHost busting tool',
  },
  dirsearch: {
    name: 'Dirsearch',
    command: 'dirsearch',
    category: 'web-attack',
    dangerous: false,
    description: 'Web path scanner',
  },
  feroxbuster: {
    name: 'Feroxbuster',
    command: 'feroxbuster',
    category: 'web-attack',
    dangerous: false,
    description: 'Fast, simple, recursive content discovery tool',
  },
  dalfox: {
    name: 'DalFox',
    command: 'dalfox',
    category: 'xss',
    dangerous: false,
    description: 'Powerful open-source XSS scanning tool',
  },
  xsstrike: {
    name: 'XSStrike',
    command: 'xsstrike',
    category: 'xss',
    dangerous: false,
    description: 'Most advanced XSS scanner',
  },
  hashcat: {
    name: 'Hashcat',
    command: 'hashcat',
    category: 'wordlist',
    dangerous: false,
    description: 'Advanced password recovery utility',
  },
  john: {
    name: 'John the Ripper',
    command: 'john',
    category: 'wordlist',
    dangerous: false,
    description: 'Password cracker',
  },
  hydra: {
    name: 'Hydra',
    command: 'hydra',
    category: 'wordlist',
    dangerous: true,
    description: 'Network logon cracker',
  },
  bettercap: {
    name: 'Bettercap',
    command: 'bettercap',
    category: 'wireless',
    dangerous: true,
    description: 'Swiss Army knife for WiFi, BLE and network attacks',
  },
  wifite: {
    name: 'Wifite',
    command: 'wifite',
    category: 'wireless',
    dangerous: true,
    description: 'Automated wireless attack tool',
  },
  responder: {
    name: 'Responder',
    command: 'responder',
    category: 'active-directory',
    dangerous: true,
    description: 'LLMNR, NBT-NS and MDNS poisoner',
  },
  bloodhound: {
    name: 'BloodHound',
    command: 'bloodhound-python',
    category: 'active-directory',
    dangerous: false,
    description: 'Active Directory attack path finder',
  },
  impacket: {
    name: 'Impacket',
    command: 'impacket-smbclient',
    category: 'active-directory',
    dangerous: true,
    description: 'Network protocol tools',
  },
  prowler: {
    name: 'Prowler',
    command: 'prowler',
    category: 'cloud',
    dangerous: false,
    description: 'AWS security assessment tool',
  },
  trivy: {
    name: 'Trivy',
    command: 'trivy',
    category: 'cloud',
    dangerous: false,
    description: 'Container vulnerability scanner',
  },
  ghidra: {
    name: 'Ghidra',
    command: 'ghidra',
    category: 'reverse-engineering',
    dangerous: false,
    description: 'Software reverse engineering framework',
  },
  radare2: {
    name: 'Radare2',
    command: 'r2',
    category: 'reverse-engineering',
    dangerous: false,
    description: 'Reverse engineering framework',
  },
  frida: {
    name: 'Frida',
    command: 'frida',
    category: 'mobile',
    dangerous: false,
    description: 'Dynamic instrumentation toolkit',
  },
  sherlock: {
    name: 'Sherlock',
    command: 'sherlock',
    category: 'information-gathering',
    dangerous: false,
    description: 'Username OSINT tool',
  },
  setoolkit: {
    name: 'SEToolkit',
    command: 'setoolkit',
    category: 'phishing',
    dangerous: true,
    description: 'Social engineering toolkit',
  },
  mitmproxy: {
    name: 'mitmproxy',
    command: 'mitmproxy',
    category: 'web-attack',
    dangerous: false,
    description: 'Interactive HTTPS proxy',
  },
  wireshark: {
    name: 'Wireshark',
    command: 'wireshark',
    category: 'forensics',
    dangerous: false,
    description: 'Network protocol analyzer',
  },
  autopsy: {
    name: 'Autopsy',
    command: 'autopsy',
    category: 'forensics',
    dangerous: false,
    description: 'Digital forensics platform',
  },
  volatility: {
    name: 'Volatility',
    command: 'vol3',
    category: 'forensics',
    dangerous: false,
    description: 'Memory forensics framework',
  },
  binwalk: {
    name: 'Binwalk',
    command: 'binwalk',
    category: 'forensics',
    dangerous: false,
    description: 'Firmware analysis tool',
  },
  metasploit: {
    name: 'Metasploit',
    command: 'msfconsole',
    category: 'exploit-framework',
    dangerous: true,
    description: 'Penetration testing framework',
  },
  sliver: {
    name: 'Sliver',
    command: 'sliver',
    category: 'post-exploitation',
    dangerous: true,
    description: 'Adversary emulation / red team framework',
  },
  pwncat: {
    name: 'pwncat',
    command: 'pwncat-cs',
    category: 'post-exploitation',
    dangerous: true,
    description: 'Reverse shell manager',
  },
  chisel: {
    name: 'Chisel',
    command: 'chisel',
    category: 'post-exploitation',
    dangerous: false,
    description: 'Fast TCP/UDP tunnel over HTTP',
  },
  cupp: {
    name: 'Cupp',
    command: 'cupp',
    category: 'wordlist',
    dangerous: false,
    description: 'Common User Passwords Profiler',
  },
  slowloris: {
    name: 'Slowloris',
    command: 'slowloris',
    category: 'ddos',
    dangerous: true,
    description: 'HTTP DoS tool',
  },
  stegcracker: {
    name: 'StegCracker',
    command: 'stegcracker',
    category: 'steganography',
    dangerous: false,
    description: 'Steganography brute-force tool',
  },
  certipy: {
    name: 'Certipy',
    command: 'certipy',
    category: 'active-directory',
    dangerous: true,
    description: 'Active Directory Certificate Services abuse tool',
  },
  kerbrute: {
    name: 'Kerbrute',
    command: 'kerbrute',
    category: 'active-directory',
    dangerous: true,
    description: 'Kerberos brute-force tool',
  },
  pacu: {
    name: 'Pacu',
    command: 'pacu',
    category: 'cloud',
    dangerous: true,
    description: 'AWS exploitation framework',
  },
  scoutsuite: {
    name: 'ScoutSuite',
    command: 'scout',
    category: 'cloud',
    dangerous: false,
    description: 'Multi-cloud security auditing tool',
  },
  mobsf: {
    name: 'MobSF',
    command: 'mobsf',
    category: 'mobile',
    dangerous: false,
    description: 'Mobile Security Framework',
  },
  objection: {
    name: 'Objection',
    command: 'objection',
    category: 'mobile',
    dangerous: false,
    description: 'Runtime mobile exploration',
  },
  // Photoshop MCP Tools
  photoshop_get_state: {
    name: 'Photoshop Get State',
    command: 'photoshop_get_state',
    category: 'design',
    dangerous: false,
    description: 'Get current Photoshop document state',
  },
  photoshop_get_preview: {
    name: 'Photoshop Get Preview',
    command: 'photoshop_get_preview',
    category: 'design',
    dangerous: false,
    description: 'Get base64 JPEG preview of current document',
  },
  photoshop_get_capabilities: {
    name: 'Photoshop Get Capabilities',
    command: 'photoshop_get_capabilities',
    category: 'design',
    dangerous: false,
    description: 'Get version-aware feature flags',
  },
  photoshop_create_document: {
    name: 'Photoshop Create Document',
    command: 'photoshop_create_document',
    category: 'design',
    dangerous: false,
    description: 'Create a new Photoshop document',
  },
  photoshop_open_document: {
    name: 'Photoshop Open Document',
    command: 'photoshop_open_document',
    category: 'design',
    dangerous: false,
    description: 'Open an existing PSD file',
  },
  photoshop_save_document: {
    name: 'Photoshop Save Document',
    command: 'photoshop_save_document',
    category: 'design',
    dangerous: false,
    description: 'Save the current document',
  },
  photoshop_export: {
    name: 'Photoshop Export',
    command: 'photoshop_export',
    category: 'design',
    dangerous: false,
    description: 'Export document as PNG/JPG/etc',
  },
  photoshop_add_layer: {
    name: 'Photoshop Add Layer',
    command: 'photoshop_add_layer',
    category: 'design',
    dangerous: false,
    description: 'Add a new layer to the document',
  },
  photoshop_delete_layer: {
    name: 'Photoshop Delete Layer',
    command: 'photoshop_delete_layer',
    category: 'design',
    dangerous: false,
    description: 'Delete a layer from the document',
  },
  photoshop_rename_layer: {
    name: 'Photoshop Rename Layer',
    command: 'photoshop_rename_layer',
    category: 'design',
    dangerous: false,
    description: 'Rename a layer',
  },
  photoshop_move_layer: {
    name: 'Photoshop Move Layer',
    command: 'photoshop_move_layer',
    category: 'design',
    dangerous: false,
    description: 'Move layer position in stack',
  },
  photoshop_duplicate_layer: {
    name: 'Photoshop Duplicate Layer',
    command: 'photoshop_duplicate_layer',
    category: 'design',
    dangerous: false,
    description: 'Duplicate an existing layer',
  },
  photoshop_merge_layers: {
    name: 'Photoshop Merge Layers',
    command: 'photoshop_merge_layers',
    category: 'design',
    dangerous: false,
    description: 'Merge multiple layers',
  },
  photoshop_flatten_image: {
    name: 'Photoshop Flatten Image',
    command: 'photoshop_flatten_image',
    category: 'design',
    dangerous: false,
    description: 'Flatten all layers into one',
  },
  photoshop_add_text: {
    name: 'Photoshop Add Text',
    command: 'photoshop_add_text',
    category: 'design',
    dangerous: false,
    description: 'Add text layer to document',
  },
  photoshop_add_shape: {
    name: 'Photoshop Add Shape',
    command: 'photoshop_add_shape',
    category: 'design',
    dangerous: false,
    description: 'Add vector shape to document',
  },
  photoshop_add_image: {
    name: 'Photoshop Add Image',
    command: 'photoshop_add_image',
    category: 'design',
    dangerous: false,
    description: 'Place an image in the document',
  },
  photoshop_apply_filter: {
    name: 'Photoshop Apply Filter',
    command: 'photoshop_apply_filter',
    category: 'design',
    dangerous: false,
    description: 'Apply a Photoshop filter',
  },
  photoshop_adjust_brightness: {
    name: 'Photoshop Adjust Brightness',
    command: 'photoshop_adjust_brightness',
    category: 'design',
    dangerous: false,
    description: 'Adjust brightness/contrast',
  },
  photoshop_adjust_hue: {
    name: 'Photoshop Adjust Hue',
    command: 'photoshop_adjust_hue',
    category: 'design',
    dangerous: false,
    description: 'Adjust hue/saturation',
  },
  photoshop_crop: {
    name: 'Photoshop Crop',
    command: 'photoshop_crop',
    category: 'design',
    dangerous: false,
    description: 'Crop the document',
  },
  photoshop_resize: {
    name: 'Photoshop Resize',
    command: 'photoshop_resize',
    category: 'design',
    dangerous: false,
    description: 'Resize the document',
  },
  photoshop_rotate: {
    name: 'Photoshop Rotate',
    command: 'photoshop_rotate',
    category: 'design',
    dangerous: false,
    description: 'Rotate the document or layer',
  },
  photoshop_flip: {
    name: 'Photoshop Flip',
    command: 'photoshop_flip',
    category: 'design',
    dangerous: false,
    description: 'Flip horizontally or vertically',
  },
  photoshop_select_region: {
    name: 'Photoshop Select Region',
    command: 'photoshop_select_region',
    category: 'design',
    dangerous: false,
    description: 'Select a rectangular region',
  },
  photoshop_deselect: {
    name: 'Photoshop Deselect',
    command: 'photoshop_deselect',
    category: 'design',
    dangerous: false,
    description: 'Remove current selection',
  },
  photoshop_fill: {
    name: 'Photoshop Fill',
    command: 'photoshop_fill',
    category: 'design',
    dangerous: false,
    description: 'Fill selection with color/pattern',
  },
  photoshop_stroke: {
    name: 'Photoshop Stroke',
    command: 'photoshop_stroke',
    category: 'design',
    dangerous: false,
    description: 'Stroke selection with color',
  },
  photoshop_clone_stamp: {
    name: 'Photoshop Clone Stamp',
    command: 'photoshop_clone_stamp',
    category: 'design',
    dangerous: false,
    description: 'Clone stamp tool',
  },
  photoshop_healing_brush: {
    name: 'Photoshop Healing Brush',
    command: 'photoshop_healing_brush',
    category: 'design',
    dangerous: false,
    description: 'Healing brush tool',
  },
  photoshop_blur: {
    name: 'Photoshop Blur',
    command: 'photoshop_blur',
    category: 'design',
    dangerous: false,
    description: 'Apply blur to layer/selection',
  },
  photoshop_sharpen: {
    name: 'Photoshop Sharpen',
    command: 'photoshop_sharpen',
    category: 'design',
    dangerous: false,
    description: 'Sharpen layer/selection',
  },
  photoshop_noise: {
    name: 'Photoshop Noise',
    command: 'photoshop_noise',
    category: 'design',
    dangerous: false,
    description: 'Add or reduce noise',
  },
  photoshop_generative_fill: {
    name: 'Photoshop Generative Fill',
    command: 'photoshop_generative_fill',
    category: 'design',
    dangerous: false,
    description: 'AI-powered generative fill',
  },
  photoshop_generative_remove: {
    name: 'Photoshop Generative Remove',
    command: 'photoshop_generative_remove',
    category: 'design',
    dangerous: false,
    description: 'AI-powered object removal',
  },
  photoshop_generative_expand: {
    name: 'Photoshop Generative Expand',
    command: 'photoshop_generative_expand',
    category: 'design',
    dangerous: false,
    description: 'AI-powered canvas expansion',
  },
  photoshop_sky_replacement: {
    name: 'Photoshop Sky Replacement',
    command: 'photoshop_sky_replacement',
    category: 'design',
    dangerous: false,
    description: 'AI-powered sky replacement',
  },
  photoshop_recipe_remove_background: {
    name: 'Photoshop Recipe Remove Background',
    command: 'photoshop_recipe_remove_background',
    category: 'design',
    dangerous: false,
    description: 'Remove background from image',
  },
  photoshop_recipe_enhance_portrait: {
    name: 'Photoshop Recipe Enhance Portrait',
    command: 'photoshop_recipe_enhance_portrait',
    category: 'design',
    dangerous: false,
    description: 'Enhance portrait photo',
  },
  photoshop_recipe_prepare_for_web: {
    name: 'Photoshop Recipe Prepare for Web',
    command: 'photoshop_recipe_prepare_for_web',
    category: 'design',
    dangerous: false,
    description: 'Optimize image for web',
  },
  photoshop_recipe_export_social: {
    name: 'Photoshop Recipe Export Social',
    command: 'photoshop_recipe_export_social',
    category: 'design',
    dangerous: false,
    description: 'Export for social media platforms',
  },
  photoshop_recipe_color_grade: {
    name: 'Photoshop Recipe Color Grade',
    command: 'photoshop_recipe_color_grade',
    category: 'design',
    dangerous: false,
    description: 'Apply color grading',
  },
  photoshop_recipe_frequency_separation: {
    name: 'Photoshop Recipe Frequency Separation',
    command: 'photoshop_recipe_frequency_separation',
    category: 'design',
    dangerous: false,
    description: 'Frequency separation for retouching',
  },
  photoshop_recipe_batch_mockup: {
    name: 'Photoshop Recipe Batch Mockup',
    command: 'photoshop_recipe_batch_mockup',
    category: 'design',
    dangerous: false,
    description: 'Batch create mockups',
  },
  photoshop_recipe_organize_layers: {
    name: 'Photoshop Recipe Organize Layers',
    command: 'photoshop_recipe_organize_layers',
    category: 'design',
    dangerous: false,
    description: 'Auto-organize layers',
  },
  photoshop_recipe_gradient_fade: {
    name: 'Photoshop Recipe Gradient Fade',
    command: 'photoshop_recipe_gradient_fade',
    category: 'design',
    dangerous: false,
    description: 'Apply gradient fade effect',
  },
  photoshop_recipe_sky_blend: {
    name: 'Photoshop Recipe Sky Blend',
    command: 'photoshop_recipe_sky_blend',
    category: 'design',
    dangerous: false,
    description: 'Blend sky with foreground',
  },
  photoshop_recipe_dodge_burn: {
    name: 'Photoshop Recipe Dodge & Burn',
    command: 'photoshop_recipe_dodge_burn',
    category: 'design',
    dangerous: false,
    description: 'Dodge and burn effect',
  },
  photoshop_recipe_remove_distraction: {
    name: 'Photoshop Recipe Remove Distraction',
    command: 'photoshop_recipe_remove_distraction',
    category: 'design',
    dangerous: false,
    description: 'Remove distracting elements',
  },
}

// ============================================================
// Authorization Functions
// ============================================================

/**
 * Check if target is authorized for testing
 * @param target - Target to check
 * @param authorizations - List of authorizations (optional, returns unauthorized if omitted)
 * @returns Authorization check result
 */
export function checkAuthorization(
  target: string,
  authorizations: AuthorizationCheck[] = []
): AuthorizationCheck {
  const now = new Date()
  
  for (const auth of authorizations) {
    if (auth.target === target || auth.target === '*') {
      if (auth.authorized) {
        if (!auth.expiresAt || auth.expiresAt > now) {
          logger.info(`Authorization verified for target: ${target}`)
          return auth
        }
        logger.warn(`Authorization expired for target: ${target}`)
      }
    }
  }
  
  logger.error(`No authorization found for target: ${target}`)
  return {
    target,
    authorized: false,
    scope: [],
  }
}

/**
 * Validate target format
 * @param target - Target to validate
 * @returns True if valid
 */
export function validateTarget(target: string): boolean {
  // IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipRegex.test(target)) {
    return true
  }
  
  // Domain name
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/
  if (domainRegex.test(target)) {
    return true
  }
  
  // URL
  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/
  if (urlRegex.test(target)) {
    return true
  }
  
  // CIDR notation
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
  if (cidrRegex.test(target)) {
    return true
  }
  
  return false
}

// ============================================================
// Tool Execution Functions
// ============================================================

/**
 * Execute a security tool
 * @param toolName - Tool name
 * @param args - Command arguments
 * @param options - Execution options
 * @returns Promise with scan result
 */
export async function executeTool(
  toolName: string,
  args: string[],
  options: {
    timeout?: number
    cwd?: string
    env?: Record<string, string>
  } = {}
): Promise<ScanResult> {
  const tool = SECURITY_TOOLS[toolName]
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`)
  }
  
  // Sanitize arguments to prevent command injection even if spawn is used
  const forbiddenChars = /[;&|<>$`\n]/
  for (const arg of args) {
    if (forbiddenChars.test(arg)) {
      throw new Error(`Invalid character in argument: ${arg}`)
    }
  }
  
  const startTime = Date.now()
  const command = `${tool.command} ${args.join(' ')}`
  
  logger.info(`Executing tool: ${toolName}`, { command, args })
  
  return new Promise((resolve, reject) => {
    const childProc = spawn(tool.command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 300000, // 5 minutes default
    })
    
    let stdout = ''
    let stderr = ''
    
    childProc.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString()
    })
    
    childProc.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })
    
    childProc.on('close', (code: number | null) => {
      const duration = Date.now() - startTime
      const result: ScanResult = {
        tool: toolName,
        target: args.join(' '),
        command,
        output: stdout || stderr,
        exitCode: code,
        timestamp: new Date(),
        duration,
      }
      
      logger.info(`Tool execution completed: ${toolName}`, {
        exitCode: code,
        duration,
      })
      
      resolve(result)
    })
    
    childProc.on('error', (error: Error) => {
      logger.error(`Tool execution failed: ${toolName}`, error)
      reject(error)
    })
  })
}

// ============================================================
// WordPress Testing Functions
// ============================================================

/**
 * Perform WordPress security scan
 * @param options - Scan options
 * @returns Promise with scan results
 */
export async function scanWordPress(
  options: WordPressScanOptions
): Promise<Record<string, ScanResult>> {
  const { target, includePlugins = true, includeThemes = true, includeUsers = true, verbose = false, aggressive = false } = options
  
  logger.info(`Starting WordPress scan: ${target}`)
  
  const results: Record<string, ScanResult> = {}
  
  // 1. Network scan with Nmap
  results.nmap = await executeTool('nmap', [
    '-sV',
    '-sC',
    '-O',
    '-p-',
    target,
  ])
  
  // 2. Web server scan with Nikto
  results.nikto = await executeTool('nikto', [
    '-h',
    target,
    verbose ? '-v' : '',
  ].filter(Boolean))
  
  // 3. WAF detection
  results.wafw00f = await executeTool('wafw00f', [target])
  
  // 4. Vulnerability scan with Nuclei
  const nucleiArgs = ['-u', target, '-severity', 'critical,high']
  if (aggressive) {
    nucleiArgs.push('-ags')
  }
  results.nuclei = await executeTool('nuclei', nucleiArgs)
  
  // 5. Directory brute-force
  results.ffuf = await executeTool('ffuf', [
    '-u',
    `${target}/FUZZ`,
    '-w',
    '/usr/share/wordlists/dirb/common.txt',
    '-mc',
    '200,301,302,403',
  ])
  
  // 6. WordPress-specific scanning with WPScan (if available)
  try {
    const wpscanArgs = ['--url', target, '--format', 'json']
    if (includePlugins) {
      wpscanArgs.push('--enumerate', 'vp')
    }
    if (includeThemes) {
      wpscanArgs.push('--enumerate', 'vt')
    }
    if (includeUsers) {
      wpscanArgs.push('--enumerate', 'u')
    }
    results.wpscan = await executeTool('wpscan', wpscanArgs)
  } catch {
    logger.warn('WPScan not available, skipping WordPress-specific scan')
  }
  
  logger.info(`WordPress scan completed: ${target}`)
  
  return results
}

/**
 * Perform network reconnaissance
 * @param target - Target to scan
 * @param options - Scan options
 * @returns Promise with scan results
 */
export async function reconNetwork(
  target: string,
  options: {
    fast?: boolean
    aggressive?: boolean
    ports?: string
  } = {}
): Promise<Record<string, ScanResult>> {
  const { aggressive = false, ports } = options
  
  logger.info(`Starting network recon: ${target}`)
  
  const results: Record<string, ScanResult> = {}
  
  // 1. Fast scan
  results.nmapFast = await executeTool('nmap', [
    '-F',
    '-T4',
    target,
  ])
  
  // 2. Service version detection
  results.nmapService = await executeTool('nmap', [
    '-sV',
    '-sC',
    target,
  ])
  
  // 3. OS detection
  results.nmapOS = await executeTool('nmap', [
    '-O',
    '--osscan-guess',
    target,
  ])
  
  // 4. Port scan
  if (ports) {
    results.nmapPorts = await executeTool('nmap', [
      '-p',
      ports,
      target,
    ])
  }
  
  // 5. Aggressive scan
  if (aggressive) {
    results.nmapAggressive = await executeTool('nmap', [
      '-A',
      '-T4',
      target,
    ])
  }
  
  logger.info(`Network recon completed: ${target}`)
  
  return results
}

/**
 * Perform web application testing
 * @param target - Target URL
 * @param options - Testing options
 * @returns Promise with test results
 */
export async function testWebApp(
  target: string,
  options: {
    directoryBruteforce?: boolean
    parameterDiscovery?: boolean
    xssTesting?: boolean
    sqlInjection?: boolean
  } = {}
): Promise<Record<string, ScanResult>> {
  const {
    directoryBruteforce = true,
    parameterDiscovery = true,
    xssTesting = false,
    sqlInjection = false,
  } = options
  
  logger.info(`Starting web app testing: ${target}`)
  
  const results: Record<string, ScanResult> = {}
  
  // 1. Directory brute-force
  if (directoryBruteforce) {
    results.ffuf = await executeTool('ffuf', [
      '-u',
      `${target}/FUZZ`,
      '-w',
      '/usr/share/wordlists/dirb/common.txt',
      '-mc',
      '200,301,302,403',
    ])
    
    results.dirsearch = await executeTool('dirsearch', [
      '-u',
      target,
      '-e',
      'php,html,js,txt',
    ])
  }
  
  // 2. Parameter discovery
  if (parameterDiscovery) {
    results.arjun = await executeTool('arjun', ['-u', target])
  }
  
  // 3. XSS testing
  if (xssTesting) {
    results.dalfox = await executeTool('dalfox', ['url', target])
  }
  
  // 4. SQL injection testing
  if (sqlInjection) {
    results.sqlmap = await executeTool('sqlmap', [
      '-u',
      target,
      '--batch',
      '--dbs',
    ])
  }
  
  logger.info(`Web app testing completed: ${target}`)
  
  return results
}

// ============================================================
// Report Generation
// ============================================================

/**
 * Generate security test report
 * @param results - Test results
 * @param target - Target tested
 * @returns Formatted report
 */
export function generateReport(
  results: Record<string, ScanResult>,
  target: string
): string {
  const report: string[] = []
  
  report.push('# Security Test Report')
  report.push('')
  report.push(`**Target:** ${target}`)
  report.push(`**Date:** ${new Date().toISOString()}`)
  report.push('')
  
  report.push('## Summary')
  report.push('')
  report.push(`- **Total Tests:** ${Object.keys(results).length}`)
  report.push(`- **Successful:** ${Object.values(results).filter(r => r.exitCode === 0).length}`)
  report.push(`- **Failed:** ${Object.values(results).filter(r => r.exitCode !== 0).length}`)
  report.push('')
  
  report.push('## Detailed Results')
  report.push('')
  
  for (const [tool, result] of Object.entries(results)) {
    report.push(`### ${tool}`)
    report.push('')
    report.push(`- **Command:** \`${result.command}\``)
    report.push(`- **Exit Code:** ${result.exitCode}`)
    report.push(`- **Duration:** ${result.duration}ms`)
    report.push('')
    
    if (result.output) {
      report.push('**Output:**')
      report.push('```')
      report.push(result.output.substring(0, 1000))
      if (result.output.length > 1000) {
        report.push('... (truncated)')
      }
      report.push('```')
    }
    report.push('')
  }
  
  report.push('## Recommendations')
  report.push('')
  report.push('1. Review all findings carefully')
  report.push('2. Prioritize critical and high severity issues')
  report.push('3. Implement fixes in a timely manner')
  report.push('4. Re-test after fixes are applied')
  report.push('')
  
  report.push('## Disclaimer')
  report.push('')
  report.push('This report is for authorized security testing purposes only.')
  report.push('The findings should be used responsibly and in compliance with all applicable laws.')
  
  return report.join('\n')
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Check if a tool is installed
 * @param toolName - Tool name
 * @returns True if installed
 */
export async function isToolInstalled(toolName: string): Promise<boolean> {
  const tool = SECURITY_TOOLS[toolName]
  if (!tool) {
    return false
  }
  
  try {
    await executeTool(toolName, ['--version'])
    return true
  } catch {
    return false
  }
}

/**
 * Get tool information
 * @param toolName - Tool name
 * @returns Tool information
 */
export function getToolInfo(toolName: string): SecurityTool | undefined {
  return SECURITY_TOOLS[toolName]
}

/**
 * List all available tools
 * @param category - Optional category filter
 * @returns List of tools
 */
export function listTools(category?: string): SecurityTool[] {
  const tools = Object.values(SECURITY_TOOLS)
  
  if (category) {
    return tools.filter(tool => tool.category === category)
  }
  
  return tools
}

/**
 * Get tools by category
 * @returns Tools grouped by category
 */
export function getToolsByCategory(): Record<string, SecurityTool[]> {
  const toolsByCategory: Record<string, SecurityTool[]> = {}
  
  for (const tool of Object.values(SECURITY_TOOLS)) {
    if (!toolsByCategory[tool.category]) {
      toolsByCategory[tool.category] = []
    }
    toolsByCategory[tool.category].push(tool)
  }
  
  return toolsByCategory
}

// ============================================================
// Exports
// ============================================================

export default {
  SECURITY_TOOLS,
  checkAuthorization,
  validateTarget,
  executeTool,
  scanWordPress,
  reconNetwork,
  testWebApp,
  generateReport,
  isToolInstalled,
  getToolInfo,
  listTools,
  getToolsByCategory,
}
