# Deployment Guide

## Prerequisites

- **EC2 Instance:** Linux-based, Docker and Docker Compose installed
- **GitHub:** Environments (`staging`, `production`) and repository secrets configured
- **Domain:** DNS A records pointing to EC2 instance public IP
- **Let's Encrypt:** Email for certificate notifications

## Environment Setup

### 1. EC2 Host Configuration

SSH into your EC2 instance and:

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Create project directory
mkdir -p /opt/nrc
cd /opt/nrc
```

### 2. GitHub Secrets & Variables

Configure per environment (`staging` and `production`):

**Secrets:**
- `EC2_HOST` - EC2 public IP or hostname
- `EC2_SSH_KEY` - Private SSH key for EC2 access
- `SERVER_ENV` - Server environment variables (see [.env.example](./.env.example))
- `WEB_ENV` - Web environment variables (see [.env.example](./.env.example))

**Variables:**
- `DOMAIN` - Primary domain (e.g., `staging.example.com` or `example.com`)
- `EC2_USER` - SSH user (default: `ubuntu`)
- `PROJECT_PATH` - Deployment path (default: `/opt/nrc`)

### 3. Environment Variables

Create `.env` file on EC2 from template:

```bash
cp .env.example .env
```

**Key Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `WEB_DOMAIN` | Frontend domain | `staging.example.com` |
| `API_DOMAIN` | API domain | `api-staging.example.com` |
| `ACME_EMAIL` | Let's Encrypt email | `admin@example.com` |
| `POSTGRES_DB` | Database name | `nrc` |
| `POSTGRES_USER` | DB user | `postgres` |
| `POSTGRES_PASSWORD` | DB password | *(secure random)* |
| `POSTGRES_PORT` | DB port | `5432` |
| `SERVER_PORT` | Server port (internal) | `3000` |
| `DATABASE_URL` | Postgres connection | `postgresql://user:pass@postgres:5432/nrc` |
| `BETTER_AUTH_SECRET` | Auth secret | *(secure random, min 32 chars)* |
| `BETTER_AUTH_URL` | Auth callback URL | `https://api-staging.example.com` |
| `CORS_ORIGIN` | CORS allowed origin | `https://staging.example.com` |
| `WEB_PORT` | Web port (internal) | `3000` |
| `VITE_API_URL` | Frontend API URL | `https://api-staging.example.com` |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | *(IAM credentials)* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret | *(IAM credentials)* |
| `AWS_S3_BUCKET` | S3 bucket name | `nrc-staging-bucket` |

## Deployment Workflow

### 1. Automated CI/CD

Deployments trigger automatically on:
- Push to `main` → `staging` environment
- Push to `production` branch → `production` environment

**Workflow Steps:**
1. Build Docker images with tag `${branch}-${commit_sha}`
2. Push to GitHub Container Registry (GHCR)
3. SSH into EC2, sync code, write `.env`
4. Pull images and restart containers via `scripts/release.sh`
5. Health check via curl to public domain

### 2. Manual Deployment

Trigger workflow manually in GitHub Actions:

```bash
# Via GitHub UI: Actions → Deploy → Run workflow → Select environment
```

### 3. Rollback

To rollback to a previous deployment:

```bash
# SSH to EC2
ssh -i <key> ubuntu@<host>
cd /opt/nrc

# List available image tags
docker images | grep ghcr.io/khanhthanhdev/nrc

# Update docker-compose.override.yml with previous tag
vi docker-compose.override.yml

# Restart
docker compose up -d
```

## Docker Infrastructure

### Network Architecture

```
┌─────────────────────────────────┐
│         Internet                │
└────────────────┬────────────────┘
                 │
         ┌───────▼────────┐
         │     Caddy      │ (Port 80, 443)
         │   (SSL Term)   │
         └──┬────────┬────┘
            │        │
      ┌─────▼─┐  ┌──▼─────┐
      │  Web  │  │ Server  │
      │:3000  │  │ :3000   │
      └───────┘  └────┬────┘
                      │
                 ┌────▼─────┐
                 │ Postgres  │
                 │ :5432     │
                 │(internal) │
                 └───────────┘
```

**Networks:**
- `edge` - Public (Caddy, web, server)
- `internal` - Isolated (Postgres, no egress)

### Security Features

- **Read-only filesystem** with `/tmp` tmpfs
- **No new privileges** and dropped capabilities
- **Resource limits** (CPU/memory)
- **Healthchecks** with service dependencies
- **Non-root user** (bun:bun)

## Domain Configuration

### DNS Setup

Point your domain to EC2 public IP:

```
WEB_DOMAIN         A → <EC2_IP>
API_DOMAIN         A → <EC2_IP>
```

### Caddy Configuration

Caddyfile automatically:
- ✅ Obtains SSL certs (Let's Encrypt)
- ✅ Redirects HTTP → HTTPS
- ✅ Enables HSTS
- ✅ Adds security headers
- ✅ Routes requests to services

**Routing:**
- `WEB_DOMAIN` → web:3000
- `API_DOMAIN` → server:3000

## Troubleshooting

### Check Deployment Status

```bash
# SSH to EC2
ssh -i <key> ubuntu@<host>

# View container logs
docker compose logs -f <service>

# Check health
docker compose ps
curl https://<WEB_DOMAIN>
curl https://<API_DOMAIN>
```

### Common Issues

| Issue | Solution |
|-------|----------|
| SSL cert failed | Check `ACME_EMAIL`, domain DNS, port 80/443 open |
| DB connection error | Verify `DATABASE_URL`, ensure `postgres` service is healthy |
| CORS errors | Check `CORS_ORIGIN` matches `WEB_DOMAIN` |
| Image pull failed | Verify GHCR credentials in EC2 Docker config |

### View Logs

```bash
# Caddy
docker compose logs caddy -f

# Server (API)
docker compose logs server -f

# Web (Frontend)
docker compose logs web -f

# Database
docker compose logs postgres -f
```

## Local Development

For local testing before deployment:

```bash
# Use docker-compose.override.yml
docker compose -f docker-compose.yml -f docker-compose.override.yml up

# Env file for local dev
cp .env.example .env
# Edit .env with local values (localhost domains, local AWS creds, etc.)
```

## References

- [Architecture Overview](./system-architecture.md)
- [Docker Configuration](../docker-compose.yml)
- [GitHub Actions Workflows](./.github/workflows/)
- [Environment Variables](./.env.example)
