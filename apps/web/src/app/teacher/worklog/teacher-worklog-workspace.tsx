"use client";
import { useState } from "react";
import { Group, Paper, Stack, Text, Textarea } from "@mantine/core";
import { CheckCircle2, FileText, Send, Upload } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

const materialTypes = ["Bài giảng", "Bài tập trên lớp", "Bài kiểm tra", "Bài tập về nhà", "Tài liệu tham khảo"];
export function TeacherWorklogWorkspace() {
  const [selectedType, setSelectedType] = useState("Bài giảng");
  return <div className="page">
    <PageHeader title="Buổi dạy & worklog" subtitle="Chuẩn bị đủ học liệu trước giờ dạy, xác nhận hoạt động trên lớp và gửi công dạy." />
    <Paper className="panel" p="lg" withBorder>
      <Group justify="space-between" mb="md"><div><Text fw={700}>IF-2609 · Unit 5 · Listening clinic</Text><Text size="sm" c="dimmed">Hôm nay 18:00-19:30 · 18 học viên · online</Text></div><UiStatusBadge role="warning">Cần chuẩn bị</UiStatusBadge></Group>
      <Stack gap="sm"><UiSelect label="Loại học liệu" value={selectedType} onChange={(value) => setSelectedType(value ?? "Bài giảng")} data={materialTypes} /><UiTextInput label="Tiêu đề" defaultValue={`${selectedType} · Unit 5`} /><Textarea label="Mô tả hướng dẫn" minRows={3} defaultValue="Mục tiêu, cách thực hiện và tiêu chí hoàn thành của học viên." /><Group justify="flex-end"><UiButton variant="default" leftSection={<Upload size={16} />}>Đính kèm tài liệu</UiButton><UiButton leftSection={<Send size={16} />}>Công bố cho lớp</UiButton></Group></Stack>
    </Paper>
    <Paper className="panel" p="lg" mt="md" withBorder><Text fw={700}>Sau buổi dạy</Text><Text size="sm" c="dimmed" mt="xs">Bài tập trên lớp được chấm ngay; bài tập về nhà chuyển sang hàng đợi chấm sau.</Text><Group mt="md"><UiButton variant="default" leftSection={<CheckCircle2 size={16} />}>Ghi nhận điểm danh</UiButton><UiButton variant="default" leftSection={<FileText size={16} />}>Xác nhận worklog</UiButton></Group></Paper>
  </div>;
}
