import { Args } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

interface VerifyProfileResponse {
  data: {
    id: string
    name: string
    language: string
    created_at: string
    updated_at: string
    record_type: string
    sms?: {
      messaging_template_id: string
      whitelisted_destinations: string[]
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
}

export default class VerifyProfileGet extends BaseCommand {
  static override description = 'Get details of a verify profile'

  static override examples = [
    '<%= config.bin %> verify profile get 4900017a-e7c8-e79e-0a7c-0d98f49b09cc',
    '<%= config.bin %> verify profile get 4900017a-e7c8-e79e-0a7c-0d98f49b09cc --json',
  ]

  static override args = {
    id: Args.string({
      description: 'Verify profile ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(VerifyProfileGet)

    validateId(args.id, 'Profile ID')

    this.info(`Fetching verify profile ${args.id}...`)

    const response = await v2.get<VerifyProfileResponse>(`/verify_profiles/${args.id}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const p = response.data

    this.log('')
    this.log(`Verify Profile Details`)
    this.log(`${'─'.repeat(50)}`)
    this.log(`  ID:         ${p.id}`)
    this.log(`  Name:       ${p.name}`)
    this.log(`  Language:   ${p.language}`)
    this.log(`  Created:    ${new Date(p.created_at).toLocaleString()}`)
    this.log(`  Updated:    ${new Date(p.updated_at).toLocaleString()}`)

    if (p.sms) {
      this.log('')
      this.log(`  SMS Configuration:`)
      this.log(`    Template ID:   ${p.sms.messaging_template_id}`)
      this.log(`    Code Length:   ${p.sms.code_length}`)
      this.log(`    Timeout:       ${p.sms.default_timeout_secs}s`)
      if (p.sms.whitelisted_destinations?.length > 0) {
        this.log(`    Destinations:  ${p.sms.whitelisted_destinations.join(', ')}`)
      }
    }

    if (p.call) {
      this.log('')
      this.log(`  Call Configuration:`)
      this.log(`    Timeout:       ${p.call.default_timeout_secs}s`)
    }

    if (p.flashcall) {
      this.log('')
      this.log(`  Flashcall Configuration:`)
      this.log(`    Timeout:       ${p.flashcall.default_timeout_secs}s`)
    }
  }
}
