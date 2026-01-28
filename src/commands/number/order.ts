import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

interface NumberOrderResponse {
  data: {
    id: string
    status: string
    record_type: string
    phone_numbers_count: number
    created_at: string
    updated_at: string
    phone_numbers: Array<{
      id: string
      phone_number: string
      status: string
      regulatory_requirements?: Array<{
        requirement_type: string
        field_type: string
      }>
    }>
  }
}

export default class NumberOrder extends BaseCommand {
  static override description = 'Order (purchase) phone numbers'

  static override examples = [
    '<%= config.bin %> number order +15551234567',
    '<%= config.bin %> number order +15551234567 +15551234568',
    '<%= config.bin %> number order +15551234567 --messaging-profile-id abc123',
    '<%= config.bin %> number order +15551234567 --connection-id def456',
  ]

  static override args = {
    numbers: Args.string({
      description: 'Phone number(s) to order (E.164 format)',
      required: true,
    }),
  }

  static override strict = false // Allow multiple arguments

  static override flags = {
    ...BaseCommand.baseFlags,
    'messaging-profile-id': Flags.string({
      description: 'Messaging profile to assign',
    }),
    'connection-id': Flags.string({
      description: 'Voice connection to assign',
    }),
    'billing-group-id': Flags.string({
      description: 'Billing group ID',
    }),
  }

  public async run(): Promise<void> {
    const { argv, flags } = await this.parse(NumberOrder)

    const numbers = argv as string[]
    
    if (numbers.length === 0) {
      throw new Error('At least one phone number is required')
    }

    // Validate all numbers
    for (const num of numbers) {
      validatePhone(num)
    }

    const phoneNumbers = numbers.map(num => {
      const pn: Record<string, unknown> = { phone_number: num }
      if (flags['messaging-profile-id']) {
        pn.messaging_profile_id = flags['messaging-profile-id']
      }
      if (flags['connection-id']) {
        pn.connection_id = flags['connection-id']
      }
      if (flags['billing-group-id']) {
        pn.billing_group_id = flags['billing-group-id']
      }
      return pn
    })

    const payload = {
      phone_numbers: phoneNumbers,
    }

    this.info(`Ordering ${numbers.length} number(s)...`)

    const response = await v2.post<NumberOrderResponse>('/number_orders', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const order = response.data
    this.success('Number order created!')
    this.log('')
    this.log(`  Order ID: ${order.id}`)
    this.log(`  Status:   ${order.status}`)
    this.log(`  Numbers:  ${order.phone_numbers_count}`)
    this.log('')

    for (const pn of order.phone_numbers) {
      this.log(`  ${pn.phone_number}: ${pn.status}`)
      if (pn.regulatory_requirements && pn.regulatory_requirements.length > 0) {
        this.warning(`    Requires: ${pn.regulatory_requirements.map(r => r.requirement_type).join(', ')}`)
      }
    }
  }
}
