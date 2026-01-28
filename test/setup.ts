/**
 * Global test setup - runs before all tests
 */

import { setupMockApi, teardownMockApi } from './helpers/mock-api.js'

// Set test API key via environment (simplest approach)
process.env.TELNYX_API_KEY = 'KEY_test1234567890abcdef'

// Set up API mocking globally
setupMockApi()

// Teardown on exit
process.on('exit', () => {
  teardownMockApi()
})
