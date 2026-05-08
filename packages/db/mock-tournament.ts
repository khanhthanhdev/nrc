import { resolve } from "node:path";
import { config } from "dotenv";
import { inArray } from "drizzle-orm";

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
  seasonTable,
  syncEventPolicy,
  team,
} = await import("./src/schema/index.js");

const SEASON_YEAR = "2026";
const SEASON_ID = "mock-season-2026";
const EVENT_ID = "mock-event-local-sync-2026";
const EVENT_CODE = "MOCK26";
const EVENT_KEY = `${SEASON_YEAR}/${EVENT_CODE}`;
const FORM_VERSION_ID = "mock-event-local-sync-2026-form-v1";
const TEAM_COUNT = 40;
const TEAM_NUMBER_START = 100;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle transaction type is inferred from runtime import.
type TransactionDB = any;

interface SeedTeam {
  cityOrProvince: string;
  id: string;
  name: string;
  organizationId: string;
  organizationSlug: string;
  schoolOrOrganization: string;
  teamNumber: string;
}

const TEAM_NAMES = [
  "Thunder Warriors",
  "Lightning Bolts",
  "Storm Riders",
  "Fire Dragons",
  "Ice Phoenix",
  "Shadow Wolves",
  "Steel Titans",
  "Iron Eagles",
  "Neon Tigers",
  "Cyber Hawks",
  "Quantum Leopards",
  "Alpha Bears",
  "Beta Lions",
  "Gamma Sharks",
  "Delta Vipers",
  "Epsilon Cobras",
  "Zeta Panthers",
  "Theta Raptors",
  "Iota Griffins",
  "Kappa Kraken",
  "Lambda Lakers",
  "Mu Mustangs",
  "Nu Navigators",
  "Xi Xpress",
  "Omicron Owls",
  "Pi Pirates",
  "Rho Rockets",
  "Sigma Spartans",
  "Tau Tigers",
  "Upsilon Unicorns",
  "Phi Phantoms",
  "Chi Chargers",
  "Psi Panthers",
  "Omega Owls",
  "Apex Apexes",
  "Binary Bandits",
  "Code Crusaders",
  "Data Dragons",
  "Error Eagles",
  "Format Falcons",
];

function generateTeams(count: number): SeedTeam[] {
  return Array.from({ length: count }, (_, index) => {
    const number = TEAM_NUMBER_START + index;
    const name = TEAM_NAMES[index] ?? `Team ${number}`;
    const teamNumber = number.toString().padStart(5, "0");

    return {
      cityOrProvince: `City ${number}`,
      id: `mock-team-${teamNumber}`,
      name,
      organizationId: `mock-org-${teamNumber}`,
      organizationSlug: `mock-team-${teamNumber}`,
      schoolOrOrganization: `Mock School ${number}`,
      teamNumber,
    };
  });
}

async function createTeams(tx: TransactionDB, teams: SeedTeam[]) {
  await tx.insert(organization).values(
    teams.map((seedTeam) => ({
      id: seedTeam.organizationId,
      name: seedTeam.name,
      slug: seedTeam.organizationSlug,
      teamNumber: seedTeam.teamNumber,
    })),
  );

  await tx.insert(team).values(
    teams.map((seedTeam) => ({
      cityOrProvince: seedTeam.cityOrProvince,
      id: seedTeam.id,
      name: seedTeam.name,
      organizationId: seedTeam.organizationId,
      schoolOrOrganization: seedTeam.schoolOrOrganization,
      teamNumber: seedTeam.teamNumber,
    })),
  );
}

async function createRegistrations(tx: TransactionDB, teams: SeedTeam[], now: Date) {
  await tx.insert(registrationTable).values(
    teams.map((seedTeam) => ({
      approvedAt: now,
      createdAt: now,
      currentRevisionNumber: 1,
      eventId: EVENT_ID,
      formVersionId: FORM_VERSION_ID,
      id: `mock-registration-${seedTeam.teamNumber}`,
      reviewedAt: now,
      status: "approved" as const,
      submittedAt: now,
      teamId: seedTeam.id,
      updatedAt: now,
    })),
  );

  await tx.insert(eventTeamProfileTable).values(
    teams.map((seedTeam, index) => ({
      contactSummary: `Lead mentor for team ${seedTeam.teamNumber}`,
      createdAt: now,
      eventId: EVENT_ID,
      id: `mock-event-team-profile-${seedTeam.teamNumber}`,
      pitLabel: `P${(index + 1).toString().padStart(2, "0")}`,
      specialRequirements: null,
      teamId: seedTeam.id,
      updatedAt: now,
    })),
  );
}

