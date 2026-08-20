import { Badge, type BadgeProps, Table, type TableProps } from "@mantine/core";

export function UiBadge(props: BadgeProps) {
  return <Badge size={props.size ?? "sm"} {...props} />;
}
export function UiTable(props: TableProps) {
  return <Table highlightOnHover {...props} />;
}
