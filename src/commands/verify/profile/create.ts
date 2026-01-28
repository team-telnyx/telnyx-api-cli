import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface VerifyProfileResponse {
  data: {
    id: string
    name: string
    language: string
    created_at: string
    updated_at: string
    sms?: {
      messaging_template_id: string
      whitelisted_destinations: string[]
      default_timeout_secs: number
      code_length: number
    }
    call?: {
      default_timeout_secs: number
    }
    flashcall?: {
      default_timeout_secs: number
    }
  }
}

export default class VerifyProfileCreate extends BaseCommand {
  static override description = 'Create a new verify profile'

  static override examples = [
    '<%= config.bin %> verify profile create --name "my-app-verify" --language en-US',
    '<%= config.bin %> verify profile create --name "my-app" --language en-US --sms-template-id abc123 --sms-code-length 6',
    '<%= config.bin %> verify profile create --name "my-app" --language en-US --enable-call --call-timeout 600',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'Profile name',
      required: true,
    }),
    language: Flags.string({
      char: 'l',
      description: 'Language code (e.g., en-US)',
      default: 'en-US',
    }),
    'sms-template-id': Flags.string({
      description: 'SMS message template ID',
    }),
    'sms-code-length': Flags.integer({
      description: 'SMS verification code length',
      default: 6,
    }),
    'sms-timeout': Flags.integer({
      description: 'SMS verification timeout in seconds',
      default: 300,
    }),
    'sms-destinations': Flags.string({
      description: 'Comma-separated list of allowed country codes (e.g., US,CA)',
    }),
    'enable-call': Flags.boolean({
      description: 'Enable call verification',
      default: false,
    }),
    'call-timeout': Flags.integer({
      description: 'Call verification timeout in seconds',
      default: 600,
    }),
    'enable-flashcall': Flags.boolean({
      description: 'Enable flashcall verification',
      default: false,
    }),
    'flashcall-timeout': Flags.integer({
      description: 'Flashcall verification timeout in seconds',
      default: 300,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyProfileCreate)

    const payload: Record<string, unknown> = {
      name: flags.name,
      language: flags.language,
    }

    // SMS configuration
    if (flags['sms-template-id']) {
      payload.sms = {
        messaging_template_id: flags['sms-template-id'],
        code_length: flags['sms-code-length'],
        default_timeout_secs: flags['sms-timeout'],
      }

      if (flags['sms-destinations']) {
        (payload.sms as Record<string, unknown>).whitelisted_destinations = flags['sms-destinations'].split(',').map(s => s.trim())
      }
    }

    // Call configuration
    if (flags['enable-call']) {
      payload.call = {
        default_timeout_secs: flags['call-timeout'],
      }
    }

    // Flashcall configuration
    if (flags['enable-flashcall']) {
      payload.flashcall = {
        default_timeout_secs: flags['flashcall-timeout'],
      }
    }

    this.info('Creating verify profile...')

    const response = await v2.post<VerifyProfileResponse>('/verify_profiles', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const p = response.data
    this.success(`Verify profile created!`)
    this.log('')
    this.log(`  ID:       ${p.id}`)
    this.log(`  Name:     ${p.name}`)
    this.log(`  Language: ${p.language}`)
    if (p.sms) this.log(`  SMS:      Enabled (code length: ${p.sms.code_length})`)
    if (p.call) this.log(`  Call:     Enabled`)
    if (p.flashcall) this.log(`  Flashcall: Enabled`)
  }
}
