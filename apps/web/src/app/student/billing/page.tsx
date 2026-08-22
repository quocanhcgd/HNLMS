"use client";
import { PageHeader } from "@/components/app-shell";
import { Group, Paper, Text } from "@mantine/core";
import { CreditCard } from "lucide-react";
import { UiButton, UiStatusBadge } from "@/components/ui";
export default function StudentBillingPage(){return <div className="page"><PageHeader title="Học phí của tôi" subtitle="Xem hóa đơn, thanh toán và biên nhận của học viên."/><Paper className="panel" p="lg" withBorder><Group justify="space-between"><div><Text fw={700}>INV-2608-001 · Học phí IELTS Foundation</Text><Text size="sm" c="dimmed">2.000.000đ · hạn 30/08/2026</Text></div><UiStatusBadge role="warning">Chờ thanh toán</UiStatusBadge><UiButton leftSection={<CreditCard size={16}/>}>Thanh toán</UiButton></Group></Paper></div>}
