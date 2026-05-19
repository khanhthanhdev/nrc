import { resolve } from "node:path";
import { config } from "dotenv";
import { inArray, eq } from "drizzle-orm";

const __dirname = import.meta.dirname;
const projectRoot = resolve(__dirname, "../..");
config({ path: resolve(projectRoot, "apps/server/.env") });

const { db } = await import("./src/index.js");
const {
  eventRegistrationFormVersionTable,
  eventTable,
  eventTeamProfileTable,
  organization,
  registrationTable,
  registrationRevisionTable,
  registrationReviewActionTable,
  seasonTable,
  team,
  teamMembership,
  user,
  member,
  account,
} = await import("./src/schema/index.js");

// ============================================================
// Configuration
// ============================================================

const SEASON_YEAR = "2025";
const SEASON_ID = "season-2025";
const TEAM_COUNT = 40;
const MEMBERS_PER_TEAM = 5;
const TEAM_NUMBER_START = 2000;

const EVENTS = [
  {
    id: "event-2025-regional-hcm",
    code: "REG-HCM",
    name: "Regional Championship - Ho Chi Minh City",
    location: "Ho Chi Minh City",
    venue: "SECC Convention Center",
    startsAt: new Date("2025-08-15T09:00:00.000Z"),
    endsAt: new Date("2025-08-17T18:00:00.000Z"),
    regStartsAt: new Date("2025-06-01T10:00:00.000Z"),
    regEndsAt: new Date("2025-07-15T23:59:59.000Z"),
  },
  {
    id: "event-2025-regional-hn",
    code: "REG-HN",
    name: "Regional Championship - Hanoi",
    location: "Hanoi",
    venue: "National Convention Center",
    startsAt: new Date("2025-09-05T09:00:00.000Z"),
    endsAt: new Date("2025-09-07T18:00:00.000Z"),
    regStartsAt: new Date("2025-06-15T10:00:00.000Z"),
    regEndsAt: new Date("2025-08-01T23:59:59.000Z"),
  },
  {
    id: "event-2025-national",
    code: "NAT-2025",
    name: "National Championship 2025",
    location: "Da Nang",
    venue: "Da Nang Exhibition Center",
    startsAt: new Date("2025-10-20T09:00:00.000Z"),
    endsAt: new Date("2025-10-22T18:00:00.000Z"),
    regStartsAt: new Date("2025-08-01T10:00:00.000Z"),
    regEndsAt: new Date("2025-09-20T23:59:59.000Z"),
  },
];

// ============================================================
// Data Arrays
// ============================================================

const TEAM_NAMES = [
  "Thunder Warriors", "Lightning Bolts", "Storm Riders", "Fire Dragons", "Ice Phoenix",
  "Shadow Wolves", "Steel Titans", "Iron Eagles", "Neon Tigers", "Cyber Hawks",
  "Quantum Leopards", "Alpha Bears", "Beta Lions", "Gamma Sharks", "Delta Vipers",
  "Epsilon Cobras", "Zeta Panthers", "Theta Raptors", "Iota Griffins", "Kappa Kraken",
  "Lambda Lakers", "Mu Mustangs", "Nu Navigators", "Xi Xpress", "Omicron Owls",
  "Pi Pirates", "Rho Rockets", "Sigma Spartans", "Tau Tigers", "Upsilon Unicorns",
  "Phi Phantoms", "Chi Chargers", "Psi Panthers", "Omega Owls", "Apex Predators",
  "Binary Bandits", "Code Crusaders", "Data Dragons", "Error Eagles", "Format Falcons",
];

const CITIES = [
  "Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho",
  "Bien Hoa", "Hue", "Nha Trang", "Buon Ma Thuot", "Quy Nhon",
  "Vung Tau", "Nam Dinh", "Phan Thiet", "Long Xuyen", "Thai Nguyen",
  "Thanh Hoa", "Rach Gia", "Ha Long", "Vinh", "My Tho",
];

const SCHOOLS = [
  "Tran Dai Nghia High School", "Le Hong Phong High School", "Nguyen Thi Minh Khai High School",
  "Phu Nhuan High School", "Gia Dinh High School", "Bui Thi Xuan High School",
  "FPT University", "RMIT Vietnam", "VinUniversity", "Vietnam National University",
];

