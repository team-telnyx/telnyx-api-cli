import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

interface ProductOption {
  product: string
  product_dimensions: string[]
  product_metrics: string[]
}

interface OptionsResponse {
  data: ProductOption[]
}

export default class UsageOptions extends BaseCommand {
  static override description = 'List available dimensions and metrics for usage reports'

  static override examples = [
    '<%= config.bin %> usage options',
    '<%= config.bin %> usage options --product messaging',
    '<%= config.bin %> usage options --product sip-trunking',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    product: Flags.string({
      char: 'p',
      description: 'Filter by product',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(UsageOptions)

    const params = new URLSearchParams()
    if (flags.product) {
      params.set('product', flags.product)
    }

    this.info('Fetching usage report options...')

    const response = await v2.get<OptionsResponse>(`/usage_reports/options?${params.toString()}`, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const products = response.data || []

    if (products.length === 0) {
      this.log('No products found')
      return
    }

    for (const p of products) {
      this.log('')
      this.log(`━━━ ${p.product} ━━━`)
      this.log('')
      this.log('  Metrics:')
      for (const metric of p.product_metrics) {
        this.log(`    - ${metric}`)
      }
      this.log('')
      this.log('  Dimensions:')
      for (const dim of p.product_dimensions) {
        this.log(`    - ${dim}`)
      }
    }

    this.log('')
  }
}
