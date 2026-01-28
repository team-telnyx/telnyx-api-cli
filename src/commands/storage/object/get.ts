import { Args, Flags } from '@oclif/core'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createWriteStream } from 'node:fs'
import { basename } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { BaseCommand } from '../../../lib/base-command.js'
import { storage, validateBucketName } from '../../../lib/api.js'

export default class StorageObjectGet extends BaseCommand {
  static override description = 'Download an object from a bucket'

  static override examples = [
    '<%= config.bin %> storage object get my-bucket myfile.txt',
    '<%= config.bin %> storage object get my-bucket images/photo.jpg --output ./downloaded.jpg',
    '<%= config.bin %> storage object get my-bucket data.json --output -  # stdout',
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
    output: Flags.string({
      char: 'o',
      description: 'Output file path (- for stdout)',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(StorageObjectGet)

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

    const outputPath = flags.output || basename(args.key)
    const toStdout = outputPath === '-'

    if (!toStdout) {
      this.info(`Downloading "${args.bucket}/${args.key}" to "${outputPath}"...`)
    }

    const command = new GetObjectCommand({
      Bucket: args.bucket,
      Key: args.key,
    })

    const response = await client.send(command)

    if (!response.Body) {
      throw new Error('Empty response body')
    }

    const bodyStream = response.Body as Readable

    if (toStdout) {
      await pipeline(bodyStream, process.stdout)
    } else {
      const writeStream = createWriteStream(outputPath)
      await pipeline(bodyStream, writeStream)
      this.success(`Downloaded to ${outputPath}`)
    }
  }
}
