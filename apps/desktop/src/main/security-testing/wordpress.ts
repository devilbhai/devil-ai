/**
 * WordPress Security Testing Workflow
 * 
 * This module provides a comprehensive workflow for testing WordPress sites.
 * Only use with proper authorization and in compliance with all laws.
 * 
 * @module wordpress-testing
 * @license MIT
 * @warning Unauthorized access to computer systems is illegal
 */

import { createLogger } from '../logger'
import { AuthorizationMiddleware } from './authorization.js'
import { executeTool, generateReport, type ScanResult } from './index.js'

const logger = createLogger('wordpress-testing')

// ============================================================
// Types
// ============================================================

export interface WordPressTestConfig {
  target: string
  includePlugins: boolean
  includeThemes: boolean
  includeUsers: boolean
  includeVulnerabilities: boolean
  includeDirectoryBruteforce: boolean
  includeSQLInjection: boolean
  includeXSSTesting: boolean
  aggressive: boolean
  verbose: boolean
  timeout: number
}

export interface WordPressTestResult {
  target: string
  startTime: Date
  endTime: Date
  duration: number
  results: Record<string, ScanResult>
  report: string
  summary: {
    totalTests: number
    successfulTests: number
    failedTests: number
    criticalFindings: number
    highFindings: number
    mediumFindings: number
    lowFindings: number
  }
}

// ============================================================
// WordPress Testing Workflow
// ============================================================

export class WordPressTestingWorkflow {
  private middleware: AuthorizationMiddleware
  private config: WordPressTestConfig

  constructor(
    middleware: AuthorizationMiddleware,
    config: Partial<WordPressTestConfig> = {}
  ) {
    this.middleware = middleware
    this.config = {
      target: '',
      includePlugins: true,
      includeThemes: true,
      includeUsers: true,
      includeVulnerabilities: true,
      includeDirectoryBruteforce: true,
      includeSQLInjection: false,
      includeXSSTesting: false,
      aggressive: false,
      verbose: false,
      timeout: 300000,
      ...config,
    }
    logger.info('WordPress testing workflow initialized')
  }

  /**
   * Execute WordPress security test
   * @param target - WordPress site URL
   * @returns Test results
   */
  async executeTest(target: string): Promise<WordPressTestResult> {
    const startTime = new Date()
    this.config.target = target

    logger.info(`Starting WordPress security test: ${target}`)

    // 1. Authorization check
    const authorization = await this.middleware.checkAuthorization({
      target,
      requestedBy: 'user',
      purpose: 'WordPress security testing',
      scope: ['scan', 'enumerate', 'test'],
    })

    if (!authorization.authorized) {
      throw new Error(
        `Authorization denied: ${authorization.reason}\n` +
        `Warnings: ${authorization.warnings.join(', ')}`
      )
    }

    this.middleware.incrementActiveTests()

    try {
      // 2. Execute tests
      const results: Record<string, ScanResult> = {}

      // Network scanning
      results.nmap = await this.executeNmapScan(target)

      // Web server scanning
      results.nikto = await this.executeNiktoScan(target)

      // WAF detection
      results.wafw00f = await this.executeWafDetection(target)

      // Vulnerability scanning
      if (this.config.includeVulnerabilities) {
        results.nuclei = await this.executeNucleiScan(target)
      }

      // Directory brute-force
      if (this.config.includeDirectoryBruteforce) {
        results.ffuf = await this.executeDirectoryBruteforce(target)
      }

      // WordPress-specific scanning
      results.wpscan = await this.executeWPScan(target)

      // SQL injection testing
      if (this.config.includeSQLInjection) {
        results.sqlmap = await this.executeSQLMapTest(target)
      }

      // XSS testing
      if (this.config.includeXSSTesting) {
        results.dalfox = await this.executeXSSTest(target)
      }

      // 3. Generate report
      const endTime = new Date()
      const report = generateReport(results, target)
      const summary = this.generateSummary(results)

      logger.info(`WordPress security test completed: ${target}`)

      return {
        target,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        results,
        report,
        summary,
      }
    } finally {
      this.middleware.decrementActiveTests()
    }
  }

