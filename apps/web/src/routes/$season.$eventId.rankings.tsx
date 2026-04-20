import { createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";

const RankingsPage = () => {
  const { eventId, season } = useParams({ from: "/$season/$eventId/rankings" });

  if (!isValidSeason(season) || !isValidEventId(eventId)) {
    return null;
  }

  return (
    <RouteSection
      description={`Public rankings for ${season} / ${eventId}. Wire to synced data later.`}
      title="Rankings"
    />
  );
};

export const Route = createFileRoute("/$season/$eventId/rankings")({
  component: RankingsPage,
});
