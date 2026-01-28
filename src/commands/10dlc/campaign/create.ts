import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { tenDlc, validateId } from '../../../lib/api.js'

interface CampaignCreateResponse {
  campaignId: string
  brandId: string
  status: string
}

export default class CampaignCreate extends BaseCommand {
  static override description = 'Create a new 10DLC campaign'

  static override examples = [
    '<%= config.bin %> 10dlc campaign create --brand-id BRAND_ID --usecase MIXED --description "Customer notifications" --sample1 "Your order has shipped" --message-flow "Users opt-in via website"',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    'brand-id': Flags.string({
      description: 'Brand ID to associate campaign with',
      required: true,
    }),
    usecase: Flags.string({
      description: 'Campaign use case (e.g., MIXED, 2FA, MARKETING)',
      required: true,
    }),
    description: Flags.string({
      description: 'Campaign description',
      required: true,
    }),
    sample1: Flags.string({
      description: 'Sample message 1',
      required: true,
    }),
    sample2: Flags.string({
      description: 'Sample message 2',
    }),
    'message-flow': Flags.string({
      description: 'Description of how users opt-in/out',
      required: true,
    }),
    'help-message': Flags.string({
      description: 'Response to HELP keyword',
    }),
    'optout-message': Flags.string({
      description: 'Response to STOP keyword',
    }),
    vertical: Flags.string({
      description: 'Campaign vertical',
    }),
    'embedded-link': Flags.boolean({
      description: 'Messages will contain links',
      default: false,
    }),
    'embedded-phone': Flags.boolean({
      description: 'Messages will contain phone numbers',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(CampaignCreate)

    validateId(flags['brand-id'], 'brand ID')

    const payload: Record<string, unknown> = {
      brandId: flags['brand-id'],
      usecase: flags.usecase,
      description: flags.description,
      sample1: flags.sample1,
      messageFlow: flags['message-flow'],
      embeddedLink: flags['embedded-link'],
      embeddedPhone: flags['embedded-phone'],
      numberPool: false,
      ageGated: false,
      directLending: false,
      subscriberOptin: true,
      subscriberOptout: true,
      subscriberHelp: true,
    }

    if (flags.sample2) payload.sample2 = flags.sample2
    if (flags['help-message']) payload.helpMessage = flags['help-message']
    if (flags['optout-message']) payload.optoutMessage = flags['optout-message']
    if (flags.vertical) payload.vertical = flags.vertical

    this.info('Creating campaign...')

    const response = await tenDlc.post<CampaignCreateResponse>(
      '/campaignBuilder',
      payload,
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success(`Campaign created: ${response.campaignId}`)
    this.warning('Campaign is pending carrier approval (typically 3-7 business days)')
  }
}
