"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Collapse,
  Drawer,
  Group,
  Menu,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { Bell, ChevronDown, Languages, LogOut, Moon, Search, Settings, Settings2, Shuffle, Sun, UserRound } from "lucide-react";
import { UiButton, UiTextInput } from "@/components/ui";
import {
  getNavigationForWorkspace,
  isNavigationPathAllowed,
  isNavigationActive,
  mockWorkspaceContexts,
  type NavigationManifest,
  type NavigationSectionKey,
  type WorkspaceKey,
} from "@/lib/navigation/manifests";
import { useDisclosure } from "@mantine/hooks";
import { useUI } from "@/lib/providers";
import type { MessageKey } from "@/lib/i18n/messages";
import { clearDemoSession, readDemoSession, type DemoSession } from "@/lib/demo-auth";

export function AppShell({ children, workspace = "admin" }: { children: React.ReactNode; workspace?: WorkspaceKey }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useUI();
  const { setColorScheme } = useMantineColorScheme();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpened, setSearchOpened] = useState(false);
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    const refreshSession = () => {
      setDemoSession(readDemoSession());
      setSessionReady(true);
    };
    refreshSession();
    window.addEventListener("hnlms-session-change", refreshSession);
    return () => window.removeEventListener("hnlms-session-change", refreshSession);
  }, []);
  const sessionContext = demoSession ? { ...mockWorkspaceContexts[workspace], role: demoSession.role } : mockWorkspaceContexts[workspace];
  const navigationItems = getNavigationForWorkspace(workspace, sessionContext);
  const workspaceLabel = demoSession?.role === "branch_manager" && demoSession.branchId === "b1" ? "Chi nhánh Cầu Giấy" : t("branch");
  useEffect(() => {
    if (!sessionReady || !demoSession) return;
    if (demoSession.workspace !== workspace) {
      router.replace(demoSession.home);
      return;
    }
    if (!isNavigationPathAllowed(pathname, workspace, sessionContext)) {
      router.replace(demoSession.home);
    }
  }, [demoSession, demoSession?.home, demoSession?.workspace, pathname, router, sessionContext, sessionReady, workspace]);
  const navigation = <Navigation pathname={pathname} t={t} items={navigationItems} />;
  const breadcrumb = getBreadcrumb(pathname, navigationItems, t);
  const toggleNavigation = () => {
    if (window.matchMedia("(max-width: 700px)").matches) {
      openMobile();
      return;
    }
    setCollapsed((value) => !value);
  };
  return (
    <div className={`shell ${collapsed ? "shellCollapsed" : ""}`}>
      <aside className={`sidebar ${collapsed ? "sidebarCollapsed" : ""}`}>
        <div className="brand">
          <div className="brandMark">HN</div>
          <span>HN LMS</span>
        </div>
        <Menu position="bottom-start">
          <Menu.Target>
            <button className="workspace workspaceButton" type="button">
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text size="xs" c="dimmed">
                    KHÔNG GIAN
                  </Text>
                  <Text size="sm" fw={600}>
                    {workspace === "admin"
                      ? workspaceLabel
                      : workspace === "teacher"
                        ? t("teacherHome")
                        : workspace === "student"
                          ? t("studentHome")
                          : t("parentHome")}
                  </Text>
                </div>
                <ChevronDown size={15} />
              </Group>
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Chuyển không gian</Menu.Label>
            <Menu.Item>{demoSession?.role === "branch_manager" && demoSession.branchId === "b1" ? "Chi nhánh Cầu Giấy" : "Chi nhánh Hà Nội"}</Menu.Item>
            <Menu.Item>Toàn tổ chức</Menu.Item>
          </Menu.Dropdown>
        </Menu>
        {navigation}
        {workspace !== "teacher" ? (
          <div className="sidebarBottom">
            <Link className="navItem" href="/">
              <Settings2 size={18} />
              <span>{t("publicSite")}</span>
            </Link>
            <Link className="navItem" href="/platform">
              <Settings size={18} />
              <span>{t("platform")}</span>
            </Link>
          </div>
        ) : null}
      </aside>
      <main className="main">
        <Drawer opened={mobileOpened} onClose={closeMobile} title="HN LMS" position="left" size="min(88vw, 320px)">
          {navigation}
        </Drawer>
        <header className="topbar">
          <ActionIcon
            className="topbarNavToggle"
            variant="subtle"
            aria-label="Open LMS navigation / Đóng/mở sidebar"
            onClick={toggleNavigation}
          >
            <ChevronDown size={18} />
          </ActionIcon>
          <div className="topbarBreadcrumb" aria-label="Breadcrumb">
            {breadcrumb}
          </div>
          <Group className="topbarActions" gap={6} wrap="nowrap">
            {searchOpened ? (
              <UiTextInput
                className="topbarSearchInput"
                leftSection={<Search size={16} />}
                placeholder={t("search")}
                autoFocus
              />
            ) : null}
            <Tooltip label="Tìm kiếm">
              <ActionIcon
                variant={searchOpened ? "filled" : "subtle"}
                size="lg"
                onClick={() => setSearchOpened((value) => !value)}
                aria-label={searchOpened ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
              >
                <Search size={19} />
              </ActionIcon>
            </Tooltip>
            {workspace === "admin" ? <TemporaryRoleSwitcher /> : null}
            <Tooltip label={locale === "vi" ? "Chuyển sang English" : "Switch to Vietnamese"}>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
                aria-label="Change language"
              >
                <Languages size={19} />
              </ActionIcon>
            </Tooltip>
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" aria-label="Theme">
                  <Moon size={19} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Theme</Menu.Label>
                <Menu.Item leftSection={<Moon size={16} />} onClick={() => setColorScheme("dark")}>
                  Dark
                </Menu.Item>
                <Menu.Item leftSection={<Sun size={16} />} onClick={() => setColorScheme("light")}>
                  Light
                </Menu.Item>
                <Menu.Item leftSection={<Settings2 size={16} />} onClick={() => setColorScheme("auto")}>
                  System
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <ActionIcon component={Link} href={notificationHref(workspace)} variant="subtle" size="lg" aria-label="Notifications" title="Mở hộp thông báo">
              <Bell size={19} />
            </ActionIcon>
            <Menu position="bottom-end" shadow="md" width={230}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" aria-label="Mở menu tài khoản">
                  <Avatar size={30} color="cyan">
                    {demoSession?.displayName?.slice(0, 2).toUpperCase() ?? "QA"}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={600}>
                    {demoSession?.displayName ?? "Quốc Anh"}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {demoSession?.email ?? "quoc.anh@hnlms.vn"}
                  </Text>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item component={Link} href={`${accountHref(workspace)}#profile`} leftSection={<UserRound size={16} />}>Hồ sơ cá nhân</Menu.Item>
                <Menu.Item component={Link} href={`${accountHref(workspace)}#preferences`} leftSection={<Settings size={16} />}>Tùy chỉnh tài khoản</Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<LogOut size={16} />}
                  onClick={() => {
                    clearDemoSession();
                    router.push("/login?loggedOut=1");
                  }}
                >
                  Đăng xuất
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </header>
        {children}
        <footer className="appFooter">
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              HN LMS v0.1.0
            </Text>
            <Text size="xs" c="dimmed">
              ·
            </Text>
            <Text size="xs" c="dimmed">
              © 2026 HN Learning. Bản quyền thuộc về HN Learning.
            </Text>
          </Group>
          <Group gap="xs">
            <Badge size="sm" variant="light" color="yellow">
              Có phiên bản mới
            </Badge>
            <UiButton variant="subtle" size="compact-xs">
              Cập nhật
            </UiButton>
          </Group>
        </footer>
      </main>
    </div>
  );
}

