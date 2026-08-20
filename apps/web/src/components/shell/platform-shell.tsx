"use client";

import Link from "next/link";
import { ActionIcon, Avatar, Group, Menu, Text, Tooltip, useMantineColorScheme } from "@mantine/core";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  Database,
  FileKey2,
  Languages,
  LogOut,
  Moon,
  Settings,
  Sun,
  Users,
  Workflow,
} from "lucide-react";
import { useUI } from "@/lib/providers";

const navItems = [
  ["Tenants", "/platform"],
  ["Plans & licenses", "/platform/licenses"],
  ["Deployments", "/platform/deployments"],
  ["Migrations", "/platform/migrations"],
  ["Operations", "/platform/operations"],
  ["Audit log", "/platform/audit"],
] as const;
const icons = [Building2, FileKey2, Database, Workflow, Activity, BarChart3];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useUI();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <div className="platformShell" data-platform-shell="true">
      <aside className="platformSidebar">
        <Link href="/platform" className="platformBrand">
          <span className="brandMark">CP</span>
          <span>
            HN LMS
            <br />
            <small>Control Plane</small>
          </span>
        </Link>
        <div className="platformWorkspace">
          <Text size="xs" c="dimmed">
            OPERATOR WORKSPACE
          </Text>
          <Group justify="space-between" mt={4}>
            <Text size="sm" fw={600}>
              Provider operations
            </Text>
            <ChevronDown size={15} />
          </Group>
        </div>
        <nav className="platformNav" aria-label="Platform navigation">
          {navItems.map(([label, href], index) => {
            const Icon = icons[index];
            return (
              <Link href={href} className="platformNavItem" key={href}>
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="platformBottom">
          <Link className="platformNavItem" href="/admin">
            <Users size={17} />
            <span>LMS preview</span>
          </Link>
          <Link className="platformNavItem" href="/platform/settings">
            <Settings size={17} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
      <main className="platformMain">
        <header className="platformTopbar">
          <div className="platformMobileTitle">Control Plane</div>
          <div className="platformTopActions">
            <Tooltip label={locale === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}>
              <ActionIcon
                variant="subtle"
                aria-label="Change language"
                onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
              >
                <Languages size={18} />
              </ActionIcon>
            </Tooltip>
            <ActionIcon variant="subtle" aria-label="Change theme" onClick={() => toggleColorScheme()}>
              {colorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </ActionIcon>
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" aria-label="Open operator menu">
                  <Avatar size={30} color="cyan">
                    SA
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Super admin</Menu.Label>
                <Menu.Item leftSection={<Settings size={15} />}>Account settings</Menu.Item>
                <Menu.Item color="red" leftSection={<LogOut size={15} />}>
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </header>
        {children}
        <footer className="platformFooter">
          <Text size="xs" c="dimmed">
            HN LMS Control Plane v0.1.0
          </Text>
          <Text size="xs" c="dimmed">
            Provider operations · © 2026 HN Learning
          </Text>
        </footer>
      </main>
    </div>
  );
}
