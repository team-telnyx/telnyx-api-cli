import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface ConnectionResponse {
  data: {
    id: string
    record_type: string
    active: boolean
    connection_name: string
    created_at: string
  }
}

export default class ConnectionCreate extends BaseCommand {
  static override description = 'Create a new voice connection'

  static override examples = [
    '<%= config.bin %> connection create --name "My Voice App" --type credential --webhook-url https://example.com/webhook',
    '<%= config.bin %> connection create --name "SIP Trunk" --type fqdn --webhook-url https://example.com/webhook',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Connection name',
      required: true,
    }),
    type: Flags.string({
      char: 't',
      description: 'Connection type',
      options: ['credential', 'fqdn', 'ip'],
      required: true,
    }),
    'webhook-url': Flags.string({
      description: 'Webhook URL for call events',
    }),
    'webhook-failover-url': Flags.string({
      description: 'Failover webhook URL',
    }),
    'webhook-timeout': Flags.integer({
      description: 'Webhook timeout in seconds',
      default: 30,
    }),
    active: Flags.boolean({
      description: 'Enable connection immediately',
      default: true,
    }),
    tag: Flags.string({
      description: 'Tags to apply',
      multiple: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectionCreate)

    const payload: Record<string, unknown> = {
      connection_name: flags.name,
      active: flags.active,
    }

    if (flags['webhook-url']) {
      payload.webhook_event_url = flags['webhook-url']
    }
    if (flags['webhook-failover-url']) {
      payload.webhook_event_failover_url = flags['webhook-failover-url']
    }
    if (flags['webhook-timeout']) {
      payload.webhook_timeout_secs = flags['webhook-timeout']
    }
    if (flags.tag && flags.tag.length > 0) {
      payload.tags = flags.tag
    }

    // Map type to endpoint
    let endpoint = '/credential_connections'
    if (flags.type === 'fqdn') {
      endpoint = '/fqdn_connections'
    } else if (flags.type === 'ip') {
      endpoint = '/ip_connections'
    }

    this.info(`Creating ${flags.type} connection...`)

    const response = await v2.post<ConnectionResponse>(endpoint, payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const c = response.data
    this.success('Connection created!')
    this.log('')
    this.log(`  ID:     ${c.id}`)
    this.log(`  Name:   ${c.connection_name}`)
    this.log(`  Type:   ${c.record_type}`)
    this.log(`  Active: ${c.active ? 'Yes' : 'No'}`)
  }
}
