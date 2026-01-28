import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface AddressResponse {
  data: {
    id: string
    street_address: string
    locality: string
    administrative_area: string
    postal_code: string
    country_code: string
    status: string
    created_at: string
  }
}

export default class E911AddressCreate extends BaseCommand {
  static override description = 'Create an E911 emergency address'

  static override examples = [
    '<%= config.bin %> e911 address create --street "123 Main St" --city "New York" --state NY --zip 10001',
    '<%= config.bin %> e911 address create --street "456 Oak Ave" --unit "Suite 100" --city "Chicago" --state IL --zip 60601',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    street: Flags.string({
      description: 'Street address',
      required: true,
    }),
    unit: Flags.string({
      description: 'Unit/apartment number',
    }),
    city: Flags.string({
      description: 'City',
      required: true,
    }),
    state: Flags.string({
      description: 'State/province code',
      required: true,
    }),
    zip: Flags.string({
      description: 'ZIP/postal code',
      required: true,
    }),
    country: Flags.string({
      description: 'Country code',
      default: 'US',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(E911AddressCreate)

    const payload: Record<string, unknown> = {
      street_address: flags.street,
      locality: flags.city,
      administrative_area: flags.state,
      postal_code: flags.zip,
      country_code: flags.country,
    }

    if (flags.unit) {
      payload.extended_address = flags.unit
    }

    this.info('Creating emergency address...')

    const response = await v2.post<AddressResponse>('/addresses', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const a = response.data
    this.success('Emergency address created!')
    this.log('')
    this.log(`  ID:      ${a.id}`)
    this.log(`  Address: ${a.street_address}`)
    this.log(`           ${a.locality}, ${a.administrative_area} ${a.postal_code}`)
    this.log(`  Status:  ${a.status}`)
    this.log('')
    this.log('Use this ID when enabling E911 on phone numbers.')
  }
}
