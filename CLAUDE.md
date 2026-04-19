# nrc-full

This file provides context about the project for AI assistants.

## Project Overview

- **Ecosystem**: Typescript

## Tech Stack

- **Runtime**: bun
- **Package Manager**: bun

### Frontend

- Framework: tanstack-start
- CSS: tailwind
- UI Library: shadcn-ui
- State: tanstack-store

### Backend

- Framework: hono
- API: orpc
- Validation: valibot

### Database

- Database: postgres
- ORM: drizzle

### Additional Features

- Testing: vitest-playwright
- Logging: evlog

## Project Structure

```
nrc-full/
├── apps/
│   ├── web/         # Frontend application
│   └── server/      # Backend API
├── packages/
│   ├── api/         # API layer
│   └── db/          # Database schema
```

## Common Commands

- `bun install` - Install dependencies
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun test` - Run tests
- `bun db:push` - Push database schema
- `bun db:studio` - Open database UI

## Maintenance

Keep CLAUDE.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
