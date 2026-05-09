import {
  db,
  eventRegistrationFormVersionTable,
  eventTable,
  registrationReviewActionTable,
  registrationRevisionTable,
  registrationTable,
  team,
  teamMembership,
} from "@nrc-full/db";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import type {
  AddRegistrationCommentInput,
  CreateRegistrationInput,
  ListAdminRegistrationsByEventInput,
  ListRegistrationReviewActionsInput,
  ListTeamRegistrationsInput,
  ReviewRegistrationInput,
  UpdateRegistrationRevisionInput,
  WithdrawRegistrationInput,
} from "../schemas/registration.js";

type RegistrationRecord = typeof registrationTable.$inferSelect;
type ReviewActionRecord = typeof registrationReviewActionTable.$inferSelect;

const toIso = (d: Date): string => d.toISOString();
const toIsoOrNull = (d: Date | null | undefined): string | null => d?.toISOString() ?? null;

const firstOrThrow = <T>(rows: T[], message = "Unexpected empty result."): T => {
  const row = rows[0];

  if (row === undefined) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message });
  }

  return row;
};

// ── Response shapes ────────────────────────────────────────────────────

export interface RegistrationSummary {
  createdAt: string;
  currentRevisionNumber: number;
  eventId: string;
  id: string;
  status: RegistrationRecord["status"];
  submittedAt: string | null;
  teamId: string;
  updatedAt: string;
}

export interface RegistrationDetail extends RegistrationSummary {
  approvedAt: string | null;
  deniedAt: string | null;
  formVersionId: string;
  reviewedAt: string | null;
  withdrawnAt: string | null;
}

export interface RegistrationRevisionItem {
  createdAt: string;
  id: string;
  payload: Record<string, unknown>;
  revisionNumber: number;
  submittedAt: string;
}

export interface ReviewActionItem {
  actionType: ReviewActionRecord["actionType"];
  actorUserId: string | null;
  comment: string | null;
  createdAt: string;
  id: string;
  isVisibleToTeam: boolean;
  nextStatus: RegistrationRecord["status"] | null;
  previousStatus: RegistrationRecord["status"] | null;
}

export interface AdminRegistrationItem extends RegistrationDetail {
  teamName: string;
  teamNumber: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

const mapSummary = (r: RegistrationRecord): RegistrationSummary => ({
  createdAt: toIso(r.createdAt),
  currentRevisionNumber: r.currentRevisionNumber,
  eventId: r.eventId,
  id: r.id,
  status: r.status,
  submittedAt: toIsoOrNull(r.submittedAt),
  teamId: r.teamId,
  updatedAt: toIso(r.updatedAt),
});

const mapDetail = (r: RegistrationRecord): RegistrationDetail => ({
  ...mapSummary(r),
  approvedAt: toIsoOrNull(r.approvedAt),
  deniedAt: toIsoOrNull(r.deniedAt),
  formVersionId: r.formVersionId,
  reviewedAt: toIsoOrNull(r.reviewedAt),
  withdrawnAt: toIsoOrNull(r.withdrawnAt),
});

const mapReviewAction = (r: ReviewActionRecord): ReviewActionItem => ({
  actionType: r.actionType,
  actorUserId: r.actorUserId,
  comment: r.comment,
  createdAt: toIso(r.createdAt),
  id: r.id,
  isVisibleToTeam: r.isVisibleToTeam,
  nextStatus: r.nextStatus,
  previousStatus: r.previousStatus,
});

const requireTeamMentorOrLeader = async (userId: string, teamId: string): Promise<void> => {
  const [membership] = await db
    .select({ role: teamMembership.role })
    .from(teamMembership)
    .where(
      and(
        eq(teamMembership.userId, userId),
        eq(teamMembership.teamId, teamId),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .limit(1);

  if (!membership || (membership.role !== "TEAM_MENTOR" && membership.role !== "TEAM_LEADER")) {
    throw new ORPCError("FORBIDDEN", {
      message: "You must be a team mentor or leader to manage registrations.",
    });
  }
};

const requireTeamMentor = async (userId: string, teamId: string): Promise<void> => {
  const [membership] = await db
    .select({ role: teamMembership.role })
    .from(teamMembership)
    .where(
      and(
        eq(teamMembership.userId, userId),
        eq(teamMembership.teamId, teamId),
        eq(teamMembership.isActive, true),
        isNull(teamMembership.deletedAt),
      ),
    )
    .limit(1);

  if (!membership || membership.role !== "TEAM_MENTOR") {
    throw new ORPCError("FORBIDDEN", {
      message: "Only team mentors can register for events.",
    });
  }
};

// ── Team-facing operations ─────────────────────────────────────────────

export const createRegistration = async (
  userId: string,
  input: CreateRegistrationInput,
): Promise<RegistrationDetail> => {
  await requireTeamMentor(userId, input.teamId);

  const [event] = await db
    .select({
      id: eventTable.id,
      status: eventTable.status,
    })
    .from(eventTable)
    .where(and(eq(eventTable.id, input.eventId), isNull(eventTable.deletedAt)))
    .limit(1);

  if (!event) {
    throw new ORPCError("NOT_FOUND", { message: "Event not found." });
  }

  if (event.status !== "registration_open") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Registration is not open for this event.",
    });
  }

