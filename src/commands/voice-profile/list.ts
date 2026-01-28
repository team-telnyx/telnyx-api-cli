import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface OutboundVoiceProfile {
  id: string
  name: string
  enabled: boolean
  concurrent_call_limit?: number
  billing_group_id?: string
  service_plan?: string
  traffic_type?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

interface ProfileListResponse {
  data: OutboundVoiceProfile[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class VoiceProfileList extends BaseCommand {
  static override description = 'List outbound voice profiles'

  static override examples = [
    '<%= config.bin %> voice-profile list',
    '<%= config.bin %> voice-profile list --limit 50',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Number of results to return',
      default: 25,
    }),
    page: Flags.integer({
      description: 'Page number',
      default: 1,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VoiceProfileList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching outbound voice profiles...')

    const response = await v2.get<ProfileListResponse>(`/outbound_voice_profiles?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const profiles = response.data || []

    if (profiles.length === 0) {
      this.log('No outbound voice profiles found')
      return
    }

    const tableData = profiles.map(p => ({
      id: p.id.substring(0, 12) + '...',
      name: p.name,
      enabled: p.enabled ? '✓' : '✗',
      callLimit: p.concurrent_call_limit || 'unlimited',
      trafficType: p.traffic_type || '-',
      created: new Date(p.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      enabled: { header: 'ON' },
      callLimit: { header: 'LIMIT' },
      trafficType: { header: 'TYPE' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
