import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { readStorageEnv } from '#/lib/env'

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export function isAllowedImageType(
  contentType: string,
): contentType is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType)
}

export function getServiceImageKey(
  orgId: string,
  serviceId: string,
  ext: string,
): string {
  return `services/${orgId}/${serviceId}.${ext.toLowerCase()}`
}

export function getPublicUrl(
  key: string,
  bucket: string,
  region: string,
): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

export function extFromContentType(contentType: AllowedImageType): string {
  const map: Record<AllowedImageType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[contentType]
}

let _s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!_s3Client) {
    const env = readStorageEnv()
    const config: ConstructorParameters<typeof S3Client>[0] = {
      region: env.S3_REGION,
    }
    if (env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      }
    }
    _s3Client = new S3Client(config)
  }
  return _s3Client
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const env = readStorageEnv()
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn: 300 })
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const env = readStorageEnv()
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn: 86400 })
}
