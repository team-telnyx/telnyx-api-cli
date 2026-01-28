import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface Profile {
  apiKey: string
}

export interface Config {
  profiles: Record<string, Profile>
  defaultProfile: string
}

const CONFIG_DIR = join(homedir(), '.config', 'telnyx')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export function getConfigDir(): string {
  return CONFIG_DIR
}

export function getConfigPath(): string {
  return CONFIG_FILE
}

export class ConfigError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

function validateConfig(config: unknown): config is Config {
  if (typeof config !== 'object' || config === null) {
    return false
  }
  
  const c = config as Record<string, unknown>
  
  if (typeof c.profiles !== 'object' || c.profiles === null) {
    return false
  }
  
  // Validate each profile
  for (const [name, profile] of Object.entries(c.profiles as Record<string, unknown>)) {
    if (typeof profile !== 'object' || profile === null) {
      throw new ConfigError(
        `Invalid profile "${name}": expected an object`,
        CONFIG_FILE
      )
    }
    
    const p = profile as Record<string, unknown>
    if (typeof p.apiKey !== 'string') {
      throw new ConfigError(
        `Invalid profile "${name}": missing or invalid apiKey`,
        CONFIG_FILE
      )
    }
    
    // Validate API key format
    if (p.apiKey && !isValidApiKey(p.apiKey)) {
      throw new ConfigError(
        `Invalid API key format in profile "${name}".\n` +
        'API keys should start with "KEY" followed by alphanumeric characters.',
        CONFIG_FILE
      )
    }
  }
  
  return true
}

function isValidApiKey(key: string): boolean {
  // Telnyx API keys start with KEY followed by alphanumeric chars
  // Allow some flexibility in format
  return /^KEY[a-zA-Z0-9_-]{10,}$/.test(key) || /^[a-zA-Z0-9_-]{20,}$/.test(key)
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { profiles: {}, defaultProfile: 'default' }
  }

  let content: string
  try {
    content = readFileSync(CONFIG_FILE, 'utf8')
  } catch (err) {
    throw new ConfigError(
      `Could not read config file: ${(err as Error).message}\n\n` +
      `Config file location: ${CONFIG_FILE}\n` +
      'Try deleting the file and running "telnyx auth setup" again.',
      CONFIG_FILE
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (err) {
    throw new ConfigError(
      `Config file contains invalid JSON: ${(err as Error).message}\n\n` +
      `Config file location: ${CONFIG_FILE}\n` +
      'Try deleting the file and running "telnyx auth setup" again.',
      CONFIG_FILE
    )
  }

  try {
    if (!validateConfig(parsed)) {
      throw new ConfigError(
        'Config file has an invalid structure.\n\n' +
        `Config file location: ${CONFIG_FILE}\n` +
        'Try deleting the file and running "telnyx auth setup" again.',
        CONFIG_FILE
      )
    }
  } catch (err) {
    if (err instanceof ConfigError) throw err
    throw new ConfigError(
      `Config validation failed: ${(err as Error).message}`,
      CONFIG_FILE
    )
  }

  return parsed
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  chmodSync(CONFIG_FILE, 0o600) // Owner read/write only
}

export function getApiKey(profile?: string): string | undefined {
  // Environment variable takes precedence
  if (process.env.TELNYX_API_KEY) {
    return process.env.TELNYX_API_KEY
  }

  const config = loadConfig()
  const profileName = profile || config.defaultProfile || 'default'
  const apiKey = config.profiles[profileName]?.apiKey

  if (!apiKey && profile) {
    // User specified a profile that doesn't exist
    const available = Object.keys(config.profiles)
    if (available.length > 0) {
      throw new ConfigError(
        `Profile "${profile}" not found.\n\n` +
        `Available profiles: ${available.join(', ')}\n` +
        `To create a new profile: telnyx auth setup --profile ${profile}`,
        CONFIG_FILE
      )
    }
  }

  return apiKey
}

export function setApiKey(apiKey: string, profile = 'default'): void {
  // Validate API key format before saving
  if (!isValidApiKey(apiKey)) {
    throw new ConfigError(
      'Invalid API key format.\n\n' +
      'Telnyx API keys typically start with "KEY" followed by alphanumeric characters.\n' +
      'Get your API key from: https://portal.telnyx.com/#/app/api-keys',
      CONFIG_FILE
    )
  }

  const config = loadConfig()
  
  if (!config.profiles[profile]) {
    config.profiles[profile] = { apiKey: '' }
  }
  
  config.profiles[profile].apiKey = apiKey
  
  if (!config.defaultProfile) {
    config.defaultProfile = profile
  }
  
  saveConfig(config)
}

export function listProfiles(): string[] {
  const config = loadConfig()
  return Object.keys(config.profiles)
}

export function getDefaultProfile(): string {
  const config = loadConfig()
  return config.defaultProfile || 'default'
}

export function setDefaultProfile(profile: string): void {
  const config = loadConfig()
  
  if (!config.profiles[profile]) {
    const available = Object.keys(config.profiles)
    throw new ConfigError(
      `Profile "${profile}" not found.\n\n` +
      (available.length > 0 
        ? `Available profiles: ${available.join(', ')}`
        : 'No profiles configured. Run "telnyx auth setup" first.'),
      CONFIG_FILE
    )
  }
  
  config.defaultProfile = profile
  saveConfig(config)
}

export function deleteProfile(profile: string): void {
  const config = loadConfig()
  
  if (!config.profiles[profile]) {
    throw new ConfigError(`Profile "${profile}" not found.`, CONFIG_FILE)
  }
  
  delete config.profiles[profile]
  
  // If we deleted the default profile, set a new one
  if (config.defaultProfile === profile) {
    const remaining = Object.keys(config.profiles)
    config.defaultProfile = remaining[0] || 'default'
  }
  
  saveConfig(config)
}
