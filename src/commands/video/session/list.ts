import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface Session {
  id: string
  room_id: string
  active: boolean
  participants_count?: number
  created_at: string
  ended_at?: string
}

interface SessionListResponse {
  data: Session[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class VideoSessionList extends BaseCommand {
  static override description = 'List video room sessions'

  static override examples = [
    '<%= config.bin %> video session list',
    '<%= config.bin %> video session list --room-id abc123',
    '<%= config.bin %> video session list --active',
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
    'room-id': Flags.string({
      description: 'Filter by room ID',
    }),
    active: Flags.boolean({
      description: 'Only show active sessions',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VideoSessionList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags['room-id']) {
      params.set('filter[room_id]', flags['room-id'])
    }
    if (flags.active) {
      params.set('filter[active]', 'true')
    }

    this.info('Fetching video sessions...')

    const response = await v2.get<SessionListResponse>(`/room_sessions?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const sessions = response.data || []

    if (sessions.length === 0) {
      this.log('No video sessions found')
      return
    }

    const tableData = sessions.map(s => ({
      id: s.id.substring(0, 12) + '...',
      roomId: s.room_id.substring(0, 12) + '...',
      active: s.active ? '✓' : '-',
      participants: s.participants_count || '-',
      started: new Date(s.created_at).toLocaleString(),
      ended: s.ended_at ? new Date(s.ended_at).toLocaleString() : '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'SESSION_ID' },
      roomId: { header: 'ROOM_ID' },
      active: { header: 'ACTIVE' },
      participants: { header: 'USERS' },
      started: { header: 'STARTED' },
      ended: { header: 'ENDED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