// ============================================================
// Fast Seed Function
// ============================================================

async function seed() {
  console.log("Fast seeding Season 2025...");
  const now = new Date();

  // Generate all data arrays first (no DB calls)
  const usersData: any[] = [];
  const accountsData: any[] = [];
  const orgsData: any[] = [];
  const teamsData: any[] = [];
  const membershipsData: any[] = [];
  const orgMembersData: any[] = [];
  const registrationsData: any[] = [];
  const revisionsData: any[] = [];
  const actionsData: any[] = [];
  const profilesData: any[] = [];

  // Generate admin reviewers
  for (let i = 0; i < EVENTS.length; i++) {
    const adminId = `admin-reviewer-${i}`;
    usersData.push({
      id: adminId,
      name: `Event Reviewer ${i + 1}`,
      email: `reviewer-${i}@nrc-admin.example.com`,
      emailVerified: true,
      userType: "STAFF",
      organizationOrSchool: "NRC Administration",
      city: "Ho Chi Minh City",
      phone: `090000000${i}`,
      dateOfBirth: "1980-01-01",
      status: "ACTIVE",
      systemRole: "MANAGER",
      onboardingCompleted: true,
      preferredLocale: "en",
    });
    accountsData.push({
      id: `account-${adminId}`,
      accountId: `reviewer-${i}@nrc-admin.example.com`,
      providerId: "credential",
      userId: adminId,
      password: "$2a$10$dummyhashedpasswordforseeding",
    });
  }

  // Generate teams and members
  for (let i = 0; i < TEAM_COUNT; i++) {
    const num = TEAM_NUMBER_START + i;
    const teamNum = num.toString().padStart(5, "0");
    const teamId = `team-2025-${teamNum}`;
    const orgId = `org-2025-${teamNum}`;
    const teamName = TEAM_NAMES[i] ?? `Team ${num}`;
    const city = CITIES[i % CITIES.length];
    const school = SCHOOLS[i % SCHOOLS.length];

    // Organization
    orgsData.push({ id: orgId, name: teamName, slug: `team-2025-${teamNum}`, teamNumber: teamNum });

    // Team
    teamsData.push({
      id: teamId, name: teamName, teamNumber: teamNum,
      organizationId: orgId, schoolOrOrganization: school,
      cityOrProvince: city, description: `${teamName} from ${school}`,
    });

    // Members (mentor, leader, 3 members)
    for (let j = 0; j < MEMBERS_PER_TEAM; j++) {
      const userId = `user-2025-${teamNum}-${j}`;
      const role = j === 0 ? "TEAM_MENTOR" : j === 1 ? "TEAM_LEADER" : "TEAM_MEMBER";
      const userRole = j === 0 ? "MENTOR" : "PARTICIPANT";

      usersData.push({
        id: userId,
        name: `${teamName} ${j === 0 ? "Mentor" : j === 1 ? "Leader" : `Member ${j - 1}`}`,
        email: `member-${i}-${j}@nrc-2025.example.com`,
        emailVerified: true, userType: userRole,
        organizationOrSchool: school, city,
        phone: `090${i.toString().padStart(4, "0")}${j.toString().padStart(3, "0")}`,
        dateOfBirth: j === 0 ? "1985-01-15" : `200${5 + j}-01-15`,
        status: "ACTIVE", systemRole: "USER",
        onboardingCompleted: true, preferredLocale: "vi",
      });

      accountsData.push({
        id: `account-${userId}`, accountId: `member-${i}-${j}@nrc-2025.example.com`,
        providerId: "credential", userId,
        password: "$2a$10$dummyhashedpasswordforseeding",
      });

      membershipsData.push({ id: `membership-${userId}`, teamId, userId, role, isActive: true });
      orgMembersData.push({ id: `org-member-${userId}`, organizationId: orgId, userId, role: j === 0 ? "admin" : "member" });
    }
  }

  // Generate registrations for each event
  for (const event of EVENTS) {
    const formId = `form-${event.id}-v1`;

    for (let i = 0; i < TEAM_COUNT; i++) {
      const num = TEAM_NUMBER_START + i;
      const teamNum = num.toString().padStart(5, "0");
      const teamId = `team-2025-${teamNum}`;
      const regId = `reg-${event.code}-${teamNum}`;
      const leaderId = `user-2025-${teamNum}-1`;
      const rand = Math.random();

      // Determine final status
      let finalStatus: string;
      let statusFlow: string[];
      if (rand < 0.65) {
        finalStatus = "approved";
        statusFlow = ["draft", "submitted", "under_review", "approved"];
      } else if (rand < 0.85) {
        finalStatus = "approved";
        statusFlow = ["draft", "submitted", "under_review", "needs_revision", "submitted", "approved"];
      } else if (rand < 0.95) {
        finalStatus = "under_review";
        statusFlow = ["draft", "submitted", "under_review"];
      } else {
        finalStatus = "denied";
        statusFlow = ["draft", "submitted", "under_review", "denied"];
      }

      const baseTime = new Date(event.regStartsAt.getTime() + Math.random() * 7 * 86400000);
      const submissionCount = statusFlow.filter(s => s === "submitted").length;

      registrationsData.push({
        id: regId, eventId: event.id, teamId, formVersionId: formId,
        status: finalStatus, currentRevisionNumber: submissionCount,
        createdByUserId: leaderId, createdAt: baseTime,
        submittedAt: statusFlow.includes("submitted") ? new Date(baseTime.getTime() + 86400000) : null,
        reviewedAt: statusFlow.includes("under_review") ? new Date(baseTime.getTime() + 259200000) : null,
        approvedAt: finalStatus === "approved" ? new Date(baseTime.getTime() + 432000000) : null,
        deniedAt: finalStatus === "denied" ? new Date(baseTime.getTime() + 432000000) : null,
      });

      // Revisions
      for (let r = 1; r <= submissionCount; r++) {
        revisionsData.push({
          id: `${regId}-rev-${r}`, registrationId: regId, revisionNumber: r,
          payload: { teamName: TEAM_NAMES[i], agreement: true },
          submittedByUserId: leaderId,
          submittedAt: new Date(baseTime.getTime() + r * 86400000),
        });
      }

      // Review actions
      let actionIdx = 0;
      for (let s = 0; s < statusFlow.length - 1; s++) {
        actionIdx++;
        const from = statusFlow[s];
        const to = statusFlow[s + 1];
        const eventIdx = EVENTS.indexOf(event);
        let actorId: string | null = null;
        let actionType = "status_changed";
        let comment: string | null = null;

        if (from === "draft" && to === "submitted") {
          actionType = "submitted";
          actorId = leaderId;
        } else if (to === "needs_revision") {
          actionType = "requested_changes";
          comment = "Please update team roster and consent forms";
          actorId = `admin-reviewer-${eventIdx}`;
        } else if (to === "approved") {
          actionType = "approved";
          comment = "Registration approved!";
          actorId = `admin-reviewer-${eventIdx}`;
        } else if (to === "denied") {
          actionType = "denied";
          comment = "Registration denied";
          actorId = `admin-reviewer-${eventIdx}`;
        }

        actionsData.push({
          id: `${regId}-action-${actionIdx}`,
          registrationId: regId, actionType,
          previousStatus: from, nextStatus: to,
          comment, actorUserId: actorId, revisionId: null,
          isVisibleToTeam: true,
          createdAt: new Date(baseTime.getTime() + actionIdx * 43200000),
        });
      }

      // Profile for approved
      if (finalStatus === "approved") {
        profilesData.push({
          id: `profile-${event.code}-${teamNum}`,
          eventId: event.id, teamId,
          contactSummary: `Leader of ${TEAM_NAMES[i]}`,
          pitLabel: `P${(i + 1).toString().padStart(2, "0")}`,
        });
      }
    }
  }

  // Now execute all inserts in a transaction
  console.log(`Generated: ${usersData.length} users, ${teamsData.length} teams, ${registrationsData.length} registrations`);

  await db.transaction(async (tx) => {
    // Clean
    console.log("Cleaning...");
    const allRegIds = registrationsData.map(r => r.id);
    const allTeamIds = teamsData.map(t => t.id);
    const allOrgIds = orgsData.map(o => o.id);
    const allUserIds = usersData.map(u => u.id);
    const adminIds = EVENTS.map((_, i) => `admin-reviewer-${i}`);

    await tx.delete(registrationReviewActionTable).where(inArray(registrationReviewActionTable.registrationId, allRegIds));
    await tx.delete(registrationRevisionTable).where(inArray(registrationRevisionTable.registrationId, allRegIds));
    await tx.delete(eventTeamProfileTable).where(eq(eventTeamProfileTable.eventId, EVENTS[0].id));
    await tx.delete(registrationTable).where(eq(registrationTable.eventId, EVENTS[0].id));
    await tx.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, EVENTS[0].id));
    await tx.delete(eventTable).where(eq(eventTable.season, SEASON_YEAR));
    await tx.delete(teamMembership).where(inArray(teamMembership.teamId, allTeamIds));
    await tx.delete(member).where(inArray(member.organizationId, allOrgIds));
    await tx.delete(account).where(inArray(account.userId, allUserIds));
    await tx.delete(team).where(inArray(team.id, allTeamIds));
    await tx.delete(organization).where(inArray(organization.id, allOrgIds));
    await tx.delete(user).where(inArray(user.id, allUserIds));
    await tx.delete(account).where(inArray(account.userId, adminIds));
    await tx.delete(user).where(inArray(user.id, adminIds));
    await tx.delete(seasonTable).where(eq(seasonTable.year, SEASON_YEAR));

    // Batch insert
    console.log("Inserting users...");
    await tx.insert(user).values(usersData).onConflictDoNothing();
    
    console.log("Inserting accounts...");
    await tx.insert(account).values(accountsData).onConflictDoNothing();
    
    console.log("Inserting organizations...");
    await tx.insert(organization).values(orgsData).onConflictDoNothing();
    
    console.log("Inserting teams...");
    await tx.insert(team).values(teamsData).onConflictDoNothing();
    
    console.log("Inserting memberships...");
    await tx.insert(teamMembership).values(membershipsData).onConflictDoNothing();
    
    console.log("Inserting org members...");
    await tx.insert(member).values(orgMembersData).onConflictDoNothing();

    // Season
    console.log("Inserting season...");
    await tx.insert(seasonTable).values({
      id: SEASON_ID, year: SEASON_YEAR,
      theme: "RoboChallenge: Future Innovators",
      description: "National Robotics Competition Season 2025",
      gameCode: "NRC-2025", isActive: true,
    }).onConflictDoNothing();

    // Events
    console.log("Inserting events...");
    for (const e of EVENTS) {
      await tx.insert(eventTable).values({
        id: e.id, name: e.name, eventCode: e.code,
        eventKey: `${SEASON_YEAR}/${e.code}`, season: SEASON_YEAR,
        description: `${e.name} - NRC 2025`,
        summary: `Compete at ${e.name}`,
        location: e.location, venue: e.venue,
        eventStartsAt: e.startsAt, eventEndsAt: e.endsAt,
        registrationStartsAt: e.regStartsAt, registrationEndsAt: e.regEndsAt,
        maxParticipants: 40, status: "registration_open", timezone: "Asia/Ho_Chi_Minh",
      }).onConflictDoNothing();

      await tx.insert(eventRegistrationFormVersionTable).values({
        id: `form-${e.id}-v1`, eventId: e.id, versionNumber: 1,
        isPublished: true, publishedAt: now,
        definition: { fields: [{ id: "agreement", label: "I agree", type: "checkbox", required: true }] },
      }).onConflictDoNothing();
    }

    // Registrations
    console.log("Inserting registrations...");
    await tx.insert(registrationTable).values(registrationsData).onConflictDoNothing();
    
    console.log("Inserting revisions...");
    await tx.insert(registrationRevisionTable).values(revisionsData).onConflictDoNothing();
    
    console.log("Inserting review actions...");
    await tx.insert(registrationReviewActionTable).values(actionsData).onConflictDoNothing();
    
    console.log("Inserting profiles...");
    await tx.insert(eventTeamProfileTable).values(profilesData).onConflictDoNothing();
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("SEED COMPLETE - Season 2025");
  console.log("=".repeat(50));
  console.log(`Teams: ${TEAM_COUNT}`);
  console.log(`Users: ${usersData.length}`);
  console.log(`Events: ${EVENTS.length}`);
  console.log(`Registrations: ${registrationsData.length}`);
  console.log(`Approved: ~${Math.round(TEAM_COUNT * 0.65 * EVENTS.length)}`);
  console.log("=".repeat(50));
}

try {
  await seed();
  process.exit(0);
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