  const [existingReg] = await db
    .select({ id: registrationTable.id })
    .from(registrationTable)
    .where(
      and(
        eq(registrationTable.eventId, input.eventId),
        eq(registrationTable.teamId, input.teamId),
        isNull(registrationTable.deletedAt),
      ),
    )
    .limit(1);

  if (existingReg) {
    throw new ORPCError("CONFLICT", {
      message: "This team is already registered for this event.",
    });
  }

  const [publishedForm] = await db
    .select({ id: eventRegistrationFormVersionTable.id })
    .from(eventRegistrationFormVersionTable)
    .where(
      and(
        eq(eventRegistrationFormVersionTable.eventId, input.eventId),
        eq(eventRegistrationFormVersionTable.isPublished, true),
        isNull(eventRegistrationFormVersionTable.deletedAt),
      ),
    )
    .limit(1);

  if (!publishedForm) {
    throw new ORPCError("BAD_REQUEST", {
      message: "No published registration form found for this event.",
    });
  }

  const now = new Date();
  const registrationId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();

  return db.transaction(async (tx) => {
    const registrationRows = await tx
      .insert(registrationTable)
      .values({
        createdAt: now,
        createdByUserId: userId,
        currentRevisionNumber: 1,
        eventId: input.eventId,
        formVersionId: publishedForm.id,
        id: registrationId,
        status: "draft",
        teamId: input.teamId,
        updatedAt: now,
      })
      .returning();

    await tx.insert(registrationRevisionTable).values({
      createdAt: now,
      id: revisionId,
      payload: input.payload,
      registrationId,
      revisionNumber: 1,
      submittedAt: now,
      submittedByUserId: userId,
    });

    return mapDetail(firstOrThrow(registrationRows));
  });
};

export const getRegistrationDetail = async (
  userId: string,
  registrationId: string,
): Promise<{
  registration: RegistrationDetail;
  revisions: RegistrationRevisionItem[];
}> => {
  const [registration] = await db
    .select()
    .from(registrationTable)
    .where(and(eq(registrationTable.id, registrationId), isNull(registrationTable.deletedAt)))
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  await requireTeamMentorOrLeader(userId, registration.teamId);

  const revisions = await db
    .select()
    .from(registrationRevisionTable)
    .where(
      and(
        eq(registrationRevisionTable.registrationId, registrationId),
        isNull(registrationRevisionTable.deletedAt),
      ),
    )
    .orderBy(desc(registrationRevisionTable.revisionNumber));

  return {
    registration: mapDetail(registration),
    revisions: revisions.map((r) => ({
      createdAt: toIso(r.createdAt),
      id: r.id,
      payload: r.payload,
      revisionNumber: r.revisionNumber,
      submittedAt: toIso(r.submittedAt),
    })),
  };
};

export const listTeamRegistrations = async (
  userId: string,
  input: ListTeamRegistrationsInput,
): Promise<RegistrationSummary[]> => {
  await requireTeamMentorOrLeader(userId, input.teamId);

  const rows = await db
    .select()
    .from(registrationTable)
    .where(
      and(eq(registrationTable.teamId, input.teamId), isNull(registrationTable.deletedAt)),
    )
    .orderBy(desc(registrationTable.createdAt));

  return rows.map(mapSummary);
};

export const submitRegistration = async (
  userId: string,
  registrationId: string,
): Promise<RegistrationDetail> => {
  const [registration] = await db
    .select()
    .from(registrationTable)
    .where(and(eq(registrationTable.id, registrationId), isNull(registrationTable.deletedAt)))
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  await requireTeamMentor(userId, registration.teamId);

  if (registration.status !== "draft" && registration.status !== "needs_revision") {
    throw new ORPCError("BAD_REQUEST", {
      message: `Registration cannot be submitted from status "${registration.status}".`,
    });
  }

  const now = new Date();
  const updatedRows = await db
    .update(registrationTable)
    .set({
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    })
    .where(eq(registrationTable.id, registrationId))
    .returning();

  await db.insert(registrationReviewActionTable).values({
    actionType: "submitted",
    actorUserId: userId,
    createdAt: now,
    id: crypto.randomUUID(),
    nextStatus: "submitted",
    previousStatus: registration.status,
    registrationId,
  });

  return mapDetail(firstOrThrow(updatedRows));
};

