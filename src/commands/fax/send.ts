import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

interface FaxResponse {
  data: {
    id: string
    connection_id: string
    direction: string
    from: string
    to: string
    status: string
    media_url?: string
    page_count?: number
    created_at: string
    updated_at: string
  }
}

export default class FaxSend extends BaseCommand {
  static override description = 'Send a fax'

  static override examples = [
    '<%= config.bin %> fax send --from +15551234567 --to +15559876543 --media-url https://example.com/doc.pdf --connection-id abc123',
    '<%= config.bin %> fax send -f +15551234567 -t +15559876543 --media-url https://example.com/doc.pdf --connection-id abc123 --quality high',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({
      char: 'f',
      description: 'Sender fax number (E.164 format)',
      required: true,
    }),
    to: Flags.string({
      char: 't',
      description: 'Recipient fax number (E.164 format)',
      required: true,
    }),
    'media-url': Flags.string({
      char: 'm',
      description: 'URL of document to fax (PDF, TIFF, etc.)',
      required: true,
    }),
    'connection-id': Flags.string({
      description: 'Fax application/connection ID',
      required: true,
    }),
    quality: Flags.string({
      char: 'q',
      description: 'Fax quality',
      options: ['normal', 'high', 'very_high'],
      default: 'high',
    }),
    'monochrome': Flags.boolean({
      description: 'Send in monochrome',
      default: true,
    }),
    't38-enabled': Flags.boolean({
      description: 'Enable T.38 fax protocol',
      default: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(FaxSend)

    validatePhone(flags.from)
    validatePhone(flags.to)

    const payload = {
      from: flags.from,
      to: flags.to,
      media_url: flags['media-url'],
      connection_id: flags['connection-id'],
      quality: flags.quality,
      monochrome: flags.monochrome,
      t38_enabled: flags['t38-enabled'],
    }

    this.info(`Sending fax to ${flags.to}...`)

    const response = await v2.post<FaxResponse>('/faxes', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const fax = response.data
    this.success('Fax queued!')
    this.log('')
    this.log(`  ID:      ${fax.id}`)
    this.log(`  From:    ${fax.from}`)
    this.log(`  To:      ${fax.to}`)
    this.log(`  Status:  ${fax.status}`)
    this.log('')
    this.log(`Use "telnyx fax get ${fax.id}" to check status`)
  }
}
