import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { getApiKey } from '../../lib/config.js'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatChoice {
  index: number
  message: ChatMessage
  finish_reason: string
}

interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: ChatChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export default class AiChat extends BaseCommand {
  static override description = 'Chat with an AI model (OpenAI-compatible)'

  static override examples = [
    '<%= config.bin %> ai chat "What is Telnyx?"',
    '<%= config.bin %> ai chat "Explain WebRTC" --model meta-llama/Meta-Llama-3.1-70B-Instruct',
    '<%= config.bin %> ai chat "Write a haiku" --system "You are a poet"',
  ]

  static override args = {
    prompt: Args.string({
      description: 'Your message to the AI',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    model: Flags.string({
      char: 'm',
      description: 'Model to use',
      default: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    }),
    system: Flags.string({
      char: 's',
      description: 'System prompt',
    }),
    'max-tokens': Flags.integer({
      description: 'Maximum tokens to generate',
      default: 1024,
    }),
    temperature: Flags.string({
      description: 'Temperature (0-2)',
      default: '0.7',
    }),
    stream: Flags.boolean({
      description: 'Stream the response',
      default: true,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AiChat)

    const apiKey = getApiKey(flags.profile)
    if (!apiKey) {
      throw new Error('No API key configured. Run "telnyx auth setup" or set TELNYX_API_KEY')
    }

    const messages: ChatMessage[] = []
    
    if (flags.system) {
      messages.push({ role: 'system', content: flags.system })
    }
    
    messages.push({ role: 'user', content: args.prompt })

    const payload = {
      model: flags.model,
      messages,
      max_tokens: flags['max-tokens'],
      temperature: parseFloat(flags.temperature),
      stream: flags.stream,
    }

    if (flags.stream && !flags.json) {
      // Streaming response
      const response = await fetch('https://api.telnyx.com/v2/ai/chat/completions', {
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

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              process.stdout.write(content)
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      this.log('') // Final newline
    } else {
      // Non-streaming response
      payload.stream = false

      const response = await fetch('https://api.telnyx.com/v2/ai/chat/completions', {
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

      const data = await response.json() as ChatResponse

      if (flags.json) {
        this.outputJson(data)
        return
      }

      this.log(data.choices[0].message.content)
      this.log('')
      this.log(`Tokens: ${data.usage.prompt_tokens} prompt + ${data.usage.completion_tokens} completion = ${data.usage.total_tokens} total`)
    }
  }
}
