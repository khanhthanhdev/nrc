import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import type { client } from "@/utils/orpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type PublicMatchItemData = Awaited<
  ReturnType<typeof client.event.listPublicMatches>
>[number];
export type PublicRankingItemData = Awaited<
  ReturnType<typeof client.event.listPublicRankings>
>[number];
export type PublicAwardItemData = Awaited<ReturnType<typeof client.event.listPublicAwards>>[number];

type AllianceColor = "red" | "blue";

interface PublicMatchesTableProps {
  detailLinks?: boolean;
  detailRoute?: "auto" | "playoffs" | "qualifications";
  emptyMessage: string;
  eventId: string;
  matches: PublicMatchItemData[];
  season: string;
}

interface DataMessageProps {
  children?: ReactNode;
  title: string;
}

interface AllianceTeamsProps {
  color: AllianceColor;
  teams: string[];
}

interface AllianceScoreDetails {
  aCenterFlags: number | null;
  aFirstTierFlags: number | null;
  aSecondTierFlags: number | null;
  bBaseFlagsDown: number | null;
  bCenterFlagDown: number | null;
  cOpponentBackfieldBullets: number | null;
  dGoldFlagsDefended: number | null;
  dRobotParkState: number | null;
  scoreA: number | null;
  scoreB: number | null;
  scoreC: number | null;
  scoreD: number | null;
  scoreTotal: number | null;
}

interface ScoreBreakdownCardProps {
  color: AllianceColor;
  details: AllianceScoreDetails | null;
  score: number | null;
}

interface PublicMatchDetailProps {
  locale: string;
  match: PublicMatchItemData;
}

const allianceStyles: Record<AllianceColor, string> = {
  blue: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
  red: "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-100",
};

const allianceHeadStyles: Record<AllianceColor, string> = {
  blue: "text-sky-700 dark:text-sky-200",
  red: "text-red-700 dark:text-red-200",
};

