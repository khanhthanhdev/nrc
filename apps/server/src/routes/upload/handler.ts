import { handleRequest, route } from "@better-upload/server";
import type { Router } from "@better-upload/server";
import { aws } from "@better-upload/server/clients";

const KB = 1024;
const MB = 1024 * KB;
const FIVE_MB = 5 * MB;
const FIFTY_MB = 50 * MB;
const TEN_MB = 10 * MB;

const getUploadClient = () => {
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return aws({
      accessKeyId,
      region: process.env.AWS_S3_REGION || "us-east-1",
      secretAccessKey,
    });
  }

  return aws();
};

const uploadRouter: Router = {
  bucketName: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "nrc-uploads",
  client: getUploadClient(),
  routes: {
    documents: route({
      fileTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      maxFileSize: TEN_MB,
      maxFiles: 5,
      multipleFiles: true,
    }),
    files: route({
      fileTypes: ["*/*"],
      maxFileSize: FIFTY_MB,
      maxFiles: 10,
      multipleFiles: true,
    }),
    images: route({
      fileTypes: ["image/*"],
      maxFileSize: FIVE_MB,
      maxFiles: 10,
      multipleFiles: true,
    }),
  },
};

export const uploadHandler = (request: Request) => handleRequest(request, uploadRouter);
