import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface Room {
  id: string
  unique_name: string
  max_participants: number
  enable_recording: boolean
  webhook_event_url?: string
  created_at: string
  updated_at: string
}

interface RoomListResponse {
  data: Room[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class VideoRoomList extends BaseCommand {
  static override description = 'List video rooms'

  static override examples = [
    '<%= config.bin %> video room list',
    '<%= config.bin %> video room list --limit 50',
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
    const { flags } = await this.parse(VideoRoomList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching video rooms...')

    const response = await v2.get<RoomListResponse>(`/rooms?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const rooms = response.data || []

    if (rooms.length === 0) {
      this.log('No video rooms found')
      return
    }

    const tableData = rooms.map(r => ({
      id: r.id.substring(0, 12) + '...',
      name: r.unique_name || '-',
      maxParticipants: r.max_participants,
      recording: r.enable_recording ? '✓' : '-',
      created: new Date(r.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      maxParticipants: { header: 'MAX' },
      recording: { header: 'REC' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
