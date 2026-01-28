import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface MessageResponse {
  data: {
    id: string
    record_type: string
    direction: string
    type: string
    from: {
      phone_number: string
      carrier?: string
      line_type?: string
    }
    to: Array<{
      phone_number: string
      status: string
      carrier?: string
      line_type?: string
    }>
    text: string
    subject?: string
    media?: Array<{
      url: string
      content_type: string
      size?: number
    }>
    messaging_profile_id?: string
    organization_id?: string
    parts: number
    created_at: string
    sent_at?: string
    completed_at?: string
    valid_until?: string
    cost?: {
      amount: string
      currency: string
    }
    errors?: Array<{
      code: string
      title: string
      detail?: string
    }>
  }
}

export default class MessageGet extends BaseCommand {
  static override description = 'Get details of a specific message'

  static override examples = [
    '<%= config.bin %> message get 40917b94-82f0-46b0-92f4-3cfb22d52b55',
    '<%= config.bin %> message get 40917b94-82f0-46b0-92f4-3cfb22d52b55 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Message ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(MessageGet)

    validateId(args.id, 'Message ID')

    this.info(`Fetching message ${args.id}...`)

    const response = await v2.get<MessageResponse>(`/messages/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const msg = response.data

    this.log('')
    this.log(`Message Details`)
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:           ${msg.id}`)
    this.log(`  Direction:    ${msg.direction}`)
    this.log(`  Type:         ${msg.type}`)
    this.log(`  Parts:        ${msg.parts}`)
    this.log('')
    this.log(`  From:         ${msg.from.phone_number}`)
    if (msg.from.carrier) {
      this.log(`    Carrier:    ${msg.from.carrier}`)
    }
    if (msg.from.line_type) {
      this.log(`    Line Type:  ${msg.from.line_type}`)
    }
    this.log('')
    
    for (const recipient of msg.to) {
      this.log(`  To:           ${recipient.phone_number}`)
      this.log(`    Status:     ${recipient.status}`)
      if (recipient.carrier) {
        this.log(`    Carrier:    ${recipient.carrier}`)
      }
      if (recipient.line_type) {
        this.log(`    Line Type:  ${recipient.line_type}`)
      }
    }

    this.log('')
    if (msg.subject) {
      this.log(`  Subject:      ${msg.subject}`)
    }
    this.log(`  Text:         ${msg.text || '(empty)'}`)

    if (msg.media && msg.media.length > 0) {
      this.log('')
      this.log(`  Media:`)
      for (const media of msg.media) {
        this.log(`    - ${media.content_type}: ${media.url}`)
      }
    }

    this.log('')
    this.log(`  Created:      ${new Date(msg.created_at).toLocaleString()}`)
    if (msg.sent_at) {
      this.log(`  Sent:         ${new Date(msg.sent_at).toLocaleString()}`)
    }
    if (msg.completed_at) {
      this.log(`  Completed:    ${new Date(msg.completed_at).toLocaleString()}`)
    }

    if (msg.cost) {
      this.log('')
      this.log(`  Cost:         ${msg.cost.amount} ${msg.cost.currency}`)
    }

    if (msg.errors && msg.errors.length > 0) {
      this.log('')
      this.warning('Errors:')
      for (const err of msg.errors) {
        this.log(`    - ${err.code}: ${err.title}`)
        if (err.detail) {
          this.log(`      ${err.detail}`)
        }
      }
    }
  }
}
