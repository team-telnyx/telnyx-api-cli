import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface PortingOrder {
  id: string
  status: string
  phone_numbers_count: number
  customer_reference?: string
  foc_datetime?: string
  created_at: string
  updated_at: string
}

interface PortingOrderListResponse {
  data: PortingOrder[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class PortingOrderList extends BaseCommand {
  static override description = 'List porting orders'

  static override examples = [
    '<%= config.bin %> porting order list',
    '<%= config.bin %> porting order list --status in-process',
    '<%= config.bin %> porting order list --limit 50',
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
      options: ['draft', 'in-process', 'submitted', 'exception', 'foc-date-confirmed', 'cancel-pending', 'ported', 'cancelled'],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(PortingOrderList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.status) {
      params.set('filter[status]', flags.status)
    }

    this.info('Fetching porting orders...')

    const response = await v2.get<PortingOrderListResponse>(`/porting_orders?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const orders = response.data || []

    if (orders.length === 0) {
      this.log('No porting orders found')
      return
    }

    const tableData = orders.map(o => ({
      id: o.id.substring(0, 12) + '...',
      status: o.status,
      numbers: o.phone_numbers_count,
      foc: o.foc_datetime ? new Date(o.foc_datetime).toLocaleDateString() : '-',
      created: new Date(o.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      status: { header: 'STATUS' },
      numbers: { header: 'NUMBERS' },
      foc: { header: 'FOC DATE' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
