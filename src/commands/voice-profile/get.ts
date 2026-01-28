import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface OutboundVoiceProfileResponse {
  data: {
    id: string
    name: string
    enabled: boolean
    concurrent_call_limit?: number
    daily_spend_limit?: string
    daily_spend_limit_enabled?: boolean
    billing_group_id?: string
    service_plan?: string
    traffic_type?: string
    usage_payment_method?: string
    whitelisted_destinations?: string[]
    max_destination_rate?: number
    call_recording?: {
      type: string
      channels?: string
    }
    tags?: string[]
    created_at: string
    updated_at: string
  }
}

export default class VoiceProfileGet extends BaseCommand {
  static override description = 'Get outbound voice profile details'

  static override examples = [
    '<%= config.bin %> voice-profile get 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
    '<%= config.bin %> voice-profile get 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Outbound voice profile ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(VoiceProfileGet)

    validateId(args.id, 'Profile ID')

    this.info(`Fetching outbound voice profile ${args.id}...`)

    const response = await v2.get<OutboundVoiceProfileResponse>(`/outbound_voice_profiles/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const p = response.data

    this.log('')
    this.log('Outbound Voice Profile Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:             ${p.id}`)
    this.log(`  Name:           ${p.name}`)
    this.log(`  Enabled:        ${p.enabled ? 'Yes' : 'No'}`)

    this.log('')
    this.log('  Limits:')
    this.log(`    Concurrent Calls: ${p.concurrent_call_limit || 'unlimited'}`)
    if (p.daily_spend_limit_enabled) {
      this.log(`    Daily Spend:      ${p.daily_spend_limit}`)
    }
    if (p.max_destination_rate) {
      this.log(`    Max Rate:         ${p.max_destination_rate}`)
    }

    if (p.traffic_type || p.service_plan) {
      this.log('')
      this.log('  Routing:')
      if (p.traffic_type) {
        this.log(`    Traffic Type:     ${p.traffic_type}`)
      }
      if (p.service_plan) {
        this.log(`    Service Plan:     ${p.service_plan}`)
      }
    }

    if (p.whitelisted_destinations && p.whitelisted_destinations.length > 0) {
      this.log('')
      this.log(`  Destinations:   ${p.whitelisted_destinations.join(', ')}`)
    }

    if (p.call_recording) {
      this.log('')
      this.log('  Recording:')
      this.log(`    Type:     ${p.call_recording.type}`)
      if (p.call_recording.channels) {
        this.log(`    Channels: ${p.call_recording.channels}`)
      }
    }

    if (p.tags && p.tags.length > 0) {
      this.log('')
      this.log(`  Tags:           ${p.tags.join(', ')}`)
    }

    this.log('')
    this.log(`  Created:        ${new Date(p.created_at).toLocaleString()}`)
    this.log(`  Updated:        ${new Date(p.updated_at).toLocaleString()}`)
  }
}
