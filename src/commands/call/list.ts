import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Call {
  id: string
  record_type: string
  call_leg_id: string
  call_session_id: string
  is_alive: boolean
  from: string
  to: string
  direction: string
  state: string
  start_time: string
  answer_time?: string
  end_time?: string
  hangup_source?: string
  hangup_cause?: string
}

interface CallListResponse {
  data: Call[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class CallList extends BaseCommand {
  static override description = 'List calls'

  static override examples = [
    '<%= config.bin %> call list',
    '<%= config.bin %> call list --direction outgoing',
    '<%= config.bin %> call list --from +15551234567',
    '<%= config.bin %> call list --limit 50 --json',
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
      options: ['incoming', 'outgoing'],
    }),
    from: Flags.string({
      description: 'Filter by caller phone number',
    }),
    to: Flags.string({
      description: 'Filter by callee phone number',
    }),
    'connection-id': Flags.string({
      description: 'Filter by connection ID',
    }),
    status: Flags.string({
      char: 's',
      description: 'Filter by call status',
      options: ['active', 'completed'],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(CallList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.direction) {
      params.set('filter[direction]', flags.direction)
    }
    if (flags.from) {
      params.set('filter[from]', flags.from)
    }
    if (flags.to) {
      params.set('filter[to]', flags.to)
    }
    if (flags['connection-id']) {
      params.set('filter[connection_id]', flags['connection-id'])
    }
    if (flags.status) {
      params.set('filter[status]', flags.status)
    }

    this.info('Fetching calls...')

    const response = await v2.get<CallListResponse>(`/calls?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const calls = response.data || []

    if (calls.length === 0) {
      this.log('No calls found')
      return
    }

    const tableData = calls.map(c => ({
      id: c.call_leg_id?.substring(0, 16) + '...' || c.id.substring(0, 16) + '...',
      direction: c.direction === 'outgoing' ? '→' : '←',
      from: c.from,
      to: c.to,
      state: c.state,
      alive: c.is_alive ? '✓' : '✗',
      started: c.start_time ? new Date(c.start_time).toLocaleString() : '-',
      hangup: c.hangup_cause || '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'CALL LEG ID' },
      direction: { header: 'DIR' },
      from: { header: 'FROM' },
      to: { header: 'TO' },
      state: { header: 'STATE' },
      alive: { header: 'ALIVE' },
      started: { header: 'STARTED' },
      hangup: { header: 'HANGUP' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
