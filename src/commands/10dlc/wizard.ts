import { confirm, input, select } from '@inquirer/prompts'
import { BaseCommand } from '../../lib/base-command.js'
import { tenDlc } from '../../lib/api.js'

interface BrandCreateResponse {
  brandId: string
  entityType: string
  identityStatus: string
}

const VERTICALS = [
  { name: 'Technology', value: 'information-technology-services' },
  { name: 'Healthcare', value: 'healthcare-and-lifesciences' },
  { name: 'Finance', value: 'financial-services' },
  { name: 'Retail', value: 'retail-and-consumer-products' },
  { name: 'Education', value: 'education' },
  { name: 'Entertainment', value: 'entertainment' },
  { name: 'Real Estate', value: 'real-estate' },
  { name: 'Professional Services', value: 'professional-services' },
  { name: 'Other', value: 'professional-services' },
]

export default class Wizard extends BaseCommand {
  static override description = 'Interactive wizard for sole proprietor 10DLC registration'

  static override examples = [
    '<%= config.bin %> 10dlc wizard',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Wizard)

    this.log('')
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    this.log('  10DLC Sole Proprietor Registration Wizard')
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    this.log('')
    this.log('This wizard will guide you through registering a sole proprietor')
    this.log('brand and campaign for US A2P SMS messaging.')
    this.log('')
    this.log('Fees (pass-through from carriers):')
    this.log('  • Brand registration: $4 one-time')
    this.log('  • Campaign vetting:   $15 per submission')
    this.log('  • Monthly fee:        $2/month')
    this.log('')

    const proceed = await confirm({ message: 'Continue?' })
    if (!proceed) return

    // Step 1: Personal Information
    this.log('')
    this.log('━━━ Step 1: Personal Information ━━━')
    this.log('')

    const firstName = await input({ message: 'First name:' })
    const lastName = await input({ message: 'Last name:' })
    const email = await input({ message: 'Email address:' })
    const phone = await input({ message: 'Phone number (e.g., +12025551234):' })

    // Step 2: Business Information
    this.log('')
    this.log('━━━ Step 2: Business Information ━━━')
    this.log('')

    const displayName = await input({ message: 'Brand/Business name:' })
    const website = await input({ message: 'Website (optional):', default: '' })

    const vertical = await select({
      message: 'Industry vertical:',
      choices: VERTICALS,
    })

    // Step 3: Address
    this.log('')
    this.log('━━━ Step 3: Address ━━━')
    this.log('')

    const street = await input({ message: 'Street address:' })
    const city = await input({ message: 'City:' })
    const state = await input({ message: 'State (2-letter code, e.g., CA):' })
    const postalCode = await input({ message: 'ZIP code:' })

    // Review
    this.log('')
    this.log('━━━ Review ━━━')
    this.log('')
    this.log(`Name:     ${firstName} ${lastName}`)
    this.log(`Email:    ${email}`)
    this.log(`Phone:    ${phone}`)
    this.log(`Brand:    ${displayName}`)
    this.log(`Vertical: ${vertical}`)
    this.log(`Address:  ${street}, ${city}, ${state} ${postalCode}`)
    this.log('')

    const createBrand = await confirm({ message: 'Create brand?' })
    if (!createBrand) return

    // Create brand
    const payload: Record<string, unknown> = {
      entityType: 'SOLE_PROPRIETOR',
      displayName,
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      state,
      postalCode,
      country: 'US',
      vertical,
      brandRelationship: 'BASIC_ACCOUNT',
    }

    if (website) payload.website = website

    this.info('Creating brand...')

    try {
      const response = await tenDlc.post<BrandCreateResponse>('/brand', payload, { profile: flags.profile })

      this.success(`Brand created: ${response.brandId}`)
      this.warning('Verification required! Check your phone/email for OTP PIN')
      this.log(`Run: telnyx 10dlc brand verify ${response.brandId} --pin <PIN>`)

      this.log('')
      this.log('━━━ Next Steps ━━━')
      this.log('')
      this.log('1. Check your phone/email for OTP verification PIN')
      this.log(`2. Run: telnyx 10dlc brand verify ${response.brandId} --pin <PIN>`)
      this.log('3. Once verified, create a campaign: telnyx 10dlc campaign create ...')
      this.log('4. After campaign approval, assign your phone number')
      this.log('')
    } catch (error) {
      this.error(`Failed to create brand: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
