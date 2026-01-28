import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone, validateId } from '../../lib/api.js'

interface VerifyCheckResponse {
  data: {
    phone_number: string
    response_code: string
  }
}

export default class VerifyCheck extends BaseCommand {
  static override description = 'Verify a code sent to a phone number'

  static override examples = [
    '<%= config.bin %> verify check --phone +15551234567 --code 123456 --profile-id abc123',
    '<%= config.bin %> verify check -n +15551234567 -c 123456 --profile-id abc123',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    phone: Flags.string({
      char: 'n',
      description: 'Phone number that received the code (E.164 format)',
      required: true,
    }),
    code: Flags.string({
      char: 'c',
      description: 'Verification code to check',
      required: true,
    }),
    'profile-id': Flags.string({
      description: 'Verify profile ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyCheck)

    validatePhone(flags.phone)
    validateId(flags['profile-id'], 'Profile ID')

    const payload = {
      code: flags.code,
      verify_profile_id: flags['profile-id'],
    }

    // Phone number needs to be URL-encoded
    const encodedPhone = encodeURIComponent(flags.phone)

    this.info(`Verifying code for ${flags.phone}...`)

    const response = await v2.post<VerifyCheckResponse>(
      `/verifications/by_phone_number/${encodedPhone}/actions/verify`,
      payload,
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const result = response.data

    if (result.response_code === 'accepted') {
      this.success('Verification successful!')
      this.log('')
      this.log(`  Phone:  ${result.phone_number}`)
      this.log(`  Status: ${result.response_code}`)
    } else {
      this.warning(`Verification failed: ${result.response_code}`)
      this.log('')
      this.log(`  Phone:  ${result.phone_number}`)
      this.log(`  Status: ${result.response_code}`)
    }
  }
}
