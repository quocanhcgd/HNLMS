"use client";
import { Badge, Button, Group, Paper, Progress, Text, ThemeIcon } from "@mantine/core";
import { ArrowUpRight, CalendarDays, CheckCircle2, CircleDollarSign, GraduationCap, TriangleAlert, TrendingUp, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UiStatusBadge, UiStatusIcon, type UiStatusRole } from "@/components/ui";
import { readDemoSession } from "@/lib/demo-auth";
import { useUI } from "@/lib/providers";

const queue: Array<[string, string, string, UiStatusRole]> = [
  ["12 lead chưa được phân công", "Tuyển sinh", "Cần xử lý trước 11:00", "danger"],
  ["3 lớp sắp vượt sức chứa", "Đào tạo", "Khai giảng trong 7 ngày", "warning"],
  ["8 hóa đơn quá hạn trên 30 ngày", "Tài chính", "Tổng dư nợ 86,4 triệu", "warning"],
  ["5 đơn nghỉ phép chờ duyệt", "Nhân sự", "Có 2 đơn cho ngày mai", "info"],
];
const schedule: [string, string, string][] = [
  ["08:00", "IELTS Foundation A1", "Phòng 301 · 18/20 học viên"],
  ["10:30", "Tư vấn tuyển sinh", "4 lịch hẹn · Phòng tư vấn"],
  ["14:00", "English Placement Test", "Online · 12 thí sinh"],
  ["18:30", "Giao tiếp doanh nghiệp K12", "Phòng 204 · 16/18 học viên"],
];
const areaLinks: Record<string, string> = {
  "Tuyển sinh": "/admin/admission",
  "Đào tạo": "/admin/academic",
  "Học vụ": "/admin/academic",
  "Tài chính": "/admin/finance",
  "Nhân sự": "/admin/hrm",
  "Học liệu": "/admin/learning",
  "Hỗ trợ": "/admin/communication",
  "Marketing": "/admin/marketing",
  "Tiền lương": "/admin/payroll",
};
const hrefForArea = (area: string) => areaLinks[area] ?? "/admin/my-work";
const hrefForKpi = (label: string, fallback: string) => {
  const value = label.toLowerCase();
  if (value.includes("nhân sự") || value.includes("hợp đồng") || value.includes("đơn nghỉ") || value.includes("hồ sơ hoàn chỉnh")) return "/admin/hrm";
  if (value.includes("học liệu") || value.includes("nội dung") || value.includes("duyệt lần đầu")) return "/admin/learning";
  if (value.includes("yêu cầu") || value.includes("phản hồi") || value.includes("đã xử lý")) return "/admin/communication";
  if (value.includes("quỹ lương") || value.includes("bảng lương") || value.includes("xác nhận công") || value.includes("đã kiểm tra") || value.includes("phê duyệt")) return "/admin/payroll";
  if (value.includes("thu học phí") || value.includes("công nợ") || value.includes("đối soát")) return "/admin/finance";
  if (value.includes("lead") || value.includes("ghi danh") || value.includes("lịch hẹn") || value.includes("hồ sơ quá hạn")) return "/admin/admission";
  if (value.includes("lớp") || value.includes("giáo viên") || value.includes("học viên") || value.includes("phòng") || value.includes("lịch")) return "/admin/academic";
  return fallback;
};
type DashboardConfig = {
  action?: { label: string; href: string };
  viewAllHref: string;
  subtitle: string;
  status: string;
  statusNote: string;
  activeClasses: string;
  progress: number;
  kpis: [string, string, string, UiStatusRole][];
  queue: [string, string, string, UiStatusRole][];
  schedule: [string, string, string][];
};

