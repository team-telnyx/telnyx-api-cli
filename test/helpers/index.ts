/**
 * Test helpers - re-export all utilities
 */

export * from './mock-api.js'
export * from './mock-config.js'

import { expect } from 'chai'

/**
 * Assert that output contains expected text
 */
export function expectOutput(output: string, expected: string | string[]): void {
  const expectations = Array.isArray(expected) ? expected : [expected]
  for (const text of expectations) {
    expect(output).to.include(text)
  }
}

/**
 * Assert that output does not contain text
 */
export function expectNoOutput(output: string, unexpected: string | string[]): void {
  const expectations = Array.isArray(unexpected) ? unexpected : [unexpected]
  for (const text of expectations) {
    expect(output).to.not.include(text)
  }
}

/**
 * Parse JSON output from command
 * Handles cases where info messages precede the JSON
 */
export function parseJsonOutput<T = unknown>(output: string): T {
  // Find lines that look like JSON (start with { or [)
  const lines = output.split('\n')
  const jsonLines: string[] = []
  let inJson = false
  let braceCount = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!inJson && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
      inJson = true
    }
    
    if (inJson) {
      jsonLines.push(line)
      braceCount += (line.match(/[{[]/g) || []).length
      braceCount -= (line.match(/[}\]]/g) || []).length
      
      if (braceCount === 0) {
        break
      }
    }
  }
  
  if (jsonLines.length === 0) {
    throw new Error(`No JSON found in output: ${output}`)
  }
  
  return JSON.parse(jsonLines.join('\n')) as T
}
