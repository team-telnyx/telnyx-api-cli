import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone, validateId } from '../../lib/api.js'

interface PhoneNumberResponse {
  data: {
    id: string
    phone_number: string
    emergency_enabled: boolean
    emergency_address_id?: string
  }
}

export default class E911Assign extends BaseCommand {
  static override description = 'Assign an E911 address to a phone number'

  static override examples = [
    '<%= config.bin %> e911 assign --number +15551234567 --address-id abc123',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    number: Flags.string({
      char: 'n',
      description: 'Phone number (E.164 format)',
      required: true,
    }),
    'address-id': Flags.string({
      char: 'a',
      description: 'Emergency address ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(E911Assign)

    validatePhone(flags.number)
    validateId(flags['address-id'], 'Address ID')

    const encoded = encodeURIComponent(flags.number)

    const payload = {
      emergency_enabled: true,
      emergency_address_id: flags['address-id'],
    }

    this.info(`Assigning E911 address to ${flags.number}...`)

    const response = await v2.put<PhoneNumberResponse>(
      `/phone_numbers/${encoded}`,
      payload,
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const pn = response.data
    this.success('E911 enabled!')
    this.log('')
    this.log(`  Number:     ${pn.phone_number}`)
    this.log(`  E911:       ${pn.emergency_enabled ? 'Enabled' : 'Disabled'}`)
    this.log(`  Address ID: ${pn.emergency_address_id}`)
  }
}
