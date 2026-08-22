import type { NavigationItem } from "@hnlms/ui";
import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type WorkspaceKey = "admin" | "teacher" | "student" | "parent";
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

export const adminNavigation: readonly NavigationManifest[] = [
  {
    key: "overview",
    labelKey: "overview",
    href: "/admin",
    icon: LayoutDashboard,
    roles: [
      "organization_admin",
      "branch_manager",
      "consultant",
      "academic_affairs",
      "finance_officer",
      "hr_officer",
      "payroll_officer",
    ],
  },
  {
    key: "admission",
    labelKey: "admission",
    href: "/admin/admission",
    icon: Users,
    moduleKey: "admission",
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager"],
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
    key: "marketing",
    labelKey: "marketing",
    href: "/admin/marketing",
    icon: Megaphone,
    moduleKey: "marketing",
    roles: ["organization_admin", "branch_manager", "marketing_manager"],
    children: [
      {
        key: "content",
        labelKey: "landingContent",
        href: "/admin/marketing/content",
        roles: ["organization_admin", "branch_manager", "marketing_manager"],
      },
      {
        key: "publicPreview",
        labelKey: "publicPreview",
        href: "/admin/marketing/preview",
        roles: ["organization_admin", "branch_manager", "marketing_manager"],
      },
    ],
  },
  {
    key: "academic",
    labelKey: "academic",
    href: "/admin/academic",
    icon: BookOpen,
    moduleKey: "academic",
    roles: ["organization_admin", "branch_manager", "academic_manager", "academic_affairs"],
    children: [
      {
        key: "programs",
        labelKey: "academicPrograms",
        href: "/admin/academic/programs",
        roles: ["organization_admin", "branch_manager", "academic_manager"],
      },
      {
        key: "classes",
        labelKey: "academicClasses",
        href: "/admin/academic/classes",
        roles: ["organization_admin", "branch_manager", "academic_manager", "academic_affairs"],
      },
      {
        key: "managedStudents",
        labelKey: "managedStudents",
        href: "/admin/academic/students",
        roles: ["organization_admin", "branch_manager", "academic_affairs"],
      },
      {
        key: "teachingAssignments",
        labelKey: "teachingAssignments",
        href: "/admin/academic/teacher-assignments",
        roles: ["organization_admin", "branch_manager", "academic_manager", "academic_affairs"],
      },
    ],
  },
  {
    key: "learningAdmin",
    labelKey: "learningAdmin",
    href: "/admin/learning",
    icon: ClipboardList,
    moduleKey: "learning",
    roles: ["organization_admin", "academic_manager", "content_reviewer"],
    children: [
      {
        key: "learningContentAdmin",
        labelKey: "learningContentAdmin",
        href: "/admin/learning/content",
        roles: ["organization_admin", "academic_manager", "content_reviewer"],
      },
      {
        key: "learningLibraryAdmin",
        labelKey: "learningLibraryAdmin",
        href: "/admin/learning/library",
        roles: ["organization_admin", "academic_manager", "content_reviewer"],
      },
    ],
  },
  {
    key: "communication",
    labelKey: "communication",
    href: "/admin/communication",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["organization_admin", "branch_manager", "academic_affairs", "support_staff"],
    children: [
      {
        key: "communicationCenter",
        labelKey: "communicationCenter",
        href: "/admin/communication",
        roles: ["organization_admin", "branch_manager", "academic_affairs", "support_staff"],
      },
      {
        key: "notificationInbox",
        labelKey: "notificationInbox",
        href: "/admin/communication/notifications",
        roles: ["organization_admin", "branch_manager", "academic_affairs", "support_staff"],
      },
    ],
  },
  {
    key: "finance",
    labelKey: "finance",
    href: "/admin/finance",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["organization_admin", "branch_manager", "finance_officer"],
  },
  {
    key: "payroll",
    labelKey: "payroll",
    href: "/admin/payroll",
    icon: Wallet,
    moduleKey: "payroll",
    roles: ["organization_admin", "payroll_officer"],
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
    roles: ["organization_admin", "branch_manager", "finance_officer", "executive"],
  },
  { key: "settings", labelKey: "settings", href: "/ui-preview", icon: Settings, roles: ["organization_admin"] },
];

