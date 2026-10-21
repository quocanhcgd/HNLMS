"use client";

import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { ExternalLink, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiBadge, UiButton, UiStatusBadge } from "@/components/ui";

const previews = [
  { title: "Giới thiệu tổ chức", slug: "gioi-thieu", kind: "Trang", summary: "Thông tin tổng quan về HN Learning", status: "Đã công bố" },
  { title: "IELTS Foundation", slug: "ielts-foundation", kind: "Khóa học", summary: "Khóa học nền tảng IELTS cho người mới bắt đầu", status: "Đã công bố" },
  { title: "Khai giảng lớp IELTS A1 mới", slug: "khai-giang-lop-moi", kind: "Tin tức", summary: "Lớp IELTS Foundation A1 khai giảng 01/09/2026", status: "Đã công bố" },
  { title: "Đăng ký tư vấn miễn phí", slug: "dang-ky-tu-van", kind: "Kêu gọi hành động", summary: "Liên hệ ngay để được tư vấn khóa học phù hợp", status: "Đã công bố" },
];

export function ContentPreviewWorkspace() {
  return <div className="page"><PageHeader title="Xem trước trang công khai" subtitle="Kiểm tra nội dung đã công bố trước khi chia sẻ cho khách hàng và chuyển lead về tuyển sinh." action="Mở website" actionHref="/" /><Paper withBorder p="lg" mb="md" className="panelHighlight"><Group gap="md"><Megaphone size={24} /><div><Text fw={700}>Bản xem trước đã công bố</Text><Text size="sm" c="dimmed">Chỉ nội dung ở trạng thái Đã công bố được hiển thị cho khách hàng.</Text></div></Group></Paper><SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">{previews.map((item) => <Paper key={item.title} withBorder p="lg"><Stack gap="sm"><Group justify="space-between"><UiBadge variant="outline" color="gray">{item.kind}</UiBadge><UiStatusBadge role="success">{item.status}</UiStatusBadge></Group><Text fz={20} fw={750}>{item.title}</Text><Text size="sm" c="dimmed">{item.summary}</Text><Group justify="space-between" mt="sm"><Text size="xs" c="dimmed">/{item.slug}</Text><UiButton component="a" href="/" variant="subtle" size="compact-xs" leftSection={<ExternalLink size={14} />}>Mở trang</UiButton></Group></Stack></Paper>)}</SimpleGrid></div>;
}
