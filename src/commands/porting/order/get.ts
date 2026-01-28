import { Args } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

interface PortingOrderResponse {
  data: {
    id: string
    status: string
    phone_numbers_count: number
    customer_reference?: string
    user_id?: string
    foc_datetime?: string
    activated_at?: string
    end_user?: {
      admin_name?: string
      location?: {
        street_address?: string
        city?: string
        state?: string
        postal_code?: string
        country?: string
      }
    }
    documents?: Array<{
      id: string
      type: string
      created_at: string
    }>
    phone_numbers?: Array<{
      phone_number: string
      portable: boolean
      status?: string
    }>
    created_at: string
    updated_at: string
  }
}

export default class PortingOrderGet extends BaseCommand {
  static override description = 'Get porting order details'

  static override examples = [
    '<%= config.bin %> porting order get 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
    '<%= config.bin %> porting order get 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --json',
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
    const { args, flags } = await this.parse(PortingOrderGet)

    validateId(args.id, 'Porting Order ID')

    this.info(`Fetching porting order ${args.id}...`)

    const response = await v2.get<PortingOrderResponse>(`/porting_orders/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const o = response.data

    this.log('')
    this.log('Porting Order Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:       ${o.id}`)
    this.log(`  Status:   ${o.status}`)
    this.log(`  Numbers:  ${o.phone_numbers_count}`)

    if (o.foc_datetime) {
      this.log(`  FOC Date: ${new Date(o.foc_datetime).toLocaleString()}`)
    }
    if (o.activated_at) {
      this.log(`  Ported:   ${new Date(o.activated_at).toLocaleString()}`)
    }

    if (o.end_user) {
      this.log('')
      this.log('  End User:')
      if (o.end_user.admin_name) {
        this.log(`    Name:    ${o.end_user.admin_name}`)
      }
      if (o.end_user.location) {
        const loc = o.end_user.location
        this.log(`    Address: ${loc.street_address || ''}`)
        this.log(`             ${loc.city || ''}, ${loc.state || ''} ${loc.postal_code || ''}`)
      }
    }

    if (o.phone_numbers && o.phone_numbers.length > 0) {
      this.log('')
      this.log('  Phone Numbers:')
      for (const pn of o.phone_numbers.slice(0, 10)) {
        this.log(`    ${pn.phone_number} (${pn.status || 'pending'})`)
      }
      if (o.phone_numbers.length > 10) {
        this.log(`    ... and ${o.phone_numbers.length - 10} more`)
      }
    }

    if (o.documents && o.documents.length > 0) {
      this.log('')
      this.log('  Documents:')
      for (const doc of o.documents) {
        this.log(`    - ${doc.type} (${doc.id.substring(0, 8)}...)`)
      }
    }

    this.log('')
    this.log(`  Created:  ${new Date(o.created_at).toLocaleString()}`)
    this.log(`  Updated:  ${new Date(o.updated_at).toLocaleString()}`)
  }
}
