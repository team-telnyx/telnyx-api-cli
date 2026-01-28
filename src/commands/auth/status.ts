import { BaseCommand } from '../../lib/base-command.js'
import { getApiKey, listProfiles, getDefaultProfile, getConfigPath } from '../../lib/config.js'
import { v2 } from '../../lib/api.js'

interface BalanceResponse {
  data: {
    balance: string
    currency: string
  }
}

export default class AuthStatus extends BaseCommand {
  static override description = 'Show current authentication status'

  static override examples = [
    '<%= config.bin %> auth status',
    '<%= config.bin %> auth status --profile production',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus)

    const apiKey = getApiKey(flags.profile)
    const profiles = listProfiles()
    const defaultProfile = getDefaultProfile()

    if (flags.json) {
      const result: Record<string, unknown> = {
        configured: !!apiKey,
        configPath: getConfigPath(),
        profiles,
        defaultProfile,
        usingEnvVar: !!process.env.TELNYX_API_KEY,
      }

      if (apiKey) {
        try {
          const response = await v2.get<BalanceResponse>('/balance', { profile: flags.profile })
          result.balance = response.data.balance
          result.currency = response.data.currency
        } catch {
          result.balance = 'unknown'
        }
      }

      this.outputJson(result)
      return
    }

    if (!apiKey) {
      this.warning('No API key configured')
      this.log('Run "telnyx auth setup" to configure')
      return
    }

    this.success('API key configured')
    
    if (process.env.TELNYX_API_KEY) {
      this.info('Using TELNYX_API_KEY environment variable')
    } else {
      this.info(`Config: ${getConfigPath()}`)
      this.info(`Profile: ${flags.profile || defaultProfile}`)
    }

    if (profiles.length > 1) {
      this.info(`Available profiles: ${profiles.join(', ')}`)
    }

    // Show account info
    try {
      const response = await v2.get<BalanceResponse>('/balance', { profile: flags.profile })
      this.info(`Account balance: $${response.data.balance} ${response.data.currency}`)
    } catch (error) {
      this.warning(`Could not fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
