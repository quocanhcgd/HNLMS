import { NextRequest, NextResponse } from "next/server";

type DemoRole =
  | "organization_admin"
  | "branch_manager"
  | "finance_officer"
  | "payroll_officer"
  | "hr_officer"
  | "executive"
  | "consultant"
  | "admission_manager"
  | "marketing_manager"
  | "academic_manager"
  | "academic_affairs"
  | "content_reviewer"
  | "support_staff"
  | "teacher"
  | "teaching_assistant"
  | "student"
  | "parent";

const adminRouteAccess: Record<DemoRole, readonly string[]> = {
  organization_admin: ["/admin"],
  branch_manager: ["/admin", "/admin/admission", "/admin/leads", "/admin/marketing", "/admin/academic", "/admin/learning", "/admin/finance", "/admin/hrm", "/admin/reporting", "/admin/communication", "/admin/branch-operations", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  finance_officer: ["/admin", "/admin/finance", "/admin/reporting", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  payroll_officer: ["/admin", "/admin/payroll", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  hr_officer: ["/admin", "/admin/hrm", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  executive: ["/admin", "/admin/reporting", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  consultant: ["/admin", "/admin/admission", "/admin/leads", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  admission_manager: ["/admin", "/admin/admission", "/admin/leads", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  marketing_manager: ["/admin", "/admin/marketing", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  academic_manager: ["/admin", "/admin/academic", "/admin/learning", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  academic_affairs: ["/admin", "/admin/academic", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  content_reviewer: ["/admin", "/admin/learning", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  support_staff: ["/admin", "/admin/communication", "/admin/my-work", "/admin/my-leave", "/admin/my-payroll", "/admin/account"],
  teacher: [],
  teaching_assistant: [],
  student: [],
  parent: [],
};

const roleHome: Partial<Record<DemoRole, string>> = {
  organization_admin: "/admin",
  branch_manager: "/admin",
  finance_officer: "/admin/finance",
  payroll_officer: "/admin/payroll",
  hr_officer: "/admin/hrm",
  executive: "/admin/reporting",
  consultant: "/admin/admission",
  admission_manager: "/admin/admission",
  marketing_manager: "/admin/marketing",
  academic_manager: "/admin/academic",
  academic_affairs: "/admin/academic",
  content_reviewer: "/admin/learning",
  support_staff: "/admin/communication",
  teacher: "/teacher",
  teaching_assistant: "/teacher",
  student: "/student",
  parent: "/parent",
};

const isAllowed = (pathname: string, role: DemoRole) => {
  if (role === "organization_admin") return pathname === "/admin" || pathname.startsWith("/admin/");
  const prefixes = adminRouteAccess[role] ?? [];
  return prefixes.some((prefix) => pathname === prefix || (prefix !== "/admin" && pathname.startsWith(`${prefix}/`)));
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/teacher") && !pathname.startsWith("/student") && !pathname.startsWith("/parent")) {
    return NextResponse.next();
  }

  const role = request.cookies.get("hnlms_demo_role")?.value as DemoRole | undefined;
  if (!role) return NextResponse.next();

  const workspace = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/teacher") ? "teacher" : pathname.startsWith("/student") ? "student" : "parent";
  const roleWorkspace = role === "teacher" || role === "teaching_assistant" ? "teacher" : role === "student" ? "student" : role === "parent" ? "parent" : "admin";
  const allowed = workspace === "admin" ? isAllowed(pathname, role) : workspace === roleWorkspace && (pathname === `/${workspace}` || pathname.startsWith(`/${workspace}/`));
  if (allowed) return NextResponse.next();

  const target = roleHome[role] ?? "/login";
  return NextResponse.redirect(new URL(target, request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*", "/parent/:path*"],
};
