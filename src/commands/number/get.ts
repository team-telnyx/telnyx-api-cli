import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface PhoneNumberResponse {
  data: {
    id: string
    phone_number: string
    status: string
    record_type: string
    connection_id?: string
    connection_name?: string
    messaging_profile_id?: string
    messaging_profile_name?: string
    billing_group_id?: string
    emergency_enabled?: boolean
    emergency_address_id?: string
    call_forwarding_enabled?: boolean
    cnam_listing_enabled?: boolean
    caller_id_name_enabled?: boolean
    call_recording_enabled?: boolean
    t38_fax_gateway_enabled?: boolean
    tags?: string[]
    created_at: string
    updated_at: string
    purchased_at?: string
  }
}

export default class NumberGet extends BaseCommand {
  static override description = 'Get details of a phone number'

  static override examples = [
    '<%= config.bin %> number get +15551234567',
    '<%= config.bin %> number get +15551234567 --json',
  ]

  static override args = {
    number: Args.string({
      description: 'Phone number (E.164 format) or ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(NumberGet)

    // URL encode the phone number (+ becomes %2B)
    const encoded = encodeURIComponent(args.number)

    this.info(`Fetching number ${args.number}...`)

    const response = await v2.get<PhoneNumberResponse>(`/phone_numbers/${encoded}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const n = response.data

    this.log('')
    this.log('Phone Number Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  Number:       ${n.phone_number}`)
    this.log(`  ID:           ${n.id}`)
    this.log(`  Status:       ${n.status}`)
    this.log('')
    
    if (n.connection_name) {
      this.log(`  Voice:        ${n.connection_name} (${n.connection_id})`)
    }
    if (n.messaging_profile_name) {
      this.log(`  Messaging:    ${n.messaging_profile_name} (${n.messaging_profile_id})`)
    }

    this.log('')
    this.log('  Features:')
    this.log(`    Emergency:      ${n.emergency_enabled ? '✓' : '✗'}`)
    this.log(`    Call Forwarding: ${n.call_forwarding_enabled ? '✓' : '✗'}`)
    this.log(`    CNAM Listing:   ${n.cnam_listing_enabled ? '✓' : '✗'}`)
    this.log(`    Call Recording: ${n.call_recording_enabled ? '✓' : '✗'}`)
    this.log(`    T.38 Fax:       ${n.t38_fax_gateway_enabled ? '✓' : '✗'}`)

    if (n.tags && n.tags.length > 0) {
      this.log('')
      this.log(`  Tags:         ${n.tags.join(', ')}`)
    }

    this.log('')
    this.log(`  Created:      ${new Date(n.created_at).toLocaleString()}`)
    if (n.purchased_at) {
      this.log(`  Purchased:    ${new Date(n.purchased_at).toLocaleString()}`)
    }
  }
}
