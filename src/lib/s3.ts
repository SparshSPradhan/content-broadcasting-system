import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.AWS_REGION!,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export async function uploadToS3(
  filePath: string,
  key: string,
  mimeType: string,
): Promise<string> {
  const client = getS3Client();
  const fileBuffer = fs.readFileSync(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    }),
  );

  // Return public URL or signed URL
  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME!,
      Key: key,
    }),
  );
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export function getS3KeyFromUrl(url: string): string {
  const urlObj = new URL(url);
  return urlObj.pathname.slice(1); // remove leading /
}