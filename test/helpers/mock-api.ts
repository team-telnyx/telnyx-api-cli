/**
 * API mocking utilities for tests
 * 
 * Uses a global mock handler list that persists across test files.
 * Call setupMockApi() once at the start and mocks will be available everywhere.
 */

type MockResponse = {
  status?: number
  data?: unknown
  error?: { code: string; title: string; detail?: string }
}

type MockHandler = {
  method: string
  pattern: RegExp | string
  response: MockResponse | ((url: string, body?: unknown) => MockResponse)
}

// Use globalThis to ensure mocks persist across module reloads
declare global {
  // eslint-disable-next-line no-var
  var __telnyxMockHandlers: MockHandler[]
  // eslint-disable-next-line no-var  
  var __telnyxOriginalFetch: typeof fetch | undefined
  // eslint-disable-next-line no-var
  var __telnyxMockSetup: boolean
}

globalThis.__telnyxMockHandlers = globalThis.__telnyxMockHandlers || []
const mockHandlers = globalThis.__telnyxMockHandlers

/**
 * Set up fetch mocking before tests
 */
export function setupMockApi(): void {
  if (globalThis.__telnyxMockSetup) return
  
  globalThis.__telnyxOriginalFetch = globalThis.fetch
  
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = init?.method || 'GET'
    
    for (const handler of mockHandlers) {
      const matches = typeof handler.pattern === 'string' 
        ? url.includes(handler.pattern)
        : handler.pattern.test(url)
      
      if (matches && handler.method === method) {
        const mockResponse = typeof handler.response === 'function'
          ? handler.response(url, init?.body ? JSON.parse(init.body as string) : undefined)
          : handler.response
        
        const status = mockResponse.status || 200
        
        // Handle 204 No Content specially
        if (status === 204) {
          return new Response(null, { status: 204 })
        }
        
        const body = mockResponse.error 
          ? { errors: [mockResponse.error] }
          : mockResponse.data !== undefined 
            ? { data: mockResponse.data }
            : {}
        
        return new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    
    // No mock found - fail with helpful message
    throw new Error(`No mock handler for ${method} ${url}. Add one with mockApiResponse().`)
  }
  
  globalThis.__telnyxMockSetup = true
}

/**
 * Restore original fetch after tests
 */
export function teardownMockApi(): void {
  if (globalThis.__telnyxOriginalFetch) {
    globalThis.fetch = globalThis.__telnyxOriginalFetch
  }
  mockHandlers.length = 0
  globalThis.__telnyxMockSetup = false
}

/**
 * Clear all mock handlers
 */
export function clearMocks(): void {
  mockHandlers.length = 0
}

/**
 * Add a mock API response
 */
export function mockApiResponse(
  method: string,
  pattern: RegExp | string,
  response: MockResponse | ((url: string, body?: unknown) => MockResponse)
): void {
  mockHandlers.push({ method, pattern, response })
}

/**
 * Common mock responses
 */
export const mocks = {
  // Auth & account
  balance: () => mockApiResponse('GET', '/balance', {
    data: {
      balance: '100.00',
      credit_limit: '500.00',
      currency: 'USD',
      available_credit: '600.00',
    },
  }),

  // Phone numbers
  numberList: (numbers: Array<{ phone_number: string; status: string }> = []) =>
    mockApiResponse('GET', '/phone_numbers', {
      data: numbers.length ? numbers : [
        { id: '123', phone_number: '+15551234567', status: 'active' },
        { id: '456', phone_number: '+15559876543', status: 'active' },
      ],
    }),

  numberGet: (phone = '+15551234567') =>
    mockApiResponse('GET', new RegExp(`/phone_numbers/.*${phone.replace('+', '\\+')}`), {
      data: {
        id: '123',
        phone_number: phone,
        status: 'active',
        connection_id: 'conn-123',
      },
    }),

  numberDelete: () =>
    mockApiResponse('DELETE', '/phone_numbers/', { status: 204 }),

  // Messages
  messageList: () =>
    mockApiResponse('GET', '/messages', {
      data: [
        {
          id: 'msg-1',
          direction: 'outbound',
          type: 'SMS',
          from: { phone_number: '+15551234567' },
          to: [{ phone_number: '+15559876543', status: 'delivered' }],
          text: 'Hello',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    }),

  messageSend: () =>
    mockApiResponse('POST', '/messages', {
      data: {
        id: 'msg-new',
        direction: 'outbound',
        type: 'SMS',
        from: { phone_number: '+15551234567' },
        to: [{ phone_number: '+15559876543', status: 'queued' }],
      },
    }),

  messageGet: (id = 'msg-1') =>
    mockApiResponse('GET', `/messages/${id}`, {
      data: {
        id,
        direction: 'outbound',
        type: 'SMS',
        from: { phone_number: '+15551234567' },
        to: [{ phone_number: '+15559876543', status: 'delivered' }],
        text: 'Hello',
        parts: 1,
        created_at: '2024-01-01T00:00:00Z',
      },
    }),

  // Calls
  callList: () =>
    mockApiResponse('GET', '/calls', {
      data: [
        {
          id: 'call-1',
          call_leg_id: 'leg-1',
          direction: 'outgoing',
          from: '+15551234567',
          to: '+15559876543',
          state: 'completed',
          is_alive: false,
          start_time: '2024-01-01T00:00:00Z',
        },
      ],
    }),

  // Webhook deliveries (debugger)
  webhookDeliveryList: () =>
    mockApiResponse('GET', '/webhook_deliveries', {
      data: [
        {
          id: 'del-1',
          status: 'delivered',
          webhook: {
            id: 'evt-1',
            event_type: 'message.received',
            occurred_at: '2024-01-01T00:00:00Z',
            payload: { test: true },
          },
          started_at: '2024-01-01T00:00:00Z',
          finished_at: '2024-01-01T00:00:01Z',
          attempts: [{ status: 'delivered', http: { response: { status: 200 } } }],
        },
      ],
    }),

  // Errors
  unauthorized: () =>
    mockApiResponse('GET', '', { status: 401, error: { code: '10001', title: 'Unauthorized' } }),

  notFound: (pattern: string | RegExp) =>
    mockApiResponse('GET', pattern, { status: 404, error: { code: '10002', title: 'Not found' } }),

  rateLimited: () =>
    mockApiResponse('GET', '', { status: 429, error: { code: '10004', title: 'Rate limit exceeded' } }),
}