const roleDashboardConfigs: Record<string, Omit<DashboardConfig, "kpis"> & { kpis?: DashboardConfig["kpis"] }> = {
  organization_admin: {
    action: { label: "Tạo tư vấn", href: "/admin/admission" },
    viewAllHref: "/admin/my-work",
    subtitle: "Tổng quan vận hành và các công việc cần xử lý trên toàn tổ chức.",
    status: "Trung tâm đang hoạt động ổn định",
    statusNote: "Cập nhật theo dữ liệu vận hành mới nhất",
    activeClasses: "36 lớp đang chạy",
    progress: 72,
    queue,
    schedule,
  },
  branch_manager: {
    action: { label: "Mở vận hành cơ sở", href: "/admin/branch-operations" },
    viewAllHref: "/admin/branch-operations",
    subtitle: "Tổng quan vận hành và việc cần xử lý trong phạm vi chi nhánh của bạn.",
    status: "Cơ sở Cầu Giấy đang hoạt động ổn định",
    statusNote: "Số liệu giới hạn theo chi nhánh được phân quyền",
    activeClasses: "9 lớp đang chạy",
    progress: 68,
    queue: [
      ["2 lead Cầu Giấy chưa được phân công", "Tuyển sinh", "Cần xử lý trước 11:00", "danger"],
      ["1 lớp Cầu Giấy sắp vượt sức chứa", "Đào tạo", "Khai giảng trong 7 ngày", "warning"],
      ["1 đơn nghỉ phép của cơ sở chờ duyệt", "Nhân sự", "Cần phản hồi trong hôm nay", "info"],
    ],
    schedule: [schedule[0], schedule[3]],
  },
  consultant: {
    action: { label: "Mở tuyển sinh", href: "/admin/admission" },
    viewAllHref: "/admin/admission",
    subtitle: "Theo dõi hồ sơ và bước tiếp theo trong pipeline tuyển sinh của bạn.",
    status: "Pipeline tuyển sinh đang được cập nhật",
    statusNote: "Ưu tiên theo hạn liên hệ tiếp theo",
    activeClasses: "12 hồ sơ đang theo dõi",
    progress: 61,
    queue: [["12 lead chưa được phân công", "Tuyển sinh", "Cần xử lý trước 11:00", "danger"]],
    schedule: [schedule[1], schedule[2]],
  },
  admission_manager: {
    action: { label: "Mở tuyển sinh", href: "/admin/admission" },
    viewAllHref: "/admin/admission",
    subtitle: "Điều phối pipeline tuyển sinh và phối hợp hồ sơ đầu vào.",
    status: "Quy trình tuyển sinh đang vận hành",
    statusNote: "Tổng hợp toàn tổ chức",
    activeClasses: "48 lead đang xử lý",
    progress: 72,
    queue: [queue[0], ["6 hồ sơ chờ chuyển học vụ", "Tuyển sinh", "Cần hoàn tất trong hôm nay", "warning"]],
    schedule: [schedule[1], schedule[2]],
  },
  marketing_manager: {
    action: { label: "Mở marketing", href: "/admin/marketing" },
    viewAllHref: "/admin/marketing",
    subtitle: "Theo dõi chiến dịch, nội dung và chuyển đổi tuyển sinh.",
    status: "Các chiến dịch đang được theo dõi",
    statusNote: "Dữ liệu nội dung công khai và nguồn lead",
    activeClasses: "4 chiến dịch đang chạy",
    progress: 64,
    queue: [["3 nội dung chờ duyệt lịch đăng", "Marketing", "Cần hoàn tất trước 15:00", "warning"], ["12 lead từ chiến dịch mới", "Tuyển sinh", "Cần bàn giao tư vấn", "info"]],
    schedule: [["09:00", "Rà soát chiến dịch tháng 8", "Phòng marketing"], schedule[1]],
  },
  academic_manager: {
    action: { label: "Mở đào tạo", href: "/admin/academic" },
    viewAllHref: "/admin/academic",
    subtitle: "Theo dõi lớp học, kế hoạch đào tạo và phân công giảng dạy.",
    status: "Kế hoạch đào tạo đang được cập nhật",
    statusNote: "Tổng hợp lớp và lịch trên toàn tổ chức",
    activeClasses: "36 lớp đang chạy",
    progress: 75,
    queue: [queue[1], ["2 phân công giảng dạy cần xác nhận", "Đào tạo", "Trước khi chốt lịch tuần tới", "info"]],
    schedule: [schedule[0], schedule[3]],
  },
  academic_affairs: {
    action: { label: "Mở đào tạo", href: "/admin/academic" },
    viewAllHref: "/admin/academic",
    subtitle: "Xử lý lớp, học viên, lịch học và phân công trong phạm vi phụ trách.",
    status: "Công việc học vụ đang được theo dõi",
    statusNote: "Hiển thị các lớp và lịch được phân quyền",
    activeClasses: "18 lớp đang phụ trách",
    progress: 70,
    queue: [["3 hồ sơ học viên cần cập nhật lớp", "Học vụ", "Cần xử lý trong hôm nay", "warning"], ["2 lịch học chờ xác nhận phòng", "Đào tạo", "Trước 16:00", "info"]],
    schedule: [schedule[0], schedule[3]],
  },
  content_reviewer: {
    action: { label: "Mở học liệu", href: "/admin/learning" },
    viewAllHref: "/admin/learning",
    subtitle: "Kiểm duyệt học liệu trước khi công bố cho lớp học.",
    status: "Hàng đợi học liệu đang được xử lý",
    statusNote: "Nội dung chờ duyệt trên toàn tổ chức",
    activeClasses: "27 học liệu đã công bố",
    progress: 78,
    queue: [["5 học liệu chờ kiểm duyệt", "Học liệu", "Cần phản hồi trong hôm nay", "danger"], ["2 tài liệu có yêu cầu chỉnh sửa", "Học liệu", "Đã trả về tác giả", "warning"]],
    schedule: [["11:00", "Rà soát học liệu tuần này", "Phòng học liệu"]],
  },
  support_staff: {
    action: { label: "Mở trao đổi", href: "/admin/communication" },
    viewAllHref: "/admin/communication",
    subtitle: "Theo dõi yêu cầu hỗ trợ và trao đổi cần phản hồi.",
    status: "Kênh hỗ trợ đang hoạt động",
    statusNote: "Ưu tiên các yêu cầu quá hạn phản hồi",
    activeClasses: "14 yêu cầu đang mở",
    progress: 83,
    queue: [["4 yêu cầu hỗ trợ chưa phản hồi", "Hỗ trợ", "Có 2 yêu cầu quá hạn", "danger"], ["3 trao đổi cần chuyển bộ phận", "Hỗ trợ", "Đang chờ tiếp nhận", "info"]],
    schedule: [["09:30", "Ca trực hỗ trợ học viên", "Quầy dịch vụ"]],
  },
  finance_officer: {
    action: { label: "Mở tài chính", href: "/admin/finance" },
    viewAllHref: "/admin/finance",
    subtitle: "Theo dõi học phí, công nợ và đối soát thanh toán.",
    status: "Dòng tiền và công nợ đang được đối soát",
    statusNote: "Số liệu tài chính cập nhật theo giao dịch đã ghi nhận",
    activeClasses: "186,4 triệu công nợ cần theo dõi",
    progress: 58,
    queue: [queue[2], ["3 giao dịch chờ đối soát", "Tài chính", "Cần hoàn tất trong ngày", "info"]],
    schedule: [["15:00", "Đối soát thanh toán trong ngày", "Phòng tài chính"]],
  },
  payroll_officer: {
    action: { label: "Mở tiền lương", href: "/admin/payroll" },
    viewAllHref: "/admin/payroll",
    subtitle: "Tổng hợp công dạy, bảng lương và phê duyệt chi trả.",
    status: "Kỳ lương tháng 8 đang chờ chốt",
    statusNote: "Dữ liệu lấy từ công dạy và phê duyệt đã ghi nhận",
    activeClasses: "42 bảng lương cần rà soát",
    progress: 66,
    queue: [["7 bảng lương chờ kiểm tra", "Tiền lương", "Chốt trước ngày 25", "warning"], ["3 bản ghi công dạy thiếu xác nhận", "Tiền lương", "Cần gửi lại cơ sở", "danger"]],
    schedule: [["16:00", "Rà soát kỳ lương tháng 8", "Phòng nhân sự"]],
  },
  hr_officer: {
    action: { label: "Mở nhân sự", href: "/admin/hrm" },
    viewAllHref: "/admin/hrm",
    subtitle: "Quản lý hồ sơ nhân sự, hợp đồng, nghỉ phép và phân công.",
    status: "Hồ sơ nhân sự đang được cập nhật",
    statusNote: "Theo dõi các yêu cầu cần HR xử lý",
    activeClasses: "86 nhân sự đang hoạt động",
    progress: 81,
    queue: [queue[3], ["2 hợp đồng sắp đến hạn", "Nhân sự", "Cần nhắc trước 30 ngày", "warning"]],
    schedule: [["13:30", "Phỏng vấn tuyển dụng", "Phòng họp HR"]],
  },
  executive: {
    action: { label: "Mở báo cáo", href: "/admin/reporting" },
    viewAllHref: "/admin/reporting",
    subtitle: "Theo dõi chỉ số tổng hợp và các điểm cần quyết định.",
    status: "Trung tâm đang hoạt động ổn định",
    statusNote: "Cập nhật theo dữ liệu vận hành mới nhất",
    activeClasses: "36 lớp đang chạy",
    progress: 72,
    queue,
    schedule,
  },
};

