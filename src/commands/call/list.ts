import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Call {
  call_control_id: string
  call_leg_id: string
  call_session_id: string
  connection_id: string
  from: string
  to: string
  direction: string
  state: string
  is_alive: boolean
  start_time: string
  answer_time?: string
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
  static override description = 'List active calls'

  static override examples = [
    '<%= config.bin %> call list',
    '<%= config.bin %> call list --connection-id abc123',
    '<%= config.bin %> call list --limit 50',
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
    'connection-id': Flags.string({
      description: 'Filter by connection/application ID',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(CallList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags['connection-id']) {
      params.set('filter[connection_id]', flags['connection-id'])
    }

    this.info('Fetching active calls...')

    const response = await v2.get<CallListResponse>(`/calls?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const calls = response.data || []

    if (calls.length === 0) {
      this.log('No active calls')
      return
    }

    const tableData = calls.map(c => ({
      id: c.call_control_id.substring(0, 20) + '...',
      direction: c.direction,
      from: c.from,
      to: c.to,
      state: c.state,
      started: new Date(c.start_time).toLocaleTimeString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'CALL_CONTROL_ID' },
      direction: { header: 'DIR' },
      from: { header: 'FROM' },
      to: { header: 'TO' },
      state: { header: 'STATE' },
      started: { header: 'STARTED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`${response.meta.total_results} active call(s)`)
    }
  }
}
