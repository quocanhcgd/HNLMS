import type { NavigationItem } from "@hnlms/ui";
import { BarChart3, BookOpen, Building2, ClipboardList, LayoutDashboard, Settings, Users, Wallet } from "lucide-react";
import type { ComponentType } from "react";

export type NavIcon = ComponentType<{ size?: number }>;
export type NavigationManifest = NavigationItem & {
  icon?: NavIcon;
  roles?: readonly string[];
  children?: readonly NavigationManifest[];
};
export type NavigationContext = {
  role: string;
  permissions: ReadonlySet<string>;
  effectiveModules: ReadonlySet<string>;
};

export const lmsNavigation: readonly NavigationManifest[] = [
  {
    key: "overview",
    labelKey: "overview",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["organization_admin", "branch_manager", "consultant", "teacher", "student", "parent"],
  },
  {
    key: "admission",
    labelKey: "admission",
    href: "/admin/admission",
    icon: Users,
    moduleKey: "admission",
    children: [
      {
        key: "leads",
        labelKey: "leads",
        href: "/admin/leads",
        roles: ["organization_admin", "branch_manager", "consultant"],
      },
    ],
  },
  {
    key: "academic",
    labelKey: "academic",
    href: "/admin/academic",
    icon: BookOpen,
    moduleKey: "academic",
    children: [
      {
        key: "programs",
        labelKey: "academic",
        href: "/admin/academic/programs",
        roles: ["organization_admin", "branch_manager"],
      },
      {
        key: "classes",
        labelKey: "learning",
        href: "/admin/academic/classes",
        roles: ["organization_admin", "branch_manager", "teacher"],
      },
    ],
  },
  {
    key: "learning",
    labelKey: "learning",
    href: "/admin/learning",
    icon: ClipboardList,
    moduleKey: "learning",
    children: [
      {
        key: "library",
        labelKey: "learning",
        href: "/admin/student/library",
        roles: ["organization_admin", "teacher", "student", "parent"],
      },
    ],
  },
  {
    key: "students",
    labelKey: "students",
    href: "/admin/students",
    icon: Users,
    roles: ["organization_admin", "branch_manager", "teacher", "student", "parent"],
  },
  {
    key: "finance",
    labelKey: "finance",
    href: "/admin/finance",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["organization_admin", "branch_manager", "finance_officer", "student", "parent"],
  },
  {
    key: "people",
    labelKey: "people",
    href: "/admin/hrm",
    icon: Building2,
    moduleKey: "hrm",
    roles: ["organization_admin", "branch_manager", "hr_officer"],
  },
  {
    key: "reports",
    labelKey: "reports",
    href: "/admin/reporting",
    icon: BarChart3,
    moduleKey: "reporting",
    roles: ["organization_admin", "branch_manager", "finance_officer"],
  },
  { key: "settings", labelKey: "settings", href: "/ui-preview", icon: Settings, roles: ["organization_admin"] },
];

export const mockNavigationContext: NavigationContext = {
  role: "organization_admin",
  permissions: new Set(["navigation:read"]),
  effectiveModules: new Set(["admission", "academic", "learning", "finance", "hrm", "reporting"]),
};

export function isNavigationVisible(item: NavigationManifest, context: NavigationContext): boolean {
  if (item.roles && !item.roles.includes(context.role)) return false;
  if (item.moduleKey && !context.effectiveModules.has(item.moduleKey)) return false;
  if (item.permission && !context.permissions.has(item.permission)) return false;
  return true;
}

export function filterNavigation(
  items: readonly NavigationManifest[],
  context: NavigationContext,
): NavigationManifest[] {
  return items.flatMap((item) => {
    if (!isNavigationVisible(item, context)) return [];
    const children = item.children ? filterNavigation(item.children, context) : [];
    if (item.children && children.length === 0 && !item.href.startsWith("/admin$")) return [];
    return [{ ...item, children }];
  });
}

export function isNavigationActive(pathname: string, item: NavigationManifest): boolean {
  return (
    pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ||
    Boolean(item.children?.some((child) => isNavigationActive(pathname, child)))
  );
}
