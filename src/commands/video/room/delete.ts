import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

export default class VideoRoomDelete extends BaseCommand {
  static override description = 'Delete a video room'

  static override examples = [
    '<%= config.bin %> video room delete 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Room ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(VideoRoomDelete)

    validateId(args.id, 'Room ID')

    if (!flags.force) {
      this.warning(`This will permanently delete room ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting room ${args.id}...`)

    await v2.delete(`/rooms/${args.id}`, { profile: flags.profile })

    this.success('Video room deleted')
  }
}
