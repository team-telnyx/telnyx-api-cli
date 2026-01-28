import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface BalanceResponse {
  data: {
    record_type: string
    balance: string
    credit_limit: string
    available_credit: string
    currency: string
  }
}

export default class BillingBalance extends BaseCommand {
  static override description = 'Get current account balance'

  static override examples = [
    '<%= config.bin %> billing balance',
    '<%= config.bin %> billing balance --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(BillingBalance)

    this.info('Fetching account balance...')

    const response = await v2.get<BalanceResponse>('/balance', { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const b = response.data

    this.log('')
    this.log('Account Balance')
    this.log(`${'─'.repeat(30)}`)
    this.log(`  Balance:          ${b.balance} ${b.currency}`)
    this.log(`  Credit Limit:     ${b.credit_limit} ${b.currency}`)
    this.log(`  Available Credit: ${b.available_credit} ${b.currency}`)
  }
}
