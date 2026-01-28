import { input } from '@inquirer/prompts'
import { BaseCommand } from '../../lib/base-command.js'
import { setApiKey, getConfigPath } from '../../lib/config.js'
import { v2 } from '../../lib/api.js'

export default class AuthSetup extends BaseCommand {
  static override description = 'Configure API key for authentication'

  static override examples = [
    '<%= config.bin %> auth setup',
    '<%= config.bin %> auth setup --profile production',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(AuthSetup)
    const profile = flags.profile || 'default'

    const apiKey = await input({
      message: 'Enter your Telnyx API key (from portal.telnyx.com):',
    })

    if (!apiKey) {
      this.error('API key cannot be empty')
    }

    // Validate the key
    this.info('Validating API key...')
    
    try {
      // Temporarily set the key to validate it
      process.env.TELNYX_API_KEY = apiKey
      await v2.get('/balance')
      delete process.env.TELNYX_API_KEY
    } catch (error) {
      delete process.env.TELNYX_API_KEY
      this.error(`Invalid API key: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Save the key
    setApiKey(apiKey, profile)
    
    this.success(`API key saved to ${getConfigPath()} (profile: ${profile})`)
  }
}
