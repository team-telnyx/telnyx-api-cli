import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

interface PortingOrderResponse {
  data: {
    id: string
    status: string
  }
}

export default class PortingOrderCancel extends BaseCommand {
  static override description = 'Cancel a porting order'

  static override examples = [
    '<%= config.bin %> porting order cancel 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Porting order ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PortingOrderCancel)

    validateId(args.id, 'Porting Order ID')

    if (!flags.force) {
      this.warning(`This will cancel porting order ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Cancelling porting order ${args.id}...`)

    const response = await v2.post<PortingOrderResponse>(
      `/porting_orders/${args.id}/actions/cancel`,
      {},
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success('Porting order cancelled')
    this.log(`  Status: ${response.data.status}`)
  }
}
