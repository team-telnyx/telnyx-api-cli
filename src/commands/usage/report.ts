import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface UsageRecord {
  [key: string]: string | number
}

interface UsageReportResponse {
  data: UsageRecord[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class UsageReport extends BaseCommand {
  static override description = 'Generate usage reports for billing and analytics'

  static override examples = [
    '<%= config.bin %> usage report --product messaging --start-date 2024-01-01 --end-date 2024-01-31',
    '<%= config.bin %> usage report --product sip-trunking --date-range last_1_weeks --metrics cost,attempted --dimensions direction',
    '<%= config.bin %> usage report --product call-control --date-range last_1_months --metrics cost --format csv',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    product: Flags.string({
      char: 'p',
      description: 'Product to report on',
      required: true,
      options: [
        'sip-trunking', 'messaging', 'call-control', 'wireless', 'cloud-storage',
        'inference', 'verify-2fa', 'fax-api', 'webrtc', 'programmable-video',
      ],
    }),
    'start-date': Flags.string({
      description: 'Start date (YYYY-MM-DD or ISO format)',
    }),
    'end-date': Flags.string({
      description: 'End date (YYYY-MM-DD or ISO format)',
    }),
    'date-range': Flags.string({
      description: 'Date range literal',
      options: ['last_1_days', 'last_1_weeks', 'last_1_months', 'last_3_months'],
    }),
    metrics: Flags.string({
      char: 'm',
      description: 'Metrics to include (comma-separated)',
      default: 'cost',
    }),
    dimensions: Flags.string({
      char: 'd',
      description: 'Dimensions to break out by (comma-separated)',
    }),
    filter: Flags.string({
      description: 'Filter (e.g., direction=outbound)',
      multiple: true,
    }),
    format: Flags.string({
      description: 'Output format',
      options: ['json', 'csv'],
      default: 'json',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Number of results to return',
      default: 50,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(UsageReport)

    // Validate date inputs
    if (!flags['date-range'] && (!flags['start-date'] || !flags['end-date'])) {
      throw new Error('Either --date-range or both --start-date and --end-date are required')
    }

    const params = new URLSearchParams()
    params.set('product', flags.product)
    params.set('metrics', flags.metrics)
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', '1')

    if (flags['date-range']) {
      params.set('date_range', flags['date-range'])
    } else {
      // Convert simple date to ISO format if needed
      const startDateInput = flags['start-date'] as string
      const endDateInput = flags['end-date'] as string
      const startDate = startDateInput.includes('T') ? startDateInput : `${startDateInput}T00:00:00-00:00`
      const endDate = endDateInput.includes('T') ? endDateInput : `${endDateInput}T23:59:59-00:00`
      params.set('start_date', startDate)
      params.set('end_date', endDate)
    }

    if (flags.dimensions) {
      params.set('dimensions', flags.dimensions)
    }

    if (flags.filter) {
      for (const f of flags.filter) {
        const [key, value] = f.split('=')
        params.set(`filter[${key}]`, value)
      }
    }

    if (flags.format === 'csv') {
      params.set('format', 'csv')
    }

    this.info(`Generating ${flags.product} usage report...`)

    const response = await v2.get<UsageReportResponse>(`/usage_reports?${params.toString()}`, { profile: flags.profile })

    if (flags.json || flags.format === 'csv') {
      this.outputJson(response)
      return
    }

    const records = response.data || []

    if (records.length === 0) {
      this.log('No usage data found for the specified criteria')
      return
    }

    // Dynamic table based on returned fields
    const columns: Record<string, { header: string }> = {}
    const firstRecord = records[0]
    for (const key of Object.keys(firstRecord)) {
      if (key !== 'product') {
        columns[key] = { header: key.toUpperCase() }
      }
    }

    this.outputTable(records as unknown as Record<string, unknown>[], columns)

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
