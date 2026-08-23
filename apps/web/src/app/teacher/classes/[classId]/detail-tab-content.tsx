"use client";
import { Group, Paper, Stack, Text, SimpleGrid } from "@mantine/core";
import { useState } from "react";
import { CalendarClock, ClipboardCheck, FileText, Video } from "lucide-react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { SessionTab } from "./session-tab";

const students = [
  { student: "Nguyễn Minh Anh", attendance: "12/14", progress: "68%", score: "8.5/10", homework: "Trễ 1 bài" },
  { student: "Trần Gia Huy", attendance: "14/14", progress: "54%", score: "7.2/10", homework: "Đủ bài" },
  { student: "Lê Phương Linh", attendance: "13/14", progress: "76%", score: "9.0/10", homework: "Đủ bài" },
];
function Kpis({ items }: { items: Array<[string, string, "success" | "info" | "warning"]> }) { return <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>{items.map(([value, label, role]) => <Paper className={`classInfoCard classInfoCard--${role}`} p="md" key={label}><Text className="classInfoLabel">{label}</Text><Text className="classInfoValue" fw={700} fz="xl">{value}</Text><UiStatusBadge role={role}>Cập nhật</UiStatusBadge></Paper>)}</SimpleGrid>; }
function DataTableView({ data, columns, empty, minWidth = 760 }: { data: any[]; columns: any[]; empty: string; minWidth?: number }) { const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() }); return <UiDataTable table={table} columnCount={columns.length} minWidth={minWidth} emptyTitle={empty} />; }
export function DetailTabContent({ activeKey }: { activeKey: string }) {
  if (activeKey === "students") return <Stack><Kpis items={[["18", "Học viên", "success"], ["14/18", "Đã tham dự", "info"], ["2", "Cần hỗ trợ", "warning"]]} /><DataTableView data={students} columns={[{ accessorKey: "student", header: "Học viên" }, { accessorKey: "attendance", header: "Điểm danh" }, { accessorKey: "progress", header: "Tiến độ" }, { accessorKey: "score", header: "Điểm gần nhất" }, { accessorKey: "homework", header: "Bài tập" }]} empty="Chưa có học viên." /></Stack>;
  if (activeKey === "sessions") return <SessionTab />;
  if (activeKey === "assignments") return <Stack><Kpis items={[["14", "Chờ chấm trên lớp", "warning"], ["12", "Bài về nhà đã nộp", "info"], ["1", "Bài kiểm tra sắp mở", "success"]]} /><DataTableView data={[{title:"Listening warm-up",type:"Bài tập trên lớp",due:"Trong buổi",submitted:"16/18",graded:"14/18"},{title:"Writing Task 1",type:"Bài tập về nhà",due:"26/08",submitted:"12/18",graded:"0/12"},{title:"Mini test Unit 5",type:"Bài kiểm tra",due:"28/08",submitted:"0/18",graded:"-"}]} columns={[{accessorKey:"title",header:"Bài"},{accessorKey:"type",header:"Loại"},{accessorKey:"due",header:"Hạn"},{accessorKey:"submitted",header:"Đã nộp"},{accessorKey:"graded",header:"Đã chấm"}]} empty="Chưa có bài tập." /></Stack>;
  if (activeKey === "materials") return <Stack><Kpis items={[["5", "Học liệu buổi kế tiếp", "info"], ["4", "Đã công bố", "success"], ["1", "Chưa công bố", "warning"]]} /><DataTableView data={[{title:"IELTS Listening · Warm-up",type:"Bài giảng",status:"Đã công bố",viewer:"Mở trong hệ thống"},{title:"Listening vocabulary pack",type:"Tài liệu tham khảo",status:"Đã công bố",viewer:"Mở trong hệ thống"},{title:"Unit 5 worksheet",type:"Bài tập",status:"Chưa công bố",viewer:"-"}]} columns={[{accessorKey:"title",header:"Học liệu"},{accessorKey:"type",header:"Loại"},{accessorKey:"status",header:"Trạng thái"},{accessorKey:"viewer",header:"Cách mở"}]} empty="Chưa có học liệu." /></Stack>;
  if (activeKey === "attendance") return <Stack><Kpis items={[["14/16", "Buổi gần nhất", "info"], ["87,5%", "Tỷ lệ tham dự", "success"], ["2", "Cần xác minh", "warning"]]} /><DataTableView data={students.map(x=>({student:x.student,rate:x.attendance,latest:x.student === "Trần Gia Huy" ? "Có mặt" : "Cần ghi",note:x.homework === "Trễ 1 bài" ? "Vắng 2 buổi" : ""}))} columns={[{accessorKey:"student",header:"Học viên"},{accessorKey:"rate",header:"Tỷ lệ"},{accessorKey:"latest",header:"Buổi gần nhất"},{accessorKey:"note",header:"Ghi chú"}]} empty="Chưa có dữ liệu điểm danh." /></Stack>;
  if (activeKey === "scores") return <Stack><Kpis items={[["8,2", "Điểm trung bình", "info"], ["14", "Đã chấm trên lớp", "success"], ["12", "Bài về nhà chờ chấm", "warning"]]} /><DataTableView data={students.map(x=>({student:x.student,inClass:x.score,test:"8.1",homework:x.homework === "Đủ bài" ? "Chờ chấm" : "-"}))} columns={[{accessorKey:"student",header:"Học viên"},{accessorKey:"inClass",header:"Trên lớp"},{accessorKey:"test",header:"Kiểm tra"},{accessorKey:"homework",header:"Bài về nhà"}]} empty="Chưa có điểm." /></Stack>;
  return <Paper className="classInfoCallout" p="lg"><Text fw={700}>Phản hồi buổi học gần nhất</Text><Text size="sm" c="dimmed" mt="xs">Học viên phản hồi về tốc độ nghe và thời lượng thực hành speaking.</Text></Paper>;
}

