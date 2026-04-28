import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  getSupportedLocale,
  localizePathname,
  stripLocaleFromPathname,
} from "@/lib/locale-routing";
import { getSystemRole } from "@/lib/route-policy";
import { getStaffNavigation } from "@/lib/navigation";
import { authClient } from "@/utils/auth-client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "./ui/sidebar";

const isActiveItem = (pathname: string, to: string): boolean => {
  const normalizedPathname = stripLocaleFromPathname(pathname);

  return normalizedPathname === to || (to !== "/staff" && normalizedPathname.startsWith(`${to}/`));
};

export function StaffSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const systemRole = getSystemRole(session.data);
  const { footerItem, sections } = getStaffNavigation(systemRole);
  const { i18n, t } = useTranslation();
  const activeLanguage = getSupportedLocale(i18n.resolvedLanguage ?? i18n.language);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-1 px-3 py-4">
        <p className="text-sidebar-foreground/65 text-[0.65rem] font-semibold uppercase tracking-[0.24em]">
          {t("staffSidebar.kicker")}
        </p>
        <p className="text-sm font-semibold tracking-[-0.02em] text-sidebar-foreground">
          {t("staffSidebar.title")}
        </p>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="gap-3 px-2 py-3">
        {sections.map((section) => (
          <SidebarGroup key={section.labelKey}>
            <SidebarGroupLabel className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]">
              {t(section.labelKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActiveItem(pathname, item.to)}
                        tooltip={t(item.labelKey)}
                      >
                        <Link to={localizePathname(item.to, activeLanguage)}>
                          <Icon />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t(footerItem.labelKey)}>
              <Link to={localizePathname(footerItem.to, activeLanguage)}>
                <footerItem.icon />
                <span>{t(footerItem.labelKey)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
