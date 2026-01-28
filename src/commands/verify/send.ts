import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone, validateId } from '../../lib/api.js'

interface VerificationResponse {
  data: {
    id: string
    phone_number: string
    verify_profile_id: string
    type: string
    status: string
    timeout_secs: number
    created_at: string
    updated_at: string
  }
}

export default class VerifySend extends BaseCommand {
  static override description = 'Send a verification code via SMS, call, or flashcall'

  static override examples = [
    '<%= config.bin %> verify send --phone +15551234567 --profile-id 4900017a-e7c8-e79e-0a7c-0d98f49b09cc',
    '<%= config.bin %> verify send --phone +15551234567 --profile-id abc123 --type call',
    '<%= config.bin %> verify send --phone +15551234567 --profile-id abc123 --type flashcall',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    phone: Flags.string({
      char: 'n',
      description: 'Phone number to verify (E.164 format)',
      required: true,
    }),
    'profile-id': Flags.string({
      description: 'Verify profile ID',
      required: true,
    }),
    type: Flags.string({
      char: 't',
      description: 'Verification method',
      options: ['sms', 'call', 'flashcall'],
      default: 'sms',
    }),
    'timeout-secs': Flags.integer({
      description: 'Override timeout in seconds',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifySend)

    validatePhone(flags.phone)
    validateId(flags['profile-id'], 'Profile ID')

    const payload: Record<string, unknown> = {
      phone_number: flags.phone,
      verify_profile_id: flags['profile-id'],
    }

    if (flags['timeout-secs']) {
      payload.timeout_secs = flags['timeout-secs']
    }

    this.info(`Sending ${flags.type} verification to ${flags.phone}...`)

    const response = await v2.post<VerificationResponse>(`/verifications/${flags.type}`, payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const v = response.data
    this.success('Verification sent!')
    this.log('')
    this.log(`  ID:           ${v.id}`)
    this.log(`  Phone:        ${v.phone_number}`)
    this.log(`  Type:         ${v.type}`)
    this.log(`  Status:       ${v.status}`)
    this.log(`  Expires in:   ${v.timeout_secs} seconds`)
    this.log('')
    this.log(`Use "telnyx verify check --phone ${v.phone_number} --code <CODE>" to verify`)
  }
}
