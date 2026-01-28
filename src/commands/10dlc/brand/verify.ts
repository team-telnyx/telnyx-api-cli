import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { tenDlc, validateId } from '../../../lib/api.js'

interface VerifyResponse {
  brandId: string
  identityStatus: string
}

export default class BrandVerify extends BaseCommand {
  static override description = 'Submit OTP verification for a 10DLC brand'

  static override examples = [
    '<%= config.bin %> 10dlc brand verify BRAND_ID --pin 123456',
  ]

  static override args = {
    brandId: Args.string({
      description: 'Brand ID to verify',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    pin: Flags.string({
      description: 'OTP PIN received via phone/email',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BrandVerify)

    validateId(args.brandId, 'brand ID')

    this.info(`Submitting verification for brand ${args.brandId}...`)

    const response = await tenDlc.post<VerifyResponse>(
      `/brand/${args.brandId}/verify`,
      { otp: flags.pin },
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    if (response.identityStatus === 'VERIFIED') {
      this.success('Brand verified successfully!')
    } else {
      this.warning(`Verification submitted. Current status: ${response.identityStatus}`)
    }
  }
}
