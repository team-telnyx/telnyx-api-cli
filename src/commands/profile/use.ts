import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { setDefaultProfile, listProfiles } from '../../lib/config.js'

export default class ProfileUse extends BaseCommand {
  static override description = 'Set the default profile'

  static override examples = [
    '<%= config.bin %> profile use production',
    '<%= config.bin %> profile use default',
  ]

  static override args = {
    name: Args.string({
      description: 'Profile name to set as default',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(ProfileUse)

    const profiles = listProfiles()
    
    if (!profiles.includes(args.name)) {
      this.error(
        `Profile "${args.name}" not found.\n\n` +
        `Available profiles: ${profiles.join(', ') || '(none)'}\n` +
        `To create a new profile: telnyx auth setup --profile ${args.name}`
      )
    }

    setDefaultProfile(args.name)
    this.success(`Default profile set to "${args.name}"`)
  }
}
