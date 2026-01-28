import { Args, Flags } from '@oclif/core'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage, validateBucketName } from '../../../lib/api.js'

export default class StorageObjectList extends BaseCommand {
  static override description = 'List objects in a bucket'

  static override examples = [
    '<%= config.bin %> storage object list my-bucket',
    '<%= config.bin %> storage object list my-bucket --prefix images/',
    '<%= config.bin %> storage object list my-bucket --limit 100',
  ]

  static override args = {
    bucket: Args.string({
      description: 'Bucket name',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.baseFlags,
    prefix: Flags.string({
      description: 'Filter by key prefix',
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum objects to return',
      default: 1000,
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageObjectList)

    validateBucketName(args.bucket)

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

    this.info(`Listing objects in "${args.bucket}"...`)

    const command = new ListObjectsV2Command({
      Bucket: args.bucket,
      Prefix: flags.prefix,
      MaxKeys: flags.limit,
    })

    const response = await client.send(command)

    if (flags.json) {
      this.outputJson(response.Contents || [])
      return
    }

    const objects = response.Contents || []

    if (objects.length === 0) {
      this.log('No objects found')
      return
    }

    const tableData = objects.map(o => ({
      key: o.Key || '-',
      size: o.Size ? formatBytes(o.Size) : '-',
      modified: o.LastModified ? new Date(o.LastModified).toLocaleString() : '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      key: { header: 'KEY' },
      size: { header: 'SIZE' },
      modified: { header: 'MODIFIED' },
    })

    this.log('')
    this.log(`${objects.length} object(s)${response.IsTruncated ? ' (truncated)' : ''}`)
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
