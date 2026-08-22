"use client";

import { Button, Group, Paper, Select, SimpleGrid, Tabs, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { UiStatusBadge } from "@/components/ui";
import { getPreset, themePresetRegistry, tokenCssVariables, validateContrast } from "@/lib/theme/registry";

const settingDefaults = {
  organizationName: "HN Learning Center",
  timezone: "Asia/Ho_Chi_Minh",
  academicYear: "2026-2027",
};

function applyPreset(key: string) {
  const preset = getPreset(key);
  for (const [mode, tokens] of [
    ["light", preset.light],
    ["dark", preset.dark],
  ] as const) {
    for (const [name, value] of Object.entries(tokenCssVariables(tokens, mode)))
      document.documentElement.style.setProperty(name, value);
  }
  document.documentElement.dataset.themePreset = `${preset.key}@${preset.version}`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(settingDefaults);
  const [activeKey, setActiveKey] = useState("hnlms-operational");
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const shown = getPreset(previewKey ?? activeKey);
  const preview = (key: string | null) => {
    if (key) {
      applyPreset(key);
      setPreviewKey(key);
    }
  };
  const publish = () => {
    if (previewKey) {
      setActiveKey(previewKey);
      setPreviewKey(null);
    }
  };
  const rollback = () => {
    setActiveKey("hnlms-operational");
    setPreviewKey(null);
    applyPreset("hnlms-operational");
  };

  return (
    <div className="page">
      <PageHeader
        title="Cài đặt tổ chức"
        subtitle="Thông tin dùng chung và nhận diện Mantine của tổ chức"
        action="Lưu cài đặt"
      />
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">Thông tin chung</Tabs.Tab>
          <Tabs.Tab value="theme">Theme & nhận diện</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="general" pt="lg">
          <Paper className="panel" p="lg">
            <Text fw={650}>Thông tin vận hành</Text>
            <Text size="sm" c="dimmed" mb="lg">
              Cấu hình này được áp dụng thống nhất cho các chi nhánh.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Tên tổ chức"
                value={settings.organizationName}
                onChange={(event) => setSettings({ ...settings, organizationName: event.currentTarget.value })}
              />
              <Select
                label="Múi giờ"
                value={settings.timezone}
                data={["Asia/Ho_Chi_Minh", "Asia/Bangkok", "UTC"]}
                onChange={(value) => value && setSettings({ ...settings, timezone: value })}
              />
              <TextInput
                label="Năm học"
                value={settings.academicYear}
                onChange={(event) => setSettings({ ...settings, academicYear: event.currentTarget.value })}
              />
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="theme" pt="lg">
          <Paper className="panel" p="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={650}>Theme preset</Text>
                <Text size="sm" c="dimmed">
                  Preview trên shell thật trước khi công bố.
                </Text>
              </div>
              <UiStatusBadge role={previewKey ? "warning" : "success"}>
                {previewKey ? "Đang preview" : `Đã publish ${activeKey}@${shown.version}`}
              </UiStatusBadge>
            </Group>
            <Group mt="md" align="end">
              <Select
                label="Preset"
                value={previewKey ?? activeKey}
                onChange={preview}
                data={themePresetRegistry.map((preset) => ({
                  value: preset.key,
                  label: `${preset.key} v${preset.version}`,
                }))}
              />
              <Button variant="default" disabled={!previewKey} onClick={publish}>
                Publish preview
              </Button>
              <Button variant="subtle" onClick={rollback}>
                Rollback
              </Button>
            </Group>
            <Group mt="md" gap="xs">
              <UiStatusBadge role={validateContrast(shown.light).valid ? "success" : "danger"}>
                Light contrast {validateContrast(shown.light).ratio.toFixed(2)}
              </UiStatusBadge>
              <UiStatusBadge role={validateContrast(shown.dark).valid ? "success" : "danger"}>
                Dark contrast {validateContrast(shown.dark).ratio.toFixed(2)}
              </UiStatusBadge>
            </Group>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
