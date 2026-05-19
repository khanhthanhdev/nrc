import { resolve } from "node:path";
import { config } from "dotenv";
import { eq, and, inArray } from "drizzle-orm";

const __dirname = import.meta.dirname;

const projectRoot = resolve(__dirname, "../..");
config({ path: resolve(projectRoot, "apps/server/.env") });

const { db } = await import("./src/index.js");
const {
  registrationTable,
  registrationRevisionTable,
  registrationReviewActionTable,
  eventTable,
  team,
  user,
} = await import("./src/schema/index.js");

// ============================================================
// Configuration
// ============================================================

const SEASON_YEAR = "2025";
const SIMULATION_SPEED_MS = 1000; // Delay between actions for visualization
const BATCH_SIZE = 5; // Process teams in batches

// ============================================================
// Types
// ============================================================

type RegistrationStatus = "draft" | "submitted" | "under_review" | "needs_revision" | "approved" | "denied";

interface RegistrationState {
  registrationId: string;
  eventId: string;
  teamId: string;
  teamLeaderId: string;
  formVersionId: string;
  currentStatus: RegistrationStatus;
  revisionNumber: number;
  createdAt: Date;
}

// ============================================================
// Helper Functions
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTimestamp(state: RegistrationState, hoursOffset: number): Date {
  return new Date(state.createdAt.getTime() + hoursOffset * 60 * 60 * 1000);
}

function logAction(teamName: string, action: string, fromStatus: string, toStatus: string) {
  const arrow = "→";
  console.log(`  [${teamName}] ${action}: ${fromStatus} ${arrow} ${toStatus}`);
}

// ============================================================
// Registration Flow Simulation
// ============================================================

