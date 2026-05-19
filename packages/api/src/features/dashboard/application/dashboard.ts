import {
  db,
  eventTable,
  managerEventScope,
  notification,
  notificationDelivery,
  registrationTable,
  seasonTable,
  syncChangeSet,
  syncPushBatch,
  team,
  teamMembership,
} from "@nrc-full/db";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import type { AuthContextSession } from "../../../shared/context.js";

type EventStatus = typeof eventTable.$inferSelect.status;
type RegistrationStatus = typeof registrationTable.$inferSelect.status;

export interface DashboardTeamSummary {
  description: string | null;
  id: string;
  membershipRole: string;
  name: string;
  schoolOrOrganization: string | null;
  teamNumber: string;
}

export interface DashboardEventSummary {
  eventCode: string;
  eventEndsAt: string;
  eventStartsAt: string;
  id: string;
  location: string | null;
  name: string;
  season: string;
  status: EventStatus;
  venue: string | null;
}

export interface DashboardRegistrationSummary {
  createdAt: string;
  eventId: string;
  eventName: string;
  id: string;
  status: RegistrationStatus;
  submittedAt: string | null;
}

export interface DashboardNotificationSummary {
  body: string;
  createdAt: string;
  id: string;
  title: string;
  topic: string;
}

export interface DashboardActionTask {
  href: string;
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
}

export interface UserDashboardData {
  activeTeam: DashboardTeamSummary | null;
  notifications: DashboardNotificationSummary[];
  registrationStatusCounts: Record<RegistrationStatus, number>;
  registrations: DashboardRegistrationSummary[];
  tasks: DashboardActionTask[];
  upcomingEvents: DashboardEventSummary[];
}

export interface StaffDashboardData {
  activeEventCount: number;
  activeSeasonCount: number;
  notifications: DashboardNotificationSummary[];
  pendingRegistrationCount: number;
  recentRegistrations: Array<DashboardRegistrationSummary & {
    teamName: string;
    teamNumber: string;
  }>;
  scopedEventCount: number | null;
  syncAttentionCount: number;
  upcomingEvents: DashboardEventSummary[];
}

const registrationStatuses: RegistrationStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "needs_revision",
  "approved",
  "denied",
  "withdrawn",
];

const toIso = (value: Date): string => value.toISOString();
const toIsoOrNull = (value: Date | null | undefined): string | null => value?.toISOString() ?? null;

const zeroRegistrationCounts = (): Record<RegistrationStatus, number> =>
  Object.fromEntries(registrationStatuses.map((status) => [status, 0])) as Record<
    RegistrationStatus,
    number
  >;

const scopedEventCondition = (session: AuthContextSession) =>
  session.user.systemRole === "ADMIN"
    ? isNull(eventTable.deletedAt)
    : and(
        isNull(eventTable.deletedAt),
        eq(managerEventScope.userId, session.session.userId),
        eq(managerEventScope.isActive, true),
        isNull(managerEventScope.deletedAt),
      );

const getActiveTeam = async (
  userId: string,
  activeOrganizationId?: string | null,
): Promise<DashboardTeamSummary | null> => {
  const selection = {
    description: team.description,
    id: team.id,
    membershipRole: teamMembership.role,
    name: team.name,
    schoolOrOrganization: team.schoolOrOrganization,
    teamNumber: team.teamNumber,
  };

  const baseWhere = and(
    eq(teamMembership.userId, userId),
    eq(teamMembership.isActive, true),
    isNull(teamMembership.deletedAt),
    isNull(team.deletedAt),
  );

  if (activeOrganizationId) {
    const [activeTeam] = await db
      .select(selection)
      .from(team)
      .innerJoin(teamMembership, eq(teamMembership.teamId, team.id))
      .where(and(baseWhere, eq(team.organizationId, activeOrganizationId)))
      .limit(1);

    if (activeTeam) {
      return activeTeam;
    }
  }

  const [fallbackTeam] = await db
    .select(selection)
    .from(team)
    .innerJoin(teamMembership, eq(teamMembership.teamId, team.id))
    .where(baseWhere)
    .orderBy(desc(team.createdAt))
    .limit(1);

  return fallbackTeam ?? null;
};

const mapEvent = (row: typeof eventTable.$inferSelect): DashboardEventSummary => ({
  eventCode: row.eventCode,
  eventEndsAt: toIso(row.eventEndsAt),
  eventStartsAt: toIso(row.eventStartsAt),
  id: row.id,
  location: row.location,
  name: row.name,
  season: row.season,
  status: row.status,
  venue: row.venue,
});

