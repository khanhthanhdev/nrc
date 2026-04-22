import { Link, createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";

const QualificationsPage = () => {
  const { eventId, season } = useParams({ from: "/$season/$eventId/qualifications" });

  if (!isValidSeason(season) || !isValidEventId(eventId)) {
    return null;
  }

  return (
    <RouteSection
      description={`Match list for ${season} / ${eventId}. Each match is a nested detail route.`}
      title="Qualifications"
    >
      <div className="space-y-2">
        <Link
          className="nrc-pill block px-4 py-3 text-sm hover:bg-muted"
          params={{ eventId, matchNumber: "2", season }}
          to="/$season/$eventId/qualifications/$matchNumber"
        >
          Qualification 2
        </Link>
      </div>
    </RouteSection>
  );
};

export const Route = createFileRoute("/$season/$eventId/qualifications")({
  component: QualificationsPage,
});
