import { Args } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { tenDlc, validateId } from '../../../lib/api.js'

interface Campaign {
  campaignId: string
  brandId: string
  usecase: string
  status: string
}

interface CampaignListResponse {
  records: Campaign[]
}

export default class CampaignList extends BaseCommand {
  static override description = 'List 10DLC campaigns'

  static override examples = [
    '<%= config.bin %> 10dlc campaign list BRAND_ID',
    '<%= config.bin %> 10dlc campaign list BRAND_ID --json',
  ]

  static override args = {
    brandId: Args.string({
      description: 'Brand ID to list campaigns for',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CampaignList)

    validateId(args.brandId, 'brand ID')
    const endpoint = `/campaign?brandId=${args.brandId}`

    this.info(`Fetching campaigns for brand ${args.brandId}...`)

    const response = await tenDlc.get<CampaignListResponse>(endpoint, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const campaigns = response.records || []

    if (campaigns.length === 0) {
      this.log('No campaigns found')
      return
    }

    this.outputTable(campaigns as unknown as Record<string, unknown>[], {
      campaignId: { header: 'CAMPAIGN_ID' },
      brandId: { header: 'BRAND_ID' },
      usecase: { header: 'USECASE' },
      status: { header: 'STATUS' },
    })
  }
}
