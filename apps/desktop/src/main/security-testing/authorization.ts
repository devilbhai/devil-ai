/**
 * Authorization Middleware for Security Testing
 * 
 * This module provides authorization checking for security testing operations.
 * All security testing must be properly authorized before execution.
 * 
 * @module authorization-middleware
 * @license MIT
 * @warning Unauthorized access to computer systems is illegal
 */

import { createLogger } from '../logger'
import type { AuthorizationCheck } from './index.js'
import { validateTarget } from './index.js'

const logger = createLogger('authorization-middleware')

// ============================================================
// Types
// ============================================================

export interface AuthorizationConfig {
  requireAuthorization: boolean
  allowedTargets: string[]
  forbiddenTargets: string[]
  maxConcurrentTests: number
  requireWrittenConsent: boolean
}

export interface AuthorizationRequest {
  target: string
  requestedBy: string
  purpose: string
  scope: string[]
  expiresAt?: Date
}

export interface AuthorizationResponse {
  authorized: boolean
  reason: string
  authorization?: AuthorizationCheck
  warnings: string[]
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: AuthorizationConfig = {
  requireAuthorization: true,
  allowedTargets: [],
  forbiddenTargets: [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
  ],
  maxConcurrentTests: 5,
  requireWrittenConsent: true,
}

// ============================================================
// Authorization Middleware
// ============================================================

export class AuthorizationMiddleware {
  private config: AuthorizationConfig
  private authorizations: Map<string, AuthorizationCheck> = new Map()
  private activeTests: number = 0

  constructor(config: Partial<AuthorizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    logger.info('Authorization middleware initialized')
  }

  /**
   * Check if a target is authorized for testing
   * @param request - Authorization request
   * @returns Authorization response
   */
  async checkAuthorization(request: AuthorizationRequest): Promise<AuthorizationResponse> {
    const { target, requestedBy, purpose, scope } = request
    const warnings: string[] = []

    logger.info(`Checking authorization for target: ${target}`, {
      requestedBy,
      purpose,
      scope,
    })

    // 1. Validate target format
    if (!validateTarget(target)) {
      return {
        authorized: false,
        reason: `Invalid target format: ${target}`,
        warnings,
      }
    }

    // 2. Check if target is in forbidden list
    if (this.isForbiddenTarget(target)) {
      return {
        authorized: false,
        reason: `Target is in forbidden list: ${target}`,
        warnings: [...warnings, 'This target is not allowed for testing'],
      }
    }

    // 3. Check if authorization is required
    if (!this.config.requireAuthorization) {
      logger.warn('Authorization not required, proceeding with test')
      return {
        authorized: true,
        reason: 'Authorization not required',
        warnings: [...warnings, 'Authorization is not required in current configuration'],
      }
    }

    // 4. Check for existing authorization
    const existingAuth = this.getExistingAuthorization(target)
    if (existingAuth) {
      if (existingAuth.authorized) {
        logger.info(`Existing authorization found for target: ${target}`)
        return {
          authorized: true,
          reason: 'Existing authorization found',
          authorization: existingAuth,
          warnings,
        }
      }
    }

    // 5. Check concurrent test limit
    if (this.activeTests >= this.config.maxConcurrentTests) {
      return {
        authorized: false,
        reason: `Maximum concurrent tests reached: ${this.config.maxConcurrentTests}`,
        warnings: [...warnings, 'Please wait for other tests to complete'],
      }
    }

    // 6. Check for written consent requirement
    if (this.config.requireWrittenConsent && !request.expiresAt) {
      warnings.push('Written consent is required for this test')
    }

    // 7. Authorization denied
    return {
      authorized: false,
      reason: 'No valid authorization found for this target',
      warnings: [
        ...warnings,
        'Please obtain proper authorization before testing',
        'Unauthorized access to computer systems is illegal',
      ],
    }
  }

  /**
   * Add authorization for a target
   * @param authorization - Authorization to add
   */
  addAuthorization(authorization: AuthorizationCheck): void {
    this.authorizations.set(authorization.target, authorization)
    logger.info(`Authorization added for target: ${authorization.target}`)
  }

