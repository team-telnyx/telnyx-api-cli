import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface SimResponse {
  data: {
    id: string
    iccid: string
    imsi?: string
    msisdn?: string
    status: string
    sim_card_group_id?: string
    sim_card_group_name?: string
    tags?: string[]
    current_billing_period_consumed_data?: {
      amount: number
      unit: string
    }
    data_limit?: {
      amount: number
      unit: string
    }
    actions_in_progress?: boolean
    ipv4?: string
    ipv6?: string
    created_at: string
    updated_at: string
  }
}

export default class SimGet extends BaseCommand {
  static override description = 'Get SIM card details'

  static override examples = [
    '<%= config.bin %> sim get 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
    '<%= config.bin %> sim get 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'SIM card ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SimGet)

    validateId(args.id, 'SIM ID')

    this.info(`Fetching SIM ${args.id}...`)

    const response = await v2.get<SimResponse>(`/sim_cards/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const s = response.data

    this.log('')
    this.log('SIM Card Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:       ${s.id}`)
    this.log(`  ICCID:    ${s.iccid}`)
    this.log(`  Status:   ${s.status}`)
    this.log('')
    if (s.imsi) {
      this.log(`  IMSI:     ${s.imsi}`)
    }
    if (s.msisdn) {
      this.log(`  MSISDN:   ${s.msisdn}`)
    }
    if (s.ipv4) {
      this.log(`  IPv4:     ${s.ipv4}`)
    }
    if (s.ipv6) {
      this.log(`  IPv6:     ${s.ipv6}`)
    }
    if (s.sim_card_group_name) {
      this.log('')
      this.log(`  Group:    ${s.sim_card_group_name}`)
    }
    if (s.current_billing_period_consumed_data) {
      this.log('')
      this.log(`  Data Used: ${s.current_billing_period_consumed_data.amount} ${s.current_billing_period_consumed_data.unit}`)
    }
    if (s.data_limit) {
      this.log(`  Data Limit: ${s.data_limit.amount} ${s.data_limit.unit}`)
    }
    if (s.tags && s.tags.length > 0) {
      this.log('')
      this.log(`  Tags:     ${s.tags.join(', ')}`)
    }
    this.log('')
    this.log(`  Created:  ${new Date(s.created_at).toLocaleString()}`)
    this.log(`  Updated:  ${new Date(s.updated_at).toLocaleString()}`)
  }
}
