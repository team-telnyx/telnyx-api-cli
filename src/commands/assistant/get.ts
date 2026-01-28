import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface AssistantResponse {
  data: {
    id: string
    name: string
    model: string
    instructions?: string
    description?: string
    greeting?: string
    tools?: Array<{
      type: string
      webhook?: {
        name: string
        url: string
      }
    }>
    voice_settings?: {
      voice: string
      voice_speed?: number
    }
    transcription?: {
      model: string
      language?: string
    }
    telephony_settings?: {
      default_texml_app_id?: string
      time_limit_secs?: number
    }
    messaging_settings?: {
      default_messaging_profile_id?: string
    }
    enabled_features: string[]
    created_at: string
    updated_at: string
  }
}

export default class AssistantGet extends BaseCommand {
  static override description = 'Get AI assistant details'

  static override examples = [
    '<%= config.bin %> assistant get assistant-abc123',
    '<%= config.bin %> assistant get assistant-abc123 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Assistant ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantGet)

    this.info(`Fetching assistant ${args.id}...`)

    const response = await v2.get<AssistantResponse>(`/ai/assistants/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const a = response.data

    this.log('')
    this.log('AI Assistant Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:           ${a.id}`)
    this.log(`  Name:         ${a.name}`)
    this.log(`  Model:        ${a.model}`)
    if (a.description) {
      this.log(`  Description:  ${a.description}`)
    }
    this.log(`  Features:     ${a.enabled_features?.join(', ') || 'none'}`)

    if (a.instructions) {
      this.log('')
      this.log('  Instructions:')
      this.log(`    ${a.instructions.substring(0, 200)}${a.instructions.length > 200 ? '...' : ''}`)
    }

    if (a.greeting) {
      this.log('')
      this.log(`  Greeting:     ${a.greeting}`)
    }

    if (a.voice_settings) {
      this.log('')
      this.log('  Voice:')
      this.log(`    Voice:      ${a.voice_settings.voice}`)
      if (a.voice_settings.voice_speed) {
        this.log(`    Speed:      ${a.voice_settings.voice_speed}x`)
      }
    }

    if (a.transcription) {
      this.log('')
      this.log('  Transcription:')
      this.log(`    Model:      ${a.transcription.model}`)
      if (a.transcription.language) {
        this.log(`    Language:   ${a.transcription.language}`)
      }
    }

    if (a.tools && a.tools.length > 0) {
      this.log('')
      this.log('  Tools:')
      for (const tool of a.tools) {
        this.log(`    - ${tool.type}${tool.webhook ? `: ${tool.webhook.name}` : ''}`)
      }
    }

    this.log('')
    this.log(`  Created:      ${new Date(a.created_at).toLocaleString()}`)
    this.log(`  Updated:      ${new Date(a.updated_at).toLocaleString()}`)
  }
}