  /**
   * Execute Nmap scan
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeNmapScan(target: string): Promise<ScanResult> {
    logger.info(`Executing Nmap scan: ${target}`)
    return executeTool('nmap', ['-sV', '-sC', '-O', '-p-', target])
  }

  /**
   * Execute Nikto scan
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeNiktoScan(target: string): Promise<ScanResult> {
    logger.info(`Executing Nikto scan: ${target}`)
    const args = ['-h', target]
    if (this.config.verbose) {
      args.push('-v')
    }
    return executeTool('nikto', args)
  }

  /**
   * Execute WAF detection
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeWafDetection(target: string): Promise<ScanResult> {
    logger.info(`Executing WAF detection: ${target}`)
    return executeTool('wafw00f', [target])
  }

  /**
   * Execute Nuclei scan
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeNucleiScan(target: string): Promise<ScanResult> {
    logger.info(`Executing Nuclei scan: ${target}`)
    const args = ['-u', target, '-severity', 'critical,high']
    if (this.config.aggressive) {
      args.push('-ags')
    }
    return executeTool('nuclei', args)
  }

  /**
   * Execute directory brute-force
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeDirectoryBruteforce(target: string): Promise<ScanResult> {
    logger.info(`Executing directory brute-force: ${target}`)
    return executeTool('ffuf', [
      '-u',
      `${target}/FUZZ`,
      '-w',
      '/usr/share/wordlists/dirb/common.txt',
      '-mc',
      '200,301,302,403',
    ])
  }

  /**
   * Execute WPScan
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeWPScan(target: string): Promise<ScanResult> {
    logger.info(`Executing WPScan: ${target}`)
    const args = ['--url', target, '--format', 'json']
    
    if (this.config.includePlugins) {
      args.push('--enumerate', 'vp')
    }
    if (this.config.includeThemes) {
      args.push('--enumerate', 'vt')
    }
    if (this.config.includeUsers) {
      args.push('--enumerate', 'u')
    }
    
    return executeTool('wpscan', args)
  }

  /**
   * Execute SQLMap test
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeSQLMapTest(target: string): Promise<ScanResult> {
    logger.info(`Executing SQLMap test: ${target}`)
    return executeTool('sqlmap', ['-u', target, '--batch', '--dbs'])
  }

  /**
   * Execute XSS test
   * @param target - Target to scan
   * @returns Scan result
   */
  private async executeXSSTest(target: string): Promise<ScanResult> {
    logger.info(`Executing XSS test: ${target}`)
    return executeTool('dalfox', ['url', target])
  }

  /**
   * Generate test summary
   * @param results - Test results
   * @returns Test summary
   */
  private generateSummary(results: Record<string, ScanResult>): WordPressTestResult['summary'] {
    const totalTests = Object.keys(results).length
    const successfulTests = Object.values(results).filter(r => r.exitCode === 0).length
    const failedTests = totalTests - successfulTests

    // Count findings based on output analysis
    let criticalFindings = 0
    let highFindings = 0
    let mediumFindings = 0
    let lowFindings = 0

    for (const result of Object.values(results)) {
      if (result.output) {
        const output = result.output.toLowerCase()
        
        if (output.includes('critical')) criticalFindings++
        if (output.includes('high')) highFindings++
        if (output.includes('medium')) mediumFindings++
        if (output.includes('low')) lowFindings++
      }
    }

    return {
      totalTests,
      successfulTests,
      failedTests,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
    }
  }
}

// ============================================================
// Convenience Functions
// ============================================================

/**
 * Quick WordPress security test
 * @param target - WordPress site URL
 * @param options - Test options
 * @returns Test results
 */
export async function quickWordPressTest(
  target: string,
  options: {
    includePlugins?: boolean
    includeThemes?: boolean
    includeUsers?: boolean
    verbose?: boolean
  } = {}
): Promise<WordPressTestResult> {
  const middleware = new AuthorizationMiddleware({
    requireAuthorization: false,
  })

  const workflow = new WordPressTestingWorkflow(middleware, {
    target,
    includePlugins: options.includePlugins ?? true,
    includeThemes: options.includeThemes ?? true,
    includeUsers: options.includeUsers ?? true,
    verbose: options.verbose ?? false,
  })

  return workflow.executeTest(target)
}

/**
 * Full WordPress security test
 * @param target - WordPress site URL
 * @param options - Test options
 * @returns Test results
 */
export async function fullWordPressTest(
  target: string,
  options: {
    includePlugins?: boolean
    includeThemes?: boolean
    includeUsers?: boolean
    includeVulnerabilities?: boolean
    includeDirectoryBruteforce?: boolean
    includeSQLInjection?: boolean
    includeXSSTesting?: boolean
    aggressive?: boolean
    verbose?: boolean
  } = {}
): Promise<WordPressTestResult> {
  const middleware = new AuthorizationMiddleware({
    requireAuthorization: true,
  })

  const workflow = new WordPressTestingWorkflow(middleware, {
    target,
    includePlugins: options.includePlugins ?? true,
    includeThemes: options.includeThemes ?? true,
    includeUsers: options.includeUsers ?? true,
    includeVulnerabilities: options.includeVulnerabilities ?? true,
    includeDirectoryBruteforce: options.includeDirectoryBruteforce ?? true,
    includeSQLInjection: options.includeSQLInjection ?? false,
    includeXSSTesting: options.includeXSSTesting ?? false,
    aggressive: options.aggressive ?? false,
    verbose: options.verbose ?? false,
  })

  return workflow.executeTest(target)
}

// ============================================================
// Exports
// ============================================================

export default {
  WordPressTestingWorkflow,
  quickWordPressTest,
  fullWordPressTest,
}
