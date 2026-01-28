import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface PhoneNumber {
  id: string
  phone_number: string
  status: string
  connection_id?: string
  connection_name?: string
  messaging_profile_id?: string
  messaging_profile_name?: string
  tags?: string[]
  created_at: string
  purchased_at?: string
}

interface NumberListResponse {
  data: PhoneNumber[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class NumberList extends BaseCommand {
  static override description = 'List your phone numbers'

  static override examples = [
    '<%= config.bin %> number list',
    '<%= config.bin %> number list --limit 50',
    '<%= config.bin %> number list --status active',
    '<%= config.bin %> number list --tag production',
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
      description: 'Filter by status',
      options: ['active', 'pending', 'deleted'],
    }),
    tag: Flags.string({
      description: 'Filter by tag',
    }),
    contains: Flags.string({
      description: 'Filter by number pattern',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(NumberList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.status) {
      params.set('filter[status]', flags.status)
    }
    if (flags.tag) {
      params.set('filter[tag]', flags.tag)
    }
    if (flags.contains) {
      params.set('filter[phone_number][contains]', flags.contains)
    }

    this.info('Fetching phone numbers...')

    const response = await v2.get<NumberListResponse>(`/phone_numbers?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const numbers = response.data || []

    if (numbers.length === 0) {
      this.log('No phone numbers found')
      return
    }

    const tableData = numbers.map(n => ({
      number: n.phone_number,
      status: n.status,
      connection: n.connection_name || '-',
      messaging: n.messaging_profile_name || '-',
      tags: n.tags?.join(', ') || '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      number: { header: 'NUMBER' },
      status: { header: 'STATUS' },
      connection: { header: 'VOICE' },
      messaging: { header: 'MESSAGING' },
      tags: { header: 'TAGS' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
