import { BaseCommand } from '../../lib/base-command.js'
import { getApiKey } from '../../lib/config.js'

interface Model {
  id: string
  object: string
  created: number
  owned_by: string
}

interface ModelsResponse {
  object: string
  data: Model[]
}

export default class AiModels extends BaseCommand {
  static override description = 'List available AI models'

  static override examples = [
    '<%= config.bin %> ai models',
    '<%= config.bin %> ai models --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(AiModels)

    const apiKey = getApiKey(flags.profile)
    if (!apiKey) {
      throw new Error('No API key configured. Run "telnyx auth setup" or set TELNYX_API_KEY')
    }

    this.info('Fetching available models...')

    const response = await fetch('https://api.telnyx.com/v2/ai/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${JSON.stringify(error)}`)
    }

    const data = await response.json() as ModelsResponse

    if (flags.json) {
      this.outputJson(data)
      return
    }

    const models = data.data || []

    if (models.length === 0) {
      this.log('No models available')
      return
    }

    // Group by owner
    const grouped: Record<string, Model[]> = {}
    for (const model of models) {
      const owner = model.owned_by || 'unknown'
      if (!grouped[owner]) grouped[owner] = []
      grouped[owner].push(model)
    }

    for (const [owner, ownerModels] of Object.entries(grouped)) {
      this.log('')
      this.log(`${owner}:`)
      for (const model of ownerModels) {
        this.log(`  ${model.id}`)
      }
    }

    this.log('')
    this.log(`${models.length} model(s) available`)
  }
}
