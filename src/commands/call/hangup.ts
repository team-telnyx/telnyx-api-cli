import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

export default class CallHangup extends BaseCommand {
  static override description = 'Hang up an active call'

  static override examples = [
    '<%= config.bin %> call hangup v3:abc123xyz',
  ]

  static override args = {
    'call-control-id': Args.string({
      description: 'Call control ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CallHangup)

    const callControlId = args['call-control-id']

    this.info(`Hanging up call ${callControlId}...`)

    await v2.post(
      `/calls/${encodeURIComponent(callControlId)}/actions/hangup`,
      {},
      { profile: flags.profile }
    )

    this.success('Call ended')
  }
}
