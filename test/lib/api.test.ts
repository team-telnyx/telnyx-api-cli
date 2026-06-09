import { expect } from 'chai'
import { clearMocks, mockApiResponse, mocks } from '../helpers/index.js'
import { v2, validateId, validatePhone, validateBucketName, TelnyxApiError, storage } from '../../src/lib/api.js'

describe('api', () => {
  beforeEach(() => {
    clearMocks()
  })

  describe('v2.get', () => {
    it('should make GET request and return data', async () => {
      mocks.balance()
      
      const response = await v2.get<{ data: { balance: string } }>('/balance')
      expect(response.data.balance).to.equal('100.00')
    })

    it('should throw TelnyxApiError on error response', async () => {
      mockApiResponse('GET', '/test-error', { 
        status: 404, 
        error: { code: '10002', title: 'Not found' } 
      })
      
      try {
        await v2.get('/test-error')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(TelnyxApiError)
        expect((err as TelnyxApiError).code).to.equal('10002')
      }
    })
  })

  describe('v2.post', () => {
    it('should make POST request with body', async () => {
      mockApiResponse('POST', '/messages', (url, body) => ({
        data: { id: 'msg-1', ...(body as object) },
      }))
      
      const response = await v2.post<{ data: { id: string; text: string } }>(
        '/messages',
        { text: 'Hello' }
      )
      expect(response.data.id).to.equal('msg-1')
      expect(response.data.text).to.equal('Hello')
    })
  })

  describe('v2.delete', () => {
    it('should make DELETE request', async () => {
      mockApiResponse('DELETE', '/phone_numbers/', { status: 204 })
      
      // Should not throw
      await v2.delete('/phone_numbers/+15551234567')
    })
  })

  describe('validateId', () => {
    it('should accept valid IDs', () => {
      expect(() => validateId('abc-123-def')).to.not.throw()
      expect(() => validateId('12345')).to.not.throw()
      expect(() => validateId('UUID-like-string')).to.not.throw()
    })

    it('should reject invalid IDs', () => {
      expect(() => validateId('')).to.throw(/Invalid/)
      expect(() => validateId('has spaces')).to.throw(/Invalid/)
      expect(() => validateId('has@special')).to.throw(/Invalid/)
    })
  })

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      expect(() => validatePhone('+15551234567')).to.not.throw()
      expect(() => validatePhone('+442071234567')).to.not.throw()
      expect(() => validatePhone('15551234567')).to.not.throw()
    })

    it('should accept formatted phone numbers', () => {
      expect(() => validatePhone('+1 (555) 123-4567')).to.not.throw()
      expect(() => validatePhone('+1-555-123-4567')).to.not.throw()
    })

    it('should reject invalid phone numbers', () => {
      expect(() => validatePhone('abc')).to.throw(/Invalid phone/)
      expect(() => validatePhone('123')).to.throw(/Invalid phone/) // Too short
    })
  })

  describe('storage configuration', () => {
    const originalStorageRegion = process.env.TELNYX_STORAGE_REGION
    const originalApiKey = process.env.TELNYX_API_KEY

    afterEach(() => {
      if (originalStorageRegion === undefined) {
        delete process.env.TELNYX_STORAGE_REGION
      } else {
        process.env.TELNYX_STORAGE_REGION = originalStorageRegion
      }

      if (originalApiKey === undefined) {
        delete process.env.TELNYX_API_KEY
      } else {
        process.env.TELNYX_API_KEY = originalApiKey
      }
    })

    it('should default storage operations to us-central-1', () => {
      delete process.env.TELNYX_STORAGE_REGION

      expect(storage.getRegion()).to.equal('us-central-1')
      expect(storage.getEndpoint()).to.equal('https://us-central-1.telnyxcloudstorage.com')
    })

    it('should derive endpoint from storage region', () => {
      expect(storage.getRegion({ region: 'eu-central-1' })).to.equal('eu-central-1')
      expect(storage.getEndpoint({ region: 'eu-central-1' })).to.equal('https://eu-central-1.telnyxcloudstorage.com')
    })

    it('should use env var for storage region', () => {
      process.env.TELNYX_STORAGE_REGION = 'eu-central-1'

      expect(storage.getRegion()).to.equal('eu-central-1')
      expect(storage.getEndpoint()).to.equal('https://eu-central-1.telnyxcloudstorage.com')
    })

    it('should reject unsupported storage regions', () => {
      expect(() => storage.getRegion({ region: 'eu-central' })).to.throw(/Unsupported storage region/)
      expect(() => storage.getRegion({ region: 'mars' })).to.throw(/Unsupported storage region/)
    })

    it('should build S3 client config from region and credentials', () => {
      process.env.TELNYX_API_KEY = 'KEY_test1234567890abcdef'

      const config = storage.getClientConfig({ region: 'eu-central-1' })

      expect(config.endpoint).to.equal('https://eu-central-1.telnyxcloudstorage.com')
      expect(config.region).to.equal('eu-central-1')
      expect(config.forcePathStyle).to.equal(true)
      expect(config.credentials.accessKeyId).to.equal('KEY_test1234567890abcdef')
      expect(config.credentials.secretAccessKey).to.equal('KEY_test1234567890abcdef')
    })
  })

  describe('validateBucketName', () => {
    it('should accept valid bucket names', () => {
      expect(() => validateBucketName('my-bucket')).to.not.throw()
      expect(() => validateBucketName('bucket123')).to.not.throw()
      expect(() => validateBucketName('my.bucket.name')).to.not.throw()
    })

    it('should reject invalid bucket names', () => {
      expect(() => validateBucketName('AB')).to.throw(/Invalid bucket/) // Too short
      expect(() => validateBucketName('MyBucket')).to.throw(/Invalid bucket/) // Uppercase
      expect(() => validateBucketName('-bucket')).to.throw(/Invalid bucket/) // Starts with hyphen
    })
  })
})