const roleKpis: Record<string, DashboardConfig["kpis"]> = {
  branch_manager: [
    ["Lead mới tại cơ sở", "12", "+8,3%", "primary"],
    ["Tỷ lệ chuyển đổi", "28,6%", "+3,1%", "success"],
    ["Lớp đang hoạt động", "9", "1 sắp khai giảng", "info"],
    ["Công nợ quá hạn", "₫32,0M", "2 hóa đơn", "warning"],
  ],
  consultant: [
    ["Lead đang phụ trách", "12", "3 lead mới", "primary"],
    ["Đã liên hệ", "75%", "+6,0%", "success"],
    ["Lịch hẹn hôm nay", "4", "1 lịch sắp tới", "info"],
    ["Hồ sơ quá hạn", "2", "Cần xử lý ngay", "warning"],
  ],
  admission_manager: [
    ["Lead đang xử lý", "48", "+12,5%", "primary"],
    ["Tỷ lệ ghi danh", "31,8%", "+4,2%", "success"],
    ["Chờ thi đầu vào", "12", "3 hồ sơ mới", "info"],
    ["Hồ sơ quá hạn", "6", "-2 hồ sơ", "warning"],
  ],
  marketing_manager: [
    ["Chiến dịch đang chạy", "4", "1 chiến dịch mới", "primary"],
    ["Tỷ lệ chuyển đổi lead", "18,4%", "+2,6%", "success"],
    ["Lead từ chiến dịch", "126", "+14,0%", "info"],
    ["Nội dung chờ duyệt", "3", "Cần xử lý hôm nay", "warning"],
  ],
  academic_manager: [
    ["Lớp đang hoạt động", "36", "4 sắp khai giảng", "primary"],
    ["Đủ giáo viên", "94%", "+2,0%", "success"],
    ["Học viên đang học", "628", "+3,8%", "info"],
    ["Lớp cần xử lý", "3", "Sắp vượt sức chứa", "warning"],
  ],
  academic_affairs: [
    ["Lớp đang phụ trách", "18", "2 sắp khai giảng", "primary"],
    ["Lịch đã xác nhận", "92%", "+4,0%", "success"],
    ["Học viên cần cập nhật", "3", "Trong hôm nay", "info"],
    ["Phòng học chờ chốt", "2", "Trước 16:00", "warning"],
  ],
  content_reviewer: [
    ["Học liệu đã công bố", "27", "+5 tài liệu", "primary"],
    ["Tỷ lệ duyệt lần đầu", "81%", "+3,0%", "success"],
    ["Chờ kiểm duyệt", "5", "2 nội dung mới", "info"],
    ["Yêu cầu chỉnh sửa", "2", "Đã trả tác giả", "warning"],
  ],
  support_staff: [
    ["Yêu cầu đang mở", "14", "4 yêu cầu mới", "primary"],
    ["Phản hồi đúng hạn", "91%", "+5,0%", "success"],
    ["Đã xử lý hôm nay", "9", "3 đang chờ", "info"],
    ["Yêu cầu quá hạn", "2", "Cần xử lý ngay", "warning"],
  ],
  finance_officer: [
    ["Thu học phí tháng", "₫1,24B", "+8,2%", "primary"],
    ["Tỷ lệ thu đúng hạn", "86,4%", "+3,1%", "success"],
    ["Chờ đối soát", "3", "Trong hôm nay", "info"],
    ["Công nợ quá hạn", "₫186,4M", "8 hóa đơn", "warning"],
  ],
  payroll_officer: [
    ["Quỹ lương kỳ này", "₫684M", "+4,3%", "primary"],
    ["Đã kiểm tra", "83%", "35/42 bảng lương", "success"],
    ["Chờ phê duyệt", "7", "Chốt trước ngày 25", "info"],
    ["Thiếu xác nhận công", "3", "Cần gửi lại cơ sở", "warning"],
  ],
  hr_officer: [
    ["Nhân sự hoạt động", "86", "+3 nhân sự", "primary"],
    ["Hồ sơ hoàn chỉnh", "96%", "+2,0%", "success"],
    ["Đơn nghỉ chờ duyệt", "5", "2 đơn ngày mai", "info"],
    ["Hợp đồng sắp hạn", "2", "Trong 30 ngày", "warning"],
  ],
};

