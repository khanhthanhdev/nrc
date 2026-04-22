import { useState } from "react";

import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { authClient } from "@/utils/auth-client";
import { isStaffPath, publicNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { LanguageSwitcher } from "./language-switcher";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { SidebarTrigger } from "./ui/sidebar";

const isPublicItemActive = (pathname: string, to: string): boolean => {
  if (to === "/events") {
    return pathname === "/events";
  }

  return pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const isStaffRoute = isStaffPath(pathname);
  const isImpersonating = Boolean(
    (
      session.data?.session as
        | ({
            impersonatedBy?: string | null;
          } & object)
        | undefined
    )?.impersonatedBy,
  );
  const displayName = session.data?.user.name.trim() || session.data?.user.email || "Account";
  const { t } = useTranslation();

  const onSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("header.feedback.signedOut"));
    setMobileMenuOpen(false);
  };

  const onStopImpersonating = async () => {
    const { error } = await authClient.admin.stopImpersonating();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("header.feedback.stopImpersonating"));
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-8">
            <div className="flex items-center gap-2 lg:hidden">
              {isStaffRoute ? (
                <SidebarTrigger
                  aria-label={t("header.mobile.openStaffMenu")}
                  className="md:hidden"
                  size="icon-sm"
                />
              ) : (
                <Button
                  aria-label={t("header.mobile.openMenu")}
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Menu />
                </Button>
              )}
            </div>

            <Link className="flex items-center gap-3" to="/">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold tracking-[0.18em] text-primary">
                S4V
              </span>
              <span className="text-[0.95rem] font-semibold tracking-[-0.03em] text-foreground sm:text-base">
                STEAM for Vietnam
              </span>
            </Link>

            <nav className="hidden flex-wrap items-center gap-2 lg:flex">
              {publicNavigation.map(({ labelKey, to }) => (
                <Link
                  activeProps={{
                    className: "nrc-nav-link-active",
                  }}
                  className={cn("nrc-nav-link px-0 py-0", isPublicItemActive(pathname, to) && "nrc-nav-link-active")}
                  key={to}
                  to={to}
                >
                  {t(labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isImpersonating && (
              <Button onClick={() => void onStopImpersonating()} size="sm" variant="outline">
                <ShieldAlert className="size-4" />
                <span className="hidden sm:inline">{t("header.stopImpersonating")}</span>
                <span className="sm:hidden">{t("header.stopShort")}</span>
              </Button>
            )}

            <LanguageSwitcher className="hidden sm:inline-flex" />

            {session.data ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" type="button" variant="secondary">
                    {displayName}
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="truncate font-medium">
                    {session.data.user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account">{t("header.account.accountSettings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/teams/new">{t("header.account.createTeam")}</Link>
                  </DropdownMenuItem>
                  {isImpersonating && (
                    <DropdownMenuItem onSelect={() => void onStopImpersonating()}>
                      {t("header.stopImpersonating")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => void onSignOut()} variant="destructive">
                    {t("header.account.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link className="text-foreground hidden text-sm font-medium sm:inline-flex" to="/auth">
                  {t("header.signIn")}
                </Link>
                <Button asChild size="sm">
                  <Link to="/register">{t("header.getStarted")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isStaffRoute && (
        <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
          <SheetContent className="w-[min(24rem,100vw)] p-0" side="left">
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle>{t("header.mobile.title")}</SheetTitle>
              <SheetDescription>{t("header.mobile.description")}</SheetDescription>
            </SheetHeader>

            <div className="flex h-full flex-col gap-6 overflow-y-auto px-6 py-6">
              <nav className="flex flex-col gap-2">
                {publicNavigation.map(({ labelKey, to }) => (
                  <Button
                    asChild
                    className="justify-start"
                    key={to}
                    onClick={() => setMobileMenuOpen(false)}
                    variant={isPublicItemActive(pathname, to) ? "secondary" : "ghost"}
                  >
                    <Link to={to}>{t(labelKey)}</Link>
                  </Button>
                ))}
              </nav>

              <div className="space-y-3 border-t border-border pt-5">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
                  {t("header.mobile.accountLabel")}
                </p>

                {session.data ? (
                  <div className="flex flex-col gap-2">
                    <Button asChild className="justify-start" onClick={() => setMobileMenuOpen(false)} variant="ghost">
                      <Link to="/account">{t("header.account.accountSettings")}</Link>
                    </Button>
                    <Button asChild className="justify-start" onClick={() => setMobileMenuOpen(false)} variant="ghost">
                      <Link to="/teams/new">{t("header.account.createTeam")}</Link>
                    </Button>
                    {isImpersonating && (
                      <Button className="justify-start" onClick={() => void onStopImpersonating()} variant="ghost">
                        {t("header.stopImpersonating")}
                      </Button>
                    )}
                    <Button className="justify-start" onClick={() => void onSignOut()} variant="ghost">
                      {t("header.account.signOut")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild className="justify-start" onClick={() => setMobileMenuOpen(false)} variant="ghost">
                      <Link to="/auth">{t("header.signIn")}</Link>
                    </Button>
                    <Button asChild className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/register">{t("header.getStarted")}</Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
                  {t("languageSwitcher.label")}
                </p>
                <LanguageSwitcher />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
