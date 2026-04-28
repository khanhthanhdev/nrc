import { createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";

const PlayoffsPage = () => {
  const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId/playoffs" });

  if (!isValidSeason(season) || !isValidEventId(eventId)) {
    return null;
  }

  return (
    <RouteSection
      description={`Public playoff view for ${season} / ${eventId}.`}
      title="Playoffs"
    />
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId/playoffs")({
  component: PlayoffsPage,
});
