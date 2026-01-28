import { Args, Flags } from '@oclif/core'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream, statSync } from 'node:fs'
import { basename } from 'node:path'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage, validateBucketName } from '../../../lib/api.js'

export default class StorageObjectPut extends BaseCommand {
  static override description = 'Upload a file to a bucket'

  static override examples = [
    '<%= config.bin %> storage object put my-bucket ./file.txt',
    '<%= config.bin %> storage object put my-bucket ./image.jpg --key images/photo.jpg',
    '<%= config.bin %> storage object put my-bucket ./doc.pdf --content-type application/pdf',
  ]

  static override args = {
    bucket: Args.string({
      description: 'Bucket name',
      required: true,
    }),
    file: Args.string({
      description: 'Local file path to upload',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    key: Flags.string({
      char: 'k',
      description: 'Object key (defaults to filename)',
    }),
    'content-type': Flags.string({
      description: 'Content-Type header',
    }),
    public: Flags.boolean({
      description: 'Make object publicly readable',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageObjectPut)

    validateBucketName(args.bucket)

    // Check file exists
    let fileStats
    try {
      fileStats = statSync(args.file)
    } catch {
      throw new Error(`File not found: ${args.file}`)
    }

    const key = flags.key || basename(args.file)

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

    this.info(`Uploading "${args.file}" to "${args.bucket}/${key}" (${formatBytes(fileStats.size)})...`)

    const command = new PutObjectCommand({
      Bucket: args.bucket,
      Key: key,
      Body: createReadStream(args.file),
      ContentType: flags['content-type'],
      ACL: flags.public ? 'public-read' : undefined,
    })

    await client.send(command)

    this.success(`Uploaded to ${args.bucket}/${key}`)

    if (flags.public) {
      this.log(`Public URL: ${storage.getEndpoint()}/${args.bucket}/${key}`)
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
