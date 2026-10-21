import type { NavigationItem } from "@hnlms/ui";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  Building2,
  ClipboardList,
  Bell,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type WorkspaceKey = "admin" | "teacher" | "student" | "parent";
export type NavIcon = ComponentType<{ size?: number }>;
export type NavigationSectionKey = "overview" | "admission" | "operations" | "learning" | "information" | "personal" | "settings";
export type NavigationManifest = NavigationItem & {
  icon?: NavIcon;
  roles?: readonly string[];
  children?: readonly NavigationManifest[];
  section?: NavigationSectionKey;
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
      "admission_manager",
      "marketing_manager",
      "academic_manager",
      "academic_affairs",
      "content_reviewer",
      "support_staff",
      "finance_officer",
      "hr_officer",
      "payroll_officer",
      "executive",
    ],
    section: "overview",
  },
  {
    key: "admission",
    labelKey: "admission",
    href: "/admin/admission",
    icon: Users,
    moduleKey: "admission",
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager"],
    section: "admission",
    children: [
      {
        key: "leads",
        labelKey: "leads",
        href: "/admin/leads",
        roles: ["organization_admin", "branch_manager", "consultant", "admission_manager"],
      },
    ],
  },
  {
    key: "consultantWork",
    labelKey: "consultantWork",
    href: "/admin/my-work",
    icon: CalendarClock,
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive"],
    section: "personal",
  },


  {
    key: "consultantLeave",
    labelKey: "consultantLeave",
    href: "/admin/my-leave",
    icon: ClipboardList,
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive"],
    section: "personal",
  },
  {
    key: "consultantPayroll",
    labelKey: "consultantPayroll",
    href: "/admin/my-payroll",
    icon: Wallet,
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive"],
    section: "personal",
  },
  {
    key: "branchOperations",
    labelKey: "branchOperations",
    href: "/admin/branch-operations",
    icon: Building2,
    roles: ["branch_manager"],
    section: "operations",
  },  {
    key: "marketing",
    labelKey: "marketing",
    href: "/admin/marketing",
    icon: Megaphone,
    moduleKey: "marketing",
    roles: ["organization_admin", "branch_manager", "marketing_manager"],
    section: "operations",
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
    section: "operations",
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
      {
        key: "competencyPublication",
        labelKey: "competencyPublication",
        href: "/admin/academic/competency",
        roles: ["organization_admin", "academic_manager", "academic_affairs"],
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
    section: "operations",
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
    key: "communicationCenter",
    labelKey: "communicationCenter",
    href: "/admin/communication",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive"],
    section: "information",
  },
  {
    key: "notificationInbox",
    labelKey: "notificationInbox",
    href: "/admin/communication/notifications",
    icon: Bell,
    moduleKey: "communication",
    roles: ["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive"],
    section: "information",
  },
  {
    key: "finance",
    labelKey: "finance",
    href: "/admin/finance",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["organization_admin", "branch_manager", "finance_officer"],
    section: "operations",
    children: [
      {
        key: "branchFinance",
        labelKey: "branchFinance",
        href: "/admin/finance/branch-finance",
        roles: ["organization_admin", "branch_manager", "finance_officer"],
      },
    ],
  },
  {
    key: "payroll",
    labelKey: "payroll",
    href: "/admin/payroll",
    icon: Wallet,
    moduleKey: "payroll",
    roles: ["organization_admin", "payroll_officer"],
    section: "operations",
  },
  {
    key: "people",
    labelKey: "people",
    href: "/admin/hrm",
    icon: Building2,
    moduleKey: "hrm",
    roles: ["organization_admin", "branch_manager", "hr_officer"],
    section: "operations",
  },
  {
    key: "reports",
    labelKey: "reports",
    href: "/admin/reporting",
    icon: BarChart3,
    moduleKey: "reporting",
    roles: ["organization_admin", "branch_manager", "finance_officer", "executive"],
    section: "operations",
  },
  {
    key: "organizationSettings",
    labelKey: "settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["organization_admin"],
    section: "settings",
  },
  {
    key: "adminAccount",
    labelKey: "teacherSettings",
    href: "/admin/account",
    icon: Settings,
    roles: [
      "organization_admin",
      "branch_manager",
      "consultant",
      "admission_manager",
      "marketing_manager",
      "academic_manager",
      "academic_affairs",
      "content_reviewer",
      "support_staff",
      "finance_officer",
      "payroll_officer",
      "hr_officer",
      "executive",
    ],
    section: "settings",
  },
];

