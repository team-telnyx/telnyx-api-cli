/**
 * Mocha root hooks - runs before all tests
 */

import { setupMockApi } from './helpers/mock-api.js'

// Set test API key via environment
process.env.TELNYX_API_KEY = 'KEY_test1234567890abcdef'

// Set up API mocking globally
setupMockApi()

export const mochaHooks = {
  beforeAll() {
    // Already set up above
  },
}
