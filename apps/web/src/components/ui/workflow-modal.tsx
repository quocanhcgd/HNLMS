import { Group, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { UiButton } from "./button";
import { UiModal } from "./modal";

export function UiConfirmModal({
  opened,
  onClose,
  title,
  description,
  confirmLabel = "Xác nhận",
  onConfirm,
  destructive = false,
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <UiModal opened={opened} onClose={onClose} title={title} size="sm">
      <Stack>
        <Text size="sm">{description}</Text>
        <Group justify="flex-end">
          <UiButton variant="default" onClick={onClose}>Hủy</UiButton>
          <UiButton color={destructive ? "red" : undefined} onClick={onConfirm}>{confirmLabel}</UiButton>
        </Group>
      </Stack>
    </UiModal>
  );
}

export function UiEditModal({
  opened,
  onClose,
  title,
  children,
  onSave,
  saveLabel = "Lưu thay đổi",
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <UiModal opened={opened} onClose={onClose} title={title}>
      <Stack>
        {children}
        <Group justify="flex-end">
          <UiButton variant="default" onClick={onClose}>Hủy</UiButton>
          <UiButton onClick={onSave}>{saveLabel}</UiButton>
        </Group>
      </Stack>
    </UiModal>
  );
}