const scoreRows = [
  {
    getValue: (details: AllianceScoreDetails) =>
      `${details.aSecondTierFlags ?? "?"} second-tier, ${details.aFirstTierFlags ?? "?"} first-tier, ${details.aCenterFlags ?? "?"} center`,
    label: "Section A",
    scoreKey: "scoreA",
  },
  {
    getValue: (details: AllianceScoreDetails) =>
      `${details.bCenterFlagDown ?? "?"} center down, ${details.bBaseFlagsDown ?? "?"} base down`,
    label: "Section B",
    scoreKey: "scoreB",
  },
  {
    getValue: (details: AllianceScoreDetails) =>
      `${details.cOpponentBackfieldBullets ?? "?"} opponent backfield bullets`,
    label: "Section C",
    scoreKey: "scoreC",
  },
  {
    getValue: (details: AllianceScoreDetails) =>
      `${details.dRobotParkState ?? "?"} park state, ${details.dGoldFlagsDefended ?? "?"} gold flags defended`,
    label: "Section D",
    scoreKey: "scoreD",
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readNumber = (record: Record<string, unknown>, key: string): number | null => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readStringOrNumber = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return null;
};

const getMatchNumber = (match: PublicMatchItemData): string => {
  if (match.sequenceNumber > 0) {
    return match.sequenceNumber.toString();
  }

  const parsed = match.matchKey.replace(/^[A-Z]+/i, "");
  return parsed || match.matchKey;
};

export const formatPublicScore = (score: number | null): string =>
  typeof score === "number" ? score.toString() : "TBD";

export const formatPublicEventDateTime = (value: string | null, locale: string): string => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatPublicStatus = (match: PublicMatchItemData): string => {
  if (match.resultStatus) {
    return match.resultStatus.toLowerCase().replaceAll("_", " ");
  }

  return match.redScore === null && match.blueScore === null ? "scheduled" : "posted";
};

export const getRankingQualifyingScore = (ranking: PublicRankingItemData): string => {
  const keys = [
    "qualifyingScore",
    "qualificationScore",
    "rankingPoint",
    "rankingPoints",
    "qs",
    "total",
  ];

  for (const record of [ranking.summary, ranking.details]) {
    if (!record) {
      continue;
    }

    for (const key of keys) {
      const value = readStringOrNumber(record, key);
      if (value) {
        return value;
      }
    }
  }

  return "-";
};

export const getAllianceScoreDetails = (
  details: Record<string, unknown> | null,
  color: AllianceColor,
): AllianceScoreDetails | null => {
  if (!details) {
    return null;
  }

  const allianceRecord =
    details[color === "red" ? "redAlliance" : "blueAlliance"] ?? details[color];
  if (!isRecord(allianceRecord)) {
    return null;
  }

  return {
    aCenterFlags: readNumber(allianceRecord, "aCenterFlags"),
    aFirstTierFlags: readNumber(allianceRecord, "aFirstTierFlags"),
    aSecondTierFlags: readNumber(allianceRecord, "aSecondTierFlags"),
    bBaseFlagsDown: readNumber(allianceRecord, "bBaseFlagsDown"),
    bCenterFlagDown: readNumber(allianceRecord, "bCenterFlagDown"),
    cOpponentBackfieldBullets: readNumber(allianceRecord, "cOpponentBackfieldBullets"),
    dGoldFlagsDefended: readNumber(allianceRecord, "dGoldFlagsDefended"),
    dRobotParkState: readNumber(allianceRecord, "dRobotParkState"),
    scoreA: readNumber(allianceRecord, "scoreA"),
    scoreB: readNumber(allianceRecord, "scoreB"),
    scoreC: readNumber(allianceRecord, "scoreC"),
    scoreD: readNumber(allianceRecord, "scoreD"),
    scoreTotal: readNumber(allianceRecord, "scoreTotal"),
  };
};

export const getPublicMatchNumber = getMatchNumber;

export function PublicDataMessage({ children, title }: DataMessageProps) {
  return (
    <div className="nrc-card-subtle p-4 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      {children ? <div className="mt-1 text-muted-foreground">{children}</div> : null}
    </div>
  );
}

export function AllianceTeams({ color, teams }: AllianceTeamsProps) {
  if (teams.length === 0) {
    return <span className="text-muted-foreground">TBD</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {teams.map((team) => (
        <span
          className={cn("rounded-full border px-2 py-1 font-medium", allianceStyles[color])}
          key={team}
        >
          {team}
        </span>
      ))}
    </div>
  );
}

export function ScoreBreakdownCard({ color, details, score }: ScoreBreakdownCardProps) {
  return (
    <div className="nrc-card-subtle p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={cn("font-semibold capitalize", allianceHeadStyles[color])}>
            {color} alliance
          </h2>
          <p className="text-muted-foreground text-xs">Game-specific score breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{formatPublicScore(score)}</p>
          <p className="text-muted-foreground text-xs">total</p>
        </div>
      </div>

      {details ? (
        <div className="mt-4 space-y-2 text-sm">
          {scoreRows.map((row) => (
            <div className="flex items-start justify-between gap-4" key={row.label}>
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-muted-foreground text-xs">{row.getValue(details)}</p>
              </div>
              <p className="font-semibold">{details[row.scoreKey] ?? "-"}</p>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-3">
            <p className="font-semibold">Published total</p>
            <p className="font-semibold">{details.scoreTotal ?? formatPublicScore(score)}</p>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">No scoring breakdown published.</p>
      )}
    </div>
  );
}

export function PublicMatchDetail({ locale, match }: PublicMatchDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="nrc-card-subtle p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Red</p>
          <div className="mt-3">
            <AllianceTeams color="red" teams={match.redAlliance} />
          </div>
          <p className="mt-4 text-3xl font-semibold">{formatPublicScore(match.redScore)}</p>
        </div>
        <div className="nrc-card-subtle p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Blue</p>
          <div className="mt-3">
            <AllianceTeams color="blue" teams={match.blueAlliance} />
          </div>
          <p className="mt-4 text-3xl font-semibold">{formatPublicScore(match.blueScore)}</p>
        </div>
      </div>

      <div className="nrc-card-subtle grid gap-3 p-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs">Status</p>
          <p className="font-medium capitalize">{formatPublicStatus(match)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Scheduled</p>
          <p className="font-medium">{formatPublicEventDateTime(match.scheduledStartAt, locale)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Played</p>
          <p className="font-medium">{formatPublicEventDateTime(match.playedAt, locale)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Field</p>
          <p className="font-medium">{match.field ?? "TBD"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScoreBreakdownCard
          color="red"
          details={getAllianceScoreDetails(match.details, "red")}
          score={match.redScore}
        />
        <ScoreBreakdownCard
          color="blue"
          details={getAllianceScoreDetails(match.details, "blue")}
          score={match.blueScore}
        />
      </div>
    </div>
  );
}

export function PublicMatchesTable({
  detailLinks = false,
  detailRoute = "qualifications",
  emptyMessage,
  eventId,
  matches,
  season,
}: PublicMatchesTableProps) {
  if (matches.length === 0) {
    return <PublicDataMessage title={emptyMessage} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Match #</TableHead>
          <TableHead>Red alliance</TableHead>
          <TableHead>Blue alliance</TableHead>
          <TableHead className="text-right">Red score</TableHead>
          <TableHead className="text-right">Blue score</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => {
          const matchNumber = getMatchNumber(match);
          let resolvedDetailRoute = detailRoute;

          if (detailRoute === "auto") {
            resolvedDetailRoute = match.phase === "PLAYOFF" ? "playoffs" : "qualifications";
          }

          return (
            <TableRow key={match.matchKey}>
              <TableCell className="font-semibold">
                {detailLinks ? (
                  <Link
                    className="underline-offset-4 hover:underline"
                    params={{ eventId, matchNumber, season }}
                    to={
                      resolvedDetailRoute === "playoffs"
                        ? "/{-$locale}/$season/$eventId/playoffs/$matchNumber"
                        : "/{-$locale}/$season/$eventId/qualifications/$matchNumber"
                    }
                  >
                    {match.matchKey}
                  </Link>
                ) : (
                  match.matchKey
                )}
              </TableCell>
              <TableCell>
                <AllianceTeams color="red" teams={match.redAlliance} />
              </TableCell>
              <TableCell>
                <AllianceTeams color="blue" teams={match.blueAlliance} />
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatPublicScore(match.redScore)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatPublicScore(match.blueScore)}
              </TableCell>
              <TableCell className="capitalize">{formatPublicStatus(match)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
