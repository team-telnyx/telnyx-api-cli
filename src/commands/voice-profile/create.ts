import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface OutboundVoiceProfileResponse {
  data: {
    id: string
    name: string
    enabled: boolean
    concurrent_call_limit?: number
    created_at: string
  }
}

export default class VoiceProfileCreate extends BaseCommand {
  static override description = 'Create an outbound voice profile'

  static override examples = [
    '<%= config.bin %> voice-profile create --name "Production"',
    '<%= config.bin %> voice-profile create --name "High Volume" --concurrent-call-limit 100',
    '<%= config.bin %> voice-profile create --name "US Only" --traffic-type conversational --daily-spend-limit 100',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Profile name',
      required: true,
    }),
    enabled: Flags.boolean({
      description: 'Enable the profile',
      default: true,
    }),
    'concurrent-call-limit': Flags.integer({
      description: 'Maximum concurrent calls',
    }),
    'daily-spend-limit': Flags.string({
      description: 'Daily spend limit (e.g., 100.00)',
    }),
    'traffic-type': Flags.string({
      description: 'Traffic type',
      options: ['conversational', 'short_duration'],
    }),
    'service-plan': Flags.string({
      description: 'Service plan',
      options: ['global', 'us_canada'],
    }),
    'billing-group-id': Flags.string({
      description: 'Billing group ID',
    }),
    tag: Flags.string({
      description: 'Tags to apply',
      multiple: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VoiceProfileCreate)

    const payload: Record<string, unknown> = {
      name: flags.name,
      enabled: flags.enabled,
    }

    if (flags['concurrent-call-limit']) {
      payload.concurrent_call_limit = flags['concurrent-call-limit']
    }

    if (flags['daily-spend-limit']) {
      payload.daily_spend_limit = flags['daily-spend-limit']
      payload.daily_spend_limit_enabled = true
    }

    if (flags['traffic-type']) {
      payload.traffic_type = flags['traffic-type']
    }

    if (flags['service-plan']) {
      payload.service_plan = flags['service-plan']
    }

    if (flags['billing-group-id']) {
      payload.billing_group_id = flags['billing-group-id']
    }

    if (flags.tag && flags.tag.length > 0) {
      payload.tags = flags.tag
    }

    this.info('Creating outbound voice profile...')

    const response = await v2.post<OutboundVoiceProfileResponse>('/outbound_voice_profiles', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const p = response.data
    this.success('Outbound voice profile created!')
    this.log('')
    this.log(`  ID:      ${p.id}`)
    this.log(`  Name:    ${p.name}`)
    this.log(`  Enabled: ${p.enabled ? 'Yes' : 'No'}`)
    if (p.concurrent_call_limit) {
      this.log(`  Limit:   ${p.concurrent_call_limit} concurrent calls`)
    }
  }
}
