import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.js'
import { v2, validateBucketName } from '../../lib/api.js'

interface PresignResponse {
  data: {
    presigned_url: string
  }
}

export default class StoragePresign extends BaseCommand {
  static override description = 'Generate a presigned URL for an object'

  static override examples = [
    '<%= config.bin %> storage presign my-bucket myfile.txt',
    '<%= config.bin %> storage presign my-bucket images/photo.jpg --ttl 3600',
    '<%= config.bin %> storage presign my-bucket data.json --ttl 60',
  ]

  static override args = {
    bucket: Args.string({
      description: 'Bucket name',
      required: true,
    }),
    key: Args.string({
      description: 'Object key',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    ttl: Flags.integer({
      description: 'URL validity in seconds',
      default: 300,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StoragePresign)

    validateBucketName(args.bucket)

    this.info(`Generating presigned URL for "${args.bucket}/${args.key}"...`)

    const response = await v2.post<PresignResponse>(
      `/storage/buckets/${args.bucket}/${encodeURIComponent(args.key)}/presigned_url`,
      { TTL: flags.ttl },
      { profile: flags.profile }
    )

    if (flags.json) {
      this.outputJson(response)
      return
    }

    this.success('Presigned URL generated')
    this.log('')
    this.log(response.data.presigned_url)
    this.log('')
    this.log(`Expires in: ${flags.ttl} seconds`)
  }
}
