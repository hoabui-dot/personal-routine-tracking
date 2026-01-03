import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '../env';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = env.AWS_S3_BUCKET_NAME;
const AWS_REGION = env.AWS_REGION;

export interface UploadResult {
  url: string;
  key: string;
}

export const uploadAvatar = async (
  file: Express.Multer.File,
  userId: number
): Promise<UploadResult> => {
  const fileExtension = file.originalname.split('.').pop();
  const key = `avatars/${userId}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  // Use the correct S3 URL format for ap-southeast-2 region
  const url = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  
  console.log('Avatar uploaded successfully:', { url, key, region: AWS_REGION, bucket: BUCKET_NAME });

  return { url, key };
};

export const deleteAvatar = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

export const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Extract key from path (remove leading slash)
    const key = urlObj.pathname.substring(1);
    return key;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};