function TemporaryRoleSwitcher() {
  const roleLinks = [
    { href: "/admin", label: "Quản trị vận hành", description: "Nhân sự nội bộ" },
    { href: "/teacher", label: "Giảng viên / Trợ giảng", description: "Cổng giảng dạy" },
    { href: "/student", label: "Học viên", description: "Cổng học tập" },
    { href: "/parent", label: "Phụ huynh", description: "Cổng theo dõi" },
  ];

  return (
    <Menu position="bottom-end" shadow="md" width={260}>
      <Menu.Target>
        <ActionIcon variant="filled" size="lg" aria-label="Chuyển vai trò kiểm thử" title="Tạm thời chuyển vai trò kiểm thử">
          <Shuffle size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Chuyển vai trò tạm thời</Menu.Label>
        {roleLinks.map((role) => (
          <Menu.Item component={Link} href={role.href} key={role.href}>
            <Text size="sm" fw={600}>
              {role.label}
            </Text>
            <Text size="xs" c="dimmed">
              {role.description}
            </Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

function Navigation({
  pathname,
  t,
  items,
}: {
  pathname: string;
  t: (key: MessageKey) => string;
  items: NavigationManifest[];
}) {
  const sectionLabels: Record<NavigationSectionKey, MessageKey> = {
    overview: "teacherNavOverview",
    admission: "consultantNavAdmission",
    operations: "branchNavOperations",
    learning: "teacherNavLearning",
    information: "teacherNavInformation",
    personal: "teacherNavPersonal",
    settings: "teacherNavSettings",
  };
  const sectionOrder: NavigationSectionKey[] = ["overview", "admission", "operations", "learning", "information", "personal", "settings"];
  const sections = items
    .reduce<Array<{ key?: NavigationSectionKey; items: NavigationManifest[] }>>((groups, item) => {
      // Keep ungrouped items independent, but merge a named section even when its
      // entries are separated in the manifest so React receives one stable key.
      if (!item.section) {
        groups.push({ items: [item] });
        return groups;
      }
      const existing = groups.find((group) => group.key === item.section);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ key: item.section, items: [item] });
      }
      return groups;
    }, [])
    .sort((left, right) => {
      const leftIndex = left.key ? sectionOrder.indexOf(left.key) : sectionOrder.length;
      const rightIndex = right.key ? sectionOrder.indexOf(right.key) : sectionOrder.length;
      return leftIndex - rightIndex;
    });

  return (
    <nav className="lmsNavigation" aria-label="LMS navigation">
      {sections.map((section, index) => (
        <div className="navSection" key={section.key ?? `ungrouped-${index}`}>
          {section.key ? <Text component="p" className="navSectionLabel">{t(sectionLabels[section.key])}</Text> : null}
          {section.items.map((item) => {
            const Icon = item.icon;
            if (!Icon) return null;
            const active = isNavigationActive(pathname, item) && !items.some((candidate) =>
              candidate.key !== item.key &&
              candidate.href !== item.href &&
              candidate.href.startsWith(`${item.href}/`) &&
              isNavigationActive(pathname, candidate),
            );
            return (
              <div className="navGroup" key={item.key}>
                <Link className={`navItem ${active ? "active" : ""}`} href={item.href}>
                  <Icon size={18} />
                  <span>{t(item.labelKey as MessageKey)}</span>
                  {item.children?.length ? <ChevronDown className="navChevron" size={14} /> : null}
                </Link>
                {item.children?.length ? (
                  <Collapse in={active}>
                    <div className="navSubmenu">
                      {item.children.map((child) => (
                        <Link
                          className={`navSubItem ${isNavigationActive(pathname, child) ? "active" : ""}`}
                          href={child.href}
                          key={child.key}
                        >
                          {t(child.labelKey as never)}
                        </Link>
                      ))}
                    </div>
                  </Collapse>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function accountHref(workspace: WorkspaceKey) {
  return workspace === "admin" ? "/admin/account" : `/${workspace}/settings`;
}

function notificationHref(workspace: WorkspaceKey) {
  if (workspace === "admin") return "/admin/communication/notifications";
  if (workspace === "teacher") return "/teacher/messages";
  if (workspace === "student") return "/student/messages";
  return "/parent/notifications";
}

function getBreadcrumb(pathname: string, items: NavigationManifest[], t: (key: MessageKey) => string) {
  const matches = items
    .filter((item) => isNavigationActive(pathname, item))
    .sort((left, right) => right.href.length - left.href.length);
  for (const item of matches) {
    if (item.children?.length) {
      const activeChild = item.children.find((child) => isNavigationActive(pathname, child));
      if (activeChild) return `HN LMS / ${t(item.labelKey as MessageKey)} / ${t(activeChild.labelKey as MessageKey)}`;
    }
    if (isNavigationActive(pathname, item)) return `HN LMS / ${t(item.labelKey as MessageKey)}`;
  }
  return "HN LMS";
}

export function PageHeader({ title, subtitle, action, actionHref, onAction }: { title: string; subtitle: string; action?: string; actionHref?: string; onAction?: () => void }) {
  return (
    <div className="pageHeader">
      <div>
        <Text fz={26} fw={700}>
          {title}
        </Text>
        <Text c="dimmed" size="sm" mt={3}>
          {subtitle}
        </Text>
      </div>
      {action && <UiButton component={actionHref ? "a" : undefined} href={actionHref} onClick={onAction}>{action}</UiButton>}
    </div>
  );
}
