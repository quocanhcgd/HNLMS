import {
  Table as MantineTable,
  type TableProps,
  Badge,
  type BadgeProps,
  Text,
  ThemeIcon,
  type ThemeIconProps,
} from "@mantine/core";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { flexRender, type Row, type RowData, type Table as ReactTable } from "@tanstack/react-table";

export type UiStatusRole = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

export const uiStatusRoleColor: Record<UiStatusRole, string> = {
  primary: "cyan",
  success: "teal",
  warning: "yellow",
  danger: "red",
  info: "blue",
  neutral: "gray",
};

export function UiBadge(props: BadgeProps) {
  return <Badge size={props.size ?? "sm"} {...props} />;
}

export function UiStatusBadge({ role, ...props }: BadgeProps & { role: UiStatusRole }) {
  return <UiBadge variant={props.variant ?? "light"} color={uiStatusRoleColor[role]} {...props} />;
}

export function UiStatusIcon({ role, ...props }: ThemeIconProps & { role: UiStatusRole }) {
  return <ThemeIcon variant={props.variant ?? "light"} color={uiStatusRoleColor[role]} {...props} />;
}

export function UiTable(props: TableProps) {
  return <MantineTable highlightOnHover {...props} />;
}

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp size={14} />;
  if (direction === "desc") return <ArrowDown size={14} />;
  return <ArrowUpDown size={14} opacity={0.5} />;
}

export function UiDataTable<TData extends RowData>({
  table,
  columnCount,
  minWidth = 760,
  emptyTitle = "Không tìm thấy dữ liệu phù hợp.",
  getRowProps,
}: {
  table: ReactTable<TData>;
  columnCount: number;
  minWidth?: number;
  emptyTitle?: string;
  getRowProps?: (row: Row<TData>) => React.ComponentProps<typeof MantineTable.Tr>;
}) {
  return (
    <div className="tableWrap">
      <MantineTable.ScrollContainer minWidth={minWidth}>
        <UiTable verticalSpacing="md" horizontalSpacing="lg">
          <MantineTable.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <MantineTable.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <MantineTable.Th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        className="tableSortButton"
                        type="button"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? <SortIndicator direction={header.column.getIsSorted()} /> : null}
                      </button>
                    )}
                  </MantineTable.Th>
                ))}
              </MantineTable.Tr>
            ))}
          </MantineTable.Thead>
          <MantineTable.Tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <MantineTable.Tr key={row.id} {...getRowProps?.(row)}>
                  {row.getVisibleCells().map((cell) => (
                    <MantineTable.Td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </MantineTable.Td>
                  ))}
                </MantineTable.Tr>
              ))
            ) : (
              <MantineTable.Tr>
                <MantineTable.Td colSpan={columnCount}>
                  <Text c="dimmed" ta="center" py="xl">
                    {emptyTitle}
                  </Text>
                </MantineTable.Td>
              </MantineTable.Tr>
            )}
          </MantineTable.Tbody>
        </UiTable>
      </MantineTable.ScrollContainer>
    </div>
  );
}
