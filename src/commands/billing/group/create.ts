import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface BillingGroupResponse {
  data: {
    id: string
    name: string
    created_at: string
  }
}

export default class BillingGroupCreate extends BaseCommand {
  static override description = 'Create a billing group'

  static override examples = [
    '<%= config.bin %> billing group create --name "Production"',
    '<%= config.bin %> billing group create --name "Development"',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Billing group name',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(BillingGroupCreate)

    const payload = {
      name: flags.name,
    }

    this.info('Creating billing group...')

    const response = await v2.post<BillingGroupResponse>('/billing_groups', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const group = response.data
    this.success('Billing group created!')
    this.log('')
    this.log(`  ID:   ${group.id}`)
    this.log(`  Name: ${group.name}`)
  }
}
