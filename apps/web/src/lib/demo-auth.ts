export type DemoRole =
  | "organization_admin"
  | "branch_manager"
  | "consultant"
  | "admission_manager"
  | "marketing_manager"
  | "academic_manager"
  | "academic_affairs"
  | "content_reviewer"
  | "support_staff"
  | "finance_officer"
  | "payroll_officer"
  | "hr_officer"
  | "executive"
  | "teacher"
  | "teaching_assistant"
  | "student"
  | "parent";

export type DemoSession = {
  email: string;
  displayName: string;
  role: DemoRole;
  roleLabel: string;
  workspace: "admin" | "teacher" | "student" | "parent";
  home: string;
  branchId?: string;
};

export type DemoAccount = DemoSession & {
  password: string;
  description: string;
  scope: string;
};

export type DemoProfile = {
  displayName: string;
  email: string;
  phone: string;
  timezone: string;
  department: string;
};

export type DemoPreferences = {
  locale: "vi" | "en";
  emailAlerts: boolean;
  reminders: boolean;
  assignmentAlerts: boolean;
  classChangeAlerts: boolean;
  centerNews: boolean;
};

export const DEMO_PASSWORD = "DemoAccess@2026!";
export const DEMO_SESSION_KEY = "hnlms-demo-session";
const DEMO_PROFILE_KEY = "hnlms-demo-profiles";
const DEMO_PREFERENCES_KEY = "hnlms-demo-preferences";
const DEMO_PASSWORD_KEY = "hnlms-demo-passwords";

export const demoAccounts: readonly DemoAccount[] = [
  {
    email: "admin@demo.hnlms.vn",
    displayName: "Quản trị viên Demo",
    role: "organization_admin",
    roleLabel: "Quản trị vận hành",
    workspace: "admin",
    home: "/admin",
    description: "Toàn quyền cấu hình tổ chức, chương trình và người dùng.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "consultant@demo.hnlms.vn",
    displayName: "Tư vấn viên Demo",
    role: "consultant",
    roleLabel: "Tư vấn tuyển sinh",
    workspace: "admin",
    home: "/admin/admission",
    description: "Tiếp nhận nhu cầu và chuyển hồ sơ đầu vào cho học vụ.",
    scope: "Cơ sở trung tâm",
    password: DEMO_PASSWORD,
  },
  {
    email: "branch-manager@demo.hnlms.vn",
    displayName: "Quản lý cơ sở Demo",
    role: "branch_manager",
    roleLabel: "Quản lý cơ sở",
    workspace: "admin",
    home: "/admin",
    description: "Điều phối vận hành trong phạm vi cơ sở được phân quyền.",
    scope: "Cơ sở trung tâm",
    branchId: "b1",
    password: DEMO_PASSWORD,
  },
  {
    email: "admission-manager@demo.hnlms.vn",
    displayName: "Quản lý tuyển sinh Demo",
    role: "admission_manager",
    roleLabel: "Quản lý tuyển sinh",
    workspace: "admin",
    home: "/admin/admission",
    description: "Điều phối quy trình tuyển sinh, phối hợp liên phòng ban và sử dụng dịch vụ cá nhân.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "marketing-manager@demo.hnlms.vn",
    displayName: "Quản lý marketing Demo",
    role: "marketing_manager",
    roleLabel: "Marketing",
    workspace: "admin",
    home: "/admin/marketing",
    description: "Quản lý nội dung công khai và chiến dịch tuyển sinh.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "academic-manager@demo.hnlms.vn",
    displayName: "Quản lý đào tạo Demo",
    role: "academic_manager",
    roleLabel: "Quản lý đào tạo",
    workspace: "admin",
    home: "/admin/academic",
    description: "Thiết lập chương trình, lớp và kế hoạch đào tạo.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "content-reviewer@demo.hnlms.vn",
    displayName: "Kiểm duyệt học liệu Demo",
    role: "content_reviewer",
    roleLabel: "Kiểm duyệt học liệu",
    workspace: "admin",
    home: "/admin/learning",
    description: "Kiểm duyệt nội dung và thư viện trước khi công bố.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "support@demo.hnlms.vn",
    displayName: "Hỗ trợ học viên Demo",
    role: "support_staff",
    roleLabel: "Hỗ trợ học viên",
    workspace: "admin",
    home: "/admin/communication",
    description: "Tiếp nhận thông báo và hỗ trợ trao đổi liên vai trò.",
    scope: "Cơ sở trung tâm",
    password: DEMO_PASSWORD,
  },
  {
    email: "academic@demo.hnlms.vn",
    displayName: "Học vụ Demo",
    role: "academic_affairs",
    roleLabel: "Học vụ",
    workspace: "admin",
    home: "/admin/academic",
    description: "Quản lý lớp, lịch học, học viên và phân công giảng dạy.",
    scope: "Cơ sở trung tâm",
    password: DEMO_PASSWORD,
  },
  {
    email: "finance@demo.hnlms.vn",
    displayName: "Tài chính Demo",
    role: "finance_officer",
    roleLabel: "Tài chính",
    workspace: "admin",
    home: "/admin/finance",
    description: "Theo dõi học phí, công nợ và đối soát thanh toán.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "payroll@demo.hnlms.vn",
    displayName: "Phụ trách lương Demo",
    role: "payroll_officer",
    roleLabel: "Phụ trách lương",
    workspace: "admin",
    home: "/admin/payroll",
    description: "Tổng hợp công dạy, bảng lương và phê duyệt chi trả.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "hr@demo.hnlms.vn",
    displayName: "Nhân sự Demo",
    role: "hr_officer",
    roleLabel: "Nhân sự",
    workspace: "admin",
    home: "/admin/hrm",
    description: "Quản lý hồ sơ nhân sự, hợp đồng và phân công.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "executive@demo.hnlms.vn",
    displayName: "Điều hành Demo",
    role: "executive",
    roleLabel: "Điều hành",
    workspace: "admin",
    home: "/admin/reporting",
    description: "Theo dõi báo cáo tổng hợp và chỉ số vận hành.",
    scope: "Toàn tổ chức",
    password: DEMO_PASSWORD,
  },
  {
    email: "teacher@demo.hnlms.vn",
    displayName: "Nguyễn Minh Anh",
    role: "teacher",
    roleLabel: "Giáo viên",
    workspace: "teacher",
    home: "/teacher",
    description: "Lớp học, chấm bài, năng lực, trao đổi và công dạy.",
    scope: "Các lớp được phân công",
    password: DEMO_PASSWORD,
  },
  {
    email: "assistant@demo.hnlms.vn",
    displayName: "Trợ giảng Demo",
    role: "teaching_assistant",
    roleLabel: "Trợ giảng",
    workspace: "teacher",
    home: "/teacher",
    description: "Hỗ trợ buổi học, điểm danh và theo dõi công việc được giao.",
    scope: "Các lớp hỗ trợ",
    password: DEMO_PASSWORD,
  },
  {
    email: "student@demo.hnlms.vn",
    displayName: "Lê Minh Khang",
    role: "student",
    roleLabel: "Học viên",
    workspace: "student",
    home: "/student",
    description: "Lịch học, bài tập, điểm, tiến độ, thư viện và lớp online.",
    scope: "Hồ sơ học tập cá nhân",
    password: DEMO_PASSWORD,
  },
  {
    email: "parent@demo.hnlms.vn",
    displayName: "Phụ huynh Demo",
    role: "parent",
    roleLabel: "Phụ huynh",
    workspace: "parent",
    home: "/parent",
    description: "Theo dõi tiến độ, lịch học, trao đổi và học phí của con.",
    scope: "Học viên được ủy quyền",
    password: DEMO_PASSWORD,
  },
];

