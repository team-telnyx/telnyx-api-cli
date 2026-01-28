import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface WebhookAttempt {
  status: string
  started_at: string
  finished_at: string
  http?: {
    request?: {
      url: string
    }
    response?: {
      status: number
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

interface WebhookDeliveryListResponse {
  data: WebhookDelivery[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class DebuggerList extends BaseCommand {
  static override description = 'List webhook deliveries for debugging'

  static override examples = [
    '<%= config.bin %> debugger list',
    '<%= config.bin %> debugger list --status failed',
    '<%= config.bin %> debugger list --event-type message.received',
    '<%= config.bin %> debugger list --since 2024-01-01',
    '<%= config.bin %> debugger list --limit 50 --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Number of results to return',
      default: 25,
    }),
    page: Flags.integer({
      description: 'Page number',
      default: 1,
    }),
    status: Flags.string({
      char: 's',
      description: 'Filter by delivery status',
      options: ['delivered', 'failed'],
    }),
    'event-type': Flags.string({
      char: 'e',
      description: 'Filter by event type (e.g., message.received, call.initiated)',
    }),
    since: Flags.string({
      description: 'Show deliveries since this date/time (ISO 8601)',
    }),
    until: Flags.string({
      description: 'Show deliveries until this date/time (ISO 8601)',
    }),
    webhook: Flags.string({
      description: 'Filter by webhook URL (contains)',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(DebuggerList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.status) {
      params.set('filter[status][eq]', flags.status)
    }
    if (flags['event-type']) {
      params.set('filter[event_type]', flags['event-type'])
    }
    if (flags.since) {
      params.set('filter[started_at][gte]', flags.since)
    }
    if (flags.until) {
      params.set('filter[started_at][lte]', flags.until)
    }
    if (flags.webhook) {
      params.set('filter[webhook][contains]', flags.webhook)
    }

    this.info('Fetching webhook deliveries...')

    const response = await v2.get<WebhookDeliveryListResponse>(`/webhook_deliveries?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const deliveries = response.data || []

    if (deliveries.length === 0) {
      this.log('No webhook deliveries found')
      return
    }

    const tableData = deliveries.map(d => {
      const lastAttempt = d.attempts?.[0]
      return {
        id: d.id.substring(0, 16) + '...',
        status: d.status === 'delivered' ? '✓' : '✗',
        event: d.webhook.event_type,
        httpStatus: lastAttempt?.http?.response?.status || '-',
        attempts: d.attempts?.length || 0,
        occurred: new Date(d.webhook.occurred_at).toLocaleString(),
      }
    })

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      status: { header: 'STATUS' },
      event: { header: 'EVENT TYPE' },
      httpStatus: { header: 'HTTP' },
      attempts: { header: 'ATTEMPTS' },
      occurred: { header: 'OCCURRED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
