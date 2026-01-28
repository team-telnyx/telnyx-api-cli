import { expect } from 'chai'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('config', () => {
  let testConfigDir: string
  let originalHome: string | undefined
  let config: typeof import('../../src/lib/config.js')

  before(async () => {
    // Save original HOME
    originalHome = process.env.HOME
    
    // Create temp directory for config
    testConfigDir = join(tmpdir(), `telnyx-cli-test-${Date.now()}`)
    const configDir = join(testConfigDir, '.config', 'telnyx')
    mkdirSync(configDir, { recursive: true })
    
    // Write test config
    const testConfig = {
      profiles: {
        default: { apiKey: 'KEY_test1234567890abcdef' },
        production: { apiKey: 'KEY_prod1234567890abcdef' },
      },
      defaultProfile: 'default',
    }
    writeFileSync(join(configDir, 'config.json'), JSON.stringify(testConfig, null, 2))
    
    // Set HOME to temp directory
    process.env.HOME = testConfigDir
    
    // Clear any cached API key from environment
    delete process.env.TELNYX_API_KEY
    
    // Force fresh import of config module
    // Since ES modules cache, we need to import with a cache-busting query
    const timestamp = Date.now()
    config = await import(`../../src/lib/config.js?t=${timestamp}`)
  })

  after(() => {
    // Restore original HOME
    if (originalHome !== undefined) {
      process.env.HOME = originalHome
    }
    
    // Clean up temp directory
    if (testConfigDir && existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true, force: true })
    }
  })

  describe('loadConfig', () => {
    it('should load config from file', () => {
      const loaded = config.loadConfig()
      expect(loaded.profiles).to.have.property('default')
      expect(loaded.profiles).to.have.property('production')
    })
  })

  describe('getApiKey', () => {
    it('should return API key from environment variable first', () => {
      process.env.TELNYX_API_KEY = 'KEY_envvar1234567890abcd'
      const key = config.getApiKey()
      expect(key).to.equal('KEY_envvar1234567890abcd')
      delete process.env.TELNYX_API_KEY
    })
  })

  describe('listProfiles', () => {
    it('should list all profiles', () => {
      const profiles = config.listProfiles()
      expect(profiles).to.include('default')
      expect(profiles).to.include('production')
    })
  })

  describe('getDefaultProfile', () => {
    it('should return the default profile name', () => {
      const profile = config.getDefaultProfile()
      expect(profile).to.equal('default')
    })
  })
})
