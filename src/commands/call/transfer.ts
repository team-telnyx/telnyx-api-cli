import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

export default class CallTransfer extends BaseCommand {
  static override description = 'Transfer an active call to another number'

  static override examples = [
    '<%= config.bin %> call transfer v3:abc123 +15559876543',
    '<%= config.bin %> call transfer v3:abc123 +15559876543 --timeout 60',
  ]

  static override args = {
    'call-control-id': Args.string({
      description: 'Call control ID',
      required: true,
    }),
    to: Args.string({
      description: 'Transfer destination (E.164 or SIP URI)',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    timeout: Flags.integer({
      description: 'Ring timeout in seconds',
      default: 30,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CallTransfer)

    const callControlId = args['call-control-id']
    
    if (args.to.startsWith('+')) {
      validatePhone(args.to)
    }

    const payload = {
      to: args.to,
      timeout_secs: flags.timeout,
    }

    this.info(`Transferring call to ${args.to}...`)

    await v2.post(
      `/calls/${encodeURIComponent(callControlId)}/actions/transfer`,
      payload,
      { profile: flags.profile }
    )

    this.success('Transfer initiated')
  }
}
