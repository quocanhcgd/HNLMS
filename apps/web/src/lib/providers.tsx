"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MantineProvider, createTheme, localStorageColorSchemeManager } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export type Locale = "vi" | "en";
type Copy = Record<string, string>;

const dictionaries: Record<Locale, Copy> = {
  vi: {
    overview: "Tổng quan",
    admission: "Tuyển sinh",
    leads: "Khách hàng tiềm năng",
    academic: "Đào tạo",
    learning: "Học tập",
    students: "Học viên",
    finance: "Tài chính",
    people: "Nhân sự",
    reports: "Báo cáo",
    settings: "Cài đặt",
    search: "Tìm kiếm học viên, lớp học...",
    branch: "Chi nhánh Hà Nội",
    dashboard: "Tổng quan chi nhánh",
    dashboardSub: "Tình hình vận hành và công việc cần xử lý hôm nay",
    newLead: "Lead mới",
    conversion: "Tỷ lệ chuyển đổi",
    activeClasses: "Lớp đang hoạt động",
    overdue: "Công nợ quá hạn",
    workQueue: "Cần xử lý",
    todaySchedule: "Lịch hôm nay",
    viewAll: "Xem tất cả",
    newConsultation: "Tạo tư vấn",
    leadPipeline: "Pipeline tuyển sinh",
    leadSub: "Theo dõi tiến độ và bước tiếp theo của từng khách hàng",
    allStatus: "Tất cả trạng thái",
    componentGallery: "Thư viện component",
    publicSite: "Trang công khai",
    platform: "Control plane",
  },
  en: {
    overview: "Overview",
    admission: "Admissions",
    leads: "Prospective students",
    academic: "Academics",
    learning: "Learning",
    students: "Students",
    finance: "Finance",
    people: "People",
    reports: "Reports",
    settings: "Settings",
    search: "Search students, classes...",
    branch: "Hanoi Branch",
    dashboard: "Branch overview",
    dashboardSub: "Operations and work requiring attention today",
    newLead: "New leads",
    conversion: "Conversion rate",
    activeClasses: "Active classes",
    overdue: "Overdue receivables",
    workQueue: "Needs attention",
    todaySchedule: "Today's schedule",
    viewAll: "View all",
    newConsultation: "New consultation",
    leadPipeline: "Admissions pipeline",
    leadSub: "Track progress and the next step for each prospective student",
    allStatus: "All statuses",
    componentGallery: "Component gallery",
    publicSite: "Public site",
    platform: "Control plane",
  },
};

const UIContext = createContext<{ locale: Locale; setLocale: (v: Locale) => void; t: (key: string) => string }>({
  locale: "vi",
  setLocale: () => undefined,
  t: (key) => key,
});

const theme = createTheme({
  primaryColor: "cyan",
  defaultRadius: "sm",
  fontFamily: "Inter, Segoe UI, Arial, sans-serif",
  headings: { fontFamily: "Inter, Segoe UI, Arial, sans-serif", fontWeight: "650" },
  colors: {
    cyan: [
      "#e5fbff",
      "#c8f5fb",
      "#94eaf5",
      "#5bdce9",
      "#2bc9d8",
      "#15aebb",
      "#098b97",
      "#08717b",
      "#095b64",
      "#064a53",
    ],
  },
  components: {
    Button: { defaultProps: { size: "sm" } },
    TextInput: { defaultProps: { size: "sm" } },
    Select: { defaultProps: { size: "sm" } },
    Paper: { defaultProps: { radius: "md" } },
  },
});

const colorSchemeManager = localStorageColorSchemeManager({ key: "hnlms-color-scheme" });

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");
  useEffect(() => {
    const saved = localStorage.getItem("hnlms-locale");
    if (saved === "vi" || saved === "en") setLocaleState(saved);
  }, []);
  const setLocale = (value: Locale) => {
    setLocaleState(value);
    localStorage.setItem("hnlms-locale", value);
    document.documentElement.lang = value;
  };
  const value = useMemo(() => ({ locale, setLocale, t: (key: string) => dictionaries[locale][key] ?? key }), [locale]);
  return (
    <UIContext.Provider value={value}>
      <MantineProvider theme={theme} defaultColorScheme="dark" colorSchemeManager={colorSchemeManager}>
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
