import { Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface TemplateResponse {
  data: {
    id: string
    text: string
  }
}

export default class VerifyTemplateCreate extends BaseCommand {
  static override description = 'Create a custom verification message template'

  static override examples = [
    '<%= config.bin %> verify template create --text "Your {{app_name}} code is {{code}}. Do not share."',
    '<%= config.bin %> verify template create --text "{{code}} is your {{app_name}} verification code."',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    text: Flags.string({
      char: 't',
      description: 'Template text (use {{app_name}} and {{code}} variables)',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyTemplateCreate)

    // Validate template contains required variables
    if (!flags.text.includes('{{code}}')) {
      this.warning('Template should include {{code}} variable')
    }

    const payload = {
      text: flags.text,
    }

    this.info('Creating verification template...')

    const response = await v2.post<TemplateResponse>('/verify_profiles/templates', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const t = response.data
    this.success('Template created!')
    this.log('')
    this.log(`  ID:   ${t.id}`)
    this.log(`  Text: ${t.text}`)
    this.log('')
    this.log('Use this template ID when creating verify profiles with --sms-template-id')
  }
}
