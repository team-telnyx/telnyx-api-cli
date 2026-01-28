import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface EmergencyAddress {
  id: string
  street_address: string
  extended_address?: string
  locality: string
  administrative_area: string
  postal_code: string
  country_code: string
  status: string
  created_at: string
  updated_at: string
}

interface AddressListResponse {
  data: EmergencyAddress[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class E911AddressList extends BaseCommand {
  static override description = 'List E911 emergency addresses'

  static override examples = [
    '<%= config.bin %> e911 address list',
    '<%= config.bin %> e911 address list --limit 50',
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
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(E911AddressList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching emergency addresses...')

    const response = await v2.get<AddressListResponse>(`/addresses?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const addresses = response.data || []

    if (addresses.length === 0) {
      this.log('No emergency addresses found')
      return
    }

    const tableData = addresses.map(a => ({
      id: a.id.substring(0, 12) + '...',
      address: `${a.street_address}, ${a.locality}`,
      state: a.administrative_area,
      zip: a.postal_code,
      status: a.status,
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      address: { header: 'ADDRESS' },
      state: { header: 'STATE' },
      zip: { header: 'ZIP' },
      status: { header: 'STATUS' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
