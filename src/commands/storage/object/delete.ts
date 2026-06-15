import { Args, Flags } from '@oclif/core'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage, validateBucketName } from '../../../lib/api.js'

export default class StorageObjectDelete extends BaseCommand {
  static override description = 'Delete an object from a bucket'

  static override examples = [
    '<%= config.bin %> storage object delete my-bucket myfile.txt --force',
    '<%= config.bin %> storage object delete my-bucket images/old-photo.jpg -f',
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
    ...BaseCommand.storageFlags,
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageObjectDelete)

    validateBucketName(args.bucket)

    if (!flags.force) {
      this.warning(`This will permanently delete "${args.bucket}/${args.key}"`)
      this.log('Use --force to skip this confirmation')
      return
    }

    const client = new S3Client(storage.getClientConfig(flags))

    this.info(`Deleting "${args.bucket}/${args.key}"...`)

    await client.send(new DeleteObjectCommand({
      Bucket: args.bucket,
      Key: args.key,
    }))

    this.success(`Deleted ${args.bucket}/${args.key}`)
  }
}
