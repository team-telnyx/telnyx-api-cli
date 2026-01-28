import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone } from '../../lib/api.js'

interface CallResponse {
  data: {
    call_control_id: string
    call_session_id: string
  }
}

export default class AssistantCall extends BaseCommand {
  static override description = 'Initiate an outbound call with an AI assistant'

  static override examples = [
    '<%= config.bin %> assistant call assistant-abc123 --from +15551234567 --to +15559876543',
    '<%= config.bin %> assistant call assistant-abc123 -f +15551234567 -t +15559876543 --texml-app-id app123',
  ]

  static override args = {
    id: Args.string({
      description: 'Assistant ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({
      char: 'f',
      description: 'Caller phone number (E.164 format)',
      required: true,
    }),
    to: Flags.string({
      char: 't',
      description: 'Destination phone number (E.164 format)',
      required: true,
    }),
    'texml-app-id': Flags.string({
      description: 'TeXML application ID (uses assistant default if not specified)',
    }),
    'amd': Flags.boolean({
      description: 'Enable answering machine detection',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AssistantCall)

    validatePhone(flags.from)
    validatePhone(flags.to)

    // Get the TeXML app ID from the assistant if not provided
    let texmlAppId = flags['texml-app-id']
    
    if (!texmlAppId) {
      // Fetch assistant to get default TeXML app
      const assistantResp = await v2.get<{ data: { telephony_settings?: { default_texml_app_id?: string } } }>(
        `/ai/assistants/${args.id}`,
        { profile: flags.profile }
      )
      texmlAppId = assistantResp.data.telephony_settings?.default_texml_app_id
      
      if (!texmlAppId) {
        throw new Error('No TeXML app configured for this assistant. Use --texml-app-id or configure in portal.')
      }
    }

    const payload: Record<string, unknown> = {
      From: flags.from,
      To: flags.to,
      AIAssistantId: args.id,
    }

    if (flags.amd) {
      payload.MachineDetection = 'Enable'
      payload.AsyncAmd = true
      payload.DetectionMode = 'Premium'
    }

    this.info(`Calling ${flags.to} with AI assistant...`)

    const response = await v2.post<CallResponse>(
      `/texml/ai_calls/${texmlAppId}`,
      payload,
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const call = response.data
    this.success('Call initiated!')
    this.log('')
    this.log(`  Call Control ID: ${call.call_control_id}`)
    this.log(`  Session ID:      ${call.call_session_id}`)
  }
}
