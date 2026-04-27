import type { client } from "@/utils/orpc";

export type PublicEventDetailData = Awaited<ReturnType<typeof client.event.getPublicEvent>>;
export type AdminEventListData = Awaited<ReturnType<typeof client.event.listAdminEvents>>;
export type AdminEventListItem = AdminEventListData[number];
export type AdminEventDetailData = Awaited<ReturnType<typeof client.event.getAdminEvent>>;
export type AdminCurrentSeasonData = Awaited<
  ReturnType<typeof client.season.getCurrentAdminSeason>
>;
export type AdminEventDocument = AdminEventDetailData["documents"][number];
export type AdminEventAnnouncement = AdminEventDetailData["announcements"][number];
export type AdminRegistrationFormVersion = AdminEventDetailData["registrationFormVersions"][number];
