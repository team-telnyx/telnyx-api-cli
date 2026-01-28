import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

export default class VerifyProfileDelete extends BaseCommand {
  static override description = 'Delete a verify profile'

  static override examples = [
    '<%= config.bin %> verify profile delete 4900017a-e7c8-e79e-0a7c-0d98f49b09cc',
    '<%= config.bin %> verify profile delete 4900017a-e7c8-e79e-0a7c-0d98f49b09cc --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Verify profile ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(VerifyProfileDelete)

    validateId(args.id, 'Profile ID')

    if (!flags.force) {
      this.warning(`This will permanently delete verify profile ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting verify profile ${args.id}...`)

    await v2.delete(`/verify_profiles/${args.id}`, { profile: flags.profile })

    this.success(`Verify profile deleted`)
  }
}
