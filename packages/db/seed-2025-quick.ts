import { resolve } from "node:path";
import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";

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

const SEASON_YEAR = "2025";
const SEASON_ID = "season-2025";
const TEAM_COUNT = 40;
const MEMBERS_PER_TEAM = 5;
const EVENT = {
  id: "event-2025-quick",
  code: "QUICK",
  name: "Quick Test Event 2025",
  location: "Ho Chi Minh City",
  venue: "Test Arena",
  startsAt: new Date("2025-08-15T09:00:00.000Z"),
  endsAt: new Date("2025-08-17T18:00:00.000Z"),
  regStartsAt: new Date("2025-06-01T10:00:00.000Z"),
  regEndsAt: new Date("2025-07-15T23:59:59.000Z"),
};

async function quickSeed() {
  console.log("Quick seeding Season 2025...");
  const now = new Date();

  // Generate data
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

  for (let i = 0; i < TEAM_COUNT; i++) {
    const teamNum = (2000 + i).toString().padStart(5, "0");
    const teamId = `team-q-${teamNum}`;
    const orgId = `org-q-${teamNum}`;

    orgsData.push({ id: orgId, name: `Team ${i + 1}`, slug: `team-q-${teamNum}`, teamNumber: teamNum });
    teamsData.push({
      id: teamId, name: `Team ${i + 1}`, teamNumber: teamNum,
      organizationId: orgId, schoolOrOrganization: `School ${i + 1}`,
      cityOrProvince: `City ${i + 1}`, description: `Quick test team ${i + 1}`,
    });

    for (let j = 0; j < MEMBERS_PER_TEAM; j++) {
      const userId = `user-q-${teamNum}-${j}`;
      const role = j === 0 ? "TEAM_MENTOR" : j === 1 ? "TEAM_LEADER" : "TEAM_MEMBER";

      const memberIdx = j === 0 ? "mentor" : j === 1 ? "leader" : `member-${j - 1}`;
      usersData.push({
        id: userId, name: `Member ${j + 1} of Team ${i + 1}`,
        email: `${memberIdx}-${i}@quick.example.com`,
        emailVerified: true, userType: j === 0 ? "MENTOR" : "PARTICIPANT",
        organizationOrSchool: `School ${i + 1}`, city: `City ${i + 1}`,
        phone: `090${i.toString().padStart(4, "0")}${j.toString().padStart(3, "0")}`,
        dateOfBirth: j === 0 ? "1985-01-15" : `200${5 + j}-01-15`,
        status: "ACTIVE", systemRole: "USER",
        onboardingCompleted: true, preferredLocale: "vi",
      });

      accountsData.push({
        id: `account-q-${teamNum}-${j}`, accountId: `${memberIdx}-${i}@quick.example.com`,
        providerId: "credential", userId,
        password: "$2a$10$dummyhashedpasswordforseeding",
      });

      membershipsData.push({ id: `membership-q-${teamNum}-${j}`, teamId, userId, role, isActive: true });
      orgMembersData.push({ id: `org-member-q-${teamNum}-${j}`, organizationId: orgId, userId, role: j === 0 ? "admin" : "member" });
    }

    // Registration
    const regId = `reg-q-${teamNum}`;
    const isApproved = i < 30;
    const isDenied = i >= 38;
    const finalStatus = isApproved ? "approved" : isDenied ? "denied" : "under_review";

    registrationsData.push({
      id: regId, eventId: EVENT.id, teamId,
      formVersionId: `form-${EVENT.id}-v1`, status: finalStatus,
      currentRevisionNumber: 1, createdByUserId: `user-q-${teamNum}-1`,
      createdAt: now, submittedAt: now,
      reviewedAt: isApproved || isDenied ? now : null,
      approvedAt: isApproved ? now : null,
      deniedAt: isDenied ? now : null,
    });

    revisionsData.push({
      id: `${regId}-rev-1`, registrationId: regId, revisionNumber: 1,
      payload: { teamName: `Team ${i + 1}`, agreement: true },
      submittedByUserId: `user-q-${teamNum}-1`, submittedAt: now,
    });

    actionsData.push({
      id: `${regId}-action-1`, registrationId: regId, actionType: "submitted",
      previousStatus: "draft", nextStatus: "submitted",
      actorUserId: `user-q-${teamNum}-1`, isVisibleToTeam: true, createdAt: now,
    });

    if (isApproved) {
      actionsData.push({
        id: `${regId}-action-2`, registrationId: regId, actionType: "approved",
        previousStatus: "under_review", nextStatus: "approved",
        comment: "Approved!", isVisibleToTeam: true, createdAt: now,
      });
      profilesData.push({
        id: `profile-q-${teamNum}`, eventId: EVENT.id, teamId,
        contactSummary: `Leader of Team ${i + 1}`, pitLabel: `P${(i + 1).toString().padStart(2, "0")}`,
      });
    } else if (isDenied) {
      actionsData.push({
        id: `${regId}-action-2`, registrationId: regId, actionType: "denied",
        previousStatus: "under_review", nextStatus: "denied",
        comment: "Denied", isVisibleToTeam: true, createdAt: now,
      });
    }
  }

  // Execute
  await db.transaction(async (tx) => {
    console.log("Cleaning...");
    const allUserIds = usersData.map(u => u.id);
    const allTeamIds = teamsData.map(t => t.id);
    const allOrgIds = orgsData.map(o => o.id);
    const allRegIds = registrationsData.map(r => r.id);

    await tx.delete(registrationReviewActionTable).where(inArray(registrationReviewActionTable.registrationId, allRegIds));
    await tx.delete(registrationRevisionTable).where(inArray(registrationRevisionTable.registrationId, allRegIds));
    await tx.delete(eventTeamProfileTable).where(eq(eventTeamProfileTable.eventId, EVENT.id));
    await tx.delete(registrationTable).where(eq(registrationTable.eventId, EVENT.id));
    await tx.delete(eventRegistrationFormVersionTable).where(eq(eventRegistrationFormVersionTable.eventId, EVENT.id));
    await tx.delete(eventTable).where(eq(eventTable.id, EVENT.id));
    await tx.delete(teamMembership).where(inArray(teamMembership.teamId, allTeamIds));
    await tx.delete(member).where(inArray(member.organizationId, allOrgIds));
    await tx.delete(account).where(inArray(account.userId, allUserIds));
    await tx.delete(team).where(inArray(team.id, allTeamIds));
    await tx.delete(organization).where(inArray(organization.id, allOrgIds));
    await tx.delete(user).where(inArray(user.id, allUserIds));
    await tx.delete(seasonTable).where(eq(seasonTable.year, SEASON_YEAR));

    console.log("Inserting...");
    await tx.insert(user).values(usersData).onConflictDoNothing();
    await tx.insert(account).values(accountsData).onConflictDoNothing();
    await tx.insert(organization).values(orgsData).onConflictDoNothing();
    await tx.insert(team).values(teamsData).onConflictDoNothing();
    await tx.insert(teamMembership).values(membershipsData).onConflictDoNothing();
    await tx.insert(member).values(orgMembersData).onConflictDoNothing();
    await tx.insert(seasonTable).values({
      id: SEASON_ID, year: SEASON_YEAR, theme: "Quick Test",
      description: "Quick test seed", gameCode: "NRC-2025", isActive: true,
    }).onConflictDoNothing();
    await tx.insert(eventTable).values({
      id: EVENT.id, name: EVENT.name, eventCode: EVENT.code,
      eventKey: `${SEASON_YEAR}/${EVENT.code}`, season: SEASON_YEAR,
      description: "Quick test event", summary: "For testing",
      location: EVENT.location, venue: EVENT.venue,
      eventStartsAt: EVENT.startsAt, eventEndsAt: EVENT.endsAt,
      registrationStartsAt: EVENT.regStartsAt, registrationEndsAt: EVENT.regEndsAt,
      maxParticipants: 40, status: "registration_open", timezone: "Asia/Ho_Chi_Minh",
    }).onConflictDoNothing();
    await tx.insert(eventRegistrationFormVersionTable).values({
      id: `form-${EVENT.id}-v1`, eventId: EVENT.id, versionNumber: 1,
      isPublished: true, publishedAt: now,
      definition: { fields: [{ id: "agreement", label: "I agree", type: "checkbox", required: true }] },
    }).onConflictDoNothing();
    await tx.insert(registrationTable).values(registrationsData).onConflictDoNothing();
    await tx.insert(registrationRevisionTable).values(revisionsData).onConflictDoNothing();
    await tx.insert(registrationReviewActionTable).values(actionsData).onConflictDoNothing();
    await tx.insert(eventTeamProfileTable).values(profilesData).onConflictDoNothing();
  });

  console.log("\n" + "=".repeat(50));
  console.log("QUICK SEED COMPLETE");
  console.log("=".repeat(50));
  console.log(`Teams: ${TEAM_COUNT}`);
  console.log(`Users: ${usersData.length}`);
  console.log(`Approved: 30, In Review: 8, Denied: 2`);
  console.log("=".repeat(50));
}

try {
  await quickSeed();
  process.exit(0);
} catch (error) {
  console.error("Quick seed failed:", error);
  process.exit(1);
}