const listUpcomingEvents = async (limit: number): Promise<DashboardEventSummary[]> => {
  const rows = await db
    .select()
    .from(eventTable)
    .where(
      and(
        isNull(eventTable.deletedAt),
        inArray(eventTable.status, ["published", "registration_open", "registration_closed", "active"]),
        sql`${eventTable.eventStartsAt} >= now()`,
      ),
    )
    .orderBy(eventTable.eventStartsAt)
    .limit(limit);

  return rows.map(mapEvent);
};

const listNotifications = async (
  userId: string,
  locale: "en" | "vi" = "en",
  limit = 5,
): Promise<DashboardNotificationSummary[]> => {
  const rows = await db
    .select({
      bodyI18n: notification.bodyI18n,
      createdAt: notification.createdAt,
      id: notification.id,
      titleI18n: notification.titleI18n,
      topic: notification.topic,
    })
    .from(notificationDelivery)
    .innerJoin(notification, eq(notificationDelivery.notificationId, notification.id))
    .where(
      and(
        eq(notificationDelivery.userId, userId),
        eq(notificationDelivery.channel, "IN_APP"),
        isNull(notificationDelivery.deletedAt),
        isNull(notification.deletedAt),
      ),
    )
    .orderBy(desc(notification.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    body: row.bodyI18n[locale] ?? row.bodyI18n.en,
    createdAt: toIso(row.createdAt),
    id: row.id,
    title: row.titleI18n[locale] ?? row.titleI18n.en,
    topic: row.topic,
  }));
};

export const getUserDashboard = async (
  session: AuthContextSession,
  locale: "en" | "vi" = "en",
): Promise<UserDashboardData> => {
  const activeTeam = await getActiveTeam(
    session.session.userId,
    session.session.activeOrganizationId ?? null,
  );
  const [upcomingEvents, notifications] = await Promise.all([
    listUpcomingEvents(4),
    listNotifications(session.session.userId, locale),
  ]);

  const registrations = activeTeam
    ? await db
        .select({
          createdAt: registrationTable.createdAt,
          eventId: registrationTable.eventId,
          eventName: eventTable.name,
          id: registrationTable.id,
          status: registrationTable.status,
          submittedAt: registrationTable.submittedAt,
        })
        .from(registrationTable)
        .innerJoin(eventTable, eq(registrationTable.eventId, eventTable.id))
        .where(and(eq(registrationTable.teamId, activeTeam.id), isNull(registrationTable.deletedAt), isNull(eventTable.deletedAt)))
        .orderBy(desc(registrationTable.createdAt))
        .limit(6)
    : [];

  const registrationStatusCounts = zeroRegistrationCounts();
  for (const registration of registrations) {
    registrationStatusCounts[registration.status] += 1;
  }

  const tasks: DashboardActionTask[] = [];
  if (!activeTeam) {
    tasks.push({ href: "/teams/new", id: "create-team", priority: "high", title: "Create or join a team" });
  } else if (!activeTeam.description) {
    tasks.push({
      href: `/teams/${activeTeam.teamNumber}`,
      id: "team-profile",
      priority: "medium",
      title: "Complete team profile",
    });
  }

  const draftRegistration = registrations.find((registration) => registration.status === "draft");
  if (draftRegistration) {
    tasks.push({
      href: `/register/${draftRegistration.eventId}/${draftRegistration.id}`,
      id: "draft-registration",
      priority: "high",
      title: "Finish draft registration",
    });
  }

  const needsRevision = registrations.find((registration) => registration.status === "needs_revision");
  if (needsRevision) {
    tasks.push({
      href: `/register/${needsRevision.eventId}/${needsRevision.id}`,
      id: "needs-revision",
      priority: "high",
      title: "Revise registration",
    });
  }

  return {
    activeTeam,
    notifications,
    registrationStatusCounts,
    registrations: registrations.map((registration) => ({
      ...registration,
      createdAt: toIso(registration.createdAt),
      submittedAt: toIsoOrNull(registration.submittedAt),
    })),
    tasks,
    upcomingEvents,
  };
};

