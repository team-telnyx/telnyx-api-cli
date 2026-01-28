import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

export default class MessagingProfileDelete extends BaseCommand {
  static override description = 'Delete a messaging profile'

  static override examples = [
    '<%= config.bin %> messaging-profile delete 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Messaging profile ID',
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
    const { args, flags } = await this.parse(MessagingProfileDelete)

    validateId(args.id, 'Profile ID')

    if (!flags.force) {
      this.warning(`This will permanently delete messaging profile ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting messaging profile ${args.id}...`)

    await v2.delete(`/messaging_profiles/${args.id}`, { profile: flags.profile })

    this.success('Messaging profile deleted')
  }
}
