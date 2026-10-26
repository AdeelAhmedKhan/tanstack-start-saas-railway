import { createServerFn } from '@tanstack/react-start'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { requireAuth } from './session'

/**
 * Uploads via an S3-compatible bucket (Railway Bucket on Railway).
 * Env-gated: without S3_ENDPOINT / S3_ACCESS_KEY_ID /
 * S3_SECRET_ACCESS_KEY / S3_BUCKET, `getStorageStatus` reports
 * configured: false and uploads throw a plain-English error.
 *
 * Flow: browser asks for a presigned PUT URL -> uploads the file
 * directly to the bucket -> the file never passes through this server.
 */

function getS3(): { client: S3Client; bucket: string } | null {
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const bucket = process.env.S3_BUCKET
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null
  return {
    client: new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'auto',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
    bucket,
  }
}

export const getStorageStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAuth()
    return { configured: getS3() !== null }
  },
)

const uploadInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
})

export const getUploadUrl = createServerFn({ method: 'POST' })
  .validator(uploadInput)
  .handler(async ({ data }) => {
    const me = await requireAuth()
    const s3 = getS3()
    if (!s3) {
      throw new Error(
        'Storage is not configured. Add a Bucket service on Railway and set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_BUCKET.',
      )
    }
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `uploads/${me.id}/${Date.now()}-${safeName}`
    const url = await getSignedUrl(
      s3.client,
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        ContentType: data.contentType,
      }),
      { expiresIn: 300 },
    )
    const publicBase = process.env.S3_PUBLIC_URL
    return {
      uploadUrl: url,
      key,
      publicUrl: publicBase ? `${publicBase}/${key}` : undefined,
    }
  })
