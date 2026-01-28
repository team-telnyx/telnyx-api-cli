import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

export default class VoiceProfileDelete extends BaseCommand {
  static override description = 'Delete an outbound voice profile'

  static override examples = [
    '<%= config.bin %> voice-profile delete 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Outbound voice profile ID',
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
    const { args, flags } = await this.parse(VoiceProfileDelete)

    validateId(args.id, 'Profile ID')

    if (!flags.force) {
      this.warning(`This will permanently delete outbound voice profile ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting outbound voice profile ${args.id}...`)

    await v2.delete(`/outbound_voice_profiles/${args.id}`, { profile: flags.profile })

    this.success('Outbound voice profile deleted')
  }
}
