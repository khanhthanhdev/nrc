import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

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

const isActiveItem = (pathname: string, to: string): boolean =>
  pathname === to || (to !== "/staff" && pathname.startsWith(`${to}/`));

export function StaffSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const session = authClient.useSession();
  const systemRole = getSystemRole(session.data);
  const { footerItem, sections } = getStaffNavigation(systemRole);
  const { t } = useTranslation();

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
                        <Link to={item.to}>
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
              <Link to={footerItem.to}>
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
