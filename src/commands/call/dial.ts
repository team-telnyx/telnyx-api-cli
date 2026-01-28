import { Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validatePhone, validateId } from '../../lib/api.js'

interface CallResponse {
  data: {
    call_control_id: string
    call_leg_id: string
    call_session_id: string
    is_alive: boolean
    record_type: string
  }
}

export default class CallDial extends BaseCommand {
  static override description = 'Make an outbound call'

  static override examples = [
    '<%= config.bin %> call dial --from +15551234567 --to +15559876543 --connection-id abc123',
    '<%= config.bin %> call dial -f +15551234567 -t +15559876543 --connection-id abc123 --timeout 30',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({
      char: 'f',
      description: 'Caller phone number (E.164 format)',
      required: true,
    }),
    to: Flags.string({
      char: 't',
      description: 'Destination phone number or SIP URI',
      required: true,
    }),
    'connection-id': Flags.string({
      description: 'Voice API application/connection ID',
      required: true,
    }),
    'webhook-url': Flags.string({
      description: 'URL for call events (overrides connection default)',
    }),
    'timeout-secs': Flags.integer({
      description: 'Ring timeout in seconds',
      default: 30,
    }),
    'answering-machine-detection': Flags.string({
      description: 'AMD mode',
      options: ['disabled', 'detect', 'detect_beep', 'detect_words', 'greeting_end'],
    }),
    'caller-id-name': Flags.string({
      description: 'Caller ID name (CNAM)',
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(CallDial)

    validatePhone(flags.from)
    // to can be phone or SIP URI, only validate if it looks like a phone
    if (flags.to.startsWith('+')) {
      validatePhone(flags.to)
    }
    validateId(flags['connection-id'], 'Connection ID')

    const payload: Record<string, unknown> = {
      from: flags.from,
      to: flags.to,
      connection_id: flags['connection-id'],
      timeout_secs: flags['timeout-secs'],
    }

    if (flags['webhook-url']) {
      payload.webhook_url = flags['webhook-url']
    }

    if (flags['answering-machine-detection']) {
      payload.answering_machine_detection = flags['answering-machine-detection']
    }

    if (flags['caller-id-name']) {
      payload.custom_headers = [
        { name: 'P-Asserted-Identity', value: `"${flags['caller-id-name']}" <sip:${flags.from.replace('+', '')}@telnyx.com>` }
      ]
    }

    this.info(`Dialing ${flags.to}...`)

    const response = await v2.post<CallResponse>('/calls', payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const call = response.data
    this.success('Call initiated!')
    this.log('')
    this.log(`  Call Control ID:  ${call.call_control_id}`)
    this.log(`  Call Leg ID:      ${call.call_leg_id}`)
    this.log(`  Session ID:       ${call.call_session_id}`)
    this.log(`  Status:           ${call.is_alive ? 'Active' : 'Ended'}`)
    this.log('')
    this.log(`Use "telnyx call hangup ${call.call_control_id}" to end the call`)
  }
}
