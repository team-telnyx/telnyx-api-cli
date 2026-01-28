import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface ConnectionResponse {
  data: {
    id: string
    record_type: string
    active: boolean
    connection_name: string
    webhook_event_url?: string
    webhook_event_failover_url?: string
    webhook_api_version?: string
    webhook_timeout_secs?: number
    inbound?: {
      channel_limit?: number
      sip_subdomain?: string
      sip_subdomain_receive_settings?: string
    }
    outbound?: {
      channel_limit?: number
      outbound_voice_profile_id?: string
    }
    tags?: string[]
    created_at: string
    updated_at: string
  }
}

export default class ConnectionGet extends BaseCommand {
  static override description = 'Get connection details'

  static override examples = [
    '<%= config.bin %> connection get 1234567890123456789',
    '<%= config.bin %> connection get 1234567890123456789 --type credential',
  ]

  static override args = {
    id: Args.string({
      description: 'Connection ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'Connection type (helps with endpoint routing)',
      options: ['credential', 'fqdn', 'ip'],
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConnectionGet)

    validateId(args.id, 'Connection ID')

    // Map type to endpoint
    let endpoint = '/credential_connections' // default
    if (flags.type === 'fqdn') {
      endpoint = '/fqdn_connections'
    } else if (flags.type === 'ip') {
      endpoint = '/ip_connections'
    }

    this.info(`Fetching connection ${args.id}...`)

    const response = await v2.get<ConnectionResponse>(`${endpoint}/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const c = response.data

    this.log('')
    this.log('Connection Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:       ${c.id}`)
    this.log(`  Name:     ${c.connection_name}`)
    this.log(`  Type:     ${c.record_type}`)
    this.log(`  Active:   ${c.active ? 'Yes' : 'No'}`)

    if (c.webhook_event_url) {
      this.log('')
      this.log('  Webhooks:')
      this.log(`    URL:      ${c.webhook_event_url}`)
      if (c.webhook_event_failover_url) {
        this.log(`    Failover: ${c.webhook_event_failover_url}`)
      }
      this.log(`    Version:  ${c.webhook_api_version || '2'}`)
      this.log(`    Timeout:  ${c.webhook_timeout_secs || 30}s`)
    }

    if (c.inbound) {
      this.log('')
      this.log('  Inbound:')
      if (c.inbound.channel_limit) {
        this.log(`    Channel Limit: ${c.inbound.channel_limit}`)
      }
      if (c.inbound.sip_subdomain) {
        this.log(`    SIP Subdomain: ${c.inbound.sip_subdomain}.sip.telnyx.com`)
      }
    }

    if (c.outbound) {
      this.log('')
      this.log('  Outbound:')
      if (c.outbound.channel_limit) {
        this.log(`    Channel Limit: ${c.outbound.channel_limit}`)
      }
      if (c.outbound.outbound_voice_profile_id) {
        this.log(`    Voice Profile: ${c.outbound.outbound_voice_profile_id}`)
      }
    }

    if (c.tags && c.tags.length > 0) {
      this.log('')
      this.log(`  Tags:     ${c.tags.join(', ')}`)
    }

    this.log('')
    this.log(`  Created:  ${new Date(c.created_at).toLocaleString()}`)
    this.log(`  Updated:  ${new Date(c.updated_at).toLocaleString()}`)
  }
}
