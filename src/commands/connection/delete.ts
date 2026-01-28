import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

export default class ConnectionDelete extends BaseCommand {
  static override description = 'Delete a voice connection'

  static override examples = [
    '<%= config.bin %> connection delete 1234567890123456789 --type credential --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Connection ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'Connection type',
      options: ['credential', 'fqdn', 'ip'],
      required: true,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConnectionDelete)

    validateId(args.id, 'Connection ID')

    if (!flags.force) {
      this.warning(`This will permanently delete connection ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    // Map type to endpoint
    let endpoint = '/credential_connections'
    if (flags.type === 'fqdn') {
      endpoint = '/fqdn_connections'
    } else if (flags.type === 'ip') {
      endpoint = '/ip_connections'
    }

    this.info(`Deleting connection ${args.id}...`)

    await v2.delete(`${endpoint}/${args.id}`, { profile: flags.profile })

    this.success('Connection deleted')
  }
}
