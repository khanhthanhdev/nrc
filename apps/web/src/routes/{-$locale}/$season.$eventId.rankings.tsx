import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";

import { RouteSection } from "@/components/route-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PublicDataMessage, getRankingQualifyingScore } from "@/features/events/public-event-data";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const RankingsPage = () => {
  const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId/rankings" });
  const isValidRoute = isValidSeason(season) && isValidEventId(eventId);
  const rankingsQuery = useQuery({
    ...orpc.event.listPublicRankings.queryOptions({
      input: { eventCode: eventId, season },
    }),
    enabled: isValidRoute,
    refetchInterval: 30_000,
    retry: false,
  });

  if (!isValidRoute) {
    return null;
  }

  return (
    <RouteSection
      description="Team ranking data from the synced qualification ranking snapshot."
      title="Rankings"
    >
      {rankingsQuery.isLoading ? <PublicDataMessage title="Loading rankings..." /> : null}
      {rankingsQuery.error ? (
        <PublicDataMessage title="Rankings unavailable">
          Try refreshing after the event sync completes.
        </PublicDataMessage>
      ) : null}
      {!rankingsQuery.isLoading &&
      !rankingsQuery.error &&
      (rankingsQuery.data ?? []).length === 0 ? (
        <PublicDataMessage title="No rankings published yet." />
      ) : null}
      {(rankingsQuery.data ?? []).length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Team #</TableHead>
              <TableHead>W-L-T</TableHead>
              <TableHead className="text-right">Played</TableHead>
              <TableHead className="text-right">QS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rankingsQuery.data ?? []).map((ranking) => (
              <TableRow key={ranking.teamNumber}>
                <TableCell className="font-semibold">{ranking.rank}</TableCell>
                <TableCell className="font-medium">{ranking.teamNumber}</TableCell>
                <TableCell>
                  {ranking.wins}-{ranking.losses}-{ranking.ties}
                </TableCell>
                <TableCell className="text-right">{ranking.matchesPlayed}</TableCell>
                <TableCell className="text-right font-semibold">
                  {getRankingQualifyingScore(ranking)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </RouteSection>
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId/rankings")({
  component: RankingsPage,
});
