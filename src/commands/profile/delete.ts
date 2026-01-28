import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { deleteProfile, listProfiles, getDefaultProfile } from '../../lib/config.js'

export default class ProfileDelete extends BaseCommand {
  static override description = 'Delete a profile'

  static override examples = [
    '<%= config.bin %> profile delete staging --force',
    '<%= config.bin %> profile delete old-profile -f',
  ]

  static override args = {
    name: Args.string({
      description: 'Profile name to delete',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.destructiveFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileDelete)

    const profiles = listProfiles()
    
    if (!profiles.includes(args.name)) {
      this.error(`Profile "${args.name}" not found.`)
    }

    if (profiles.length === 1) {
      this.error(
        `Cannot delete the only remaining profile.\n` +
        `Create another profile first with: telnyx auth setup --profile <name>`
      )
    }

    const isDefault = args.name === getDefaultProfile()

    if (flags['dry-run']) {
      this.dryRunLog(`Would delete profile "${args.name}"`)
      if (isDefault) {
        this.dryRunLog('A new default profile would be selected automatically')
      }
      return
    }

    if (!flags.force) {
      const confirmed = await this.confirmOrForce(
        `Delete profile "${args.name}"?${isDefault ? ' (This is your default profile)' : ''}`,
        flags.force
      )
      if (!confirmed) {
        this.log('Cancelled')
        return
      }
    }

    deleteProfile(args.name)
    this.success(`Profile "${args.name}" deleted`)
    
    if (isDefault) {
      const newDefault = getDefaultProfile()
      this.log(`Default profile is now "${newDefault}"`)
    }
  }
}
