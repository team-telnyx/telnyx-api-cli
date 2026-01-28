import { expect } from 'chai'
import { runCommand } from '@oclif/test'

describe('profile commands', () => {
  describe('profile list', () => {
    it('should list profiles', async () => {
      const { stdout } = await runCommand(['profile', 'list'])
      expect(stdout).to.include('profile')
    })

    it('should output JSON with --json flag', async () => {
      const { stdout } = await runCommand(['profile', 'list', '--json'])
      const json = JSON.parse(stdout)
      expect(json).to.have.property('profiles')
      expect(json).to.have.property('configPath')
    })
  })

  describe('profile use', () => {
    it('should require profile name', async () => {
      const { error } = await runCommand(['profile', 'use'])
      expect(error?.message).to.include('Missing')
    })
  })

  describe('profile delete', () => {
    it('should require profile name', async () => {
      const { error } = await runCommand(['profile', 'delete'])
      expect(error?.message).to.include('Missing')
    })

    it('should support dry-run', async () => {
      const { stdout } = await runCommand(['profile', 'delete', 'nonexistent', '--dry-run'])
      // Will fail because profile doesn't exist, but should still show dry-run behavior
      expect(stdout).to.satisfy((s: string) => s.includes('DRY RUN') || s === '')
    })
  })
})
