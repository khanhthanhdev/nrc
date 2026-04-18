# File Upload Setup Guide

This project uses **Better Upload** for simple, direct file uploads to S3-compatible services (AWS S3, Cloudflare R2, etc.).

## Architecture

- **Server**: Hono route that generates presigned URLs via `@better-upload/server`
- **Client**: React components + TanStack Query/Form hooks
- **Storage**: Direct S3 upload (no server processing needed)

## Environment Setup

### Required Variables

Add to `.env` or your hosting provider:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Or use S3-compatible service (Cloudflare R2, MinIO, etc.)
# AWS_ENDPOINT=https://your-endpoint.example.com
```

### AWS S3 Setup

1. Create S3 bucket
2. Create IAM user with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
3. Configure CORS on bucket:
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["https://yourdomain.com", "http://localhost:*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

## Usage

### Image Upload

```tsx
import { ImageUploader } from "@/components/upload";

export function MyComponent() {
  return (
    <ImageUploader
      route="images"
      maxFiles={10}
      maxFileSize={5 * 1024 * 1024} // 5MB
      onSuccess={(urls) => console.log("Uploaded:", urls)}
      onError={(error) => console.error("Failed:", error)}
    />
  );
}
```

### File Upload

```tsx
import { FileUploader } from "@/components/upload";

export function MyComponent() {
  return (
    <FileUploader
      route="documents"
      accept=".pdf,.doc,.docx"
      maxFiles={5}
      onSuccess={(urls) => console.log("Uploaded:", urls)}
    />
  );
}
```

### Form Integration

```tsx
import { FormWithUpload } from "@/components/upload/form-with-upload";

export function MyForm() {
  return (
    <FormWithUpload
      onSubmit={async (data) => {
        // data.images, data.documents, data.title, data.description
        console.log("Form submitted:", data);
      }}
    />
  );
}
```

### Manual Hook Usage

```tsx
import { useUploadFiles, UPLOAD_ROUTES } from "@/components/upload";

export function Custom() {
  const { mutate, isPending } = useUploadFiles(UPLOAD_ROUTES.IMAGES);

  const handleUpload = (files: File[]) => {
    mutate(files, {
      onSuccess: (urls) => console.log("Uploaded:", urls),
    });
  };

  return <button onClick={() => handleUpload([])}>Upload</button>;
}
```

## Upload Routes

Defined in `apps/server/src/routes/upload.ts`:

| Route       | Types           | Max Files | Max Size |
| ----------- | --------------- | --------- | -------- |
| `images`    | image/\*        | 10        | 5MB      |
| `files`     | _/_             | 10        | 50MB     |
| `documents` | PDF, Word, Text | 5         | 10MB     |

Customize routes in the server handler.

## Custom File Types

Add a new route to `apps/server/src/routes/upload.ts`:

```ts
routes: {
  videos: route({
    fileTypes: ['video/mp4', 'video/webm'],
    multipleFiles: true,
    maxFiles: 3,
    maxFileSize: 500 * 1024 * 1024, // 500MB
  }),
}
```

Then use in client:

```tsx
<FileUploader route="videos" accept=".mp4,.webm" />
```

## Error Handling

Files are validated:

- **Type check**: Against allowed MIME types
- **Size check**: Against maxFileSize
- **Count check**: Cannot exceed maxFiles

Errors are displayed in the uploader component. For custom error handling, use the `onError` callback.

## Testing

```bash
# Test upload endpoint
curl -X POST \
  -F "file=@test.jpg" \
  http://localhost:3000/api/upload/images
```

## Performance Tips

1. **Compress images** before upload
2. **Use webp** for better compression
3. **Chunk large files** for multipart upload (configured in Better Upload)
4. **Cache URLs** with TanStack Query (already configured)

## Security

- ✅ CORS configured
- ✅ Presigned URLs (expire after time limit)
- ✅ File type validation (client + server)
- ✅ File size limits
- ✅ Direct S3 upload (no server processing)

Optional additions:

- Add authentication middleware to upload route
- Scan uploaded files with antivirus
- Validate EXIF data on images