async function simulateRegistrationFlow(state: RegistrationState, teamName: string) {
  const { registrationId, teamLeaderId, eventId } = state;
  
  console.log(`\nSimulating registration for: ${teamName}`);
  console.log(`  Registration ID: ${registrationId}`);
  
  // Step 1: Draft → Submitted
  await sleep(SIMULATION_SPEED_MS);
  
  await db.update(registrationTable)
    .set({ 
      status: "submitted",
      submittedAt: getTimestamp(state, 1),
      currentRevisionNumber: 1,
    })
    .where(eq(registrationTable.id, registrationId));
  
  await db.insert(registrationRevisionTable).values({
    id: `${registrationId}-rev-1`,
    registrationId,
    revisionNumber: 1,
    payload: {
      teamName,
      contactName: "Team Leader",
      contactEmail: "leader@example.com",
      contactPhone: "0901234567",
      schoolName: "Sample School",
      teamSize: 5,
      specialRequirements: "",
      agreement: true,
    },
    submittedByUserId: teamLeaderId,
    submittedAt: getTimestamp(state, 1),
  });
  
  await db.insert(registrationReviewActionTable).values({
    id: `${registrationId}-action-submit`,
    registrationId,
    actionType: "submitted",
    previousStatus: "draft",
    nextStatus: "submitted",
    actorUserId: teamLeaderId,
    isVisibleToTeam: true,
    createdAt: getTimestamp(state, 1),
  });
  
  logAction(teamName, "Submit", "draft", "submitted");
  state.currentStatus = "submitted";
  state.revisionNumber = 1;

  // Step 2: Submitted → Under Review
  await sleep(SIMULATION_SPEED_MS);
  
  await db.update(registrationTable)
    .set({ 
      status: "under_review",
      reviewedAt: getTimestamp(state, 24),
    })
    .where(eq(registrationTable.id, registrationId));
  
  await db.insert(registrationReviewActionTable).values({
    id: `${registrationId}-action-review`,
    registrationId,
    actionType: "status_changed",
    previousStatus: "submitted",
    nextStatus: "under_review",
    comment: "Registration received and assigned to reviewer",
    isVisibleToTeam: true,
    createdAt: getTimestamp(state, 24),
  });
  
  logAction(teamName, "Review Start", "submitted", "under_review");
  state.currentStatus = "under_review";

  // Step 3: Random outcome
  const outcome = Math.random();
  
  if (outcome < 0.6) {
    // 60% → Approved
    await sleep(SIMULATION_SPEED_MS);
    
    await db.update(registrationTable)
      .set({ 
        status: "approved",
        approvedAt: getTimestamp(state, 72),
      })
      .where(eq(registrationTable.id, registrationId));
    
    await db.insert(registrationReviewActionTable).values({
      id: `${registrationId}-action-approve`,
      registrationId,
      actionType: "approved",
      previousStatus: "under_review",
      nextStatus: "approved",
      comment: "Registration approved. Welcome to the competition!",
      isVisibleToTeam: true,
      createdAt: getTimestamp(state, 72),
    });
    
    logAction(teamName, "Approve", "under_review", "approved");
    state.currentStatus = "approved";
    
  } else if (outcome < 0.85) {
    // 25% → Needs Revision → Resubmit → Approved
    await sleep(SIMULATION_SPEED_MS);
    
    await db.update(registrationTable)
      .set({ status: "needs_revision" })
      .where(eq(registrationTable.id, registrationId));
    
    await db.insert(registrationReviewActionTable).values({
      id: `${registrationId}-action-revise`,
      registrationId,
      actionType: "requested_changes",
      previousStatus: "under_review",
      nextStatus: "needs_revision",
      comment: "Please provide: 1) Updated team roster, 2) Parent consent forms",
      isVisibleToTeam: true,
      createdAt: getTimestamp(state, 48),
    });
    
    logAction(teamName, "Request Revision", "under_review", "needs_revision");
    state.currentStatus = "needs_revision";

    // Resubmit
    await sleep(SIMULATION_SPEED_MS);
    
    state.revisionNumber = 2;
    
    await db.update(registrationTable)
      .set({ 
        status: "submitted",
        currentRevisionNumber: 2,
      })
      .where(eq(registrationTable.id, registrationId));
    
    await db.insert(registrationRevisionTable).values({
      id: `${registrationId}-rev-2`,
      registrationId,
      revisionNumber: 2,
      payload: {
        teamName,
        contactName: "Team Leader",
        contactEmail: "leader@example.com",
        contactPhone: "0901234567",
        schoolName: "Sample School",
        teamSize: 5,
        specialRequirements: "All documents attached",
        agreement: true,
      },
      submittedByUserId: teamLeaderId,
      submittedAt: getTimestamp(state, 72),
    });
    
    await db.insert(registrationReviewActionTable).values({
      id: `${registrationId}-action-resubmit`,
      registrationId,
      actionType: "submitted",
      previousStatus: "needs_revision",
      nextStatus: "submitted",
      actorUserId: teamLeaderId,
      revisionId: `${registrationId}-rev-2`,
      isVisibleToTeam: true,
      createdAt: getTimestamp(state, 72),
    });
    
    logAction(teamName, "Resubmit", "needs_revision", "submitted");
    state.currentStatus = "submitted";

    // Final approval
    await sleep(SIMULATION_SPEED_MS);
    
    await db.update(registrationTable)
      .set({ 
        status: "approved",
        approvedAt: getTimestamp(state, 96),
      })
      .where(eq(registrationTable.id, registrationId));
    
    await db.insert(registrationReviewActionTable).values({
      id: `${registrationId}-action-final-approve`,
      registrationId,
      actionType: "approved",
      previousStatus: "under_review",
      nextStatus: "approved",
      comment: "Registration approved after revision. Welcome to the competition!",
      isVisibleToTeam: true,
      createdAt: getTimestamp(state, 96),
    });
    
    logAction(teamName, "Final Approve", "under_review", "approved");
    state.currentStatus = "approved";
    
  } else {
    // 15% → Denied
    await sleep(SIMULATION_SPEED_MS);
    
    await db.update(registrationTable)
      .set({ 
        status: "denied",
        deniedAt: getTimestamp(state, 48),
      })
      .where(eq(registrationTable.id, registrationId));
    
    await db.insert(registrationReviewActionTable).values({
      id: `${registrationId}-action-deny`,
      registrationId,
      actionType: "denied",
      previousStatus: "under_review",
      nextStatus: "denied",
      comment: "Registration denied: Team does not meet eligibility requirements",
      isVisibleToTeam: true,
      createdAt: getTimestamp(state, 48),
    });
    
    logAction(teamName, "Deny", "under_review", "denied");
    state.currentStatus = "denied";
  }
  
  return state;
}

