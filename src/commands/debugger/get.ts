import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface WebhookAttempt {
  status: string
  started_at: string
  finished_at: string
  http?: {
    request?: {
      url: string
      headers?: Array<[string, string]>
    }
    response?: {
      status: number
      headers?: Array<[string, string]>
      body?: string
    }
  }
  errors?: number[]
}

interface WebhookDelivery {
  id: string
  record_type: string
  status: string
  webhook: {
    id: string
    event_type: string
    occurred_at: string
    payload: Record<string, unknown>
  }
  started_at: string
  finished_at: string
  attempts: WebhookAttempt[]
}

interface WebhookDeliveryResponse {
  data: WebhookDelivery
}

export default class DebuggerGet extends BaseCommand {
  static override description = 'Get details of a specific webhook delivery'

  static override examples = [
    '<%= config.bin %> debugger get 0ccc7b54-4df3-4bca-a65a-3da1ecc777f0',
    '<%= config.bin %> debugger get 0ccc7b54-4df3-4bca-a65a-3da1ecc777f0 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Webhook delivery ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DebuggerGet)

    validateId(args.id, 'Webhook delivery ID')

    this.info(`Fetching webhook delivery ${args.id}...`)

    const response = await v2.get<WebhookDeliveryResponse>(`/webhook_deliveries/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const d = response.data

    this.log('')
    this.log(`Webhook Delivery Details`)
    this.log(`${'─'.repeat(60)}`)
    this.log(`  ID:           ${d.id}`)
    this.log(`  Status:       ${d.status === 'delivered' ? '✓ Delivered' : '✗ Failed'}`)
    this.log(`  Event Type:   ${d.webhook.event_type}`)
    this.log(`  Event ID:     ${d.webhook.id}`)
    this.log(`  Occurred:     ${new Date(d.webhook.occurred_at).toLocaleString()}`)
    this.log('')
    this.log(`  Started:      ${new Date(d.started_at).toLocaleString()}`)
    this.log(`  Finished:     ${new Date(d.finished_at).toLocaleString()}`)

    // Show payload
    this.log('')
    this.log(`Event Payload`)
    this.log(`${'─'.repeat(60)}`)
    this.log(JSON.stringify(d.webhook.payload, null, 2))

    // Show attempts
    if (d.attempts && d.attempts.length > 0) {
      this.log('')
      this.log(`Delivery Attempts (${d.attempts.length})`)
      this.log(`${'─'.repeat(60)}`)

      for (let i = 0; i < d.attempts.length; i++) {
        const attempt = d.attempts[i]
        const attemptNum = d.attempts.length - i // Most recent first

        this.log('')
        this.log(`  Attempt #${attemptNum}`)
        this.log(`  Status:       ${attempt.status === 'delivered' ? '✓ Delivered' : '✗ Failed'}`)
        this.log(`  Started:      ${new Date(attempt.started_at).toLocaleString()}`)
        this.log(`  Finished:     ${new Date(attempt.finished_at).toLocaleString()}`)

        if (attempt.http?.request) {
          this.log(`  Request URL:  ${attempt.http.request.url}`)
        }

        if (attempt.http?.response) {
          const statusCode = attempt.http.response.status
          const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✓' : '✗'
          this.log(`  Response:     ${statusEmoji} HTTP ${statusCode}`)

          if (attempt.http.response.body) {
            const body = attempt.http.response.body
            const truncated = body.length > 200 ? body.substring(0, 200) + '...' : body
            this.log(`  Body:         ${truncated}`)
          }
        }

        if (attempt.errors && attempt.errors.length > 0) {
          this.log(`  Errors:       ${attempt.errors.join(', ')}`)
        }
      }
    }
  }
}
