import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Fax {
  id: string
  direction: string
  from: string
  to: string
  status: string
  page_count?: number
  created_at: string
}

interface FaxListResponse {
  data: Fax[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class FaxList extends BaseCommand {
  static override description = 'List faxes'

  static override examples = [
    '<%= config.bin %> fax list',
    '<%= config.bin %> fax list --direction outbound',
    '<%= config.bin %> fax list --limit 50',
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
    direction: Flags.string({
      char: 'd',
      description: 'Filter by direction',
      options: ['inbound', 'outbound'],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(FaxList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.direction) {
      params.set('filter[direction]', flags.direction)
    }

    this.info('Fetching faxes...')

    const response = await v2.get<FaxListResponse>(`/faxes?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const faxes = response.data || []

    if (faxes.length === 0) {
      this.log('No faxes found')
      return
    }

    const tableData = faxes.map(f => ({
      id: f.id.substring(0, 12) + '...',
      direction: f.direction,
      from: f.from,
      to: f.to,
      status: f.status,
      pages: f.page_count || '-',
      created: new Date(f.created_at).toLocaleString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      direction: { header: 'DIR' },
      from: { header: 'FROM' },
      to: { header: 'TO' },
      status: { header: 'STATUS' },
      pages: { header: 'PAGES' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
