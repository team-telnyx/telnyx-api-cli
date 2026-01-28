import { Args } from '@oclif/core'
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage, validateBucketName } from '../../../lib/api.js'

export default class StorageBucketCreate extends BaseCommand {
  static override description = 'Create a new storage bucket'

  static override examples = [
    '<%= config.bin %> storage bucket create my-bucket',
    '<%= config.bin %> storage bucket create my-app-files',
  ]

  static override args = {
    name: Args.string({
      description: 'Bucket name (lowercase letters, numbers, hyphens)',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageBucketCreate)

    validateBucketName(args.name)

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

    this.info(`Creating bucket "${args.name}"...`)

    await client.send(new CreateBucketCommand({ Bucket: args.name }))

    this.success(`Bucket "${args.name}" created`)
  }
}
