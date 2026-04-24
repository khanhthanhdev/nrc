"use client";

import { useForm } from "@tanstack/react-form";
import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { useUploadFiles } from "./use-upload-mutations";
import type { UploadRoute } from "./use-upload-mutations";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
};

interface FileUploaderProps {
  accept?: string;
  inputId?: string;
  maxFiles?: number;
  maxFileSize?: number;
  multiple?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (urls: string[]) => void;
  route?: UploadRoute;
}

const FileUploader = ({
  route = "files",
  accept,
  inputId = "file-input",
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024,
  multiple = true,
  onSuccess,
  onError,
}: FileUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { mutate, isPending, isError, error } = useUploadFiles(route);

  const form = useForm({
    defaultValues: {
      files: [] as File[],
    },
    onSubmit: ({ value }) => {
      if (value.files.length === 0) {
        return;
      }

      mutate(value.files, {
        onError: (err) => {
          const uploadError = err instanceof Error ? err : new Error(String(err));
          onError?.(uploadError);
        },
        onSuccess: (urls) => {
          onSuccess?.(urls);
          setSelectedFiles([]);
          form.reset();
        },
      });
    },
  });

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = [...(event.target.files || [])];
      const rejectedFiles: string[] = [];

      const validFiles = files.filter((file) => {
        if (file.size > maxFileSize) {
          rejectedFiles.push(file.name);
          return false;
        }

        return true;
      });

      if (validFiles.length > maxFiles) {
        validFiles.splice(maxFiles);
      }

      if (rejectedFiles.length > 0) {
        onError?.(new Error(`Skipped ${rejectedFiles.length} oversized file(s).`));
      }

      setSelectedFiles(validFiles);
      form.setFieldValue("files", validFiles);
    },
    [form, maxFiles, maxFileSize, onError],
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
        <input
          id={inputId}
          accept={accept}
          className="hidden"
          disabled={isPending}
          multiple={multiple}
          type="file"
          onChange={handleFileChange}
        />
        <label
          className="flex cursor-pointer flex-col items-center justify-center"
          htmlFor={inputId}
        >
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
          <p className="mt-2 text-sm text-gray-600">Drop files here or click to select</p>
          <p className="text-xs text-gray-500">
            Max {maxFiles} files, {(maxFileSize / 1024 / 1024).toFixed(0)}MB each
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Selected Files:</h3>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {selectedFiles.map((file) => (
              <li
                key={`${file.name}-${file.lastModified}-${file.size}`}
                className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm"
              >
                <span className="truncate">{file.name}</span>
                <span className="ml-2 text-xs text-gray-500">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error?.message || "Upload failed"}
        </div>
      )}

      <button
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        disabled={isPending || selectedFiles.length === 0}
        type="button"
        onClick={() => form.handleSubmit()}
      >
        {isPending
          ? "Uploading..."
          : `Upload ${selectedFiles.length} File${selectedFiles.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
};

export { FileUploader };
