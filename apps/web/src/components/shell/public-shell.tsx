"use client";

import Link from "next/link";
import { ActionIcon, Drawer, Group, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Languages, Menu as MenuIcon, MoonStar, Sun } from "lucide-react";
import { UiButton } from "@/components/ui";
import { useUI } from "@/lib/providers";

const navItems = [
  ["Chương trình", "#programs"],
  ["Chi nhánh", "#branches"],
  ["Đội ngũ", "#team"],
  ["Tin tức", "#news"],
] as const;

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useUI();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <div className="publicShell" data-public-shell="true">
      <header className="publicHeader">
        <Link href="/" className="publicBrand" aria-label="Hanoi Learning home">
          <span className="brandMark">HN</span>
          <span>Hanoi Learning</span>
        </Link>
        <nav className="publicDesktopNav" aria-label="Public navigation">
          {navItems.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Group gap={6} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            aria-label={locale === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
          >
            <Languages size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" aria-label="Change theme" onClick={() => toggleColorScheme()}>
            {colorScheme === "dark" ? <Sun size={18} /> : <MoonStar size={18} />}
          </ActionIcon>
          <UiButton component={Link} href="#consultation" className="publicCta">
            Đăng ký tư vấn
          </UiButton>
          <ActionIcon className="publicMenuButton" variant="subtle" aria-label="Open navigation" onClick={open}>
            <MenuIcon size={20} />
          </ActionIcon>
        </Group>
      </header>
      <Drawer
        opened={opened}
        onClose={close}
        title="Hanoi Learning"
        position="right"
        size="min(88vw, 340px)"
        closeButtonProps={{ "aria-label": "Close navigation" }}
      >
        <Stack gap="xs">
          {navItems.map(([label, href]) => (
            <UiButton key={href} component={Link} href={href} variant="subtle" justify="flex-start" onClick={close}>
              {label}
            </UiButton>
          ))}
          <UiButton component={Link} href="/admin" onClick={close}>
            Vào portal học tập
          </UiButton>
        </Stack>
      </Drawer>
      {children}
      <footer className="publicFooter" id="contact">
        <div>
          <Group gap="xs">
            <span className="brandMark">HN</span>
            <Text fw={700}>Hanoi Learning</Text>
          </Group>
          <Text size="sm" c="dimmed" mt="sm">
            Học đúng lộ trình. Tiến bộ có thể nhìn thấy.
          </Text>
        </div>
        <div>
          <Text size="sm" fw={600}>
            Liên hệ
          </Text>
          <Text size="sm" c="dimmed" mt={5}>
            hello@hanoilearning.vn · 024 0000 0000
          </Text>
        </div>
        <div>
          <Text size="sm" fw={600}>
            Pháp lý
          </Text>
          <Group gap="md" mt={5}>
            <Link href="#privacy">Chính sách riêng tư</Link>
            <Link href="#terms">Điều khoản sử dụng</Link>
          </Group>
        </div>
        <Text size="xs" c="dimmed" className="publicCopyright">
          © 2026 HN Learning. Bản quyền thuộc về HN Learning.
        </Text>
      </footer>
    </div>
  );
}
