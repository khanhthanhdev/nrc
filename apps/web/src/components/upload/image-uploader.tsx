"use client";

import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useUploadFiles } from "./use-upload-mutations";
import type { UploadRoute } from "./use-upload-mutations";

interface ImageUploaderProps {
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (error: Error) => void;
  onSuccess?: (urls: string[]) => void;
  route?: UploadRoute;
}

const ImageUploader = ({
  route = "images",
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024,
  onSuccess,
  onError,
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string[]>([]);
  const { mutate, isPending, isError, error } = useUploadFiles(route);
  const clearPreviewUrls = useCallback(() => {
    setPreview((previousPreviews) => {
      for (const previewUrl of previousPreviews) {
        URL.revokeObjectURL(previewUrl);
      }
      return [];
    });
  }, []);

  useEffect(() => clearPreviewUrls, [clearPreviewUrls]);

  const form = useForm({
    defaultValues: {
      images: [] as File[],
    },
    onSubmit: ({ value }) => {
      if (value.images.length === 0) {
        return;
      }

      mutate(value.images, {
        onError: (err) => {
          const uploadError = err instanceof Error ? err : new Error(String(err));
          onError?.(uploadError);
        },
        onSuccess: (urls) => {
          onSuccess?.(urls);
          clearPreviewUrls();
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
        if (!file.type.startsWith("image/")) {
          rejectedFiles.push(file.name);
          return false;
        }

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
        onError?.(new Error(`Skipped ${rejectedFiles.length} invalid image file(s).`));
      }

      form.setFieldValue("images", validFiles);
      setPreview((previousPreviews) => {
        for (const previewUrl of previousPreviews) {
          URL.revokeObjectURL(previewUrl);
        }

        return validFiles.map((file) => URL.createObjectURL(file));
      });
    },
    [form, maxFiles, maxFileSize, onError],
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
        <input
          id="image-input"
          accept="image/*"
          className="hidden"
          disabled={isPending}
          multiple
          type="file"
          onChange={handleFileChange}
        />
        <label
          className="flex cursor-pointer flex-col items-center justify-center"
          htmlFor="image-input"
        >
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
          <p className="mt-2 text-sm text-gray-600">Drop images here or click to select</p>
          <p className="text-xs text-gray-500">
            Max {maxFiles} files, {(maxFileSize / 1024 / 1024).toFixed(0)}MB each
          </p>
        </label>
      </div>

      {preview.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {preview.map((src, idx) => (
            <div key={`${src}-${idx}`} className="relative aspect-square">
              <img
                alt={`Preview ${idx + 1}`}
                className="h-full w-full rounded object-cover"
                src={src}
              />
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
                  <div className="text-sm text-white">Uploading...</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error?.message || "Upload failed"}
        </div>
      )}

      <button
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        disabled={isPending || preview.length === 0}
        type="button"
        onClick={() => form.handleSubmit()}
      >
        {isPending
          ? "Uploading..."
          : `Upload ${preview.length} Image${preview.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
};

export { ImageUploader };
