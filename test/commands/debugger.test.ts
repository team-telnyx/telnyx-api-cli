import { expect } from 'chai'
import { runCommand } from '@oclif/test'
import { clearMocks, mocks, mockApiResponse, parseJsonOutput } from '../helpers/index.js'

describe('debugger commands', () => {
  beforeEach(() => {
    clearMocks()
  })

  describe('debugger list', () => {
    it('should list webhook deliveries', async () => {
      mocks.webhookDeliveryList()
      
      const { stdout } = await runCommand(['debugger', 'list'])
      expect(stdout).to.include('message.received')
    })

    it('should output JSON with --json flag', async () => {
      mocks.webhookDeliveryList()
      
      const { stdout } = await runCommand(['debugger', 'list', '--json'])
      const json = parseJsonOutput<{ data: Array<{ webhook: { event_type: string } }> }>(stdout)
      expect(json.data).to.be.an('array')
      expect(json.data[0].webhook.event_type).to.equal('message.received')
    })

    it('should handle empty results', async () => {
      mockApiResponse('GET', '/webhook_deliveries', { data: [] })
      
      const { stdout } = await runCommand(['debugger', 'list'])
      expect(stdout).to.include('No webhook deliveries found')
    })

    it('should filter by status', async () => {
      mockApiResponse('GET', 'status%5D%5Beq%5D=failed', {
        data: [{
          id: 'del-failed',
          status: 'failed',
          webhook: { 
            id: 'evt-1',
            event_type: 'message.sent', 
            occurred_at: '2024-01-01T00:00:00Z', 
            payload: {} 
          },
          started_at: '2024-01-01T00:00:00Z',
          finished_at: '2024-01-01T00:00:01Z',
          attempts: [{ status: 'failed', http: { response: { status: 500 } } }],
        }],
      })
      
      const { stdout } = await runCommand(['debugger', 'list', '--status', 'failed'])
      expect(stdout).to.include('message.sent')
    })
  })

  describe('debugger get', () => {
    it('should get delivery details', async () => {
      mockApiResponse('GET', '/webhook_deliveries/del-123', {
        data: {
          id: 'del-123',
          status: 'delivered',
          webhook: {
            id: 'evt-1',
            event_type: 'call.initiated',
            occurred_at: '2024-01-01T00:00:00Z',
            payload: { call_leg_id: 'leg-1' },
          },
          started_at: '2024-01-01T00:00:00Z',
          finished_at: '2024-01-01T00:00:01Z',
          attempts: [{
            status: 'delivered',
            started_at: '2024-01-01T00:00:00Z',
            finished_at: '2024-01-01T00:00:01Z',
            http: {
              request: { url: 'https://example.com/webhook' },
              response: { status: 200, body: 'OK' },
            },
          }],
        },
      })
      
      const { stdout } = await runCommand(['debugger', 'get', 'del-123'])
      expect(stdout).to.include('Webhook Delivery Details')
      expect(stdout).to.include('call.initiated')
      expect(stdout).to.include('Delivered')
      expect(stdout).to.include('example.com')
    })

    it('should require delivery ID', async () => {
      const { error } = await runCommand(['debugger', 'get'])
      expect(error?.message).to.include('Missing')
    })
  })
})