export const updateRegistrationRevision = async (
  userId: string,
  input: UpdateRegistrationRevisionInput,
): Promise<RegistrationDetail> => {
  const [registration] = await db
    .select()
    .from(registrationTable)
    .where(
      and(eq(registrationTable.id, input.registrationId), isNull(registrationTable.deletedAt)),
    )
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  await requireTeamMentor(userId, registration.teamId);

  if (registration.status !== "draft" && registration.status !== "needs_revision") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Registration can only be updated when in draft or needs_revision status.",
    });
  }

  const now = new Date();
  const nextRevisionNumber = registration.currentRevisionNumber + 1;

  return db.transaction(async (tx) => {
    await tx.insert(registrationRevisionTable).values({
      createdAt: now,
      id: crypto.randomUUID(),
      payload: input.payload,
      registrationId: input.registrationId,
      revisionNumber: nextRevisionNumber,
      submittedAt: now,
      submittedByUserId: userId,
    });

    const updatedRows = await tx
      .update(registrationTable)
      .set({
        currentRevisionNumber: nextRevisionNumber,
        updatedAt: now,
      })
      .where(eq(registrationTable.id, input.registrationId))
      .returning();

    return mapDetail(firstOrThrow(updatedRows));
  });
};

export const withdrawRegistration = async (
  userId: string,
  input: WithdrawRegistrationInput,
): Promise<RegistrationDetail> => {
  const [registration] = await db
    .select()
    .from(registrationTable)
    .where(
      and(eq(registrationTable.id, input.registrationId), isNull(registrationTable.deletedAt)),
    )
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  await requireTeamMentor(userId, registration.teamId);

  const withdrawableStatuses: RegistrationRecord["status"][] = [
    "draft",
    "submitted",
    "under_review",
    "needs_revision",
  ];

  if (!withdrawableStatuses.includes(registration.status)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Registration cannot be withdrawn from status "${registration.status}".`,
    });
  }

  const now = new Date();
  const updatedRows = await db
    .update(registrationTable)
    .set({
      status: "withdrawn",
      updatedAt: now,
      withdrawnAt: now,
    })
    .where(eq(registrationTable.id, input.registrationId))
    .returning();

  await db.insert(registrationReviewActionTable).values({
    actionType: "withdrawn",
    actorUserId: userId,
    createdAt: now,
    id: crypto.randomUUID(),
    nextStatus: "withdrawn",
    previousStatus: registration.status,
    registrationId: input.registrationId,
  });

  return mapDetail(firstOrThrow(updatedRows));
};

export const listRegistrationReviewActions = async (
  userId: string,
  input: ListRegistrationReviewActionsInput,
): Promise<ReviewActionItem[]> => {
  const [registration] = await db
    .select({ teamId: registrationTable.teamId })
    .from(registrationTable)
    .where(
      and(eq(registrationTable.id, input.registrationId), isNull(registrationTable.deletedAt)),
    )
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  await requireTeamMentorOrLeader(userId, registration.teamId);

  const rows = await db
    .select()
    .from(registrationReviewActionTable)
    .where(
      and(
        eq(registrationReviewActionTable.registrationId, input.registrationId),
        eq(registrationReviewActionTable.isVisibleToTeam, true),
        isNull(registrationReviewActionTable.deletedAt),
      ),
    )
    .orderBy(desc(registrationReviewActionTable.createdAt));

  return rows.map(mapReviewAction);
};

// ── Admin operations ───────────────────────────────────────────────────

export const listAdminRegistrationsByEvent = async (
  input: ListAdminRegistrationsByEventInput,
): Promise<AdminRegistrationItem[]> => {
  const conditions = [
    eq(registrationTable.eventId, input.eventId),
    isNull(registrationTable.deletedAt),
  ];

  if (input.status) {
    conditions.push(eq(registrationTable.status, input.status));
  }

  const rows = await db
    .select({
      registration: registrationTable,
      teamName: team.name,
      teamNumber: team.teamNumber,
    })
    .from(registrationTable)
    .innerJoin(team, eq(registrationTable.teamId, team.id))
    .where(and(...conditions))
    .orderBy(desc(registrationTable.createdAt));

  return rows.map((r) => ({
    ...mapDetail(r.registration),
    teamName: r.teamName,
    teamNumber: r.teamNumber,
  }));
};

export const reviewRegistration = async (
  actorUserId: string,
  input: ReviewRegistrationInput,
): Promise<RegistrationDetail> => {
  const [registration] = await db
    .select()
    .from(registrationTable)
    .where(
      and(eq(registrationTable.id, input.registrationId), isNull(registrationTable.deletedAt)),
    )
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  const now = new Date();

  const actionMap: Record<
    string,
    {
      actionType: ReviewActionRecord["actionType"];
      nextStatus: RegistrationRecord["status"];
      timestamps: Partial<RegistrationRecord>;
    }
  > = {
    approve: {
      actionType: "approved",
      nextStatus: "approved",
      timestamps: { approvedAt: now, reviewedAt: now },
    },
    deny: {
      actionType: "denied",
      nextStatus: "denied",
      timestamps: { deniedAt: now, reviewedAt: now },
    },
    request_changes: {
      actionType: "requested_changes",
      nextStatus: "needs_revision",
      timestamps: { reviewedAt: now },
    },
  };

  const mapping = actionMap[input.action];

  if (!mapping) {
    throw new ORPCError("BAD_REQUEST", { message: "Invalid review action." });
  }

  const reviewableStatuses: RegistrationRecord["status"][] = [
    "submitted",
    "under_review",
  ];

  if (!reviewableStatuses.includes(registration.status)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Registration cannot be reviewed from status "${registration.status}".`,
    });
  }

  const updatedRows = await db
    .update(registrationTable)
    .set({
      ...mapping.timestamps,
      status: mapping.nextStatus,
      updatedAt: now,
    })
    .where(eq(registrationTable.id, input.registrationId))
    .returning();

  await db.insert(registrationReviewActionTable).values({
    actionType: mapping.actionType,
    actorUserId,
    comment: input.comment ?? null,
    createdAt: now,
    id: crypto.randomUUID(),
    isVisibleToTeam: true,
    nextStatus: mapping.nextStatus,
    previousStatus: registration.status,
    registrationId: input.registrationId,
  });

  return mapDetail(firstOrThrow(updatedRows));
};

