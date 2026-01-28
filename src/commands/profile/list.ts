import { BaseCommand } from '../../lib/base-command.js'
import { listProfiles, getDefaultProfile, getConfigPath } from '../../lib/config.js'

export default class ProfileList extends BaseCommand {
  static override description = 'List configured profiles'

  static override examples = [
    '<%= config.bin %> profile list',
    '<%= config.bin %> profile list --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ProfileList)

    const profiles = listProfiles()
    const defaultProfile = getDefaultProfile()

    if (flags.json || flags.output === 'json') {
      this.outputJson({
        profiles,
        defaultProfile,
        configPath: getConfigPath(),
      })
      return
    }

    if (profiles.length === 0) {
      this.log('No profiles configured.')
      this.log('')
      this.log('Run "telnyx auth setup" to create a profile.')
      return
    }

    this.log('Configured profiles:')
    this.log('')
    for (const profile of profiles) {
      const isDefault = profile === defaultProfile
      this.log(`  ${isDefault ? '→' : ' '} ${profile}${isDefault ? ' (default)' : ''}`)
    }
    this.log('')
    this.log(`Config: ${getConfigPath()}`)
  }
}