export const teacherNavigation: readonly NavigationManifest[] = [
  {
    key: "teacherHome",
    labelKey: "teacherHome",
    href: "/teacher",
    icon: LayoutDashboard,
    roles: ["teacher", "teaching_assistant"],
    section: "overview",
  },
  {
    key: "teacherClasses",
    labelKey: "teacherClasses",
    href: "/teacher/classes",
    icon: BookOpen,
    roles: ["teacher", "teaching_assistant"],
    section: "learning",
  },
  {
    key: "teacherContent",
    labelKey: "teacherContent",
    href: "/teacher/content",
    icon: ClipboardList,
    moduleKey: "learning",
    roles: ["teacher"],
    section: "learning",
  },
  {
    key: "teacherEntranceAssessment",
    labelKey: "teacherEntranceAssessment",
    href: "/teacher/assessment/entrance",
    icon: ClipboardList,
    moduleKey: "assessment",
    roles: ["teacher"],
    section: "learning",
  },
  {
    key: "teacherMockAssessment",
    labelKey: "teacherMockAssessment",
    href: "/teacher/assessment/mock",
    icon: ClipboardList,
    moduleKey: "assessment",
    roles: ["teacher"],
    section: "learning",
  },
  {
    key: "teacherCompetency",
    labelKey: "teacherCompetency",
    href: "/teacher/competency",
    icon: BarChart3,
    moduleKey: "assessment",
    roles: ["teacher"],
    section: "learning",
  },
  {
    key: "teacherOnline",
    labelKey: "teacherOnline",
    href: "/teacher/online",
    icon: BookOpen,
    moduleKey: "online_class",
    roles: ["teacher", "teaching_assistant"],
    section: "learning",
  },
  {
    key: "teacherWorklog",
    labelKey: "teacherWorklog",
    href: "/teacher/worklog",
    icon: ClipboardList,
    moduleKey: "academic",
    roles: ["teacher", "teaching_assistant"],
    section: "personal",
  },
  {
    key: "teacherPayroll",
    labelKey: "teacherPayroll",
    href: "/teacher/payroll",
    icon: Wallet,
    moduleKey: "payroll",
    roles: ["teacher", "teaching_assistant"],
    section: "personal",
  },
  {
    key: "teacherLeave",
    labelKey: "consultantLeave",
    href: "/teacher/leave",
    icon: ClipboardList,
    moduleKey: "hrm",
    roles: ["teacher", "teaching_assistant"],
    section: "personal",
  },
  {
    key: "teacherMessages",
    labelKey: "teacherMessages",
    href: "/teacher/messages",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["teacher", "teaching_assistant"],
    section: "information",
  },
  {
    key: "teacherInternalMessages",
    labelKey: "teacherInternalMessages",
    href: "/teacher/internal",
    icon: UsersRound,
    moduleKey: "communication",
    roles: ["teacher", "teaching_assistant"],
    section: "information",
  },
  {
    key: "teacherSettings",
    labelKey: "teacherSettings",
    href: "/teacher/settings",
    icon: Settings,
    roles: ["teacher", "teaching_assistant"],
    section: "settings",
  },
];

