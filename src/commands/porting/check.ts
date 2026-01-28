import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

interface PortabilityResult {
  phone_number: string
  portable: boolean
  fast_portable?: boolean
  messaging_capable?: boolean
  not_portable_reason?: string
  spid?: string
  spid_carrier_name?: string
}

interface PortabilityResponse {
  data: PortabilityResult[]
}

export default class PortingCheck extends BaseCommand {
  static override description = 'Check if phone numbers can be ported to Telnyx'

  static override examples = [
    '<%= config.bin %> porting check +15551234567',
    '<%= config.bin %> porting check +15551234567 +15559876543',
  ]

  static override strict = false

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { argv, flags } = await this.parse(PortingCheck)

    const numbers = argv as string[]

    if (numbers.length === 0) {
      throw new Error('At least one phone number is required')
    }

    for (const num of numbers) {
      validatePhone(num)
    }

    const payload = {
      phone_numbers: numbers,
    }

    this.info(`Checking portability for ${numbers.length} number(s)...`)

    const response = await v2.post<PortabilityResponse>('/portability_checks', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const results = response.data || []

    this.log('')
    for (const r of results) {
      const status = r.portable ? '✓ Portable' : '✗ Not Portable'
      this.log(`${r.phone_number}: ${status}`)
      
      if (r.portable) {
        if (r.fast_portable) this.log('    FastPort eligible')
        if (r.messaging_capable) this.log('    Messaging capable')
        if (r.spid_carrier_name) this.log(`    Current carrier: ${r.spid_carrier_name}`)
      } else if (r.not_portable_reason) {
        this.log(`    Reason: ${r.not_portable_reason}`)
      }
    }

    const portableCount = results.filter(r => r.portable).length
    this.log('')
    this.log(`${portableCount}/${results.length} number(s) portable`)
  }
}
