import { BaseCommand } from '../../lib/base-command.js'
import { v2, setVerboseLogger } from '../../lib/api.js'
import { getDefaultProfile, listProfiles, getConfigPath } from '../../lib/config.js'

interface BalanceResponse {
  data: {
    balance: string
    credit_limit: string
    currency: string
    available_credit: string
  }
}

interface UserResponse {
  data: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    organization_id?: string
  }
}

export default class AuthWhoami extends BaseCommand {
  static override description = 'Display current authentication info and account details'

  static override examples = [
    '<%= config.bin %> auth whoami',
    '<%= config.bin %> auth whoami --json',
    '<%= config.bin %> auth whoami --profile production',
  ]

  static override aliases = ['whoami']

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(AuthWhoami)

    if (flags.verbose) {
      this.isVerbose = true
      setVerboseLogger((msg) => this.debugLog(msg))
    }

    const currentProfile = flags.profile || getDefaultProfile()
    const profiles = listProfiles()

    // Try to get account info
    let balance: BalanceResponse['data'] | null = null
    let user: UserResponse['data'] | null = null

    try {
      const balanceResponse = await v2.get<BalanceResponse>('/balance', { 
        profile: flags.profile,
        verbose: flags.verbose 
      })
      balance = balanceResponse.data
    } catch {
      // Balance fetch failed, continue anyway
    }

    if (flags.json) {
      this.outputJson({
        profile: currentProfile,
        configPath: getConfigPath(),
        availableProfiles: profiles,
        account: balance ? {
          balance: balance.balance,
          currency: balance.currency,
          creditLimit: balance.credit_limit,
          availableCredit: balance.available_credit,
        } : null,
      })
      return
    }

    this.log('')
    this.log('Authentication Status')
    this.log('─'.repeat(50))
    this.log(`  Profile:        ${currentProfile}${currentProfile === getDefaultProfile() ? ' (default)' : ''}`)
    this.log(`  Config file:    ${getConfigPath()}`)
    
    if (profiles.length > 1) {
      this.log(`  All profiles:   ${profiles.join(', ')}`)
    }

    if (balance) {
      this.log('')
      this.log('Account')
      this.log('─'.repeat(50))
      this.log(`  Balance:        ${balance.balance} ${balance.currency}`)
      this.log(`  Credit limit:   ${balance.credit_limit} ${balance.currency}`)
      this.log(`  Available:      ${balance.available_credit} ${balance.currency}`)
      this.log('')
      this.success('Authenticated and connected to Telnyx API')
    } else {
      this.log('')
      this.warning('Could not fetch account details. Check your API key.')
    }
  }
}
