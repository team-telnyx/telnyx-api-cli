import { expect } from 'chai'
import { runCommand } from '@oclif/test'
import { clearMocks, mocks, mockApiResponse, parseJsonOutput } from '../helpers/index.js'

describe('number commands', () => {
  beforeEach(() => {
    clearMocks()
  })

  describe('number list', () => {
    it('should list phone numbers', async () => {
      mocks.numberList()
      
      const { stdout } = await runCommand(['number', 'list'])
      expect(stdout).to.include('+15551234567')
      expect(stdout).to.include('active')
    })

    it('should output JSON with --json flag', async () => {
      mocks.numberList()
      
      const { stdout } = await runCommand(['number', 'list', '--json'])
      const json = parseJsonOutput<{ data: Array<{ phone_number: string }> }>(stdout)
      expect(json.data).to.be.an('array')
      expect(json.data[0].phone_number).to.equal('+15551234567')
    })
  })

  describe('number get', () => {
    it('should get number details', async () => {
      mocks.numberGet('+15551234567')
      
      const { stdout } = await runCommand(['number', 'get', '+15551234567'])
      expect(stdout).to.include('+15551234567')
    })
  })

  describe('number search', () => {
    it('should search for numbers', async () => {
      mockApiResponse('GET', '/available_phone_numbers', {
        data: [
          { 
            phone_number: '+15551111111', 
            region_information: [{ region_type: 'state', region_name: 'California' }],
            cost_information: { upfront_cost: '1.00', monthly_cost: '1.00', currency: 'USD' },
            features: [],
          },
        ],
      })
      
      const { stdout } = await runCommand(['number', 'search', '--country', 'US'])
      expect(stdout).to.include('+15551111111')
    })

    it('should require country flag', async () => {
      const { error } = await runCommand(['number', 'search'])
      expect(error?.message).to.include('country')
    })
  })

  describe('number update', () => {
    it('should update number settings', async () => {
      mockApiResponse('PATCH', '/phone_numbers/', {
        data: {
          id: '123',
          phone_number: '+15551234567',
          status: 'active',
          tags: ['production'],
        },
      })
      
      const { stdout } = await runCommand([
        'number', 'update', '+15551234567',
        '--tags', 'production',
      ])
      expect(stdout).to.include('Updated')
    })

    it('should support dry-run mode', async () => {
      const { stdout } = await runCommand([
        'number', 'update', '+15551234567',
        '--tags', 'test',
        '--dry-run',
      ])
      expect(stdout).to.include('[DRY RUN]')
      expect(stdout).to.include('tags')
    })

    it('should warn when no updates specified', async () => {
      const { stdout } = await runCommand(['number', 'update', '+15551234567'])
      expect(stdout).to.include('No updates specified')
    })
  })

  describe('number delete', () => {
    it('should support dry-run mode', async () => {
      const { stdout } = await runCommand([
        'number', 'delete', '+15551234567',
        '--dry-run',
      ])
      expect(stdout).to.include('[DRY RUN]')
      expect(stdout).to.include('release')
    })

    it('should delete with --force', async () => {
      mocks.numberDelete()
      
      const { stdout } = await runCommand([
        'number', 'delete', '+15551234567',
        '--force',
      ])
      expect(stdout).to.include('released')
    })
  })
})
