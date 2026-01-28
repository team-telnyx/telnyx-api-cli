import { getApiKey } from './config.js'

const API_V2_BASE = 'https://api.telnyx.com/v2'
const API_10DLC_BASE = 'https://api.telnyx.com/10dlc'
const STORAGE_BASE = 'https://us-central-1.telnyxcloudstorage.com'

export interface ApiOptions {
  profile?: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: {
    code: string
    title: string
    detail?: string
  }
}

async function makeRequest<T>(
  baseUrl: string,
  method: string,
  endpoint: string,
  options: ApiOptions & { body?: unknown } = {}
): Promise<T> {
  const apiKey = getApiKey(options.profile)
  
  if (!apiKey) {
    throw new Error('No API key configured. Run "telnyx auth setup" or set TELNYX_API_KEY')
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

  const response = await fetch(url, fetchOptions)
  const data = await response.json() as ApiResponse<T>

  if (!response.ok) {
    const error = data.error || { code: 'UNKNOWN', title: 'Unknown error' }
    throw new Error(`API Error (${error.code}): ${error.title}${error.detail ? ` - ${error.detail}` : ''}`)
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
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    throw new Error(`Invalid ${name} format: ${id}`)
  }
}

export function validatePhone(phone: string): void {
  if (!/^\+?[0-9]+$/.test(phone)) {
    throw new Error(`Invalid phone number format. Use E.164 format (e.g., +12025551234)`)
  }
}

export function validateBucketName(name: string): void {
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name)) {
    throw new Error('Invalid bucket name. Use lowercase letters, numbers, hyphens, and periods (3-63 chars)')
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