export const studentNavigation: readonly NavigationManifest[] = [
  {
    key: "studentHome",
    labelKey: "studentHome",
    href: "/student",
    icon: GraduationCap,
    roles: ["student"],
    section: "overview",
  },
  {
    key: "studentSchedule",
    labelKey: "studentSchedule",
    href: "/student/schedule",
    icon: CalendarClock,
    moduleKey: "academic",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentClasses",
    labelKey: "studentClasses",
    href: "/student/classes",
    icon: BookOpen,
    moduleKey: "academic",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentScores",
    labelKey: "studentScores",
    href: "/student/scores",
    icon: BarChart3,
    moduleKey: "academic",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentHomework",
    labelKey: "studentHomework",
    href: "/student/homework",
    icon: ClipboardList,
    moduleKey: "learning",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentProgress",
    labelKey: "studentProgress",
    href: "/student/progress",
    icon: BarChart3,
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentLibrary",
    labelKey: "studentLibrary",
    href: "/student/library",
    icon: ClipboardList,
    moduleKey: "learning",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentAssessment",
    labelKey: "studentAssessment",
    href: "/student/assessment",
    icon: ClipboardList,
    moduleKey: "assessment",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentEnglish",
    labelKey: "studentEnglish",
    href: "/student/competency",
    icon: BarChart3,
    moduleKey: "assessment",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentOnline",
    labelKey: "studentOnline",
    href: "/student/online",
    icon: BookOpen,
    moduleKey: "online_class",
    roles: ["student"],
    section: "learning",
  },
  {
    key: "studentMessages",
    labelKey: "studentMessages",
    href: "/student/messages",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["student"],
    section: "information",
  },
  {
    key: "studentBilling",
    labelKey: "studentBilling",
    href: "/student/billing",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["student"],
    section: "personal",
  },
  {
    key: "studentSettings",
    labelKey: "studentSettings",
    href: "/student/settings",
    icon: Settings,
    roles: ["student"],
    section: "settings",
  },
];

export const parentNavigation: readonly NavigationManifest[] = [
  { key: "parentHome", labelKey: "parentHome", href: "/parent", icon: Users, roles: ["parent"], section: "overview" },
  {
    key: "parentCompetency",
    labelKey: "parentCompetency",
    href: "/parent/competency",
    icon: BarChart3,
    moduleKey: "assessment",
    roles: ["parent"],
    section: "learning",
  },
  {
    key: "parentStudents",
    labelKey: "parentStudents",
    href: "/parent/students",
    icon: GraduationCap,
    roles: ["parent"],
    section: "learning",
  },
  {
    key: "parentClasses",
    labelKey: "parentClasses",
    href: "/parent/classes",
    icon: BookOpen,
    moduleKey: "academic",
    roles: ["parent"],
    section: "learning",
  },
  {
    key: "parentOnline",
    labelKey: "parentOnline",
    href: "/parent/online",
    icon: BookOpen,
    moduleKey: "online_class",
    roles: ["parent"],
    section: "learning",
  },
  {
    key: "parentConversations",
    labelKey: "parentConversations",
    href: "/parent/conversations",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["parent"],
    section: "information",
  },
  {
    key: "notificationInbox",
    labelKey: "notificationInbox",
    href: "/parent/notifications",
    icon: MessageSquare,
    moduleKey: "communication",
    roles: ["parent"],
    section: "information",
  },
  {
    key: "parentPayments",
    labelKey: "parentPayments",
    href: "/parent/payments",
    icon: Wallet,
    moduleKey: "finance",
    roles: ["parent"],
    section: "personal",
  },
  {
    key: "parentSettings",
    labelKey: "settings",
    href: "/parent/settings",
    icon: Settings,
    roles: ["parent"],
    section: "settings",
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
    "online_class",
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

/** Returns whether a pathname belongs to a route visible to the current role. */
export function isNavigationPathAllowed(
  pathname: string,
  workspace: WorkspaceKey,
  context: NavigationContext = mockWorkspaceContexts[workspace],
) {
  return getNavigationForWorkspace(workspace, context).some((item) => isNavigationActive(pathname, item));
}

export function isNavigationActive(pathname: string, item: NavigationManifest): boolean {
  const workspaceRootRoutes = new Set(["/admin", "/teacher", "/student", "/parent"]);
  return (
    pathname === item.href ||
    (!workspaceRootRoutes.has(item.href) && pathname.startsWith(`${item.href}/`)) ||
    Boolean(item.children?.some((child) => isNavigationActive(pathname, child)))
  );
}

