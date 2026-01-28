import { getApiKey } from './config.js'

const API_V2_BASE = 'https://api.telnyx.com/v2'
const API_10DLC_BASE = 'https://api.telnyx.com/10dlc'
const STORAGE_BASE = 'https://us-central-1.telnyxcloudstorage.com'

export interface ApiOptions {
  profile?: string
  verbose?: boolean
}

export interface ApiError {
  code: string
  title: string
  detail?: string
  meta?: Record<string, unknown>
}

export interface ApiResponse<T = unknown> {
  data?: T
  errors?: ApiError[]
  error?: ApiError
}

// Friendly error messages for common error codes
const ERROR_HINTS: Record<string, string> = {
  '10001': 'Check that your API key is valid and has the required permissions.',
  '10002': 'The requested resource was not found. Verify the ID is correct.',
  '10003': 'Invalid request parameters. Check your input values.',
  '10004': 'Rate limit exceeded. Wait a moment and try again.',
  '10005': 'Insufficient funds. Check your account balance with "telnyx billing balance".',
  '40001': 'Invalid phone number format. Use E.164 format (e.g., +12025551234).',
  '40002': 'Phone number not found. Check the number is correct.',
  '40300': 'Number not available for purchase. Try a different number.',
  '40301': 'Number already owned. Check your numbers with "telnyx number list".',
  '50000': 'Internal server error. Try again later or contact support.',
}

// Suggest similar commands for common typos/mistakes
export function suggestCommand(input: string, commands: string[]): string | null {
  const threshold = 3 // Max edit distance
  
  for (const cmd of commands) {
    if (levenshteinDistance(input.toLowerCase(), cmd.toLowerCase()) <= threshold) {
      return cmd
    }
  }
  return null
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

export class TelnyxApiError extends Error {
  code: string
  detail?: string
  hint?: string
  statusCode?: number

  constructor(error: ApiError, statusCode?: number) {
    const hint = ERROR_HINTS[error.code]
    const message = `${error.title}${error.detail ? `: ${error.detail}` : ''}${hint ? `\n\n💡 Hint: ${hint}` : ''}`
    
    super(message)
    this.name = 'TelnyxApiError'
    this.code = error.code
    this.detail = error.detail
    this.hint = hint
    this.statusCode = statusCode
  }
}

let verboseLogger: ((msg: string) => void) | null = null

export function setVerboseLogger(logger: (msg: string) => void): void {
  verboseLogger = logger
}

async function makeRequest<T>(
  baseUrl: string,
  method: string,
  endpoint: string,
  options: ApiOptions & { body?: unknown } = {}
): Promise<T> {
  const apiKey = getApiKey(options.profile)
  
  if (!apiKey) {
    throw new Error(
      'No API key configured.\n\n' +
      'To fix this, either:\n' +
      '  1. Run: telnyx auth setup\n' +
      '  2. Set environment variable: export TELNYX_API_KEY=KEY_xxx\n\n' +
      'Get your API key from: https://portal.telnyx.com/#/app/api-keys'
    )
  }

  const url = `${baseUrl}${endpoint}`
  
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  }

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  // Verbose logging
  if (options.verbose && verboseLogger) {
    verboseLogger(`${method} ${url}`)
    if (options.body) {
      verboseLogger(`Body: ${JSON.stringify(options.body, null, 2)}`)
    }
  }

  const startTime = Date.now()
  const response = await fetch(url, fetchOptions)
  const elapsed = Date.now() - startTime

  // Handle empty responses (204 No Content)
  let data: ApiResponse<T>
  const contentType = response.headers.get('content-type')
  if (response.status === 204 || !contentType?.includes('application/json')) {
    data = {} as ApiResponse<T>
  } else {
    data = await response.json() as ApiResponse<T>
  }

  if (options.verbose && verboseLogger) {
    verboseLogger(`Response: ${response.status} (${elapsed}ms)`)
  }

  if (!response.ok) {
    const error = data.errors?.[0] || data.error || { 
      code: `HTTP_${response.status}`, 
      title: response.statusText || 'Request failed' 
    }
    throw new TelnyxApiError(error, response.status)
  }

  return data as T
}

// V2 API helpers
export const v2 = {
  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_V2_BASE, 'GET', endpoint, options)
  },

  async post<T>(endpoint: string, body: unknown, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_V2_BASE, 'POST', endpoint, { ...options, body })
  },

  async put<T>(endpoint: string, body: unknown, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_V2_BASE, 'PUT', endpoint, { ...options, body })
  },

  async patch<T>(endpoint: string, body: unknown, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_V2_BASE, 'PATCH', endpoint, { ...options, body })
  },

  async delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_V2_BASE, 'DELETE', endpoint, options)
  },
}

// 10DLC API helpers (different base URL)
export const tenDlc = {
  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_10DLC_BASE, 'GET', endpoint, options)
  },

  async post<T>(endpoint: string, body: unknown, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_10DLC_BASE, 'POST', endpoint, { ...options, body })
  },

  async put<T>(endpoint: string, body: unknown, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_10DLC_BASE, 'PUT', endpoint, { ...options, body })
  },

  async delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return makeRequest<T>(API_10DLC_BASE, 'DELETE', endpoint, options)
  },
}

// Validation helpers
export function validateId(id: string, name = 'ID'): void {
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
    throw new Error(
      `Invalid ${name} format: "${id}"\n\n` +
      `${name} should contain only letters, numbers, and hyphens.`
    )
  }
}

export function validatePhone(phone: string): void {
  // Strip common formatting
  const cleaned = phone.replace(/[\s()-]/g, '')
  
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
    throw new Error(
      `Invalid phone number format: "${phone}"\n\n` +
      'Use E.164 format (e.g., +12025551234).\n' +
      'The number should start with + followed by country code and number.'
    )
  }
}

export function validateBucketName(name: string): void {
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name)) {
    throw new Error(
      `Invalid bucket name: "${name}"\n\n` +
      'Bucket names must:\n' +
      '  • Be 3-63 characters long\n' +
      '  • Start and end with a letter or number\n' +
      '  • Contain only lowercase letters, numbers, hyphens, and periods'
    )
  }
}

// Storage API helpers (S3-compatible)
export const storage = {
  getEndpoint(): string {
    return STORAGE_BASE
  },

  getCredentials(profile?: string): { accessKeyId: string; secretAccessKey: string } {
    const apiKey = getApiKey(profile)
    if (!apiKey) {
      throw new Error('No API key configured. Run "telnyx auth setup" or set TELNYX_API_KEY')
    }
    // Telnyx uses API key for both access key and secret
    return { accessKeyId: apiKey, secretAccessKey: apiKey }
  },
}