export default function Dashboard() {
  const { t, locale } = useUI();
  const router = useRouter();
  const [session, setSession] = useState<{ role?: string; branchId?: string } | null>(null);
  useEffect(() => {
    const current = readDemoSession();
    setSession(current ? { role: current.role, branchId: current.branchId } : null);
  }, []);
  const branchScoped = session?.role === "branch_manager";
  const dashboardActions: Record<string, { label: string; href: string }> = {
    organization_admin: { label: "Tạo tư vấn", href: "/admin/admission" },
    branch_manager: { label: "Tạo tư vấn", href: "/admin/admission" },
    consultant: { label: "Tạo tư vấn", href: "/admin/admission" },
    admission_manager: { label: "Mở tuyển sinh", href: "/admin/admission" },
    marketing_manager: { label: "Mở marketing", href: "/admin/marketing" },
    academic_manager: { label: "Mở đào tạo", href: "/admin/academic" },
    academic_affairs: { label: "Mở đào tạo", href: "/admin/academic" },
    content_reviewer: { label: "Mở học liệu", href: "/admin/learning" },
    support_staff: { label: "Mở trao đổi", href: "/admin/communication" },
    finance_officer: { label: "Mở tài chính", href: "/admin/finance" },
    payroll_officer: { label: "Mở tiền lương", href: "/admin/payroll" },
    hr_officer: { label: "Mở nhân sự", href: "/admin/hrm" },
    executive: { label: "Mở báo cáo", href: "/admin/reporting" },
  };
  const dashboardAction = dashboardActions[session?.role ?? ""];
  const config = roleDashboardConfigs[session?.role ?? ""] ?? roleDashboardConfigs.executive;
  const visibleQueue = config.queue;
  const defaultKpis: Array<[string, string, string, UiStatusRole]> = [
    [t("newLead"), branchScoped ? "12" : "48", branchScoped ? "+8,3%" : "+12,5%", "primary"],
    [t("conversion"), branchScoped ? "28,6%" : "31,8%", branchScoped ? "+3,1%" : "+4,2%", "success"],
    [t("activeClasses"), branchScoped ? "9" : "36", branchScoped ? "1 sắp khai giảng" : "4 sắp khai giảng", "info"],
    [t("overdue"), branchScoped ? "₫32,0M" : "₫186,4M", branchScoped ? "2 hóa đơn" : "8 hóa đơn", "warning"],
  ];
  const kpis = config.kpis ?? roleKpis[session?.role ?? ""] ?? defaultKpis;
  const kpiIcons = [UsersRound, TrendingUp, GraduationCap, CircleDollarSign];
  const criticalCount = visibleQueue.filter(([, , , role]) => role === "danger").length;
  const formatKpiDetail = (delta: string) => delta.endsWith("%") ? `${delta} so với tháng trước` : delta;
  const dashboardTitle = branchScoped ? t("dashboard") : locale === "en" ? "Branch overview" : "Tổng quan vận hành";
  return (
    <div className="page">
      <PageHeader title={dashboardTitle} subtitle={config.subtitle} action={config.action?.label ?? dashboardAction?.label} onAction={(config.action ?? dashboardAction) ? () => router.push((config.action ?? dashboardAction)!.href) : undefined} />
      <Paper withBorder p="lg" mb="md" className="dashboardOverview" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}><Group justify="space-between" align="flex-start" wrap="wrap" gap="xl"><Group align="flex-start" gap="md"><ThemeIcon size={48} radius="md" color="primary"><TrendingUp size={25} /></ThemeIcon><div><Text size="sm" c="dimmed">Tổng quan vận hành hôm nay</Text><Text fz={32} fw={800} lh={1.1}>{config.status}</Text><Group gap="xs" mt={6}><Badge color="teal" variant="light" leftSection={<CheckCircle2 size={12} />}>{config.activeClasses}</Badge><Text size="xs" c="dimmed">{config.statusNote}</Text></Group></div></Group><div className="dashboardOverviewSummary"><Group gap="xl"><div><Text size="xs" c="dimmed">Việc cần xử lý</Text><Text fw={750}>{visibleQueue.length}</Text></div><div><Text size="xs" c="dimmed">Mức khẩn cấp</Text><Text fw={750} c="red">{criticalCount}</Text></div><div><Text size="xs" c="dimmed">Lịch hôm nay</Text><Text fw={750}>{config.schedule.length}</Text></div></Group><Progress value={config.progress} color="teal" size="sm" mt="md" aria-label="Tiến độ vận hành" /></div></Group></Paper>
      <div className="kpiGrid">
        {kpis.map(([label, value, delta, role], index) => {
          const Icon = kpiIcons[index] ?? TrendingUp;
          return (
            <Paper component="a" href={hrefForKpi(label, config.viewAllHref)} className={`kpi kpi--${role}`} key={label} style={{ color: "inherit", textDecoration: "none" }}>
            <div className="kpiTop">
              <Group gap="xs"><ThemeIcon color={role === "primary" ? "blue" : role === "success" ? "teal" : role === "warning" ? "orange" : "violet"} variant="light" size={28}><Icon size={15} /></ThemeIcon><span>{label}</span></Group>
              <UiStatusIcon role={role} size="md">
                <ArrowUpRight size={15} />
              </UiStatusIcon>
            </div>
            <div className="kpiValue">{value}</div>
            <div className="delta">{formatKpiDetail(delta)}</div>
          </Paper>
          );
        })}
      </div>
      <div className="dashboardGrid">
        <Paper className="panel">
          <div className="panelHeader">
            <div>
              <Text fw={650}>{t("workQueue")}</Text>
              <Text className="muted">Ưu tiên theo mức độ ảnh hưởng</Text>
            </div>
            <Button variant="subtle" size="xs" onClick={() => router.push(config.viewAllHref)}>
              {t("viewAll")}
            </Button>
          </div>
          {visibleQueue.map(([title, area, note, role]) => (
            <div className="queueItem" key={title}>
              <UiStatusIcon role={role}>
                <TriangleAlert size={17} />
              </UiStatusIcon>
              <div>
                <Text size="sm" fw={600}>
                  {title}
                </Text>
                <Text className="muted">{note}</Text>
              </div>
              <Group gap="xs" wrap="nowrap">
                <UiStatusBadge role={role}>{area}</UiStatusBadge>
                <Button component="a" href={hrefForArea(area)} variant="subtle" size="compact-xs">
                  Mở
                </Button>
              </Group>
            </div>
          ))}
        </Paper>
        <Paper className="panel">
          <div className="panelHeader">
            <div>
              <Text fw={650}>{t("todaySchedule")}</Text>
              <Text className="muted">Thứ Năm, 20/08</Text>
            </div>
            <CalendarDays size={19} />
          </div>
          {config.schedule.map(([time, title, note]) => (
            <div className="queueItem queueItem--schedule" key={time}>
              <div className="scheduleTime">{time}</div>
              <div>
                <Text size="sm" fw={600}>
                  {title}
                </Text>
                <Text className="muted">{note}</Text>
                <Button component="a" href={title.includes("IELTS") || title.includes("Giao tiếp") ? "/admin/academic" : title.includes("tuyển sinh") || title.includes("Placement") ? "/admin/admission" : "/admin/my-work"} variant="subtle" size="compact-xs">
                  Mở
                </Button>
              </div>
            </div>
          ))}
        </Paper>
      </div>
    </div>
  );
}
