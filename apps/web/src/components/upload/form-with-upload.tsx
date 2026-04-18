"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { FileUploader } from "./file-uploader";
import { ImageUploader } from "./image-uploader";
import { UPLOAD_ROUTES } from "./use-upload-mutations";

interface FormData {
  description: string;
  documents: string[];
  images: string[];
  title: string;
}

interface FormWithUploadProps {
  onSubmit?: (data: FormData) => Promise<void>;
}

const FormWithUpload = ({ onSubmit }: FormWithUploadProps) => {
  const [uploadErrors, setUploadErrors] = useState<{
    documents: string | null;
    images: string | null;
  }>({ documents: null, images: null });
  const [uploadedUrls, setUploadedUrls] = useState<{
    documents: string[];
    images: string[];
  }>({ documents: [], images: [] });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (onSubmit) {
        await onSubmit(data);
      }

      return data;
    },
  });

  const form = useForm({
    defaultValues: {
      description: "",
      documents: [] as string[],
      images: [] as string[],
      title: "",
    },
    onSubmit: async ({ value }) => {
      const formData = {
        ...value,
        documents: uploadedUrls.documents,
        images: uploadedUrls.images,
      };
      await submitMutation.mutateAsync(formData);
    },
  });

  const handleImagesUploaded = useCallback((urls: string[]) => {
    setUploadErrors((prev) => ({ ...prev, images: null }));
    setUploadedUrls((prev) => ({ ...prev, images: urls }));
  }, []);

  const handleDocumentsUploaded = useCallback((urls: string[]) => {
    setUploadErrors((prev) => ({ ...prev, documents: null }));
    setUploadedUrls((prev) => ({ ...prev, documents: urls }));
  }, []);

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      {/* Title Field */}
      <form.Field
        name="title"
        validators={{
          onBlur: ({ value }) => (value.length === 0 ? "Title is required" : undefined),
        }}
      >
        {(field) => (
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter title"
              type="text"
              value={field.state.value}
            />
            {field.state.meta.errors && (
              <p className="mt-1 text-sm text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Description Field */}
      <form.Field name="description">
        {(field) => (
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter description"
              rows={4}
              value={field.state.value}
            />
          </div>
        )}
      </form.Field>

      {/* Image Upload */}
      <div>
        <p className="mb-3 block text-sm font-medium text-gray-700">Images</p>
        <ImageUploader
          onError={(uploadError) => {
            setUploadErrors((prev) => ({ ...prev, images: uploadError.message }));
          }}
          onSuccess={handleImagesUploaded}
          route={UPLOAD_ROUTES.IMAGES}
        />
        {uploadErrors.images && <p className="mt-2 text-sm text-red-600">{uploadErrors.images}</p>}
        {uploadedUrls.images.length > 0 && (
          <div className="mt-3 text-sm text-green-600">
            {uploadedUrls.images.length} image(s) uploaded
          </div>
        )}
      </div>

      {/* Document Upload */}
      <div>
        <p className="mb-3 block text-sm font-medium text-gray-700">Documents</p>
        <FileUploader
          accept=".pdf,.doc,.docx,.txt"
          onError={(uploadError) => {
            setUploadErrors((prev) => ({ ...prev, documents: uploadError.message }));
          }}
          onSuccess={handleDocumentsUploaded}
          route={UPLOAD_ROUTES.DOCUMENTS}
        />
        {uploadErrors.documents && (
          <p className="mt-2 text-sm text-red-600">{uploadErrors.documents}</p>
        )}
        {uploadedUrls.documents.length > 0 && (
          <div className="mt-3 text-sm text-green-600">
            {uploadedUrls.documents.length} document(s) uploaded
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        className="w-full rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        disabled={submitMutation.isPending}
        type="submit"
      >
        {submitMutation.isPending ? "Submitting..." : "Submit"}
      </button>

      {submitMutation.isError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitMutation.error?.message || "Submission failed"}
        </div>
      )}
    </form>
  );
};

export { FormWithUpload };
