import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

export default class NumberDelete extends BaseCommand {
  static override description = 'Delete (release) a phone number'

  static override examples = [
    '<%= config.bin %> number delete +15551234567 --force',
    '<%= config.bin %> number delete 1234567890123456789 -f',
  ]

  static override args = {
    number: Args.string({
      description: 'Phone number (E.164) or ID',
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
    const { args, flags } = await this.parse(NumberDelete)

    if (!flags.force) {
      this.warning(`This will permanently release ${args.number}`)
      this.log('The number will become available for others to purchase.')
      this.log('Use --force to skip this confirmation')
      return
    }

    const encoded = encodeURIComponent(args.number)

    this.info(`Deleting number ${args.number}...`)

    await v2.delete(`/phone_numbers/${encoded}`, { profile: flags.profile })

    this.success(`Number ${args.number} released`)
  }
}
