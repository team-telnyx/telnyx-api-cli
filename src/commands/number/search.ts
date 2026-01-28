import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface AvailableNumber {
  phone_number: string
  region_information: Array<{
    region_type: string
    region_name: string
  }>
  cost_information: {
    upfront_cost: string
    monthly_cost: string
    currency: string
  }
  features: Array<{
    name: string
  }>
  record_type: string
}

interface SearchResponse {
  data: AvailableNumber[]
  meta?: {
    total_results: number
  }
}

export default class NumberSearch extends BaseCommand {
  static override description = 'Search for available phone numbers'

  static override examples = [
    '<%= config.bin %> number search --country US',
    '<%= config.bin %> number search --country US --contains 555',
    '<%= config.bin %> number search --country US --locality "New York" --limit 10',
    '<%= config.bin %> number search --country CA --type toll_free',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    country: Flags.string({
      char: 'c',
      description: 'ISO country code (e.g., US, CA, GB)',
      required: true,
    }),
    type: Flags.string({
      char: 't',
      description: 'Number type',
      options: ['local', 'toll_free', 'national', 'mobile'],
    }),
    locality: Flags.string({
      description: 'City or locality name',
    }),
    'area-code': Flags.string({
      description: 'Area code / NPA',
    }),
    contains: Flags.string({
      description: 'Pattern to match in number',
    }),
    'starts-with': Flags.string({
      description: 'Digits the number should start with',
    }),
    'ends-with': Flags.string({
      description: 'Digits the number should end with',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Number of results to return',
      default: 10,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(NumberSearch)

    const params = new URLSearchParams()
    params.set('filter[country_code]', flags.country.toUpperCase())
    params.set('filter[limit]', String(flags.limit))

    if (flags.type) {
      params.set('filter[phone_number_type]', flags.type)
    }
    if (flags.locality) {
      params.set('filter[locality]', flags.locality)
    }
    if (flags['area-code']) {
      params.set('filter[national_destination_code]', flags['area-code'])
    }
    if (flags.contains) {
      params.set('filter[phone_number][contains]', flags.contains)
    }
    if (flags['starts-with']) {
      params.set('filter[phone_number][starts_with]', flags['starts-with'])
    }
    if (flags['ends-with']) {
      params.set('filter[phone_number][ends_with]', flags['ends-with'])
    }

    this.info(`Searching for numbers in ${flags.country.toUpperCase()}...`)

    const response = await v2.get<SearchResponse>(`/available_phone_numbers?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const numbers = response.data || []

    if (numbers.length === 0) {
      this.log('No numbers found matching your criteria')
      return
    }

    const tableData = numbers.map(n => ({
      number: n.phone_number,
      region: n.region_information?.[0]?.region_name || '-',
      monthly: `${n.cost_information.monthly_cost} ${n.cost_information.currency}`,
      upfront: `${n.cost_information.upfront_cost} ${n.cost_information.currency}`,
      features: n.features?.map(f => f.name).join(', ') || '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      number: { header: 'NUMBER' },
      region: { header: 'REGION' },
      monthly: { header: 'MONTHLY' },
      upfront: { header: 'UPFRONT' },
      features: { header: 'FEATURES' },
    })

    this.log('')
    this.log(`${numbers.length} number(s) found`)
    this.log('Use "telnyx number order <number>" to purchase')
  }
}
