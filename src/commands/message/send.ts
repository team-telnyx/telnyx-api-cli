import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

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
    }>
    text: string
    media?: Array<{
      url: string
      content_type: string
    }>
    messaging_profile_id?: string
    created_at: string
    sent_at?: string
    completed_at?: string
    cost?: {
      amount: string
      currency: string
    }
  }
}

export default class MessageSend extends BaseCommand {
  static override description = 'Send an SMS or MMS message'

  static override examples = [
    '<%= config.bin %> message send --from +15551234567 --to +15559876543 --text "Hello!"',
    '<%= config.bin %> message send -f +15551234567 -t +15559876543 --text "Check this out" --media https://example.com/image.jpg',
    '<%= config.bin %> message send --from +15551234567 --to +15559876543 --text "Hello" --profile production',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({
      char: 'f',
      description: 'Sender phone number (E.164 format)',
      required: true,
    }),
    to: Flags.string({
      char: 't',
      description: 'Recipient phone number (E.164 format)',
      required: true,
    }),
    text: Flags.string({
      description: 'Message text content',
      required: true,
    }),
    media: Flags.string({
      char: 'm',
      description: 'Media URL for MMS (can be specified multiple times)',
      multiple: true,
    }),
    'messaging-profile-id': Flags.string({
      description: 'Messaging profile ID to use',
    }),
    'webhook-url': Flags.string({
      description: 'URL for delivery webhooks',
    }),
    subject: Flags.string({
      description: 'MMS subject line',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(MessageSend)

    // Validate phone numbers
    validatePhone(flags.from)
    validatePhone(flags.to)

    const payload: Record<string, unknown> = {
      from: flags.from,
      to: flags.to,
      text: flags.text,
    }

    if (flags.media && flags.media.length > 0) {
      payload.media_urls = flags.media
    }

    if (flags['messaging-profile-id']) {
      payload.messaging_profile_id = flags['messaging-profile-id']
    }

    if (flags['webhook-url']) {
      payload.webhook_url = flags['webhook-url']
      payload.use_profile_webhooks = false
    }

    if (flags.subject) {
      payload.subject = flags.subject
    }

    this.info(`Sending message to ${flags.to}...`)

    const response = await v2.post<MessageResponse>('/messages', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const msg = response.data
    this.success(`Message sent!`)
    this.log('')
    this.log(`  ID:     ${msg.id}`)
    this.log(`  From:   ${msg.from.phone_number}`)
    this.log(`  To:     ${msg.to[0].phone_number}`)
    this.log(`  Status: ${msg.to[0].status}`)
    this.log(`  Type:   ${msg.type}`)
    if (msg.cost) {
      this.log(`  Cost:   ${msg.cost.amount} ${msg.cost.currency}`)
    }
  }
}
