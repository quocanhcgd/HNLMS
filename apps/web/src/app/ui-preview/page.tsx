"use client";
import Link from "next/link";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  Progress,
  Radio,
  Select,
  Switch,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { Bell, Ellipsis, Download, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getPreset, themePresetRegistry, tokenCssVariables, validateContrast } from "@/lib/theme/registry";

export default function Preview() {
  const [opened, { open, close }] = useDisclosure(false);
  const [activeKey, setActiveKey] = useState("hnlms-operational");
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const activePreset = getPreset(activeKey);
  const previewPreset = previewKey ? getPreset(previewKey) : null;
  const shownPreset = previewPreset ?? activePreset;
  const applyPreview = (key: string) => {
    const preset = getPreset(key);
    for (const [mode, tokens] of [
      ["light", preset.light],
      ["dark", preset.dark],
    ] as const)
      for (const [name, value] of Object.entries(tokenCssVariables(tokens, mode)))
        document.documentElement.style.setProperty(name, value);
    setPreviewKey(key);
  };
  const publishPreview = () => {
    if (previewKey) {
      setActiveKey(previewKey);
      setPreviewKey(null);
    }
  };
  const rollback = () => {
    setActiveKey("hnlms-operational");
    setPreviewKey(null);
  };
  return (
    <AppShell>
      <div className="page">
        <PageHeader title="Thư viện component" subtitle="Duyệt màu, trạng thái điều khiển và mật độ giao diện" />
        <Paper className="panel themeControlPanel" p="lg">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={650}>Theme preset</Text>
              <Text size="sm" c="dimmed">
                Preview trong shell thật, publish hoặc rollback theo version.
              </Text>
            </div>
            <Badge color={previewKey ? "yellow" : "teal"} variant="light">
              {previewKey ? "Đang preview" : `Đã publish ${activePreset.key}@${activePreset.version}`}
            </Badge>
          </Group>
          <Group mt="md" align="end">
            <Select
              label="Preset"
              value={previewKey ?? activeKey}
              onChange={(value) => value && applyPreview(value)}
              data={themePresetRegistry.map((preset) => ({
                value: preset.key,
                label: `${preset.key} v${preset.version}`,
              }))}
            />
            <Button variant="default" onClick={publishPreview} disabled={!previewKey}>
              Publish preview
            </Button>
            <Button variant="subtle" onClick={rollback}>
              Rollback
            </Button>
          </Group>
          <Group mt="md" gap="xs">
            <Badge color={validateContrast(shownPreset.light).valid ? "teal" : "red"} variant="light">
              Light contrast {validateContrast(shownPreset.light).ratio.toFixed(2)}
            </Badge>
            <Badge color={validateContrast(shownPreset.dark).valid ? "teal" : "red"} variant="light">
              Dark contrast {validateContrast(shownPreset.dark).ratio.toFixed(2)}
            </Badge>
          </Group>
        </Paper>
        <div className="galleryGrid">
          <Paper className="panel" p="lg">
            <Text fw={650} mb="md">
              Màu ngữ nghĩa
            </Text>
            <div className="swatches">
              <div className="swatch" style={{ background: "#15aebb" }}>
                Primary
              </div>
              <div className="swatch" style={{ background: "#2f9e68" }}>
                Success
              </div>
              <div className="swatch" style={{ background: "#d99b22" }}>
                Warning
              </div>
              <div className="swatch" style={{ background: "#d94c4c" }}>
                Danger
              </div>
              <div className="swatch" style={{ background: "#3182ce" }}>
                Info
              </div>
            </div>
            <Text size="xs" c="dimmed" mt="sm">
              Màu chỉ nhấn hành động và trạng thái, không phủ toàn bộ giao diện.
            </Text>
          </Paper>
          <Paper className="panel" p="lg">
            <Text fw={650} mb="md">
              Button & actions
            </Text>
            <Group>
              <Button leftSection={<Plus size={16} />}>Tạo mới</Button>
              <Button variant="default" leftSection={<Download size={16} />}>
                Xuất dữ liệu
              </Button>
              <Button variant="light">Lưu nháp</Button>
              <Button color="red" variant="light" leftSection={<Trash2 size={16} />}>
                Xóa
              </Button>
              <Button loading>Đang lưu</Button>
              <ActionIcon variant="default" aria-label="Thông báo">
                <Bell size={17} />
              </ActionIcon>
              <Tooltip label="Tác vụ khác">
                <ActionIcon variant="subtle" aria-label="Tác vụ khác">
                  <Ellipsis size={17} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Paper>
          <Paper className="panel" p="lg">
            <Text fw={650} mb="md">
              Form controls
            </Text>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <TextInput label="Tên học viên" placeholder="Nhập họ và tên" required />
              <Select label="Chi nhánh" data={["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"]} defaultValue="Hà Nội" />
              <TextInput label="Số điện thoại" error="Số điện thoại chưa hợp lệ" defaultValue="123" />
              <Textarea label="Ghi chú tư vấn" placeholder="Nhu cầu và bước tiếp theo..." />
            </div>
            <Group mt="md">
              <Checkbox defaultChecked label="Đã đồng ý nhận tư vấn" />
              <Switch label="Gửi thông báo" defaultChecked />
            </Group>
          </Paper>
          <Paper className="panel" p="lg">
            <Text fw={650} mb="md">
              Status & feedback
            </Text>
            <Group mb="lg">
              <Badge color="cyan" variant="light">
                Mới
              </Badge>
              <Badge color="yellow" variant="light">
                Chờ duyệt
              </Badge>
              <Badge color="teal" variant="light">
                Đã ghi danh
              </Badge>
              <Badge color="red" variant="light">
                Quá hạn
              </Badge>
              <Badge color="gray" variant="outline">
                Không hoạt động
              </Badge>
            </Group>
            <Text size="sm" fw={600}>
              Tiến độ hồ sơ
            </Text>
            <Progress value={72} mt={7} mb="lg" aria-label="Tiến độ hồ sơ 72 phần trăm" />
            <Button variant="default" onClick={open}>
              Mở hộp thoại xác nhận
            </Button>
            <Modal opened={opened} onClose={close} title="Xác nhận công bố">
              <Text size="sm">Nội dung sẽ hiển thị cho toàn bộ học viên trong lớp IELTS Foundation A1.</Text>
              <Group justify="flex-end" mt="xl">
                <Button variant="default" onClick={close}>
                  Hủy
                </Button>
                <Button onClick={close}>Công bố</Button>
              </Group>
            </Modal>
          </Paper>
          <Paper className="panel" p="lg">
            <Text fw={650} mb="md">
              Tabs & lựa chọn
            </Text>
            <Tabs defaultValue="overview">
              <Tabs.List>
                <Tabs.Tab value="overview">Tổng quan</Tabs.Tab>
                <Tabs.Tab value="students">Học viên</Tabs.Tab>
                <Tabs.Tab value="schedule">Lịch học</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="overview" pt="md">
                <Text size="sm" c="dimmed">
                  Nội dung tab sử dụng spacing ổn định ở cả hai ngôn ngữ.
                </Text>
              </Tabs.Panel>
            </Tabs>
            <Radio.Group mt="lg" label="Hình thức học" defaultValue="hybrid">
              <Group mt="xs">
                <Radio value="offline" label="Trực tiếp" />
                <Radio value="online" label="Online" />
                <Radio value="hybrid" label="Kết hợp" />
              </Group>
            </Radio.Group>
          </Paper>
          <Paper className="panel" p="lg">
            <Text fw={650} mb="md">
              Liên kết màn hình
            </Text>
            <Group>
              <Button component={Link} href="/admin">
                Dashboard
              </Button>
              <Button component={Link} href="/admin/leads" variant="default">
                Lead pipeline
              </Button>
              <Button component={Link} href="/" variant="default">
                Landing
              </Button>
              <Button component={Link} href="/platform" variant="default">
                Platform
              </Button>
            </Group>
            <Text mt="lg" size="sm" c="dimmed">
              Dùng các màn hình này để duyệt sự khác biệt giữa public, vận hành LMS và control plane.
            </Text>
          </Paper>
        </div>
      </div>
    </AppShell>
  );
}
