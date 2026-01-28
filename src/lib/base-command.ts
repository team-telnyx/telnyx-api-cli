import { Command, Flags } from '@oclif/core'

export abstract class BaseCommand extends Command {
  static baseFlags = {
    profile: Flags.string({
      char: 'p',
      description: 'Config profile to use',
      env: 'TELNYX_PROFILE',
    }),
    json: Flags.boolean({
      description: 'Output raw JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output including API requests',
      default: false,
    }),
  }

  // Flags for commands that modify/delete resources
  static destructiveFlags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
    'dry-run': Flags.boolean({
      description: 'Show what would happen without making changes',
      default: false,
    }),
  }

  protected isVerbose = false
  protected isDryRun = false

  protected outputJson(data: unknown): void {
    this.log(JSON.stringify(data, null, 2))
  }

  protected outputTable(data: Record<string, unknown>[], columns: Record<string, { header: string }>): void {
    if (data.length === 0) {
      this.log('No results found')
      return
    }

    // Simple table output
    const headers = Object.entries(columns).map(([, v]) => v.header)
    const keys = Object.keys(columns)
    
    // Calculate column widths
    const widths = keys.map((key, i) => {
      const headerLen = headers[i].length
      const maxDataLen = Math.max(...data.map(row => String(row[key] || '').length))
      return Math.max(headerLen, maxDataLen)
    })

    // Print header
    const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join('  ')
    this.log(headerRow)
    
    // Print data rows
    for (const row of data) {
      const dataRow = keys.map((key, i) => String(row[key] || '').padEnd(widths[i])).join('  ')
      this.log(dataRow)
    }
  }

  protected success(message: string): void {
    this.log(`✓ ${message}`)
  }

  protected info(message: string): void {
    this.log(`ℹ ${message}`)
  }

  protected warning(message: string): void {
    this.log(`⚠ ${message}`)
  }

  protected debugLog(message: string): void {
    if (this.isVerbose) {
      this.log(`  → ${message}`)
    }
  }

  protected dryRunLog(message: string): void {
    this.log(`[DRY RUN] ${message}`)
  }

  protected async confirmOrForce(message: string, force: boolean): Promise<boolean> {
    if (force) return true
    
    const { confirm } = await import('@inquirer/prompts')
    return confirm({ message, default: false })
  }
}
