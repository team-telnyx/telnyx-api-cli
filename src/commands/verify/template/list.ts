import { BaseCommand } from '../../../lib/base-command.js'
import { v2 } from '../../../lib/api.js'

interface Template {
  id: string
  text: string
}

interface TemplateListResponse {
  data: Template[]
}

export default class VerifyTemplateList extends BaseCommand {
  static override description = 'List available verification message templates'

  static override examples = [
    '<%= config.bin %> verify template list',
    '<%= config.bin %> verify template list --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyTemplateList)

    this.info('Fetching verification templates...')

    const response = await v2.get<TemplateListResponse>('/verify_profiles/templates', { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const templates = response.data || []

    if (templates.length === 0) {
      this.log('No templates found')
      return
    }

    this.log('')
    for (const t of templates) {
      this.log(`ID: ${t.id}`)
      this.log(`   ${t.text}`)
      this.log('')
    }

    this.log(`${templates.length} template(s) available`)
  }
}
