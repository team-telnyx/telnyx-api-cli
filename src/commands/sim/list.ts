import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface SimCard {
  id: string
  iccid: string
  imsi?: string
  msisdn?: string
  status: { value: string } | string
  sim_card_group_id?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

interface SimListResponse {
  data: SimCard[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class SimList extends BaseCommand {
  static override description = 'List SIM cards'

  static override examples = [
    '<%= config.bin %> sim list',
    '<%= config.bin %> sim list --status active',
    '<%= config.bin %> sim list --limit 50',
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
    status: Flags.string({
      description: 'Filter by status',
      options: ['enabled', 'disabled', 'standby', 'data_limit_exceeded', 'setting_up'],
    }),
    iccid: Flags.string({
      description: 'Filter by ICCID',
    }),
    tag: Flags.string({
      description: 'Filter by tag',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(SimList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.status) {
      params.set('filter[status]', flags.status)
    }
    if (flags.iccid) {
      params.set('filter[iccid]', flags.iccid)
    }
    if (flags.tag) {
      params.set('filter[tags]', flags.tag)
    }

    this.info('Fetching SIM cards...')

    const response = await v2.get<SimListResponse>(`/sim_cards?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const sims = response.data || []

    if (sims.length === 0) {
      this.log('No SIM cards found')
      return
    }

    const tableData = sims.map(s => ({
      id: s.id.substring(0, 12) + '...',
      iccid: s.iccid,
      msisdn: s.msisdn || '-',
      status: typeof s.status === 'object' ? s.status.value : s.status,
      tags: s.tags?.join(', ') || '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      iccid: { header: 'ICCID' },
      msisdn: { header: 'MSISDN' },
      status: { header: 'STATUS' },
      tags: { header: 'TAGS' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
