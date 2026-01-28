import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface MessagingProfileResponse {
  data: {
    id: string
    name: string
    enabled: boolean
    created_at: string
  }
}

export default class MessagingProfileCreate extends BaseCommand {
  static override description = 'Create a messaging profile'

  static override examples = [
    '<%= config.bin %> messaging-profile create --name "My App"',
    '<%= config.bin %> messaging-profile create --name "Production" --webhook-url https://example.com/webhook',
    '<%= config.bin %> messaging-profile create --name "Alerts" --webhook-url https://example.com/webhook --geomatch',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Profile name',
      required: true,
    }),
    'webhook-url': Flags.string({
      description: 'Webhook URL for message events',
    }),
    'webhook-failover-url': Flags.string({
      description: 'Failover webhook URL',
    }),
    enabled: Flags.boolean({
      description: 'Enable the profile',
      default: true,
    }),
    geomatch: Flags.boolean({
      description: 'Enable number pool geomatch',
      default: false,
    }),
    'long-code-weight': Flags.integer({
      description: 'Weight for long codes in number pool',
      default: 1,
    }),
    'toll-free-weight': Flags.integer({
      description: 'Weight for toll-free numbers in number pool',
      default: 1,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(MessagingProfileCreate)

    const payload: Record<string, unknown> = {
      name: flags.name,
      enabled: flags.enabled,
    }

    if (flags['webhook-url']) {
      payload.webhook_url = flags['webhook-url']
    }

    if (flags['webhook-failover-url']) {
      payload.webhook_failover_url = flags['webhook-failover-url']
    }

    if (flags.geomatch || flags['long-code-weight'] !== 1 || flags['toll-free-weight'] !== 1) {
      payload.number_pool_settings = {
        geomatch: flags.geomatch,
        long_code_weight: flags['long-code-weight'],
        toll_free_weight: flags['toll-free-weight'],
      }
    }

    this.info('Creating messaging profile...')

    const response = await v2.post<MessagingProfileResponse>('/messaging_profiles', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const p = response.data
    this.success('Messaging profile created!')
    this.log('')
    this.log(`  ID:      ${p.id}`)
    this.log(`  Name:    ${p.name}`)
    this.log(`  Enabled: ${p.enabled ? 'Yes' : 'No'}`)
  }
}
