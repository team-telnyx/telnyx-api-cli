import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

export default class E911AddressDelete extends BaseCommand {
  static override description = 'Delete an E911 emergency address'

  static override examples = [
    '<%= config.bin %> e911 address delete 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Address ID',
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
    const { args, flags } = await this.parse(E911AddressDelete)

    validateId(args.id, 'Address ID')

    if (!flags.force) {
      this.warning(`This will permanently delete emergency address ${args.id}`)
      this.log('Make sure no phone numbers are using this address.')
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting emergency address ${args.id}...`)

    await v2.delete(`/addresses/${args.id}`, { profile: flags.profile })

    this.success('Emergency address deleted')
  }
}
