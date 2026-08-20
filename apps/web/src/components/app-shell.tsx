"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActionIcon, Avatar, Badge, Button, Group, Menu, Text, TextInput, Tooltip, useMantineColorScheme } from "@mantine/core";
import { Settings2, Bell, BookOpen, Building2, ChartBar, ChevronDown, ClipboardList, LayoutDashboard, Languages, Moon, Search, Settings, Sun, Users, Wallet, UserRound, LogOut, RefreshCw } from "lucide-react";
import { useUI } from "@/lib/providers";

const nav = [
  ["overview", "/admin", LayoutDashboard], ["admission", "/admin/leads", Users], ["academic", "#", BookOpen],
  ["learning", "#", ClipboardList], ["students", "#", Users], ["finance", "#", Wallet],
  ["people", "#", Building2], ["reports", "#", ChartBar], ["settings", "/ui-preview", Settings]
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const { t, locale, setLocale } = useUI(); const { colorScheme, setColorScheme } = useMantineColorScheme();
  return <div className="shell"><aside className="sidebar">
    <div className="brand"><div className="brandMark">HN</div><span>HN LMS</span></div>
    <div className="workspace"><Group justify="space-between" wrap="nowrap"><div><Text size="xs" c="dimmed">KHÔNG GIAN</Text><Text size="sm" fw={600}>{t("branch")}</Text></div><ChevronDown size={15}/></Group></div>
    <nav>{nav.map(([key,href,Icon])=><Link className={`navItem ${pathname===href?"active":""}`} href={href} key={key}><Icon size={18}/><span>{t(key)}</span></Link>)}</nav>
    <div className="sidebarBottom"><Link className="navItem" href="/"><Settings2 size={18}/><span>{t("publicSite")}</span></Link><Link className="navItem" href="/platform"><Building2 size={18}/><span>{t("platform")}</span></Link></div>
  </aside><main className="main"><header className="topbar">
    <TextInput className="searchBox" leftSection={<Search size={16}/>} placeholder={t("search")} />
    <Group className="topbarActions" gap={6} wrap="nowrap">
      <Tooltip label={locale==="vi"?"Chuyển sang English":"Switch to Vietnamese"}><ActionIcon variant="subtle" size="lg" onClick={()=>setLocale(locale==="vi"?"en":"vi")} aria-label="Change language"><Languages size={19}/></ActionIcon></Tooltip>
      <Menu position="bottom-end"><Menu.Target><ActionIcon variant="subtle" size="lg" aria-label="Theme"><Moon size={19}/></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Label>Theme</Menu.Label><Menu.Item leftSection={<Moon size={16}/>} onClick={()=>setColorScheme("dark")}>Dark</Menu.Item><Menu.Item leftSection={<Sun size={16}/>} onClick={()=>setColorScheme("light")}>Light</Menu.Item><Menu.Item leftSection={<Settings2 size={16}/>} onClick={()=>setColorScheme("auto")}>System</Menu.Item></Menu.Dropdown></Menu>
      <ActionIcon variant="subtle" size="lg" aria-label="Notifications"><Bell size={19}/></ActionIcon><Menu position="bottom-end" shadow="md" width={230}><Menu.Target><ActionIcon variant="subtle" size="lg" aria-label="Mở menu tài khoản"><Avatar size={30} color="cyan">QA</Avatar></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Label><Text size="sm" fw={600}>Quốc Anh</Text><Text size="xs" c="dimmed">quoc.anh@hnlms.vn</Text></Menu.Label><Menu.Divider/><Menu.Item leftSection={<UserRound size={16}/>}>Hồ sơ cá nhân</Menu.Item><Menu.Item leftSection={<Settings size={16}/>}>Tùy chỉnh tài khoản</Menu.Item><Menu.Divider/><Menu.Item color="red" leftSection={<LogOut size={16}/>}>Đăng xuất</Menu.Item></Menu.Dropdown></Menu>
    </Group>
  </header>{children}<footer className="appFooter"><Group gap="xs"><Text size="xs" c="dimmed">HN LMS v0.1.0</Text><Text size="xs" c="dimmed">·</Text><Text size="xs" c="dimmed">© 2026 HN Learning. Bản quyền thuộc về HN Learning.</Text></Group><Group gap="xs"><Badge size="sm" variant="light" color="yellow" leftSection={<RefreshCw size={12}/>}>Có phiên bản mới</Badge><Button variant="subtle" size="compact-xs">Cập nhật</Button></Group></footer></main></div>;
}

export function PageHeader({ title, subtitle, action }: { title:string; subtitle:string; action?:string }) {
 return <div className="pageHeader"><div><div className="eyebrow">HN LMS / {title}</div><Text fz={26} fw={700}>{title}</Text><Text c="dimmed" size="sm" mt={3}>{subtitle}</Text></div>{action&&<Button>{action}</Button>}</div>;
}


