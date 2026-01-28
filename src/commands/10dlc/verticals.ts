import { BaseCommand } from '../../lib/base-command.js'
import { tenDlc } from '../../lib/api.js'

interface Vertical {
  industryId: string
  displayName: string
  description: string
}

export default class Verticals extends BaseCommand {
  static override description = 'List available 10DLC verticals (industries)'

  static override examples = [
    '<%= config.bin %> 10dlc verticals',
    '<%= config.bin %> 10dlc verticals --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Verticals)

    this.info('Fetching available verticals...')

    const response = await tenDlc.get<Record<string, Vertical>>('/enum/vertical', { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    for (const [key, v] of Object.entries(response)) {
      this.log(`  • ${key} - ${v.displayName}`)
    }
  }
}
