import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface MessagingProfileResponse {
  data: {
    id: string
    name: string
    enabled: boolean
    webhook_url?: string
    webhook_failover_url?: string
    webhook_api_version?: string
    whitelisted_destinations?: string[]
    number_pool_settings?: {
      geomatch: boolean
      long_code_weight: number
      toll_free_weight: number
      skip_unhealthy: boolean
      sticky_sender: boolean
    }
    url_shortener_settings?: {
      domain: string
      prefix?: string
    }
    created_at: string
    updated_at: string
  }
}

export default class MessagingProfileGet extends BaseCommand {
  static override description = 'Get messaging profile details'

  static override examples = [
    '<%= config.bin %> messaging-profile get 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
    '<%= config.bin %> messaging-profile get 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Messaging profile ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagingProfileGet)

    validateId(args.id, 'Profile ID')

    this.info(`Fetching messaging profile ${args.id}...`)

    const response = await v2.get<MessagingProfileResponse>(`/messaging_profiles/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const p = response.data

    this.log('')
    this.log('Messaging Profile Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:        ${p.id}`)
    this.log(`  Name:      ${p.name}`)
    this.log(`  Enabled:   ${p.enabled ? 'Yes' : 'No'}`)

    if (p.webhook_url) {
      this.log('')
      this.log('  Webhooks:')
      this.log(`    URL:       ${p.webhook_url}`)
      if (p.webhook_failover_url) {
        this.log(`    Failover:  ${p.webhook_failover_url}`)
      }
      this.log(`    Version:   ${p.webhook_api_version || '2'}`)
    }

    if (p.whitelisted_destinations && p.whitelisted_destinations.length > 0) {
      this.log('')
      this.log(`  Destinations: ${p.whitelisted_destinations.join(', ')}`)
    }

    if (p.number_pool_settings) {
      this.log('')
      this.log('  Number Pool:')
      this.log(`    Geomatch:       ${p.number_pool_settings.geomatch ? 'Yes' : 'No'}`)
      this.log(`    Long Code:      ${p.number_pool_settings.long_code_weight}`)
      this.log(`    Toll-Free:      ${p.number_pool_settings.toll_free_weight}`)
      this.log(`    Sticky Sender:  ${p.number_pool_settings.sticky_sender ? 'Yes' : 'No'}`)
    }

    if (p.url_shortener_settings) {
      this.log('')
      this.log('  URL Shortener:')
      this.log(`    Domain:  ${p.url_shortener_settings.domain}`)
    }

    this.log('')
    this.log(`  Created:   ${new Date(p.created_at).toLocaleString()}`)
    this.log(`  Updated:   ${new Date(p.updated_at).toLocaleString()}`)
  }
}
