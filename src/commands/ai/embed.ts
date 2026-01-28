import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { getApiKey } from '../../lib/config.js'

interface EmbeddingResponse {
  object: string
  data: Array<{
    object: string
    index: number
    embedding: number[]
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export default class AiEmbed extends BaseCommand {
  static override description = 'Generate embeddings for text'

  static override examples = [
    '<%= config.bin %> ai embed "Hello world"',
    '<%= config.bin %> ai embed "Machine learning is fascinating" --model thenlper/gte-large',
  ]

  static override args = {
    text: Args.string({
      description: 'Text to embed',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    model: Flags.string({
      char: 'm',
      description: 'Embedding model to use',
      default: 'thenlper/gte-large',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AiEmbed)

    const apiKey = getApiKey(flags.profile)
    if (!apiKey) {
      throw new Error('No API key configured. Run "telnyx auth setup" or set TELNYX_API_KEY')
    }

    const payload = {
      model: flags.model,
      input: args.text,
    }

    this.info('Generating embedding...')

    const response = await fetch('https://api.telnyx.com/v2/ai/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${JSON.stringify(error)}`)
    }

    const data = await response.json() as EmbeddingResponse

    if (flags.json) {
      this.outputJson(data)
      return
    }

    const embedding = data.data[0].embedding
    this.success(`Generated ${embedding.length}-dimensional embedding`)
    this.log('')
    this.log(`Model: ${data.model}`)
    this.log(`Tokens: ${data.usage.total_tokens}`)
    this.log('')
    this.log(`First 10 values: [${embedding.slice(0, 10).map(v => v.toFixed(6)).join(', ')}...]`)
  }
}