async function seed() {
  console.log("Seeding 2026 local sync event...");

  const teams = generateTeams(TEAM_COUNT);
  const now = new Date();

  await db.transaction(async (tx) => {
    console.log("Cleaning previous mock local sync data...");

    await tx
      .delete(eventTeamProfileTable)
      .where(inArray(eventTeamProfileTable.eventId, [EVENT_ID]));
    await tx.delete(registrationTable).where(inArray(registrationTable.eventId, [EVENT_ID]));
    await tx
      .delete(eventRegistrationFormVersionTable)
      .where(inArray(eventRegistrationFormVersionTable.eventId, [EVENT_ID]));
    await tx.delete(syncEventPolicy).where(inArray(syncEventPolicy.eventKey, [EVENT_KEY]));
    await tx.delete(eventTable).where(inArray(eventTable.id, [EVENT_ID]));
    await tx.delete(team).where(
      inArray(
        team.id,
        teams.map((seedTeam) => seedTeam.id),
      ),
    );
    await tx.delete(organization).where(
      inArray(
        organization.id,
        teams.map((seedTeam) => seedTeam.organizationId),
      ),
    );

    console.log(`Creating season ${SEASON_YEAR}...`);
    await tx
      .insert(seasonTable)
      .values({
        createdAt: now,
        description: "Mock season for local app sync testing.",
        gameCode: "ITD-2026",
        id: SEASON_ID,
        isActive: true,
        theme: "Into the Deep",
        updatedAt: now,
        year: SEASON_YEAR,
      })
      .onConflictDoUpdate({
        target: seasonTable.year,
        set: {
          description: "Mock season for local app sync testing.",
          gameCode: "ITD-2026",
          isActive: true,
          theme: "Into the Deep",
          updatedAt: now,
        },
      });

    console.log(`Creating ${TEAM_COUNT} teams...`);
    await createTeams(tx, teams);

    console.log("Creating event...");
    await tx.insert(eventTable).values({
      createdAt: now,
      description: "Seed event for local app sync bootstrap and push testing.",
      eventCode: EVENT_CODE,
      eventEndsAt: new Date("2026-07-12T16:00:00.000Z"),
      eventKey: EVENT_KEY,
      eventStartsAt: new Date("2026-07-10T09:00:00.000Z"),
      id: EVENT_ID,
      location: "Ho Chi Minh City",
      maxParticipants: TEAM_COUNT,
      name: "Local Sync Test Event 2026",
      registrationEndsAt: new Date("2026-06-20T10:00:00.000Z"),
      registrationStartsAt: new Date("2026-05-20T10:00:00.000Z"),
      season: SEASON_YEAR,
      status: "active",
      summary: "A 40-team event with approved registrations for sync testing.",
      timezone: "Asia/Ho_Chi_Minh",
      updatedAt: now,
      venue: "Virtual Arena",
    });

    console.log("Creating published registration form...");
    await tx.insert(eventRegistrationFormVersionTable).values({
      createdAt: now,
      definition: {
        fields: [
          { id: "contactName", label: "Contact name", required: true, type: "text" },
          { id: "contactPhone", label: "Contact phone", required: true, type: "text" },
        ],
      },
      eventId: EVENT_ID,
      id: FORM_VERSION_ID,
      isPublished: true,
      publishedAt: now,
      updatedAt: now,
      versionNumber: 1,
    });

    console.log(`Registering ${TEAM_COUNT} approved teams...`);
    await createRegistrations(tx, teams, now);

    console.log("Creating sync policy...");
    await tx.insert(syncEventPolicy).values({
      allowedPushResources: [
        "inspection_schedule",
        "inspection_results",
        "match_schedule",
        "match_results",
        "team_rankings",
        "team_awards",
      ],
      eventKey: EVENT_KEY,
      id: "mock-sync-policy-local-sync-2026",
      isSyncEnabled: true,
      reviewMode: "AUTO_ACCEPT",
      scheduleOwner: "LOCAL_APP",
      updatedAt: now,
    });
  });

  console.log("Seed completed.");
  console.log(`Event: ${SEASON_YEAR}/${EVENT_CODE}`);
  console.log(`Event key: ${EVENT_KEY}`);
  console.log(`Registered teams: ${TEAM_COUNT}`);
}

try {
  await seed();
  process.exit(0);
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
