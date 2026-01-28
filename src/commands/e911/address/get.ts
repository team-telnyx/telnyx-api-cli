import { Args } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

interface AddressResponse {
  data: {
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
}

export default class E911AddressGet extends BaseCommand {
  static override description = 'Get E911 emergency address details'

  static override examples = [
    '<%= config.bin %> e911 address get 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
  ]

  static override args = {
    id: Args.string({
      description: 'Address ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(E911AddressGet)

    validateId(args.id, 'Address ID')

    this.info(`Fetching emergency address ${args.id}...`)

    const response = await v2.get<AddressResponse>(`/addresses/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const a = response.data

    this.log('')
    this.log('Emergency Address Details')
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:       ${a.id}`)
    this.log(`  Status:   ${a.status}`)
    this.log('')
    this.log(`  Street:   ${a.street_address}`)
    if (a.extended_address) {
      this.log(`  Unit:     ${a.extended_address}`)
    }
    this.log(`  City:     ${a.locality}`)
    this.log(`  State:    ${a.administrative_area}`)
    this.log(`  ZIP:      ${a.postal_code}`)
    this.log(`  Country:  ${a.country_code}`)
    this.log('')
    this.log(`  Created:  ${new Date(a.created_at).toLocaleString()}`)
    this.log(`  Updated:  ${new Date(a.updated_at).toLocaleString()}`)
  }
}
