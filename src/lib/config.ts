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

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { profiles: {}, defaultProfile: 'default' }
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf8')
    return JSON.parse(content) as Config
  } catch {
    return { profiles: {}, defaultProfile: 'default' }
  }
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
  return config.profiles[profileName]?.apiKey
}

export function setApiKey(apiKey: string, profile = 'default'): void {
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
  config.defaultProfile = profile
  saveConfig(config)
}
