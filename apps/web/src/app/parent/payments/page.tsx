"use client";
import { PageHeader } from "@/components/app-shell";
import { Group, Paper, Text } from "@mantine/core";
import { CreditCard } from "lucide-react";
import { UiButton, UiStatusBadge } from "@/components/ui";
export default function ParentPaymentsPage(){return <div className="page"><PageHeader title="Thanh toán học phí" subtitle="Thanh toán các hóa đơn được phép cho học viên được ủy quyền."/><Paper className="panel" p="lg" withBorder><Group justify="space-between"><div><Text fw={700}>Nguyễn Minh Anh · INV-2608-001</Text><Text size="sm" c="dimmed">Học phí IELTS Foundation · 2.000.000đ</Text></div><UiStatusBadge role="warning">Chờ thanh toán</UiStatusBadge><UiButton leftSection={<CreditCard size={16}/>}>Thanh toán</UiButton></Group></Paper></div>}
