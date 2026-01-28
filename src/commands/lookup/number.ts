import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

interface LookupResponse {
  data: {
    phone_number: string
    country_code: string
    national_format: string
    carrier?: {
      name: string
      type: string
      mobile_country_code?: string
      mobile_network_code?: string
    }
    caller_name?: {
      caller_name: string
      error_code?: string
    }
    portability?: {
      status: string
      ported_status?: string
      ported_date?: string
      ocn?: string
      spid?: string
      line_type?: string
    }
    record_type: string
  }
}

export default class LookupNumber extends BaseCommand {
  static override description = 'Look up phone number information (carrier, caller ID, portability)'

  static override examples = [
    '<%= config.bin %> lookup number +15551234567',
    '<%= config.bin %> lookup number +15551234567 --type carrier',
    '<%= config.bin %> lookup number +15551234567 --type caller-name',
    '<%= config.bin %> lookup number +15551234567 --type carrier --type caller-name',
  ]

  static override args = {
    number: Args.string({
      description: 'Phone number to look up (E.164 format)',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'Lookup type(s)',
      options: ['carrier', 'caller-name', 'portability'],
      multiple: true,
      default: ['carrier'],
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(LookupNumber)

    validatePhone(args.number)

    const params = new URLSearchParams()
    for (const t of flags.type) {
      params.append('type[]', t)
    }

    const encoded = encodeURIComponent(args.number)

    this.info(`Looking up ${args.number}...`)

    const response = await v2.get<LookupResponse>(`/number_lookup/${encoded}?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const data = response.data

    this.log('')
    this.log('Number Lookup Results')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  Number:          ${data.phone_number}`)
    this.log(`  Country:         ${data.country_code}`)
    this.log(`  National Format: ${data.national_format}`)

    if (data.carrier) {
      this.log('')
      this.log('  Carrier:')
      this.log(`    Name:          ${data.carrier.name}`)
      this.log(`    Type:          ${data.carrier.type}`)
      if (data.carrier.mobile_country_code) {
        this.log(`    MCC:           ${data.carrier.mobile_country_code}`)
      }
      if (data.carrier.mobile_network_code) {
        this.log(`    MNC:           ${data.carrier.mobile_network_code}`)
      }
    }

    if (data.caller_name) {
      this.log('')
      this.log('  Caller Name (CNAM):')
      if (data.caller_name.error_code) {
        this.log(`    Error:         ${data.caller_name.error_code}`)
      } else {
        this.log(`    Name:          ${data.caller_name.caller_name}`)
      }
    }

    if (data.portability) {
      this.log('')
      this.log('  Portability:')
      this.log(`    Status:        ${data.portability.status}`)
      if (data.portability.ported_status) {
        this.log(`    Ported:        ${data.portability.ported_status}`)
      }
      if (data.portability.line_type) {
        this.log(`    Line Type:     ${data.portability.line_type}`)
      }
      if (data.portability.spid) {
        this.log(`    SPID:          ${data.portability.spid}`)
      }
    }
  }
}
