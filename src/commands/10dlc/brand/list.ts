import { BaseCommand } from '../../../lib/base-command.js'
import { tenDlc } from '../../../lib/api.js'

interface Brand {
  brandId: string
  displayName: string
  entityType: string
  identityStatus: string
}

interface BrandListResponse {
  records: Brand[]
}

export default class BrandList extends BaseCommand {
  static override description = 'List all 10DLC brands'

  static override examples = [
    '<%= config.bin %> 10dlc brand list',
    '<%= config.bin %> 10dlc brand list --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(BrandList)

    this.info('Fetching brands...')

    const response = await tenDlc.get<BrandListResponse>('/brand', { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const brands = response.records || []

    if (brands.length === 0) {
      this.log('No brands found')
      return
    }

    this.outputTable(brands as unknown as Record<string, unknown>[], {
      brandId: { header: 'BRAND_ID' },
      displayName: { header: 'NAME' },
      entityType: { header: 'ENTITY_TYPE' },
      identityStatus: { header: 'STATUS' },
    })
  }
}
