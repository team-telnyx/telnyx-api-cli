import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface VerifyProfile {
  id: string
  name: string
  language: string
  created_at: string
  updated_at: string
  sms?: {
    messaging_template_id: string
    default_timeout_secs: number
    code_length: number
  }
  call?: {
    default_timeout_secs: number
  }
  flashcall?: {
    default_timeout_secs: number
  }
}

interface ProfileListResponse {
  data: VerifyProfile[]
  meta?: {
    page_number: number
    page_size: number
    total_pages: number
    total_results: number
  }
}

export default class VerifyProfileList extends BaseCommand {
  static override description = 'List all verify profiles'

  static override examples = [
    '<%= config.bin %> verify profile list',
    '<%= config.bin %> verify profile list --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Number of profiles to return',
      default: 25,
    }),
    page: Flags.integer({
      description: 'Page number',
      default: 1,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyProfileList)

    const params = new URLSearchParams()
    params.set('page[size]', String(flags.limit))
    params.set('page[number]', String(flags.page))

    this.info('Fetching verify profiles...')

    const response = await v2.get<ProfileListResponse>(`/verify_profiles?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const profiles = response.data || []

    if (profiles.length === 0) {
      this.log('No verify profiles found')
      return
    }

    const tableData = profiles.map(p => ({
      id: p.id.substring(0, 12) + '...',
      name: p.name,
      language: p.language,
      sms: p.sms ? '✓' : '-',
      call: p.call ? '✓' : '-',
      flashcall: p.flashcall ? '✓' : '-',
      created: new Date(p.created_at).toLocaleDateString(),
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      id: { header: 'ID' },
      name: { header: 'NAME' },
      language: { header: 'LANG' },
      sms: { header: 'SMS' },
      call: { header: 'CALL' },
      flashcall: { header: 'FLASH' },
      created: { header: 'CREATED' },
    })
  }
}
