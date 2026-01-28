import { expect } from 'chai'
import { runCommand } from '@oclif/test'
import { clearMocks, mocks } from '../helpers/index.js'

describe('auth commands', () => {
  beforeEach(() => {
    clearMocks()
  })

  describe('auth status', () => {
    it('should show authenticated status', async () => {
      const { stdout } = await runCommand(['auth', 'status'])
      expect(stdout).to.include('API key')
    })
  })

  describe('auth whoami', () => {
    it('should display account info', async () => {
      mocks.balance()
      
      const { stdout } = await runCommand(['auth', 'whoami'])
      expect(stdout).to.include('Authentication Status')
      expect(stdout).to.include('Profile')
    })

    it('should output JSON with --json flag', async () => {
      mocks.balance()
      
      const { stdout } = await runCommand(['auth', 'whoami', '--json'])
      const json = JSON.parse(stdout)
      expect(json).to.have.property('profile')
      expect(json).to.have.property('configPath')
    })
  })

  describe('whoami alias', () => {
    it('should work as top-level command', async () => {
      mocks.balance()
      
      const { stdout } = await runCommand(['whoami'])
      expect(stdout).to.include('Authentication Status')
    })
  })
})