  /**
   * Remove authorization for a target
   * @param target - Target to remove authorization for
   */
  removeAuthorization(target: string): void {
    this.authorizations.delete(target)
    logger.info(`Authorization removed for target: ${target}`)
  }

  /**
   * Increment active tests count
   */
  incrementActiveTests(): void {
    this.activeTests++
    logger.debug(`Active tests: ${this.activeTests}`)
  }

  /**
   * Decrement active tests count
   */
  decrementActiveTests(): void {
    this.activeTests--
    logger.debug(`Active tests: ${this.activeTests}`)
  }

  /**
   * Get active tests count
   */
  getActiveTests(): number {
    return this.activeTests
  }

  /**
   * Check if target is forbidden
   * @param target - Target to check
   * @returns True if forbidden
   */
  private isForbiddenTarget(target: string): boolean {
    for (const forbidden of this.config.forbiddenTargets) {
      if (target === forbidden || target.startsWith(forbidden.split('/')[0])) {
        return true
      }
    }
    return false
  }

  /**
   * Get existing authorization for target
   * @param target - Target to check
   * @returns Authorization if found
   */
  private getExistingAuthorization(target: string): AuthorizationCheck | undefined {
    return this.authorizations.get(target)
  }

  /**
   * Get all authorizations
   * @returns Map of authorizations
   */
  getAuthorizations(): Map<string, AuthorizationCheck> {
    return new Map(this.authorizations)
  }

  /**
   * Clear all authorizations
   */
  clearAuthorizations(): void {
    this.authorizations.clear()
    logger.info('All authorizations cleared')
  }
}

// ============================================================
// Authorization Decorator
// ============================================================

/**
 * Decorator for authorizing security testing functions
 * @param target - Target to authorize
 * @param middleware - Authorization middleware
 */
export function Authorized(
  target: string,
  middleware: AuthorizationMiddleware
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      const authorization = await middleware.checkAuthorization({
        target,
        requestedBy: 'system',
        purpose: `Security testing on ${target}`,
        scope: ['read', 'scan'],
      })

      if (!authorization.authorized) {
        throw new Error(
          `Authorization denied: ${authorization.reason}\n` +
          `Warnings: ${authorization.warnings.join(', ')}`
        )
      }

      middleware.incrementActiveTests()

      try {
        return await originalMethod.apply(this, args)
      } finally {
        middleware.decrementActiveTests()
      }
    }

    return descriptor
  }
}

// ============================================================
// Authorization Hooks
// ============================================================

/**
 * Hook for authorizing WordPress testing
 * @param target - WordPress site URL
 * @param middleware - Authorization middleware
 */
export async function authorizeWordPressTest(
  target: string,
  middleware: AuthorizationMiddleware
): Promise<AuthorizationResponse> {
  return middleware.checkAuthorization({
    target,
    requestedBy: 'user',
    purpose: 'WordPress security testing',
    scope: ['scan', 'enumerate', 'test'],
  })
}

/**
 * Hook for authorizing network scanning
 * @param target - Network target
 * @param middleware - Authorization middleware
 */
export async function authorizeNetworkScan(
  target: string,
  middleware: AuthorizationMiddleware
): Promise<AuthorizationResponse> {
  return middleware.checkAuthorization({
    target,
    requestedBy: 'user',
    purpose: 'Network security scanning',
    scope: ['scan', 'enumerate'],
  })
}

/**
 * Hook for authorizing web application testing
 * @param target - Web application URL
 * @param middleware - Authorization middleware
 */
export async function authorizeWebAppTest(
  target: string,
  middleware: AuthorizationMiddleware
): Promise<AuthorizationResponse> {
  return middleware.checkAuthorization({
    target,
    requestedBy: 'user',
    purpose: 'Web application security testing',
    scope: ['scan', 'test', 'enumerate'],
  })
}

// ============================================================
// Exports
// ============================================================

export default {
  AuthorizationMiddleware,
  Authorized,
  authorizeWordPressTest,
  authorizeNetworkScan,
  authorizeWebAppTest,
}
