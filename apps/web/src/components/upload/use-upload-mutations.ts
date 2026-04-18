import { uploadFile, uploadFiles } from "@better-upload/client";
import type { FileUploadInfo } from "@better-upload/client";
import { env } from "@nrc-full/env/web";
import { useMutation } from "@tanstack/react-query";

export const UPLOAD_ROUTES = {
  DOCUMENTS: "documents",
  FILES: "files",
  IMAGES: "images",
} as const;

export type UploadRoute = (typeof UPLOAD_ROUTES)[keyof typeof UPLOAD_ROUTES];

export interface UploadFile {
  error?: {
    message: string;
    type: string;
  };
  id?: string;
  key: string;
  name: string;
  progress?: number;
  skip?: "completed";
  size: number;
  status: "complete" | "failed" | "pending" | "uploading";
  type: string;
}

const uploadApi = `${env.VITE_SERVER_URL}/api/upload`;

const createPartialUploadError = (
  route: UploadRoute,
  failedFiles: FileUploadInfo<"failed">[],
): Error => {
  const names = failedFiles.map((file) => file.name).join(", ");
  return new Error(`Upload failed for route "${route}": ${names}`);
};

const toUploadedObjectKeys = (files: FileUploadInfo<"complete">[]) =>
  files.map((file) => file.objectInfo.key);

export const useUploadFile = (route: UploadRoute) =>
  useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const result = await uploadFile({
        api: uploadApi,
        file,
        route,
      });

      return result.file.objectInfo.key;
    },
  });

export const useUploadFiles = (route: UploadRoute) =>
  useMutation({
    mutationFn: async (files: File[]): Promise<string[]> => {
      const result = await uploadFiles({
        api: uploadApi,
        files,
        route,
      });

      if (result.failedFiles.length > 0) {
        throw createPartialUploadError(route, result.failedFiles);
      }

      return toUploadedObjectKeys(result.files);
    },
  });
