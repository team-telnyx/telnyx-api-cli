import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../../lib/base-command.js'
import { v2, validateId } from '../../../lib/api.js'

interface TokenResponse {
  data: {
    token: string
    refresh_token: string
    token_expires_at: string
    refresh_token_expires_at: string
  }
}

export default class VideoRoomToken extends BaseCommand {
  static override description = 'Generate a client join token for a video room'

  static override examples = [
    '<%= config.bin %> video room token 6a09cdc3-8948-47f0-aa62-74ac943d6c58',
    '<%= config.bin %> video room token 6a09cdc3-8948-47f0-aa62-74ac943d6c58 --ttl 3600',
  ]

  static override args = {
    id: Args.string({
      description: 'Room ID',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    ttl: Flags.integer({
      description: 'Token TTL in seconds',
      default: 600,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(VideoRoomToken)

    validateId(args.id, 'Room ID')

    const payload = {
      token_ttl_secs: flags.ttl,
      refresh_token_ttl_secs: flags.ttl * 2,
    }

    this.info('Generating join token...')

    const response = await v2.post<TokenResponse>(`/rooms/${args.id}/actions/generate_join_client_token`, payload, { profile: flags.profile })

    if (flags.json) {
      this.outputJson(response)
      return
    }

    const token = response.data
    this.success('Join token generated!')
    this.log('')
    this.log('Token:')
    this.log(token.token)
    this.log('')
    this.log(`Expires: ${new Date(token.token_expires_at).toLocaleString()}`)
  }
}
