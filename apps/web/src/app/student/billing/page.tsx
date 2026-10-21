"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { CreditCard, FileText, Search } from "lucide-react";
import { Group, Paper, Radio, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { billingApi, type BillingInvoice } from "@/lib/billing-api";

type InvoiceStatus = "Chờ thanh toán" | "Đã thanh toán" | "Quá hạn";
type Invoice = { id: string; className: string; program: string; amount: number; dueAt: string; status: InvoiceStatus };

const fromApi = (item: BillingInvoice): Invoice => ({
  id: item.number,
  className: item.branch,
  program: item.description,
  amount: item.amount,
  dueAt: new Date(item.due).toLocaleDateString("vi-VN"),
  status: item.status === "paid" ? "Đã thanh toán" : item.status === "overdue" ? "Quá hạn" : "Chờ thanh toán",
});
const statusRole: Record<InvoiceStatus, "warning" | "success" | "danger"> = {
  "Chờ thanh toán": "warning",
  "Đã thanh toán": "success",
  "Quá hạn": "danger",
};
const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "đ";

export default function StudentBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [method, setMethod] = useState("banking");

  useEffect(() => {
    void billingApi.listForLearner("student")
      .then((result) => setInvoices(result.data.map(fromApi)))
      .catch(() => setError("Không tải được hóa đơn học phí."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => invoices.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (status === "all" || !status || item.status === status)),
    [invoices, query, status],
  );
  const columns = useMemo<ColumnDef<Invoice>[]>(() => [
    { accessorKey: "id", header: "Hóa đơn", cell: ({ row }) => <div><Text fw={600}>{row.original.id}</Text><Text size="xs" c="dimmed">{row.original.className} · {row.original.program}</Text></div> },
    { accessorKey: "amount", header: "Số tiền", cell: ({ getValue }) => money(getValue<number>()) },
    { accessorKey: "dueAt", header: "Hạn thanh toán" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <UiStatusBadge role={statusRole[row.original.status]}>{row.original.status}</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <Group gap="xs"><UiButton size="compact-xs" variant="default" leftSection={<FileText size={14} />} onClick={() => setSelected(row.original)}>Chi tiết</UiButton>{row.original.status !== "Đã thanh toán" ? <UiButton size="compact-xs" leftSection={<CreditCard size={14} />} onClick={() => setSelected(row.original)}>Thanh toán</UiButton> : null}</Group> },
  ], []);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const confirmPayment = () => {
    if (!selected) return;
    void billingApi.payForLearner(selected.id, "student")
      .then((item) => {
        setInvoices((current) => current.map((row) => row.id === selected.id ? fromApi(item) : row));
        setSelected(null);
      })
      .catch(() => setError("Không thể ghi nhận thanh toán."));
  };

  return <div className="page">
    <PageHeader title="Học phí của tôi" subtitle="Theo dõi hóa đơn, hạn thanh toán, trạng thái công nợ và biên nhận theo từng lớp học." />
    {error ? <Text size="sm" c="red" mb="sm">{error}</Text> : null}
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm hóa đơn" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm mã hóa đơn, lớp, chương trình..." style={{ minWidth: 300 }} /><UiSelect aria-label="Lọc trạng thái hóa đơn" w={180} value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, "Chờ thanh toán", "Đã thanh toán", "Quá hạn"]} /></PageToolbar>
    <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" mb="md"><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Tổng hóa đơn</Text><Text fz={24} fw={700}>{loading ? "..." : filtered.length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Cần thanh toán</Text><Text fz={24} fw={700}>{loading ? "..." : filtered.filter((item) => item.status !== "Đã thanh toán").length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Đã thanh toán</Text><Text fz={24} fw={700}>{loading ? "..." : filtered.filter((item) => item.status === "Đã thanh toán").length}</Text></Paper></SimpleGrid>
    <UiDataTable table={table} columnCount={columns.length} minWidth={960} emptyTitle={loading ? "Đang tải hóa đơn..." : "Không tìm thấy hóa đơn phù hợp."} />
    <Text size="xs" c="dimmed" mt="sm">Thanh toán, hoàn tiền và điều chỉnh thật phải đi qua cổng tài chính có xác nhận và audit.</Text>
    <UiModal opened={selected !== null} onClose={() => setSelected(null)} title={selected ? "Hóa đơn · " + selected.id : "Hóa đơn"}>{selected ? selected.status === "Đã thanh toán" ? <Stack gap="sm"><Group justify="space-between"><Text>Trạng thái</Text><UiStatusBadge role="success">Đã thanh toán</UiStatusBadge></Group><Text size="sm">{money(selected.amount)} · {selected.className} · {selected.program}</Text><Text size="sm" c="dimmed">Hóa đơn đã được ghi nhận trong luồng tài chính.</Text><Group justify="flex-end"><UiButton onClick={() => setSelected(null)}>Đóng</UiButton></Group></Stack> : <Stack gap="sm"><Text size="sm">{money(selected.amount)} · hạn {selected.dueAt}</Text><Radio.Group label="Phương thức thanh toán" value={method} onChange={setMethod}><Stack gap="xs" mt="xs"><Radio value="banking" label="Chuyển khoản ngân hàng" /><Radio value="card" label="Thẻ thanh toán" /></Stack></Radio.Group><Text size="xs" c="dimmed">Thanh toán được ghi nhận qua luồng tài chính của trung tâm.</Text><Group justify="flex-end"><UiButton onClick={confirmPayment}>Xác nhận thanh toán</UiButton></Group></Stack> : null}</UiModal>
  </div>;
}