// ============================================================
// Main Simulation
// ============================================================

async function main() {
  console.log("=" .repeat(60));
  console.log("REGISTRATION FLOW SIMULATION - Season 2025");
  console.log("=" .repeat(60));
  console.log(`Simulation speed: ${SIMULATION_SPEED_MS}ms between actions`);
  console.log(`Batch size: ${BATCH_SIZE} teams`);
  console.log("");

  // Get all events for season 2025
  const events = await db.select().from(eventTable).where(eq(eventTable.season, SEASON_YEAR));
  
  if (events.length === 0) {
    console.log("No events found for season 2025. Please run seed-season-2025.ts first.");
    process.exit(1);
  }

  console.log(`Found ${events.length} events for season ${SEASON_YEAR}:`);
  for (const event of events) {
    console.log(`  - ${event.name} (${event.eventCode})`);
  }

  // Get all teams with registrations
  const registrations = await db
    .select({
      registrationId: registrationTable.id,
      eventId: registrationTable.eventId,
      teamId: registrationTable.teamId,
      status: registrationTable.status,
      formVersionId: registrationTable.formVersionId,
      createdAt: registrationTable.createdAt,
      teamName: team.name,
      teamLeaderId: registrationTable.createdByUserId,
    })
    .from(registrationTable)
    .innerJoin(team, eq(registrationTable.teamId, team.id))
    .where(eq(team.deletedAt, null));

  if (registrations.length === 0) {
    console.log("No registrations found. Please run seed-season-2025.ts first.");
    process.exit(1);
  }

  console.log(`\nFound ${registrations.length} registrations to simulate`);
  console.log("");

  // Group by event
  const registrationsByEvent = new Map<string, typeof registrations>();
  for (const reg of registrations) {
    const existing = registrationsByEvent.get(reg.eventId) || [];
    existing.push(reg);
    registrationsByEvent.set(reg.eventId, existing);
  }

  let totalProcessed = 0;
  let totalApproved = 0;
  let totalDenied = 0;
  let totalNeedsRevision = 0;

  // Process each event
  for (const [eventId, eventRegistrations] of registrationsByEvent) {
    const event = events.find(e => e.id === eventId);
    if (!event) continue;

    console.log(`\n${"─".repeat(60)}`);
    console.log(`Processing Event: ${event.name}`);
    console.log(`${"─".repeat(60)}`);

    // Process in batches
    for (let i = 0; i < eventRegistrations.length; i += BATCH_SIZE) {
      const batch = eventRegistrations.slice(i, i + BATCH_SIZE);
      
      console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(eventRegistrations.length / BATCH_SIZE)}`);
      
      // Process batch sequentially for clarity
      for (const reg of batch) {
        if (reg.status === "approved" || reg.status === "denied") {
          console.log(`  [${reg.teamName}] Already ${reg.status}, skipping...`);
          continue;
        }

        const state: RegistrationState = {
          registrationId: reg.registrationId,
          eventId: reg.eventId,
          teamId: reg.teamId,
          teamLeaderId: reg.teamLeaderId || "",
          formVersionId: reg.formVersionId,
          currentStatus: reg.status as RegistrationStatus,
          revisionNumber: 0,
          createdAt: reg.createdAt,
        };

        const result = await simulateRegistrationFlow(state, reg.teamName);
        
        totalProcessed++;
        if (result.currentStatus === "approved") totalApproved++;
        if (result.currentStatus === "denied") totalDenied++;
        if (result.currentStatus === "needs_revision") totalNeedsRevision++;
      }
    }
  }

  // Print summary
  console.log("\n" + "=" .repeat(60));
  console.log("SIMULATION SUMMARY");
  console.log("=" .repeat(60));
  console.log(`Total registrations processed: ${totalProcessed}`);
  console.log(`Approved: ${totalApproved}`);
  console.log(`Denied: ${totalDenied}`);
  console.log(`Needs Revision: ${totalNeedsRevision}`);
  console.log(`Approval Rate: ${((totalApproved / totalProcessed) * 100).toFixed(1)}%`);
  console.log("=" .repeat(60));
  console.log("\nSimulation completed!");
}

// ============================================================
// Execute
// ============================================================

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error("Simulation failed:", error);
  process.exit(1);
}
