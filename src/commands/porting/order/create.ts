import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validatePhone } from '../../../lib/api.js'

interface PortingOrderResponse {
  data: Array<{
    id: string
    status: string
    phone_numbers_count: number
    created_at: string
  }>
}

export default class PortingOrderCreate extends BaseCommand {
  static override description = 'Create a draft porting order'

  static override examples = [
    '<%= config.bin %> porting order create --numbers +15551234567,+15559876543',
    '<%= config.bin %> porting order create --numbers +15551234567 --reference "Customer ABC"',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    numbers: Flags.string({
      char: 'n',
      description: 'Phone numbers to port (comma-separated)',
      required: true,
    }),
    reference: Flags.string({
      char: 'r',
      description: 'Customer reference for this order',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(PortingOrderCreate)

    const numbers = flags.numbers.split(',').map(n => n.trim())

    for (const num of numbers) {
      validatePhone(num)
    }

    const payload: Record<string, unknown> = {
      phone_numbers: numbers.map(n => ({ phone_number: n })),
    }

    if (flags.reference) {
      payload.customer_reference = flags.reference
    }

    this.info(`Creating porting order for ${numbers.length} number(s)...`)

    const response = await v2.post<PortingOrderResponse>('/porting_orders', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const orders = response.data || []

    if (orders.length === 1) {
      const o = orders[0]
      this.success('Porting order created!')
      this.log('')
      this.log(`  ID:      ${o.id}`)
      this.log(`  Status:  ${o.status}`)
      this.log(`  Numbers: ${o.phone_numbers_count}`)
      this.log('')
      this.log('Next steps:')
      this.log('  1. Upload LOA and invoice documents')
      this.log('  2. Provide end user information')
      this.log(`  3. Submit: telnyx porting order submit ${o.id}`)
    } else {
      this.success(`Created ${orders.length} porting orders (numbers were split)`)
      this.log('')
      for (const o of orders) {
        this.log(`  ${o.id}: ${o.phone_numbers_count} number(s) - ${o.status}`)
      }
      this.log('')
      this.log('Orders were split by carrier/type. Submit each separately.')
    }
  }
}
