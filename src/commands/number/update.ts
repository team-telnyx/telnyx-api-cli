import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone, setVerboseLogger } from '../../lib/api.js'

interface PhoneNumberResponse {
  data: {
    id: string
    phone_number: string
    status: string
    connection_id?: string
    messaging_profile_id?: string
    tags?: string[]
    billing_group_id?: string
    emergency_enabled?: boolean
    emergency_address_id?: string
    call_forwarding_enabled?: boolean
    cnam_listing_enabled?: boolean
    caller_id_name_enabled?: boolean
  }
}

export default class NumberUpdate extends BaseCommand {
  static override description = 'Update settings for a phone number'

  static override examples = [
    '<%= config.bin %> number update +15551234567 --connection-id <id>',
    '<%= config.bin %> number update +15551234567 --messaging-profile-id <id>',
    '<%= config.bin %> number update +15551234567 --tags production,us-west',
    '<%= config.bin %> number update +15551234567 --call-forwarding --dry-run',
  ]

  static override args = {
    phone: Args.string({
      description: 'Phone number to update (E.164 format)',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.destructiveFlags,
    'connection-id': Flags.string({
      description: 'Voice connection ID to assign',
    }),
    'messaging-profile-id': Flags.string({
      description: 'Messaging profile ID to assign',
    }),
    'billing-group-id': Flags.string({
      description: 'Billing group ID to assign',
    }),
    tags: Flags.string({
      char: 't',
      description: 'Comma-separated tags',
    }),
    'emergency-enabled': Flags.boolean({
      description: 'Enable E911 emergency services',
      allowNo: true,
    }),
    'emergency-address-id': Flags.string({
      description: 'E911 address ID',
    }),
    'call-forwarding': Flags.boolean({
      description: 'Enable call forwarding',
      allowNo: true,
    }),
    'cnam-listing': Flags.boolean({
      description: 'Enable CNAM listing',
      allowNo: true,
    }),
    'caller-id-name': Flags.boolean({
      description: 'Enable caller ID name',
      allowNo: true,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(NumberUpdate)

    if (flags.verbose) {
      this.isVerbose = true
      setVerboseLogger((msg) => this.debugLog(msg))
    }

    validatePhone(args.phone)

    // Build update payload - only include fields that were specified
    const updates: Record<string, unknown> = {}
    
    if (flags['connection-id'] !== undefined) {
      updates.connection_id = flags['connection-id']
    }
    if (flags['messaging-profile-id'] !== undefined) {
      updates.messaging_profile_id = flags['messaging-profile-id']
    }
    if (flags['billing-group-id'] !== undefined) {
      updates.billing_group_id = flags['billing-group-id']
    }
    if (flags.tags !== undefined) {
      updates.tags = flags.tags.split(',').map(t => t.trim())
    }
    if (flags['emergency-enabled'] !== undefined) {
      updates.emergency_enabled = flags['emergency-enabled']
    }
    if (flags['emergency-address-id'] !== undefined) {
      updates.emergency_address_id = flags['emergency-address-id']
    }
    if (flags['call-forwarding'] !== undefined) {
      updates.call_forwarding_enabled = flags['call-forwarding']
    }
    if (flags['cnam-listing'] !== undefined) {
      updates.cnam_listing_enabled = flags['cnam-listing']
    }
    if (flags['caller-id-name'] !== undefined) {
      updates.caller_id_name_enabled = flags['caller-id-name']
    }

    if (Object.keys(updates).length === 0) {
      this.warning('No updates specified. Use --help to see available options.')
      return
    }

    // Encode the phone number for the URL
    const encodedPhone = encodeURIComponent(args.phone)

    // Show what we're about to do
    this.info(`Updating ${args.phone}...`)
    
    if (flags.verbose || flags['dry-run']) {
      this.log('Updates:')
      for (const [key, value] of Object.entries(updates)) {
        this.log(`  ${key}: ${JSON.stringify(value)}`)
      }
    }

    if (flags['dry-run']) {
      this.dryRunLog('Would update phone number with the above settings')
      return
    }

    const response = await v2.patch<PhoneNumberResponse>(
      `/phone_numbers/${encodedPhone}`,
      updates,
      { profile: flags.profile, verbose: flags.verbose }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const num = response.data
    this.success(`Updated ${num.phone_number}`)
    
    this.log('')
    this.log('Current settings:')
    if (num.connection_id) this.log(`  Connection:         ${num.connection_id}`)
    if (num.messaging_profile_id) this.log(`  Messaging profile:  ${num.messaging_profile_id}`)
    if (num.billing_group_id) this.log(`  Billing group:      ${num.billing_group_id}`)
    if (num.tags?.length) this.log(`  Tags:               ${num.tags.join(', ')}`)
    if (num.emergency_enabled !== undefined) this.log(`  E911 enabled:       ${num.emergency_enabled ? 'Yes' : 'No'}`)
    if (num.call_forwarding_enabled !== undefined) this.log(`  Call forwarding:    ${num.call_forwarding_enabled ? 'Yes' : 'No'}`)
  }
}