export const teacherNavigation: readonly NavigationManifest[] = [
  {
    key: "teacherHome",
    labelKey: "teacherHome",
    href: "/teacher",
    icon: LayoutDashboard,
    roles: ["teacher", "teaching_assistant"],
  },
  {
    key: "teacherClasses",
    labelKey: "teacherClasses",
    href: "/teacher/classes",
    icon: BookOpen,
    roles: ["teacher", "teaching_assistant"],
  },
  {
    key: "teacherContent",
    labelKey: "teacherContent",
    href: "/teacher/content",
    icon: ClipboardList,
    moduleKey: "learning",
    roles: ["teacher"],
  },
  {
    key: "teacherAssessment",
    labelKey: "teacherAssessment",
    href: "/teacher/assessment",
    icon: ClipboardList,
    moduleKey: "assessment",
    roles: ["teacher"],
  },
  {
    key: "teacherMessages",
    labelKey: "teacherMessages",
    href: "/teacher/messages",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["teacher", "teaching_assistant"],
  },
  {
    key: "teacherPayroll",
    labelKey: "teacherPayroll",
    href: "/teacher/payroll",
    icon: Wallet,
    moduleKey: "payroll",
    roles: ["teacher", "teaching_assistant"],
  },
];

export const studentNavigation: readonly NavigationManifest[] = [
  { key: "studentHome", labelKey: "studentHome", href: "/student", icon: GraduationCap, roles: ["student"] },
  {
    key: "studentProgress",
    labelKey: "studentProgress",
    href: "/student/progress",
    icon: BarChart3,
    roles: ["student"],
  },
  {
    key: "studentLibrary",
    labelKey: "studentLibrary",
    href: "/student/library",
    icon: ClipboardList,
    moduleKey: "learning",
    roles: ["student"],
  },
  {
    key: "studentAssessment",
    labelKey: "studentAssessment",
    href: "/student/assessment",
    icon: ClipboardList,
    moduleKey: "assessment",
    roles: ["student"],
  },
  {
    key: "studentMessages",
    labelKey: "studentMessages",
    href: "/student/messages",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["student"],
  },
  {
    key: "studentBilling",
    labelKey: "studentBilling",
    href: "/student/billing",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["student"],
  },
];

export const parentNavigation: readonly NavigationManifest[] = [
  { key: "parentHome", labelKey: "parentHome", href: "/parent", icon: Users, roles: ["parent"] },
  {
    key: "parentStudents",
    labelKey: "parentStudents",
    href: "/parent/students",
    icon: GraduationCap,
    roles: ["parent"],
  },
  {
    key: "parentConversations",
    labelKey: "parentConversations",
    href: "/parent/conversations",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["parent"],
  },
  {
    key: "notificationInbox",
    labelKey: "notificationInbox",
    href: "/parent/notifications",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["parent"],
  },
  {
    key: "parentPayments",
    labelKey: "parentPayments",
    href: "/parent/payments",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["parent"],
  },
];

export const workspaceNavigation: Record<WorkspaceKey, readonly NavigationManifest[]> = {
  admin: adminNavigation,
  teacher: teacherNavigation,
  student: studentNavigation,
  parent: parentNavigation,
};

export const lmsNavigation = adminNavigation;

export const mockNavigationContext: NavigationContext = {
  role: "organization_admin",
  permissions: new Set(["navigation:read"]),
  effectiveModules: new Set([
    "admission",
    "marketing",
    "academic",
    "learning",
    "assessment",
    "communication",
    "finance",
    "payroll",
    "hrm",
    "reporting",
  ]),
};

export const mockWorkspaceContexts: Record<WorkspaceKey, NavigationContext> = {
  admin: mockNavigationContext,
  teacher: {
    role: "teacher",
    permissions: new Set(["navigation:read"]),
    effectiveModules: mockNavigationContext.effectiveModules,
  },
  student: {
    role: "student",
    permissions: new Set(["navigation:read"]),
    effectiveModules: mockNavigationContext.effectiveModules,
  },
  parent: {
    role: "parent",
    permissions: new Set(["navigation:read"]),
    effectiveModules: mockNavigationContext.effectiveModules,
  },
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

export function getNavigationForWorkspace(
  workspace: WorkspaceKey,
  context: NavigationContext = mockWorkspaceContexts[workspace],
) {
  return filterNavigation(workspaceNavigation[workspace], context);
}

export function isNavigationActive(pathname: string, item: NavigationManifest): boolean {
  return (
    pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ||
    Boolean(item.children?.some((child) => isNavigationActive(pathname, child)))
  );
}
