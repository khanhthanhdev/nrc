# AWS S3 Setup Guide for NRC Web

**Last Updated:** 2026-03-29

---

## Overview

This guide covers AWS S3 setup for file uploads in the NRC Web platform using Better Upload.

---

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured (`aws configure`)
- IAM permissions to create S3 buckets and IAM users

---

## Step 1: Create S3 Bucket

### Via AWS Console

1. Navigate to [S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click **"Create bucket"**
3. **Bucket name:** `nrc-web-uploads`
4. **Region:** `US East (N. Virginia) us-east-1`
5. **Bucket Versioning:** Enable (recommended)
6. **Block Public Access:** Keep all blocked (we use presigned URLs)
7. Click **"Create bucket"**

### Via AWS CLI

```bash
aws s3 mb s3://nrc-web-uploads --region us-east-1
```

---

## Step 2: Configure CORS

CORS is required for browser-based uploads to S3.

### Create CORS Configuration File

Create `cors-config.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3001", "http://localhost:3000", "https://nrc.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Apply CORS Configuration

```bash
aws s3api put-bucket-cors \
  --bucket nrc-web-uploads \
  --cors-configuration file://cors-config.json
```

### Verify CORS

```bash
aws s3api get-bucket-cors --bucket nrc-web-uploads
```

---

## Step 3: Create IAM User

### Via AWS Console

1. Navigate to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → **"Create user"**
3. **User name:** `nrc-web-s3-uploader`
4. Select **"Attach policies directly"**
5. Click **"Create policy"** (opens new tab)

### Create IAM Policy

In the new tab:

1. Choose **"JSON"** tab
2. Paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBucketOperations",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::nrc-web-uploads"
    },
    {
      "Sid": "AllowObjectOperations",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::nrc-web-uploads/*"
    }
  ]
}
```

3. Click **"Next"**
4. **Policy name:** `nrc-web-s3-uploader-policy`
5. Click **"Create policy"**

### Attach Policy to User

Back in user creation:

1. Refresh policies list
2. Search for `nrc-web-s3-uploader-policy`
3. Check the policy
4. Click **"Next"** → **"Create user"**

### Generate Access Keys

1. Click on the new user
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"**
4. Click **"Create access key"**
5. Choose **"Command Line Interface (CLI)"**
6. Copy **Access key ID** and **Secret access key**

---

## Step 4: Configure Environment Variables

### Server Environment

**File:** `apps/server/.env`

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=nrc-web-uploads
```

### Validation

The schema in `packages/env/src/server.ts` validates these as optional. Uploads will use default "nrc-web" bucket if not configured.

---

## Step 5: Test Connection

### Test Upload

```bash
echo "test content" > test.txt

aws s3 cp test.txt s3://nrc-web-uploads/test-upload.txt
```

### Test Download

```bash
aws s3 cp s3://nrc-web-uploads/test-upload.txt ./downloaded.txt
cat downloaded.txt
```

### Test CORS

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://nrc-web-uploads.s3.us-east-1.amazonaws.com/
```

Expected headers:

```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Methods: GET, PUT, POST
```

### Clean Up

```bash
aws s3 rm s3://nrc-web-uploads/test-upload.txt
rm test.txt downloaded.txt
```

---

## Step 6: Lifecycle Rules (Optional)

Set up lifecycle rules to manage storage costs.

### Delete Incomplete Multipart Uploads

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket nrc-web-uploads \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "DeleteIncompleteUploads",
        "Status": "Enabled",
        "Filter": {},
        "AbortIncompleteMultipartUpload": {
          "DaysAfterInitiation": 7
        }
      }
    ]
  }'
```

### Archive Old Files to Glacier (Optional)

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket nrc-web-uploads \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "ArchiveOldFiles",
        "Status": "Enabled",
        "Filter": { "Prefix": "users/" },
        "Transitions": [
          {
            "Days": 90,
            "StorageClass": "GLACIER"
          }
        ]
      }
    ]
  }'
```

---

## Troubleshooting

### CORS Error in Browser Console

**Error:** `Access to fetch at ... has been blocked by CORS policy`

**Solution:**

- Verify CORS configuration: `aws s3api get-bucket-cors --bucket nrc-web-uploads`
- Ensure `AllowedOrigins` matches your frontend URL exactly (including port)
- Clear browser cache and retry

### Access Denied

**Error:** `Access Denied` on upload

**Solution:**

- Check IAM policy has `s3:PutObject` permission
- Verify bucket name in `.env` matches created bucket
- Check AWS region matches

### Invalid Region

**Error:** `InvalidRegion` or `Bucket not found`

**Solution:**

- Ensure `AWS_REGION` matches the bucket's region
- S3 buckets are region-specific

---

## Cost Estimation

As of 2024, S3 pricing (us-east-1):

| Storage Class     | Price per GB/Month |
| ----------------- | ------------------ |
| Standard          | $0.023             |
| Infrequent Access | $0.0125            |
| Glacier           | $0.004             |

**API Requests:**

- PUT/COPY/POST/LIST: $0.005 per 1,000
- GET/SELECT: $0.0004 per 1,000

**Example:** 10,000 uploads/month at 1MB each = ~10GB storage = ~$0.23/month

---

## Security Best Practices

1. **Never commit credentials** - Use environment variables only
2. **Rotate access keys regularly** - Every 90 days recommended
3. **Minimum permissions** - Only grant required S3 actions
4. **Enable bucket versioning** - Protect against accidental deletion
5. **Enable server access logging** - Audit trail for compliance

---

## Related Documentation

- [Better Upload Documentation](https://better-upload.com/docs)
- [AWS S3 CORS Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
