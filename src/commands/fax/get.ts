import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateId } from '../../lib/api.js'

interface FaxResponse {
  data: {
    id: string
    connection_id: string
    direction: string
    from: string
    to: string
    status: string
    media_url?: string
    media_name?: string
    page_count?: number
    quality?: string
    store_media?: boolean
    webhook_url?: string
    webhook_failover_url?: string
    created_at: string
    updated_at: string
    completed_at?: string
  }
}

export default class FaxGet extends BaseCommand {
  static override description = 'Get fax details'

  static override examples = [
    '<%= config.bin %> fax get 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
    '<%= config.bin %> fax get 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Fax ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(FaxGet)

    validateId(args.id, 'Fax ID')

    this.info(`Fetching fax ${args.id}...`)

    const response = await v2.get<FaxResponse>(`/faxes/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const f = response.data

    this.log('')
    this.log('Fax Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:         ${f.id}`)
    this.log(`  Direction:  ${f.direction}`)
    this.log(`  Status:     ${f.status}`)
    this.log('')
    this.log(`  From:       ${f.from}`)
    this.log(`  To:         ${f.to}`)
    this.log('')
    if (f.page_count) {
      this.log(`  Pages:      ${f.page_count}`)
    }
    if (f.quality) {
      this.log(`  Quality:    ${f.quality}`)
    }
    if (f.media_url) {
      this.log(`  Media URL:  ${f.media_url}`)
    }
    this.log('')
    this.log(`  Created:    ${new Date(f.created_at).toLocaleString()}`)
    if (f.completed_at) {
      this.log(`  Completed:  ${new Date(f.completed_at).toLocaleString()}`)
    }
  }
}
