import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId, setVerboseLogger } from '../../lib/api.js'

export default class MessagingProfileDelete extends BaseCommand {
  static override description = 'Delete a messaging profile'

  static override examples = [
    '<%= config.bin %> messaging-profile delete <id> --force',
    '<%= config.bin %> messaging-profile delete <id> --dry-run',
  ]

  static override args = {
    id: Args.string({
      description: 'Messaging profile ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.destructiveFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagingProfileDelete)

    if (flags.verbose) {
      this.isVerbose = true
      setVerboseLogger((msg) => this.debugLog(msg))
    }

    validateId(args.id, 'Profile ID')

    if (flags['dry-run']) {
      this.dryRunLog(`Would delete messaging profile ${args.id}`)
      return
    }

    if (!flags.force) {
      const confirmed = await this.confirmOrForce(
        `Delete messaging profile ${args.id}? This cannot be undone.`,
        flags.force
      )
      if (!confirmed) {
        this.log('Cancelled')
        return
      }
    }

    this.info(`Deleting messaging profile ${args.id}...`)

    await v2.delete(`/messaging_profiles/${args.id}`, { 
      profile: flags.profile,
      verbose: flags.verbose 
    })

    this.success('Messaging profile deleted')
  }
}
