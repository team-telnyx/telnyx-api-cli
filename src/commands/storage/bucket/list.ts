import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage } from '../../../lib/api.js'

export default class StorageBucketList extends BaseCommand {
  static override description = 'List all storage buckets'

  static override examples = [
    '<%= config.bin %> storage bucket list',
    '<%= config.bin %> storage bucket list --json',
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(StorageBucketList)

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

    this.info('Fetching buckets...')

    const response = await client.send(new ListBucketsCommand({}))

    if (flags.json) {
      this.outputJson(response.Buckets || [])
      return
    }

    const buckets = response.Buckets || []

    if (buckets.length === 0) {
      this.log('No buckets found')
      return
    }

    const tableData = buckets.map(b => ({
      name: b.Name || '-',
      created: b.CreationDate ? new Date(b.CreationDate).toLocaleString() : '-',
    }))

    this.outputTable(tableData as unknown as Record<string, unknown>[], {
      name: { header: 'NAME' },
      created: { header: 'CREATED' },
    })

    this.log('')
    this.log(`${buckets.length} bucket(s)`)
  }
}
