import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

export default class AssistantDelete extends BaseCommand {
  static override description = 'Delete an AI assistant'

  static override examples = [
    '<%= config.bin %> assistant delete assistant-abc123 --force',
  ]

  static override args = {
    id: Args.string({
      description: 'Assistant ID',
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
    const { args, flags } = await this.parse(AssistantDelete)

    if (!flags.force) {
      this.warning(`This will permanently delete assistant ${args.id}`)
      this.log('Use --force to skip this confirmation')
      return
    }

    this.info(`Deleting assistant ${args.id}...`)

    await v2.delete(`/ai/assistants/${args.id}`, { profile: flags.profile })

    this.success('AI assistant deleted')
  }
}
