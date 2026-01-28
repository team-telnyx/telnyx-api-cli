import { Args, Flags } from '@oclif/core'
import { S3Client, DeleteBucketCommand } from '@aws-sdk/client-s3'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage, validateBucketName } from '../../../lib/api.js'

export default class StorageBucketDelete extends BaseCommand {
  static override description = 'Delete a storage bucket (must be empty)'

  static override examples = [
    '<%= config.bin %> storage bucket delete my-bucket --force',
  ]

  static override args = {
    name: Args.string({
      description: 'Bucket name',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageBucketDelete)

    validateBucketName(args.name)

    if (!flags.force) {
      this.warning(`This will permanently delete bucket "${args.name}"`)
      this.log('Use --force to skip this confirmation')
      return
    }

    const creds = storage.getCredentials(flags.profile)
    
    const client = new S3Client({
      endpoint: storage.getEndpoint(),
      region: 'us-central-1',
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
      forcePathStyle: true,
    })

    this.info(`Deleting bucket "${args.name}"...`)

    await client.send(new DeleteBucketCommand({ Bucket: args.name }))

    this.success(`Bucket "${args.name}" deleted`)
  }
}
