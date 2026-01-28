import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface BillingGroup {
  id: string
  name: string
  organization_id: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

interface BillingGroupListResponse {
  data: BillingGroup[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class BillingGroupList extends BaseCommand {
  static override description = 'List billing groups'

  static override examples = [
    '<%= config.bin %> billing group list',
    '<%= config.bin %> billing group list --limit 50',
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
    const { flags } = await this.parse(BillingGroupList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching billing groups...')

    const response = await v2.get<BillingGroupListResponse>(`/billing_groups?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const groups = response.data || []

    if (groups.length === 0) {
      this.log('No billing groups found')
      return
    }

    const tableData = groups.map(g => ({
      id: g.id.substring(0, 12) + '...',
      name: g.name,
      created: new Date(g.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      created: { header: 'CREATED' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
