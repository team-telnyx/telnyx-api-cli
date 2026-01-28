import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Assistant {
  id: string
  name: string
  model: string
  description?: string
  enabled_features: string[]
  created_at: string
  updated_at: string
}

interface AssistantListResponse {
  data: Assistant[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class AssistantList extends BaseCommand {
  static override description = 'List AI assistants'

  static override examples = [
    '<%= config.bin %> assistant list',
    '<%= config.bin %> assistant list --limit 50',
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
    const { flags } = await this.parse(AssistantList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching AI assistants...')

    const response = await v2.get<AssistantListResponse>(`/ai/assistants?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const assistants = response.data || []

    if (assistants.length === 0) {
      this.log('No AI assistants found')
      return
    }

    const tableData = assistants.map(a => ({
      id: a.id.substring(0, 20) + '...',
      name: a.name,
      model: a.model || '-',
      features: a.enabled_features?.join(', ') || '-',
      created: new Date(a.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      model: { header: 'MODEL' },
      features: { header: 'FEATURES' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
