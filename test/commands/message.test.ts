import { expect } from 'chai'
import { runCommand } from '@oclif/test'
import { clearMocks, mocks, mockApiResponse, parseJsonOutput } from '../helpers/index.js'

describe('message commands', () => {
  beforeEach(() => {
    clearMocks()
  })

  describe('message list', () => {
    it('should list messages', async () => {
      mocks.messageList()
      
      const { stdout } = await runCommand(['message', 'list'])
      expect(stdout).to.include('+15551234567')
    })

    it('should output JSON with --json flag', async () => {
      mocks.messageList()
      
      const { stdout } = await runCommand(['message', 'list', '--json'])
      const json = parseJsonOutput<{ data: unknown[] }>(stdout)
      expect(json.data).to.be.an('array')
    })

    it('should handle empty results', async () => {
      mockApiResponse('GET', '/messages', { data: [] })
      
      const { stdout } = await runCommand(['message', 'list'])
      expect(stdout).to.include('No messages found')
    })
  })

  describe('message get', () => {
    it('should get message details', async () => {
      mocks.messageGet('msg-123')
      
      const { stdout } = await runCommand(['message', 'get', 'msg-123'])
      expect(stdout).to.include('Message Details')
      expect(stdout).to.include('+15551234567')
    })

    it('should output JSON with --json flag', async () => {
      mocks.messageGet('msg-123')
      
      const { stdout } = await runCommand(['message', 'get', 'msg-123', '--json'])
      const json = parseJsonOutput<{ data: { id: string } }>(stdout)
      expect(json.data.id).to.equal('msg-123')
    })
  })

  describe('message send', () => {
    it('should send a message', async () => {
      mocks.messageSend()
      
      const result = await runCommand([
        'message', 'send',
        '--from', '+15551234567',
        '--to', '+15559876543',
        '--text=Hello',
      ])
      
      // If there's an error, fail with the error message
      if (result.error) {
        expect.fail(`Command failed: ${result.error.message}`)
      }
      
      expect(result.stdout).to.include('Message sent')
    })

    it('should require from, to, and text', async () => {
      const { error } = await runCommand(['message', 'send'])
      expect(error?.message).to.include('Missing required flag')
    })
  })
})
