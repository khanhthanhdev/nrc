import { createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";

const AwardsPage = () => {
  const { eventId, season } = useParams({ from: "/$season/$eventId/awards" });

  if (!isValidSeason(season) || !isValidEventId(eventId)) {
    return null;
  }

  return (
    <RouteSection
      description={`Public awards and recognition view for ${season} / ${eventId}.`}
      title="Awards"
    />
  );
};

export const Route = createFileRoute("/$season/$eventId/awards")({
  component: AwardsPage,
});
