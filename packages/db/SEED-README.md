# Seed Scripts - Season 2025

This directory contains seed scripts for populating the database with test data for Season 2025.

## Available Scripts

### 1. Full Seed (`seed-season-2025.ts`)
Complete seed with all 3 events, 40 teams, 5 members per team, and full registration flow simulation.

```bash
bun run seed:2025
```

**What it creates:**
- Season 2025 with theme "RoboChallenge: Future Innovators"
- 3 Regional/National events
- 40 teams with unique names
- 200 users (5 per team: 1 mentor, 1 leader, 3 members)
- Registration forms for each event
- Complete registration flow with realistic status transitions
- Review actions and registration revisions

**Registration Status Distribution:**
- 60% - Straightforward approval (draft → submitted → under_review → approved)
- 20% - Needed revision then approved
- 10% - Still in review
- 10% - Denied

### 2. Quick Seed (`seed-2025-quick.ts`)
Faster seed for development with a single event and simplified data.

```bash
bun run seed:2025:quick
```

**What it creates:**
- Season 2025
- 1 test event
- 40 teams with 5 members each (200 users total)
- Pre-configured registrations (75% approved, 20% in review, 5% denied)

### 3. Mock Tournament (`mock-tournament.ts`)
Original mock tournament for sync testing (Season 2026).

```bash
bun run seed:2025:mock
```

### 4. Registration Simulation (`simulate-registration.ts`)
Interactive script that simulates the registration approval process step by step.

```bash
bun run simulate:registration
```

**Features:**
- Visual step-by-step registration flow
- Realistic timing with configurable delays
- Batch processing of teams
- Summary statistics at the end

## Events in Season 2025

| Event | Code | Location | Dates |
|-------|------|----------|-------|
| Regional Championship - HCM | REG-HCM | Ho Chi Minh City | Aug 15-17, 2025 |
| Regional Championship - Hanoi | REG-HN | Hanoi | Sep 5-7, 2025 |
| National Championship | NAT-2025 | Da Nang | Oct 20-22, 2025 |

## Team Structure

Each team consists of:
- **1 Mentor** (user_type: MENTOR)
- **1 Team Leader** (user_type: PARTICIPANT)
- **3 Team Members** (user_type: PARTICIPANT)

## Database Schema

The seed scripts populate the following tables:
- `season` - Season information
- `event` - Competition events
- `event_registration_form_version` - Registration forms
- `user` - User accounts
- `account` - Authentication accounts
- `organization` - Team organizations
- `team` - Team information
- `team_membership` - Team member assignments
- `member` - Organization memberships
- `registration` - Event registrations
- `registration_revision` - Registration form submissions
- `registration_review_action` - Review status changes
- `event_team_profile` - Approved team profiles

## Environment Variables

Make sure the following environment variables are set in `apps/server/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nrc_db
```

## Troubleshooting

### "No events found" error
Run the seed script first before running the simulation.

### "Duplicate key" errors
The scripts use `onConflictDoNothing()` for idempotency. You can safely re-run them.

### Slow performance
For faster seeding, use the quick seed script (`seed:2025:quick`).

## Development

To modify the seed data:

1. Edit the configuration constants at the top of each script
2. Modify the data generation functions as needed
3. Run the script again

The scripts are designed to be idempotent - running them multiple times will not create duplicate data.
