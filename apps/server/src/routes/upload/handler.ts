import { handleRequest, RejectUpload, route } from "@better-upload/server";
import type { Router } from "@better-upload/server";
import { aws } from "@better-upload/server/clients";

import { db, uploadedFiles } from "@nrc-full/db";
import { getPublicUrl } from "../../adapters/storage/s3";
import { getAuthSessionFromHeaders } from "../../auth/session";

const KB = 1024;
const MB = 1024 * KB;
const FIVE_MB = 5 * MB;
const FIFTY_MB = 50 * MB;
const TEN_MB = 10 * MB;

type UploadCategory = "attachment" | "event" | "profile" | "team_logo";
type MultipleUploadRouteConfig = Omit<
  Parameters<typeof route<true>>[0],
  "multipleFiles" | "onAfterSignedUrl" | "onBeforeUpload"
>;

const requireUploadSession = async (req: Request) => {
  const session = await getAuthSessionFromHeaders(req.headers);

  if (!session) {
    throw new RejectUpload("Unauthorized.");
  }

  return session;
};

const createUploadRoute = (
  category: UploadCategory,
  config: MultipleUploadRouteConfig,
) =>
  route({
    ...config,
    multipleFiles: true,
    onBeforeUpload: async ({ req }) => {
      const session = await requireUploadSession(req);

      return {
        metadata: {
          email: session.user.email,
          uploadedBy: session.user.id,
          userType: session.user.userType ?? "PARTICIPANT",
        },
      };
    },
    onAfterSignedUrl: async ({ files, metadata }) => {
      const uploadedBy = typeof metadata.uploadedBy === "string" ? metadata.uploadedBy : null;

      if (!uploadedBy) {
        throw new RejectUpload("Unauthorized.");
      }

      await db.insert(uploadedFiles).values(
        files.map((file) => ({
          category,
          fileName: file.name,
          fileSize: String(file.size),
          fileType: file.type,
          metadata: {
            email: typeof metadata.email === "string" ? metadata.email : "",
            uploadedAt: new Date().toISOString(),
            uploadedBy,
            userType: typeof metadata.userType === "string" ? metadata.userType : "PARTICIPANT",
          },
          s3Key: file.objectInfo.key,
          s3Url: getPublicUrl(file.objectInfo.key),
          userId: uploadedBy,
        })),
      );
    },
  });

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
    documents: createUploadRoute("attachment", {
      fileTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ],
      maxFileSize: TEN_MB,
      maxFiles: 5,
    }),
    files: createUploadRoute("attachment", {
      fileTypes: [
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "application/rtf",
        // Archives
        "application/zip",
        "application/x-tar",
        "application/gzip",
        "application/x-7z-compressed",
        "application/x-rar-compressed",
        // Images (no SVG — XSS vector)
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        // Audio
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/flac",
        "audio/aac",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ],
      maxFileSize: FIFTY_MB,
      maxFiles: 10,
    }),
    images: createUploadRoute("team_logo", {
      fileTypes: ["image/*"],
      maxFileSize: FIVE_MB,
      maxFiles: 10,
    }),
  },
};

export const uploadHandler = (request: Request) => handleRequest(request, uploadRouter);
