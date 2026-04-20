import { createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { isValidEventId, isValidMatchNumber, isValidSeason } from "@/lib/route-policy";

const QualificationMatchPage = () => {
  const { eventId, matchNumber, season } = useParams({
    from: "/$season/$eventId/qualifications/$matchNumber",
  });

  if (!isValidSeason(season) || !isValidEventId(eventId) || !isValidMatchNumber(matchNumber)) {
    return null;
  }

  return (
    <RouteSection
      description={`Match detail for ${season} / ${eventId}. Read-only public result view.`}
      title={`Qualification ${matchNumber}`}
    />
  );
};

export const Route = createFileRoute("/$season/$eventId/qualifications/$matchNumber")({
  component: QualificationMatchPage,
});
