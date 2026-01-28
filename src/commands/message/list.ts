import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Message {
  id: string
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
  created_at: string
}

interface MessageListResponse {
  data: Message[]
  meta: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class MessageList extends BaseCommand {
  static override description = 'List sent and received messages'

  static override examples = [
    '<%= config.bin %> message list',
    '<%= config.bin %> message list --limit 50',
    '<%= config.bin %> message list --direction outbound',
    '<%= config.bin %> message list --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Number of messages to return',
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
      description: 'Filter by message type',
      options: ['SMS', 'MMS'],
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

    this.info('Fetching messages...')

    const response = await v2.get<MessageListResponse>(`/messages?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const messages = response.data || []

    if (messages.length === 0) {
      this.log('No messages found')
      return
    }

    // Format for table display
    const tableData = messages.map(msg => ({
      id: msg.id.substring(0, 12) + '...',
      direction: msg.direction,
      type: msg.type,
      from: msg.from.phone_number,
      to: msg.to[0]?.phone_number || '-',
      status: msg.to[0]?.status || '-',
      text: msg.text?.substring(0, 30) + (msg.text?.length > 30 ? '...' : '') || '-',
      created: new Date(msg.created_at).toLocaleString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      direction: { header: 'DIR' },
      type: { header: 'TYPE' },
      from: { header: 'FROM' },
      to: { header: 'TO' },
      status: { header: 'STATUS' },
      text: { header: 'TEXT' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