export function findDemoAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return demoAccounts.find((account) => account.email === normalizedEmail && getDemoPassword(account.email) === password);
}

function readStore<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function writeStore<T>(key: string, value: Record<string, T>) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

function accountKey(email: string) {
  return email.trim().toLowerCase();
}

function accountFor(email: string) {
  return demoAccounts.find((account) => account.email === accountKey(email));
}

export function getDemoPassword(email: string) {
  return readStore<string>(DEMO_PASSWORD_KEY)[accountKey(email)] ?? accountFor(email)?.password ?? DEMO_PASSWORD;
}

export function getDemoProfile(email: string): DemoProfile {
  const account = accountFor(email);
  const saved = readStore<DemoProfile>(DEMO_PROFILE_KEY)[accountKey(email)];
  return saved ?? {
    displayName: account?.displayName ?? "Người dùng HN LMS",
    email: account?.email ?? email,
    phone: "",
    timezone: "Asia/Ho_Chi_Minh",
    department: account?.workspace === "admin" ? account?.roleLabel ?? "Vận hành" : account?.roleLabel ?? "",
  };
}

export function saveDemoProfile(email: string, profile: DemoProfile) {
  const key = accountKey(email);
  writeStore(DEMO_PROFILE_KEY, { ...readStore<DemoProfile>(DEMO_PROFILE_KEY), [key]: { ...profile, email: key } });
}

export function getDemoPreferences(email: string): DemoPreferences {
  return readStore<DemoPreferences>(DEMO_PREFERENCES_KEY)[accountKey(email)] ?? {
    locale: "vi",
    emailAlerts: true,
    reminders: true,
    assignmentAlerts: true,
    classChangeAlerts: true,
    centerNews: false,
  };
}

export function saveDemoPreferences(email: string, preferences: DemoPreferences) {
  const key = accountKey(email);
  writeStore(DEMO_PREFERENCES_KEY, { ...readStore<DemoPreferences>(DEMO_PREFERENCES_KEY), [key]: preferences });
}

export function changeDemoPassword(email: string, currentPassword: string, nextPassword: string) {
  if (getDemoPassword(email) !== currentPassword) return { ok: false as const, error: "Mật khẩu hiện tại chưa đúng." };
  if (nextPassword.length < 8) return { ok: false as const, error: "Mật khẩu mới phải có ít nhất 8 ký tự." };
  const key = accountKey(email);
  writeStore(DEMO_PASSWORD_KEY, { ...readStore<string>(DEMO_PASSWORD_KEY), [key]: nextPassword });
  return { ok: true as const };
}

export function saveDemoSession(session: DemoSession, remember = true) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(session);
  localStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(DEMO_SESSION_KEY, serialized);
  document.cookie = `hnlms_demo_role=${session.role}; Path=/; Max-Age=28800; SameSite=Lax`;
}

export function updateDemoSessionProfile(profile: DemoProfile) {
  const session = readDemoSession();
  if (!session) return;
  saveDemoSession({ ...session, displayName: profile.displayName, email: profile.email }, true);
  window.dispatchEvent(new Event("hnlms-session-change"));
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(DEMO_SESSION_KEY) ?? sessionStorage.getItem(DEMO_SESSION_KEY);
    return value ? (JSON.parse(value) as DemoSession) : null;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  document.cookie = "hnlms_demo_role=; Path=/; Max-Age=0; SameSite=Lax";
}
