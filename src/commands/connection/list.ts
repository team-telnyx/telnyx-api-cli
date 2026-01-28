import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface Connection {
  id: string
  record_type: string
  active: boolean
  connection_name: string
  webhook_url?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

interface ConnectionListResponse {
  data: Connection[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class ConnectionList extends BaseCommand {
  static override description = 'List voice connections (Credential, FQDN, IP)'

  static override examples = [
    '<%= config.bin %> connection list',
    '<%= config.bin %> connection list --type credential',
    '<%= config.bin %> connection list --limit 50',
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
    type: Flags.string({
      char: 't',
      description: 'Filter by connection type',
      options: ['credential', 'fqdn', 'ip'],
    }),
    tag: Flags.string({
      description: 'Filter by tag',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConnectionList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    if (flags.tag) {
      params.set('filter[tag]', flags.tag)
    }

    // Map type to endpoint
    let endpoint = '/connections'
    if (flags.type === 'credential') {
      endpoint = '/credential_connections'
    } else if (flags.type === 'fqdn') {
      endpoint = '/fqdn_connections'
    } else if (flags.type === 'ip') {
      endpoint = '/ip_connections'
    }

    this.info(`Fetching ${flags.type || 'all'} connections...`)

    const response = await v2.get<ConnectionListResponse>(`${endpoint}?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const connections = response.data || []

    if (connections.length === 0) {
      this.log('No connections found')
      return
    }

    const tableData = connections.map(c => ({
      id: c.id.substring(0, 16) + '...',
      name: c.connection_name || '-',
      type: c.record_type.replace('_connection', ''),
      active: c.active ? '✓' : '✗',
      webhook: c.webhook_url ? '✓' : '-',
      tags: c.tags?.join(', ') || '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      type: { header: 'TYPE' },
      active: { header: 'ACTIVE' },
      webhook: { header: 'WEBHOOK' },
      tags: { header: 'TAGS' },
    })

    if (response.meta) {
      this.log('')
      this.log(`Page ${response.meta.page_number} of ${response.meta.total_pages} (${response.meta.total_results} total)`)
    }
  }
}
