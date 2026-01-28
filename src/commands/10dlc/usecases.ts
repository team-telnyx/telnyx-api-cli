import { BaseCommand } from '../../lib/base-command.js'
import { tenDlc } from '../../lib/api.js'

interface Usecase {
  displayName: string
  description: string
  classification: string
}

export default class Usecases extends BaseCommand {
  static override description = 'List available 10DLC use cases'

  static override examples = [
    '<%= config.bin %> 10dlc usecases',
    '<%= config.bin %> 10dlc usecases --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Usecases)

    this.info('Fetching available use cases...')

    const response = await tenDlc.get<Record<string, Usecase>>('/enum/usecase', { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    for (const [key, uc] of Object.entries(response)) {
      const desc = uc.description.length > 60 
        ? uc.description.slice(0, 60) + '...'
        : uc.description
      this.log(`  • ${key} - ${desc}`)
    }
  }
}
