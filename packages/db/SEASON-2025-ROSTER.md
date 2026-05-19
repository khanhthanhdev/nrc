# Season 2025 - Team Roster

## Overview
- **Season**: 2025 - RoboChallenge: Future Innovators
- **Total Teams**: 40
- **Members per Team**: 5 (1 Mentor + 1 Leader + 3 Members)
- **Total Users**: 200

## Events

| # | Event Name | Code | Location | Dates |
|---|------------|------|----------|-------|
| 1 | Regional Championship - Ho Chi Minh City | REG-HCM | Ho Chi Minh City | Aug 15-17, 2025 |
| 2 | Regional Championship - Hanoi | REG-HN | Hanoi | Sep 5-7, 2025 |
| 3 | National Championship 2025 | NAT-2025 | Da Nang | Oct 20-22, 2025 |

## Team List

| # | Team Number | Team Name | School/Organization | City |
|---|-------------|-----------|---------------------|------|
| 1 | 02000 | Thunder Warriors | Tran Dai Nghia High School | Ho Chi Minh City |
| 2 | 02001 | Lightning Bolts | Le Hong Phong High School | Hanoi |
| 3 | 02002 | Storm Riders | Nguyen Thi Minh Khai High School | Da Nang |
| 4 | 02003 | Fire Dragons | Phu Nhuan High School | Hai Phong |
| 5 | 02004 | Ice Phoenix | Gia Dinh High School | Can Tho |
| 6 | 02005 | Shadow Wolves | Bui Thi Xuan High School | Bien Hoa |
| 7 | 02006 | Steel Titans | Nguyen Du High School | Hue |
| 8 | 02007 | Iron Eagles | Vo Truong Toan High School | Nha Trang |
| 9 | 02008 | Neon Tigers | Le Quy Don High School | Buon Ma Thuot |
| 10 | 02009 | Cyber Hawks | Hanoi Amsterdam High School | Quy Nhon |
| 11 | 02010 | Quantum Leopards | Chu Van An High School | Vung Tau |
| 12 | 02011 | Alpha Bears | Kim Lien High School | Nam Dinh |
| 13 | 02012 | Beta Lions | Nguyen Hue High School | Phan Thiet |
| 14 | 02013 | Gamma Sharks | Tran Phu High School | Long Xuyen |
| 15 | 02014 | Delta Vipers | Ly Thuong Kiet High School | Thai Nguyen |
| 16 | 02015 | Epsilon Cobras | Hung Vuong High School | Thanh Hoa |
| 17 | 02016 | Zeta Panthers | Quoc Hoc High School | Rach Gia |
| 18 | 02017 | Theta Raptors | Hai Ba Trung High School | Ha Long |
| 19 | 02018 | Iota Griffins | Trung Vuong High School | Vinh |
| 20 | 02019 | Kappa Kraken | Nguyen Trai High School | My Tho |
| 21 | 02020 | Lambda Lakers | FPT University | Ho Chi Minh City |
| 22 | 02021 | Mu Mustangs | RMIT Vietnam | Hanoi |
| 23 | 02022 | Nu Navigators | VinUniversity | Da Nang |
| 24 | 02023 | Xi Xpress | Vietnam National University | Hai Phong |
| 25 | 02024 | Omicron Owls | Ho Chi Minh City University of Technology | Can Tho |
| 26 | 02025 | Pi Pirates | Da Nang University | Bien Hoa |
| 27 | 02026 | Rho Rockets | Can Tho University | Hue |
| 28 | 02027 | Sigma Spartans | Thai Nguyen University | Nha Trang |
| 29 | 02028 | Tau Tigers | Hue University | Buon Ma Thuot |
| 30 | 02029 | Upsilon Unicorns | Industrial University of Ho Chi Minh City | Quy Nhon |
| 31 | 02030 | Phi Phantoms | Tran Dai Nghia High School | Vung Tau |
| 32 | 02031 | Chi Chargers | Le Hong Phong High School | Nam Dinh |
| 33 | 02032 | Psi Panthers | Nguyen Thi Minh Khai High School | Phan Thiet |
| 34 | 02033 | Omega Owls | Phu Nhuan High School | Long Xuyen |
| 35 | 02034 | Apex Predators | Gia Dinh High School | Thai Nguyen |
| 36 | 02035 | Binary Bandits | Bui Thi Xuan High School | Thanh Hoa |
| 37 | 02036 | Code Crusaders | Nguyen Du High School | Rach Gia |
| 38 | 02037 | Data Dragons | Vo Truong Toan High School | Ha Long |
| 39 | 02038 | Error Eagles | Le Quy Don High School | Vinh |
| 40 | 02039 | Format Falcons | Hanoi Amsterdam High School | My Tho |

## Team Member Structure

Each team has 5 members with the following roles:

| Role | User Type | Count | Description |
|------|-----------|-------|-------------|
| TEAM_MENTOR | MENTOR | 1 | Adult mentor/coach |
| TEAM_LEADER | PARTICIPANT | 1 | Team captain |
| TEAM_MEMBER | PARTICIPANT | 3 | Team members |

## Registration Status Distribution

For each event, registrations follow this distribution:

| Status | Percentage | Description |
|--------|------------|-------------|
| Approved | 60% | Straightforward approval |
| Approved (after revision) | 20% | Needed changes, then approved |
| Under Review | 10% | Still being reviewed |
| Denied | 10% | Did not meet requirements |

## Sample User Accounts

### Login Credentials (Development Only)
All accounts use the password: `password123` (hashed in database)

**Format**: `{role}-{teamIndex}@nrc-2025.example.com`

**Examples**:
- Mentor: `mentor-0@nrc-2025.example.com`
- Leader: `leader-0@nrc-2025.example.com`
- Member: `member-0-0@nrc-2025.example.com`, `member-0-1@nrc-2025.example.com`, `member-0-2@nrc-2025.example.com`

## Database Relationships

```
Season (2025)
  └── Events (3)
       ├── Registration Form
       └── Registrations (40 per event)
            ├── Team
            │    ├── Organization
            │    └── Memberships (5)
            │         └── User
            ├── Revisions (1-2)
            └── Review Actions (2-4)
```

## Quick Commands

```bash
# Full seed with all events
bun run seed:2025

# Quick seed with single event
bun run seed:2025:quick

# Simulate registration process
bun run simulate:registration
```
