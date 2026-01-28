import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { tenDlc, validateId, validatePhone } from '../../lib/api.js'

interface AssignResponse {
  phoneNumber: string
  campaignId: string
  status: string
}

export default class Assign extends BaseCommand {
  static override description = 'Assign a phone number to a 10DLC campaign'

  static override examples = [
    '<%= config.bin %> 10dlc assign +12025551234 CAMPAIGN_ID',
  ]

  static override args = {
    phoneNumber: Args.string({
      description: 'Phone number to assign (E.164 format)',
      required: true,
    }),
    campaignId: Args.string({
      description: 'Campaign ID to assign to',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Assign)

    validatePhone(args.phoneNumber)
    validateId(args.campaignId, 'campaign ID')

    this.info(`Assigning ${args.phoneNumber} to campaign ${args.campaignId}...`)

    const response = await tenDlc.post<AssignResponse>(
      '/phoneNumberCampaign',
      {
        phoneNumber: args.phoneNumber,
        campaignId: args.campaignId,
      },
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success('Phone number assigned successfully')
  }
}
