import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface SimActionResponse {
  data: {
    id: string
    status: string
  }
}

export default class SimDisable extends BaseCommand {
  static override description = 'Disable a SIM card'

  static override examples = [
    '<%= config.bin %> sim disable 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
  ]

  static override args = {
    id: Args.string({
      description: 'SIM card ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SimDisable)

    validateId(args.id, 'SIM ID')

    this.info(`Disabling SIM ${args.id}...`)

    const response = await v2.post<SimActionResponse>(
      `/sim_cards/${args.id}/actions/disable`,
      {},
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success(`SIM disabled (status: ${response.data.status})`)
  }
}
