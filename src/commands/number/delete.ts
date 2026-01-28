import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, setVerboseLogger } from '../../lib/api.js'

export default class NumberDelete extends BaseCommand {
  static override description = 'Delete (release) a phone number'

  static override examples = [
    '<%= config.bin %> number delete +15551234567 --force',
    '<%= config.bin %> number delete +15551234567 --dry-run',
    '<%= config.bin %> number delete 1234567890123456789 -f',
  ]

  static override args = {
    number: Args.string({
      description: 'Phone number (E.164) or ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.destructiveFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(NumberDelete)

    if (flags.verbose) {
      this.isVerbose = true
      setVerboseLogger((msg) => this.debugLog(msg))
    }

    if (flags['dry-run']) {
      this.dryRunLog(`Would release phone number ${args.number}`)
      this.dryRunLog('The number would become available for others to purchase.')
      return
    }

    if (!flags.force) {
      const confirmed = await this.confirmOrForce(
        `This will permanently release ${args.number}. The number will become available for others to purchase. Continue?`,
        flags.force
      )
      
      if (!confirmed) {
        this.log('Cancelled')
        return
      }
    }

    const encoded = encodeURIComponent(args.number)

    this.info(`Deleting number ${args.number}...`)

    await v2.delete(`/phone_numbers/${encoded}`, { 
      profile: flags.profile,
      verbose: flags.verbose 
    })

    this.success(`Number ${args.number} released`)
  }
}
