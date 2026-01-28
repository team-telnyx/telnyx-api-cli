/**
 * Config mocking utilities for tests
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

let testConfigDir: string | null = null
let originalHome: string | undefined

/**
 * Set up a temporary config directory for tests
 */
export function setupMockConfig(apiKey = 'KEY_test1234567890abcdef'): string {
  // Create temp directory
  testConfigDir = join(tmpdir(), `telnyx-cli-test-${Date.now()}`)
  const configDir = join(testConfigDir, '.config', 'telnyx')
  mkdirSync(configDir, { recursive: true })
  
  // Write test config
  const config = {
    profiles: {
      default: { apiKey },
      production: { apiKey: 'KEY_prod1234567890abcdef' },
    },
    defaultProfile: 'default',
  }
  writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2))
  
  // Override HOME to use temp directory
  originalHome = process.env.HOME
  process.env.HOME = testConfigDir
  
  return testConfigDir
}

/**
 * Clean up temporary config directory
 */
export function teardownMockConfig(): void {
  if (originalHome !== undefined) {
    process.env.HOME = originalHome
  }
  
  if (testConfigDir && existsSync(testConfigDir)) {
    rmSync(testConfigDir, { recursive: true, force: true })
  }
  
  testConfigDir = null
}

/**
 * Set a specific API key for tests
 */
export function setTestApiKey(apiKey: string): void {
  process.env.TELNYX_API_KEY = apiKey
}

/**
 * Clear the test API key
 */
export function clearTestApiKey(): void {
  delete process.env.TELNYX_API_KEY
}
