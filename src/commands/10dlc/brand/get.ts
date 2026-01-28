import { Args } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { tenDlc, validateId } from '../../../lib/api.js'

interface Brand {
  brandId: string
  displayName: string
  companyName?: string
  entityType: string
  identityStatus: string
  email: string
  phone?: string
  country: string
  vertical: string
}

export default class BrandGet extends BaseCommand {
  static override description = 'Get details of a 10DLC brand'

  static override examples = [
    '<%= config.bin %> 10dlc brand get BRAND_ID',
  ]

  static override args = {
    brandId: Args.string({
      description: 'Brand ID to fetch',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BrandGet)

    validateId(args.brandId, 'brand ID')

    this.info(`Fetching brand ${args.brandId}...`)

    const brand = await tenDlc.get<Brand>(`/brand/${args.brandId}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(brand)
      return
    }

    this.log(`Brand ID:      ${brand.brandId}`)
    this.log(`Display Name:  ${brand.displayName}`)
    this.log(`Company Name:  ${brand.companyName || 'N/A'}`)
    this.log(`Entity Type:   ${brand.entityType}`)
    this.log(`Status:        ${brand.identityStatus || 'unknown'}`)
    this.log(`Email:         ${brand.email}`)
    this.log(`Phone:         ${brand.phone || 'N/A'}`)
    this.log(`Country:       ${brand.country}`)
    this.log(`Vertical:      ${brand.vertical}`)
  }
}
