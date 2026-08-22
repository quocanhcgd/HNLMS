"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
import { Bell, ChevronDown, Languages, LogOut, Moon, Search, Settings, Settings2, Sun, UserRound } from "lucide-react";
import { UiButton, UiTextInput } from "@/components/ui";
import {
  filterNavigation,
  isNavigationActive,
  lmsNavigation,
  mockNavigationContext,
  type NavigationManifest,
} from "@/lib/navigation/manifests";
import { useDisclosure } from "@mantine/hooks";
import { useUI } from "@/lib/providers";
import type { MessageKey } from "@/lib/i18n/messages";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useUI();
  const { setColorScheme } = useMantineColorScheme();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpened, setSearchOpened] = useState(false);
  const [mobileOpened, { open: openMobile, close: closeMobile }] = useDisclosure(false);
  const navigationItems = filterNavigation(lmsNavigation, mockNavigationContext);
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
                    {t("branch")}
                  </Text>
                </div>
                <ChevronDown size={15} />
              </Group>
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Chuyển không gian</Menu.Label>
            <Menu.Item>Chi nhánh Hà Nội</Menu.Item>
            <Menu.Item>Toàn tổ chức</Menu.Item>
          </Menu.Dropdown>
        </Menu>
        {navigation}
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
      </aside>
      <main className="main">
        <Drawer opened={mobileOpened} onClose={closeMobile} title="HN LMS" position="left" size="min(88vw, 320px)">
          {navigation}
        </Drawer>
        <header className="topbar">
          <ActionIcon
            className="topbarNavToggle"
            variant="subtle"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
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
            <ActionIcon variant="subtle" size="lg" aria-label="Notifications">
              <Bell size={19} />
            </ActionIcon>
            <Menu position="bottom-end" shadow="md" width={230}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" aria-label="Mở menu tài khoản">
                  <Avatar size={30} color="cyan">
                    QA
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="sm" fw={600}>
                    Quốc Anh
                  </Text>
                  <Text size="xs" c="dimmed">
                    quoc.anh@hnlms.vn
                  </Text>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item leftSection={<UserRound size={16} />}>Hồ sơ cá nhân</Menu.Item>
                <Menu.Item leftSection={<Settings size={16} />}>Tùy chỉnh tài khoản</Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<LogOut size={16} />}>
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

function Navigation({
  pathname,
  t,
  items,
}: {
  pathname: string;
  t: (key: MessageKey) => string;
  items: NavigationManifest[];
}) {
  return (
    <nav className="lmsNavigation" aria-label="LMS navigation">
      {items.map((item) => {
        const Icon = item.icon;
        if (!Icon) return null;
        const active = isNavigationActive(pathname, item);
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
    </nav>
  );
}

function getBreadcrumb(pathname: string, items: NavigationManifest[], t: (key: MessageKey) => string) {
  for (const item of items) {
    if (item.children?.length) {
      const activeChild = item.children.find((child) => isNavigationActive(pathname, child));
      if (activeChild) return `HN LMS / ${t(item.labelKey as MessageKey)} / ${t(activeChild.labelKey as MessageKey)}`;
    }
    if (isNavigationActive(pathname, item)) return `HN LMS / ${t(item.labelKey as MessageKey)}`;
  }
  return "HN LMS";
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) {
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
      {action && <UiButton>{action}</UiButton>}
    </div>
  );
}
