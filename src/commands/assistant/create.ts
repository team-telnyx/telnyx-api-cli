import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface AssistantResponse {
  data: {
    id: string
    name: string
    model: string
    created_at: string
  }
}

export default class AssistantCreate extends BaseCommand {
  static override description = 'Create an AI assistant'

  static override examples = [
    '<%= config.bin %> assistant create --name "Customer Support" --instructions "You are a helpful customer support agent."',
    '<%= config.bin %> assistant create --name "Sales Bot" --instructions "Help customers with product inquiries" --model meta-llama/Meta-Llama-3.1-70B-Instruct',
    '<%= config.bin %> assistant create --name "Receptionist" --instructions "Answer calls and take messages" --greeting "Hello, how can I help you today?" --enable-telephony',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Assistant name',
      required: true,
    }),
    instructions: Flags.string({
      char: 'i',
      description: 'System instructions for the assistant',
      required: true,
    }),
    model: Flags.string({
      char: 'm',
      description: 'LLM model to use',
      default: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Assistant description',
    }),
    greeting: Flags.string({
      char: 'g',
      description: 'Greeting message for calls',
    }),
    voice: Flags.string({
      description: 'Voice for TTS',
      default: 'Telnyx.Cove',
    }),
    'enable-telephony': Flags.boolean({
      description: 'Enable phone call support',
      default: false,
    }),
    'enable-messaging': Flags.boolean({
      description: 'Enable SMS/messaging support',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(AssistantCreate)

    const enabledFeatures: string[] = []
    if (flags['enable-telephony']) enabledFeatures.push('telephony')
    if (flags['enable-messaging']) enabledFeatures.push('messaging')

    const payload: Record<string, unknown> = {
      name: flags.name,
      instructions: flags.instructions,
      model: flags.model,
      enabled_features: enabledFeatures,
    }

    if (flags.description) {
      payload.description = flags.description
    }

    if (flags.greeting) {
      payload.greeting = flags.greeting
    }

    if (flags.voice) {
      payload.voice_settings = {
        voice: flags.voice,
      }
    }

    this.info('Creating AI assistant...')

    const response = await v2.post<AssistantResponse>('/ai/assistants', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const a = response.data
    this.success('AI assistant created!')
    this.log('')
    this.log(`  ID:    ${a.id}`)
    this.log(`  Name:  ${a.name}`)
    this.log(`  Model: ${a.model}`)
    this.log('')
    this.log('Assign a phone number to this assistant in the portal or use:')
    this.log(`  telnyx assistant call ${a.id} --to +1555...`)
  }
}
