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
import { PublicDataMessage } from "@/features/events/public-event-data";
import { isValidEventId, isValidSeason } from "@/lib/route-policy";
import { orpc } from "@/utils/orpc";

const AwardsPage = () => {
  const { eventId, season } = useParams({ from: "/{-$locale}/$season/$eventId/awards" });
  const isValidRoute = isValidSeason(season) && isValidEventId(eventId);
  const awardsQuery = useQuery({
    ...orpc.event.listPublicAwards.queryOptions({
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
      description="Awards and recipients from the synced event awards snapshot."
      title="Awards"
    >
      {awardsQuery.isLoading ? <PublicDataMessage title="Loading awards..." /> : null}
      {awardsQuery.error ? (
        <PublicDataMessage title="Awards unavailable">
          Try refreshing after the event sync completes.
        </PublicDataMessage>
      ) : null}
      {!awardsQuery.isLoading && !awardsQuery.error && (awardsQuery.data ?? []).length === 0 ? (
        <PublicDataMessage title="No awards published yet." />
      ) : null}
      {(awardsQuery.data ?? []).length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Award</TableHead>
              <TableHead>Team #</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(awardsQuery.data ?? []).map((award) => (
              <TableRow key={award.awardKey}>
                <TableCell className="font-medium">{award.awardName}</TableCell>
                <TableCell>{award.teamNumber ?? "-"}</TableCell>
                <TableCell>{award.recipientName ?? "-"}</TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {award.comment ?? "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </RouteSection>
  );
};

export const Route = createFileRoute("/{-$locale}/$season/$eventId/awards")({
  component: AwardsPage,
});
