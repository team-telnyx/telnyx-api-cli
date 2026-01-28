import { Args } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

interface PortingOrderResponse {
  data: {
    id: string
    status: string
  }
}

export default class PortingOrderSubmit extends BaseCommand {
  static override description = 'Submit a porting order for processing'

  static override examples = [
    '<%= config.bin %> porting order submit 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
  ]

  static override args = {
    id: Args.string({
      description: 'Porting order ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PortingOrderSubmit)

    validateId(args.id, 'Porting Order ID')

    this.info(`Submitting porting order ${args.id}...`)

    const response = await v2.post<PortingOrderResponse>(
      `/porting_orders/${args.id}/actions/submit`,
      {},
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success('Porting order submitted!')
    this.log('')
    this.log(`  ID:     ${response.data.id}`)
    this.log(`  Status: ${response.data.status}`)
    this.log('')
    this.log('The order is now being processed. Monitor status with:')
    this.log(`  telnyx porting order get ${response.data.id}`)
  }
}
