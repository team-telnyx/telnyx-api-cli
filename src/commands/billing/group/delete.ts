import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

export default class BillingGroupDelete extends BaseCommand {
  static override description = 'Delete a billing group'

  static override examples = [
    '<%= config.bin %> billing group delete 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Billing group ID',
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
    const { args, flags } = await this.parse(BillingGroupDelete)

    validateId(args.id, 'Billing Group ID')

    if (!flags.force) {
      this.warning(`This will permanently delete billing group ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting billing group ${args.id}...`)

    await v2.delete(`/billing_groups/${args.id}`, { profile: flags.profile })

    this.success('Billing group deleted')
  }
}