export const addRegistrationComment = async (
  actorUserId: string,
  input: AddRegistrationCommentInput,
): Promise<ReviewActionItem> => {
  const [registration] = await db
    .select({ id: registrationTable.id })
    .from(registrationTable)
    .where(
      and(eq(registrationTable.id, input.registrationId), isNull(registrationTable.deletedAt)),
    )
    .limit(1);

  if (!registration) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  const now = new Date();
  const actionId = crypto.randomUUID();

  const actionRows = await db
    .insert(registrationReviewActionTable)
    .values({
      actionType: "commented",
      actorUserId,
      comment: input.comment,
      createdAt: now,
      id: actionId,
      isVisibleToTeam: input.isVisibleToTeam ?? true,
      registrationId: input.registrationId,
    })
    .returning();

  return mapReviewAction(firstOrThrow(actionRows));
};

export const getAdminRegistrationDetail = async (
  registrationId: string,
): Promise<{
  registration: AdminRegistrationItem;
  revisions: RegistrationRevisionItem[];
  reviewActions: ReviewActionItem[];
}> => {
  const rows = await db
    .select({
      registration: registrationTable,
      teamName: team.name,
      teamNumber: team.teamNumber,
    })
    .from(registrationTable)
    .innerJoin(team, eq(registrationTable.teamId, team.id))
    .where(
      and(eq(registrationTable.id, registrationId), isNull(registrationTable.deletedAt)),
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    throw new ORPCError("NOT_FOUND", { message: "Registration not found." });
  }

  const revisions = await db
    .select()
    .from(registrationRevisionTable)
    .where(
      and(
        eq(registrationRevisionTable.registrationId, registrationId),
        isNull(registrationRevisionTable.deletedAt),
      ),
    )
    .orderBy(desc(registrationRevisionTable.revisionNumber));

  const reviewActions = await db
    .select()
    .from(registrationReviewActionTable)
    .where(
      and(
        eq(registrationReviewActionTable.registrationId, registrationId),
        isNull(registrationReviewActionTable.deletedAt),
      ),
    )
    .orderBy(desc(registrationReviewActionTable.createdAt));

  return {
    registration: {
      ...mapDetail(row.registration),
      teamName: row.teamName,
      teamNumber: row.teamNumber,
    },
    reviewActions: reviewActions.map(mapReviewAction),
    revisions: revisions.map((r) => ({
      createdAt: toIso(r.createdAt),
      id: r.id,
      payload: r.payload,
      revisionNumber: r.revisionNumber,
      submittedAt: toIso(r.submittedAt),
    })),
  };
};
