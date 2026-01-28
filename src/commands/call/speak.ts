import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2 } from '../../lib/api.js'

export default class CallSpeak extends BaseCommand {
  static override description = 'Speak text on an active call (TTS)'

  static override examples = [
    '<%= config.bin %> call speak v3:abc123 "Hello, how can I help you today?"',
    '<%= config.bin %> call speak v3:abc123 "Welcome" --voice female --language en-US',
  ]

  static override args = {
    'call-control-id': Args.string({
      description: 'Call control ID',
      required: true,
    }),
    text: Args.string({
      description: 'Text to speak',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    voice: Flags.string({
      char: 'v',
      description: 'Voice gender',
      options: ['male', 'female'],
      default: 'female',
    }),
    language: Flags.string({
      char: 'l',
      description: 'Language code',
      default: 'en-US',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CallSpeak)

    const callControlId = args['call-control-id']

    const payload = {
      payload: args.text,
      voice: flags.voice,
      language: flags.language,
    }

    this.info(`Speaking on call ${callControlId}...`)

    await v2.post(
      `/calls/${encodeURIComponent(callControlId)}/actions/speak`,
      payload,
      { profile: flags.profile }
    )

    this.success('Speaking text')
  }
}
