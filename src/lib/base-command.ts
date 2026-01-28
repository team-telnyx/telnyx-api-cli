import { Command, Flags } from '@oclif/core'

export type OutputFormat = 'table' | 'json' | 'csv' | 'tsv' | 'ids'

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
    output: Flags.string({
      char: 'o',
      description: 'Output format',
      options: ['table', 'json', 'csv', 'tsv', 'ids'],
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output including API requests',
      default: false,
    }),
  }

  /** Get the output format from flags */
  protected getOutputFormat(flags: { json?: boolean; output?: string }): OutputFormat {
    if (flags.output) return flags.output as OutputFormat
    if (flags.json) return 'json'
    return 'table'
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

  protected outputTable(
    data: Record<string, unknown>[], 
    columns: Record<string, { header: string }>,
    options: { format?: OutputFormat; idField?: string } = {}
  ): void {
    const format = options.format || 'table'
    const keys = Object.keys(columns)
    const headers = Object.entries(columns).map(([, v]) => v.header)

    if (data.length === 0) {
      if (format === 'json') {
        this.log('[]')
      } else if (format !== 'ids') {
        this.log('No results found')
      }
      return
    }

    switch (format) {
      case 'json':
        this.log(JSON.stringify(data, null, 2))
        break

      case 'csv':
        this.log(headers.join(','))
        for (const row of data) {
          const values = keys.map(key => {
            const val = String(row[key] || '')
            // Escape quotes and wrap in quotes if contains comma
            return val.includes(',') || val.includes('"') 
              ? `"${val.replace(/"/g, '""')}"` 
              : val
          })
          this.log(values.join(','))
        }
        break

      case 'tsv':
        this.log(headers.join('\t'))
        for (const row of data) {
          const values = keys.map(key => String(row[key] || '').replace(/\t/g, ' '))
          this.log(values.join('\t'))
        }
        break

      case 'ids':
        const idField = options.idField || keys[0]
        for (const row of data) {
          this.log(String(row[idField] || ''))
        }
        break

      case 'table':
      default:
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
        break
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