export const getStaffDashboard = async (
  session: AuthContextSession,
  locale: "en" | "vi" = "en",
): Promise<StaffDashboardData> => {
  const isAdmin = session.user.systemRole === "ADMIN";
  const scopedEventKeys = isAdmin
    ? null
    : await db
        .select({ eventKey: eventTable.eventKey })
        .from(eventTable)
        .innerJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
        .where(scopedEventCondition(session));
  const eventScope = scopedEventCondition(session);

  const [
    activeSeasonRows,
    activeEventRows,
    scopedEventRows,
    pendingRegistrationRows,
    syncBatchRows,
    syncChangeRows,
    recentRows,
    upcomingRows,
    notifications,
  ] = await Promise.all([
    isAdmin
      ? db.select({ value: count() }).from(seasonTable).where(and(eq(seasonTable.isActive, true), isNull(seasonTable.deletedAt)))
      : db
          .select({ value: sql<number>`cast(count(distinct ${eventTable.season}) as integer)` })
          .from(eventTable)
          .innerJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
          .where(scopedEventCondition(session)),
    isAdmin
      ? db.select({ value: count() }).from(eventTable).where(and(isNull(eventTable.deletedAt), inArray(eventTable.status, ["registration_open", "active"])))
      : db
          .select({ value: count() })
          .from(eventTable)
          .innerJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
          .where(and(eventScope, inArray(eventTable.status, ["registration_open", "active"]))),
    isAdmin
      ? db.select({ value: count() }).from(eventTable).where(isNull(eventTable.deletedAt))
      : db
          .select({ value: count() })
          .from(eventTable)
          .innerJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
          .where(eventScope),
    db
      .select({ value: count() })
      .from(registrationTable)
      .innerJoin(eventTable, eq(registrationTable.eventId, eventTable.id))
      .leftJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
      .where(
        and(
          scopedEventCondition(session),
          isNull(registrationTable.deletedAt),
          inArray(registrationTable.status, ["submitted", "under_review"]),
        ),
      ),
    db
      .select({ value: count() })
      .from(syncPushBatch)
      .where(
        and(
          isNull(syncPushBatch.deletedAt),
          inArray(syncPushBatch.status, ["failed", "pending_review"]),
          scopedEventKeys ? inArray(syncPushBatch.eventKey, scopedEventKeys.map((event) => event.eventKey)) : undefined,
        ),
      ),
    db
      .select({ value: count() })
      .from(syncChangeSet)
      .where(
        and(
          isNull(syncChangeSet.deletedAt),
          inArray(syncChangeSet.status, ["failed", "pending_review"]),
          scopedEventKeys ? inArray(syncChangeSet.eventKey, scopedEventKeys.map((event) => event.eventKey)) : undefined,
        ),
      ),
    db
      .select({
        createdAt: registrationTable.createdAt,
        eventId: registrationTable.eventId,
        eventName: eventTable.name,
        id: registrationTable.id,
        status: registrationTable.status,
        submittedAt: registrationTable.submittedAt,
        teamName: team.name,
        teamNumber: team.teamNumber,
      })
      .from(registrationTable)
      .innerJoin(eventTable, eq(registrationTable.eventId, eventTable.id))
      .innerJoin(team, eq(registrationTable.teamId, team.id))
      .leftJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
      .where(and(scopedEventCondition(session), isNull(registrationTable.deletedAt)))
      .orderBy(desc(registrationTable.createdAt))
      .limit(5),
    db
      .select({
        event: eventTable,
      })
      .from(eventTable)
      .leftJoin(managerEventScope, eq(managerEventScope.eventId, eventTable.id))
      .where(and(scopedEventCondition(session), sql`${eventTable.eventStartsAt} >= now()`))
      .orderBy(eventTable.eventStartsAt)
      .limit(4),
    listNotifications(session.session.userId, locale),
  ]);

  return {
    activeEventCount: activeEventRows[0]?.value ?? 0,
    activeSeasonCount: activeSeasonRows[0]?.value ?? 0,
    notifications,
    pendingRegistrationCount: pendingRegistrationRows[0]?.value ?? 0,
    recentRegistrations: recentRows.map((registration) => ({
      ...registration,
      createdAt: toIso(registration.createdAt),
      submittedAt: toIsoOrNull(registration.submittedAt),
    })),
    scopedEventCount: isAdmin ? null : (scopedEventRows[0]?.value ?? 0),
    syncAttentionCount: (syncBatchRows[0]?.value ?? 0) + (syncChangeRows[0]?.value ?? 0),
    upcomingEvents: upcomingRows.map((row) => mapEvent(row.event)),
  };
};
