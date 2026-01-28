import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface MessagingProfile {
  id: string
  name: string
  enabled: boolean
  webhook_url?: string
  webhook_failover_url?: string
  v1_secret?: string
  number_pool_settings?: {
    geomatch: boolean
    long_code_weight: number
    toll_free_weight: number
  }
  created_at: string
  updated_at: string
}

interface ProfileListResponse {
  data: MessagingProfile[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class MessagingProfileList extends BaseCommand {
  static override description = 'List messaging profiles'

  static override examples = [
    '<%= config.bin %> messaging-profile list',
    '<%= config.bin %> messaging-profile list --limit 50',
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
    const { flags } = await this.parse(MessagingProfileList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching messaging profiles...')

    const response = await v2.get<ProfileListResponse>(`/messaging_profiles?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const profiles = response.data || []

    if (profiles.length === 0) {
      this.log('No messaging profiles found')
      return
    }

    const tableData = profiles.map(p => ({
      id: p.id.substring(0, 12) + '...',
      name: p.name,
      enabled: p.enabled ? '✓' : '✗',
      webhook: p.webhook_url ? '✓' : '-',
      pool: p.number_pool_settings ? '✓' : '-',
      created: new Date(p.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      enabled: { header: 'ON' },
      webhook: { header: 'WEBHOOK' },
      pool: { header: 'POOL' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
