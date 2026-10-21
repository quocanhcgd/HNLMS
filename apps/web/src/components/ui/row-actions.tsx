import { Group, Tooltip } from "@mantine/core";
import { Archive, Eye, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { UiButton } from "./button";

export type UiRowAction = "view" | "edit" | "publish" | "archive" | "void" | "delete";

export type UiRowActionsProps = {
  actions?: Partial<Record<UiRowAction, (() => void) | undefined>>;
  disabled?: boolean;
  labels?: Partial<Record<UiRowAction, string>>;
};

const defaults: Record<UiRowAction, { label: string; icon: typeof Eye; color?: string }> = {
  view: { label: "Xem", icon: Eye },
  edit: { label: "Chỉnh sửa", icon: Pencil },
  publish: { label: "Công bố", icon: Send, color: "teal" },
  archive: { label: "Lưu trữ", icon: Archive, color: "orange" },
  void: { label: "Hủy hiệu lực", icon: Undo2, color: "orange" },
  delete: { label: "Xóa", icon: Trash2, color: "red" },
};

/** Row-level commands stay beside the record and inherit the caller's state/permission checks. */
export function UiRowActions({ actions = {}, disabled = false, labels = {} }: UiRowActionsProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      {(Object.keys(defaults) as UiRowAction[]).map((action) => {
        const onClick = actions[action];
        if (!onClick) return null;
        const config = defaults[action];
        const Icon = config.icon;
        const label = labels[action] ?? config.label;
        return (
          <Tooltip key={action} label={label} withArrow>
            <UiButton
              aria-label={label}
              size="compact-xs"
              variant={action === "edit" || action === "view" ? "default" : "light"}
              color={config.color}
              disabled={disabled}
              onClick={onClick}
              leftSection={<Icon size={14} aria-hidden="true" />}
            >
              {label}
            </UiButton>
          </Tooltip>
        );
      })}
    </Group>
  );
}
