import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

export default class FaxDelete extends BaseCommand {
  static override description = 'Delete a fax record'

  static override examples = [
    '<%= config.bin %> fax delete 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Fax ID',
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
    const { args, flags } = await this.parse(FaxDelete)

    validateId(args.id, 'Fax ID')

    if (!flags.force) {
      this.warning(`This will permanently delete fax ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting fax ${args.id}...`)

    await v2.delete(`/faxes/${args.id}`, { profile: flags.profile })

    this.success('Fax deleted')
  }
}
