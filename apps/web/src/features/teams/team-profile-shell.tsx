import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { PublicTeamProfileData } from "./types";

interface TeamProfileShellProps {
  children: ReactNode;
  showManageTabs: boolean;
  team: PublicTeamProfileData;
}

const tabClassName = "nrc-hero-tab";
const activeTabClassName = "nrc-hero-tab-active";

export function TeamProfileShell({ children, showManageTabs, team }: TeamProfileShellProps) {
  const initials = team.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <section className="space-y-6">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="relative overflow-hidden">
          {team.coverImageUrl ? (
            <img alt="" className="h-48 w-full object-cover sm:h-56" src={team.coverImageUrl} />
          ) : (
            <div className="nrc-hero h-48 sm:h-56" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-8 lg:px-12">
            <div className="flex items-end gap-4">
              <Avatar className="size-16 border-2 border-white sm:size-20">
                <AvatarImage alt={team.name} src={team.avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <h1 className="truncate text-2xl font-semibold text-white sm:text-3xl">
                  {team.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/75">
                  <span>{team.teamNumber}</span>
                  {team.schoolOrOrganization && (
                    <>
                      <span className="text-white/40">·</span>
                      <span>{team.schoolOrOrganization}</span>
                    </>
                  )}
                  {team.cityOrProvince && (
                    <>
                      <span className="text-white/40">·</span>
                      <span>{team.cityOrProvince}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b bg-background px-6 sm:px-8 lg:px-12">
          <nav className="flex flex-wrap gap-3 py-3">
            <Link
              activeOptions={{ exact: true }}
              activeProps={{ className: activeTabClassName }}
              className={tabClassName}
              params={{ teamNumber: team.teamNumber }}
              search={{ tab: undefined }}
              to="/teams/$teamNumber"
            >
              Public view
            </Link>
            {showManageTabs && (
              <>
                <Link
                  activeProps={{ className: activeTabClassName }}
                  className={tabClassName}
                  params={{ teamNumber: team.teamNumber }}
                  search={{ tab: "manage" }}
                  to="/teams/$teamNumber"
                >
                  Management
                </Link>
                <Link
                  activeProps={{ className: activeTabClassName }}
                  className={tabClassName}
                  params={{ teamNumber: team.teamNumber }}
                  search={{ tab: "invitations" }}
                  to="/teams/$teamNumber"
                >
                  Invitations
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}
