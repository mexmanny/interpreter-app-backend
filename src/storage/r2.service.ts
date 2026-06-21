import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
    ? { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }
    : undefined
});

export const uploadPdf = async ({ key, body }: { key: string; body: Buffer }) => {
  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: "application/pdf"
  }));

  return env.R2_PUBLIC_BASE_URL ? `${env.R2_PUBLIC_BASE_URL}/${key}` : key;
};

export const deleteFile = async (key: string) => {
  await s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
};

export const downloadPdf = async (key: string): Promise<Buffer> => {
  const response = await s3.send(new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  }));

  if (!response.Body) {
    throw new Error("Empty R2 response");
  }

  return Buffer.from(await response.Body.transformToByteArray());
};
