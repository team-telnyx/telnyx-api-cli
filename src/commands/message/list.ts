import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Message {
  id: string
  record_type: string
  direction: string
  type: string
  from: {
    phone_number: string
  }
  to: Array<{
    phone_number: string
    status: string
  }>
  text: string
  parts: number
  created_at: string
  sent_at?: string
  completed_at?: string
  cost?: {
    amount: string
    currency: string
  }
}

interface MessageListResponse {
  data: Message[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class MessageList extends BaseCommand {
  static override description = 'List messages'

  static override examples = [
    '<%= config.bin %> message list',
    '<%= config.bin %> message list --direction outbound',
    '<%= config.bin %> message list --from +15551234567',
    '<%= config.bin %> message list --limit 50 --json',
    '<%= config.bin %> message list --output csv > messages.csv',
    '<%= config.bin %> message list --output ids | xargs -I {} telnyx message get {}',
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
    direction: Flags.string({
      char: 'd',
      description: 'Filter by direction',
      options: ['inbound', 'outbound'],
    }),
    type: Flags.string({
      char: 't',
      description: 'Filter by message type',
      options: ['SMS', 'MMS'],
    }),
    from: Flags.string({
      description: 'Filter by sender phone number',
    }),
    to: Flags.string({
      description: 'Filter by recipient phone number',
    }),
    'messaging-profile-id': Flags.string({
      description: 'Filter by messaging profile ID',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(MessageList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.direction) {
      params.set('filter[direction]', flags.direction)
    }
    if (flags.type) {
      params.set('filter[type]', flags.type)
    }
    if (flags.from) {
      params.set('filter[from]', flags.from)
    }
    if (flags.to) {
      params.set('filter[to]', flags.to)
    }
    if (flags['messaging-profile-id']) {
      params.set('filter[messaging_profile_id]', flags['messaging-profile-id'])
    }

    const format = this.getOutputFormat(flags)
    
    if (format === 'table') {
      this.info('Fetching messages...')
    }

    const response = await v2.get<MessageListResponse>(`/messages?${params.toString()}`, { profile: flags.profile })

    // For full JSON output, return the raw response
    if (format === 'json' && !flags.output) {
      this.outputJson(response)
      return
    }

    const messages = response.data || []

    if (messages.length === 0 && format === 'table') {
      this.log('No messages found')
      return
    }

    const tableData = messages.map(m => ({
      id: m.id,
      direction: format === 'table' ? (m.direction === 'outbound' ? '→' : '←') : m.direction,
      type: m.type,
      from: m.from.phone_number,
      to: m.to[0]?.phone_number || '-',
      status: m.to[0]?.status || '-',
      text: format === 'table' 
        ? (m.text || '').substring(0, 30) + ((m.text?.length || 0) > 30 ? '...' : '')
        : m.text || '',
      created: format === 'table' ? new Date(m.created_at).toLocaleString() : m.created_at,
    }))

    this.outputTable(
      tableData as unknown as Record<string, unknown>[],
      {
        id: { header: 'ID' },
        direction: { header: 'DIR' },
        type: { header: 'TYPE' },
        from: { header: 'FROM' },
        to: { header: 'TO' },
        status: { header: 'STATUS' },
        text: { header: 'TEXT' },
        created: { header: 'CREATED' },
      },
      { format, idField: 'id' }
    )

    if (format === 'table' && response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
