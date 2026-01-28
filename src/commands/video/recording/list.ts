import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface Recording {
  id: string
  room_id: string
  session_id: string
  status: string
  type: string
  size_mb?: number
  download_url?: string
  created_at: string
  completed_at?: string
}

interface RecordingListResponse {
  data: Recording[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class VideoRecordingList extends BaseCommand {
  static override description = 'List video recordings'

  static override examples = [
    '<%= config.bin %> video recording list',
    '<%= config.bin %> video recording list --room-id abc123',
    '<%= config.bin %> video recording list --session-id xyz789',
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
    'session-id': Flags.string({
      description: 'Filter by session ID',
    }),
    status: Flags.string({
      description: 'Filter by status',
      options: ['completed', 'processing'],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VideoRecordingList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags['room-id']) {
      params.set('filter[room_id]', flags['room-id'])
    }
    if (flags['session-id']) {
      params.set('filter[session_id]', flags['session-id'])
    }
    if (flags.status) {
      params.set('filter[status]', flags.status)
    }

    this.info('Fetching recordings...')

    const response = await v2.get<RecordingListResponse>(`/room_recordings?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const recordings = response.data || []

    if (recordings.length === 0) {
      this.log('No recordings found')
      return
    }

    const tableData = recordings.map(r => ({
      id: r.id.substring(0, 12) + '...',
      roomId: r.room_id.substring(0, 12) + '...',
      status: r.status,
      type: r.type,
      size: r.size_mb ? `${r.size_mb} MB` : '-',
      created: new Date(r.created_at).toLocaleString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      roomId: { header: 'ROOM_ID' },
      status: { header: 'STATUS' },
      type: { header: 'TYPE' },
      size: { header: 'SIZE' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
