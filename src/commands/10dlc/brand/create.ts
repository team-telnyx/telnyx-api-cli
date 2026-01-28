import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { tenDlc } from '../../../lib/api.js'

interface BrandCreateResponse {
  brandId: string
  entityType: string
  identityStatus: string
}

export default class BrandCreate extends BaseCommand {
  static override description = 'Create a new 10DLC brand'

  static override examples = [
    '<%= config.bin %> 10dlc brand create --sole-prop --display-name "My Business" --first-name John --last-name Doe --email john@example.com --phone +12025551234 --vertical TECHNOLOGY',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    'sole-prop': Flags.boolean({
      description: 'Create a sole proprietor brand',
      default: false,
    }),
    'display-name': Flags.string({
      description: 'Brand/business display name',
      required: true,
    }),
    'first-name': Flags.string({
      description: 'First name (required for sole prop)',
    }),
    'last-name': Flags.string({
      description: 'Last name (required for sole prop)',
    }),
    email: Flags.string({
      description: 'Contact email address',
      required: true,
    }),
    phone: Flags.string({
      description: 'Contact phone number (E.164 format)',
    }),
    vertical: Flags.string({
      description: 'Industry vertical',
      required: true,
    }),
    street: Flags.string({
      description: 'Street address',
    }),
    city: Flags.string({
      description: 'City',
    }),
    state: Flags.string({
      description: 'State (2-letter code)',
    }),
    'postal-code': Flags.string({
      description: 'ZIP/postal code',
    }),
    country: Flags.string({
      description: 'Country code',
      default: 'US',
    }),
    website: Flags.string({
      description: 'Website URL',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(BrandCreate)

    // Validate sole prop requirements
    if (flags['sole-prop']) {
      if (!flags['first-name']) {
        this.error('First name required for sole proprietor (--first-name)')
      }
      if (!flags['last-name']) {
        this.error('Last name required for sole proprietor (--last-name)')
      }
      if (!flags.phone) {
        this.error('Phone required for sole proprietor (--phone)')
      }
    }

    const entityType = flags['sole-prop'] ? 'SOLE_PROPRIETOR' : 'PRIVATE_PROFIT'

    // Build payload
    const payload: Record<string, unknown> = {
      entityType,
      displayName: flags['display-name'],
      email: flags.email,
      country: flags.country,
      vertical: flags.vertical,
      brandRelationship: 'BASIC_ACCOUNT',
    }

    if (flags['first-name']) payload.firstName = flags['first-name']
    if (flags['last-name']) payload.lastName = flags['last-name']
    if (flags.phone) payload.phone = flags.phone
    if (flags.street) payload.street = flags.street
    if (flags.city) payload.city = flags.city
    if (flags.state) payload.state = flags.state
    if (flags['postal-code']) payload.postalCode = flags['postal-code']
    if (flags.website) payload.website = flags.website

    this.info('Creating brand...')

    const response = await tenDlc.post<BrandCreateResponse>('/brand', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success(`Brand created: ${response.brandId}`)
    
    if (entityType === 'SOLE_PROPRIETOR') {
      this.warning('Verification required! Check your phone/email for OTP PIN')
      this.log(`Run: telnyx 10dlc brand verify ${response.brandId} --pin <PIN>`)
    }
  }
}
