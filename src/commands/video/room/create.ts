import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface RoomResponse {
  data: {
    id: string
    unique_name: string
    max_participants: number
    enable_recording: boolean
    webhook_event_url?: string
    created_at: string
  }
}

export default class VideoRoomCreate extends BaseCommand {
  static override description = 'Create a video room'

  static override examples = [
    '<%= config.bin %> video room create --name "Daily Standup"',
    '<%= config.bin %> video room create --name "Interview" --max-participants 2 --enable-recording',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Unique room name',
      required: true,
    }),
    'max-participants': Flags.integer({
      description: 'Maximum participants allowed',
      default: 10,
    }),
    'enable-recording': Flags.boolean({
      description: 'Enable recording for this room',
      default: false,
    }),
    'webhook-url': Flags.string({
      description: 'Webhook URL for room events',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VideoRoomCreate)

    const payload: Record<string, unknown> = {
      unique_name: flags.name,
      max_participants: flags['max-participants'],
      enable_recording: flags['enable-recording'],
    }

    if (flags['webhook-url']) {
      payload.webhook_event_url = flags['webhook-url']
    }

    this.info('Creating video room...')

    const response = await v2.post<RoomResponse>('/rooms', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const room = response.data
    this.success('Video room created!')
    this.log('')
    this.log(`  ID:              ${room.id}`)
    this.log(`  Name:            ${room.unique_name}`)
    this.log(`  Max Participants: ${room.max_participants}`)
    this.log(`  Recording:       ${room.enable_recording ? 'Enabled' : 'Disabled'}`)
    this.log('')
    this.log('Use "telnyx video room token <room-id>" to generate a join token')
  }
}
