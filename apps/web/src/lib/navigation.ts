import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarRange,
  ClipboardCheck,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import type { SystemRole } from "./route-policy";

import { isAdminSystemRole } from "./route-policy";
import { stripLocaleFromPathname } from "./locale-routing";

export interface PublicNavigationItem {
  labelKey: string;
  to: "/" | "/events" | "/teams" | "/register";
}

export interface StaffNavigationItem {
  icon: LucideIcon;
  labelKey: string;
  to: string;
}

export interface StaffNavigationSection {
  items: StaffNavigationItem[];
  labelKey: string;
}

export const publicNavigation: PublicNavigationItem[] = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.events", to: "/events" },
  { labelKey: "nav.teams", to: "/teams" },
  { labelKey: "nav.register", to: "/register" },
];

export const isStaffPath = (pathname: string): boolean => {
  const normalizedPathname = stripLocaleFromPathname(pathname);

  return normalizedPathname === "/staff" || normalizedPathname.startsWith("/staff/");
};

export const getStaffNavigation = (systemRole?: SystemRole) => {
  const isAdmin = isAdminSystemRole(systemRole);

  const sections: StaffNavigationSection[] = [
    {
      items: [{ icon: LayoutDashboard, labelKey: "staffSidebar.overview", to: "/staff" }],
      labelKey: "staffSidebar.section.panel",
    },
    {
      items: [
        ...(isAdmin
          ? [
              {
                icon: CalendarRange,
                labelKey: "staffSidebar.seasons",
                to: "/staff/seasons",
              } satisfies StaffNavigationItem,
            ]
          : []),
        { icon: Trophy, labelKey: "staffSidebar.events", to: "/staff/events" },
        {
          icon: ClipboardCheck,
          labelKey: "staffSidebar.registrations",
          to: "/staff/registrations",
        },
      ],
      labelKey: "staffSidebar.section.content",
    },
    {
      items: [
        ...(isAdmin
          ? [
              {
                icon: Users,
                labelKey: "staffSidebar.users",
                to: "/staff/users",
              } satisfies StaffNavigationItem,
            ]
          : []),
        { icon: RefreshCw, labelKey: "staffSidebar.sync", to: "/staff/sync" },
        ...(isAdmin
          ? [
              {
                icon: Settings,
                labelKey: "staffSidebar.settings",
                to: "/staff/settings",
              } satisfies StaffNavigationItem,
            ]
          : []),
      ],
      labelKey: "staffSidebar.section.admin",
    },
  ];

  return {
    footerItem: {
      icon: ArrowLeft,
      labelKey: "staffSidebar.backToSite",
      to: "/",
    } satisfies StaffNavigationItem,
    sections: sections.filter((section) => section.items.length > 0),
  };
};
