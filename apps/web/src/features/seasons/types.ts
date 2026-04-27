import type { client } from "@/utils/orpc";

export type PublicSeasonPageData = Awaited<ReturnType<typeof client.season.getPublicSeasonPage>>;
export type PublicSeasonData = PublicSeasonPageData["season"];
export type PublicSeasonEvent = PublicSeasonPageData["events"][number];
export type PublicSeasonDocument = PublicSeasonPageData["documents"][number];
export type PublicSeasonAnnouncement = PublicSeasonPageData["announcements"][number];
export type PublicSeasonOption = PublicSeasonPageData["seasonOptions"][number];

export type AdminSeasonListData = Awaited<ReturnType<typeof client.season.listAdminSeasons>>;
export type AdminSeasonListItem = AdminSeasonListData[number];

export type AdminSeasonDetailData = Awaited<ReturnType<typeof client.season.getAdminSeason>>;
export type AdminSeasonData = AdminSeasonDetailData["season"];
export type AdminSeasonDocument = AdminSeasonDetailData["documents"][number];
export type AdminSeasonAnnouncement = AdminSeasonDetailData["announcements"][number];
