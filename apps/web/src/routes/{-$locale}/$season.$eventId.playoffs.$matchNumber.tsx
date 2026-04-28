import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RouteSection } from "@/components/route-section";
import { PublicDataMessage, PublicMatchDetail } from "@/features/events/public-event-data";
import { getSupportedLocale } from "@/lib/locale-routing";
import { isValidEventId, isValidMatchNumber, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const PlayoffMatchPage = () => {
  const { eventId, matchNumber, season } = useParams({
    from: "/{-$locale}/$season/$eventId/playoffs/$matchNumber",
  });
  const { i18n } = useTranslation();
  const locale = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
  const isValidRoute =
    isValidSeason(season) && isValidEventId(eventId) && isValidMatchNumber(matchNumber);
  const matchesQuery = useQuery({
    ...orpc.event.listPublicMatches.queryOptions({
      input: { eventCode: eventId, phase: "PLAYOFF", season },
    }),
    enabled: isValidRoute,
    refetchInterval: 30_000,
    retry: false,
  });

  if (!isValidRoute) {
    return null;
  }

  const matchKey = `E${matchNumber}`;
  const match = matchesQuery.data?.find(
    (item) => item.matchKey === matchKey || item.sequenceNumber.toString() === matchNumber,
  );

  return (
    <RouteSection
      description={`Read-only public playoff result view for ${season} / ${eventId}.`}
      title={`Playoff ${matchNumber}`}
    >
      {matchesQuery.isLoading ? <PublicDataMessage title="Loading match detail..." /> : null}
      {matchesQuery.error ? (
        <PublicDataMessage title="Match detail unavailable">
          Try refreshing after the event sync completes.
        </PublicDataMessage>
      ) : null}
      {!matchesQuery.isLoading && !matchesQuery.error && !match ? (
        <PublicDataMessage title={`Playoff ${matchNumber} has not been published.`} />
      ) : null}
      {match ? <PublicMatchDetail locale={locale} match={match} /> : null}
    </RouteSection>
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId/playoffs/$matchNumber")({
  component: PlayoffMatchPage,
});
