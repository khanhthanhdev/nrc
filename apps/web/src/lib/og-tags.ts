import type { PublicEventDetailData } from "@/features/events/types";

const siteName = "NRC Competition Hub";
const defaultDescription =
  "National Robotics Competition event schedules, rankings, match results, and awards.";
const defaultImage = "/og-default.png";

type MetaDescriptor =
  | { content: string; name: string; property?: never; title?: never }
  | { content: string; name?: never; property: string; title?: never }
  | { content?: never; name?: never; property?: never; title: string };

export function publicPageMeta(title: string, description = defaultDescription): MetaDescriptor[] {
  return [
    { title },
    { content: description, name: "description" },
    { content: title, property: "og:title" },
    { content: description, property: "og:description" },
    { content: "website", property: "og:type" },
    { content: siteName, property: "og:site_name" },
    { content: defaultImage, property: "og:image" },
    { content: "summary_large_image", name: "twitter:card" },
    { content: title, name: "twitter:title" },
    { content: description, name: "twitter:description" },
  ];
}

export function eventPageMeta(
  publicEvent: PublicEventDetailData | undefined,
  suffix?: string,
): MetaDescriptor[] {
  const event = publicEvent?.event;
  const eventName = event?.name ?? "Event";
  const title = suffix ? `${eventName} ${suffix} | NRC` : `${eventName} | NRC`;
  const description = event?.description ?? event?.summary ?? defaultDescription;

  return publicPageMeta(title, description);
}
