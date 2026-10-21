"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { CreditCard, Search } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { billingApi, type BillingInvoice } from "@/lib/billing-api";

type InvoiceRow = {
  id: string;
  student: string;
  course: string;
  due: string;
  amount: number;
  status: "Chờ thanh toán" | "Đã thanh toán" | "Quá hạn";
};
const fromApi = (item: BillingInvoice): InvoiceRow => ({ id: item.number, student: item.student, course: item.description, due: new Date(item.due).toLocaleDateString("vi-VN"), amount: item.amount, status: item.status === "paid" ? "Đã thanh toán" : item.status === "overdue" ? "Quá hạn" : "Chờ thanh toán" });
const formatMoney = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;

export default function ParentPaymentsPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<string | null>(searchParams.get("student") ?? "all");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void billingApi.listForLearner("parent").then((result) => setRows(result.data.map(fromApi))).catch(() => setError("Không tải được hóa đơn của học viên được ủy quyền.")).finally(() => setLoading(false)); }, []);
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === "all" || !status || row.status === status) &&
          (student === "all" || !student || (student === "student-minh-anh" && row.student === "Nguyễn Minh Anh") || (student === "student-gia-huy" && row.student === "Trần Gia Huy")) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rows, status, student],
  );
  const columns = useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Hóa đơn",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.id}</Text>
            <Text size="xs" c="dimmed">
              {row.original.student} · {row.original.course}
            </Text>
          </div>
        ),
      },
      { accessorKey: "due", header: "Hạn" },
      {
        accessorKey: "amount",
        header: "Số tiền",
        cell: ({ getValue }) => <Text fw={600}>{formatMoney(getValue<number>())}</Text>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<InvoiceRow["status"]>();
          return (
            <UiStatusBadge role={value === "Đã thanh toán" ? "success" : value === "Quá hạn" ? "danger" : "warning"}>
              {value}
            </UiStatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <Group gap="xs">
            <UiButton size="compact-xs" variant="default" onClick={() => setSelected(row.original)}>
              Chi tiết
            </UiButton>
            {row.original.status !== "Đã thanh toán" ? (
              <UiButton
                size="compact-xs"
                leftSection={<CreditCard size={14} />}
                onClick={() => setSelected(row.original)}
              >
                Thanh toán
              </UiButton>
            ) : null}
          </Group>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const confirmPayment = () => {
    if (!selected) return;
    void billingApi.payForLearner(selected.id, "parent").then((item) => { setRows((value) => value.map((row) => row.id === selected.id ? fromApi(item) : row)); setNotice("Đã ghi nhận thanh toán trong luồng công nợ."); setSelected(null); }).catch(() => setError("Không thể ghi nhận thanh toán."));
  };
  const outstanding = rows.filter((row) => row.status !== "Đã thanh toán").reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="page">
      <PageHeader title="Thanh toán học phí" subtitle="Thanh toán các hóa đơn được phép cho học viên được ủy quyền." />
      {error ? <Text size="sm" c="red" mb="sm">{error}</Text> : null}
      {notice ? (
        <UiStatusBadge role="success" mb="md">
          {notice}
        </UiStatusBadge>
      ) : null}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Paper className="classInfoCard classInfoCard--warning" p="md">
          <Text className="classInfoLabel">CÒN PHẢI THANH TOÁN</Text>
          <Text className="classInfoValue" fw={700}>
            {formatMoney(outstanding)}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--info" p="md">
          <Text className="classInfoLabel">HÓA ĐƠN</Text>
          <Text className="classInfoValue" fw={700}>
            {rows.length}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--success" p="md">
          <Text className="classInfoLabel">ĐÃ THANH TOÁN</Text>
          <Text className="classInfoValue" fw={700}>
            {rows.filter((row) => row.status === "Đã thanh toán").length}
          </Text>
        </Paper>
      </SimpleGrid>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm hóa đơn"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm mã hóa đơn, học viên..."
          style={{ minWidth: 290 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái hóa đơn"
          w={190}
          value={status}
          onChange={setStatus}
          data={[{ value: "all", label: "Tất cả trạng thái" }, "Chờ thanh toán", "Đã thanh toán", "Quá hạn"]}
        />
        <UiSelect
          aria-label="Lọc học viên"
          w={210}
          value={student}
          onChange={setStudent}
          data={[
            { value: "all", label: "Tất cả học viên" },
            { value: "student-minh-anh", label: "Nguyễn Minh Anh" },
            { value: "student-gia-huy", label: "Trần Gia Huy" },
          ]}
        />
      </PageToolbar>
      <UiDataTable table={table} columnCount={columns.length} minWidth={950} emptyTitle={loading ? "Đang tải hóa đơn..." : "Không có hóa đơn phù hợp."} />
      <UiModal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.id} · ${selected.student}` : "Chi tiết hóa đơn"}
      >
        {selected ? (
          <Stack gap="md">
            <Text>{selected.course}</Text>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Số tiền
              </Text>
              <Text fw={700}>{formatMoney(selected.amount)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Hạn thanh toán
              </Text>
              <Text>{selected.due}</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Thanh toán được ghi nhận vào cùng luồng công nợ mà bộ phận tài chính theo dõi.
            </Text>
            <Group justify="flex-end">
              <UiButton variant="default" onClick={() => setSelected(null)}>
                Đóng
              </UiButton>
              {selected.status !== "Đã thanh toán" ? (
                <UiButton leftSection={<CreditCard size={16} />} onClick={confirmPayment}>
                  Xác nhận thanh toán
                </UiButton>
              ) : null}
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
