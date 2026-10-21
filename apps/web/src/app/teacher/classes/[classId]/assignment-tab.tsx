"use client";

import { useEffect, useMemo, useState } from "react";
import { Group, NumberInput, Paper, Stack, Text, Textarea } from "@mantine/core";
import { Plus, Search } from "lucide-react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { UiButton, UiConfirmModal, UiDataTable, UiEditModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { teacherLearningApi, type TeacherLearningAssignment, type TeacherLearningSubmission } from "@/lib/teacher-learning-api";

const classId = "if-2609";
const sessions = [{ value: "session-5", label: "Buổi 5 · Listening clinic" }, { value: "session-6", label: "Buổi 6 · Reading strategies" }, { value: "session-7", label: "Buổi 7 · Writing paragraph" }];
const dueLabel = (value?: string) => {
  if (!value) return "Trong buổi";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[·-]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  return `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")} · ${match[4].padStart(2, "0")}:${match[5]}`;
};
const stateLabel = (item: TeacherLearningAssignment) => item.lifecycle === "draft" ? "Bản nháp" : item.lifecycle === "archived" ? "Đã lưu trữ" : item.submissions?.some((entry) => entry.lifecycle === "submitted") ? "Đang chấm" : "Đã giao";

export function AssignmentTab() {
  const [items, setItems] = useState<TeacherLearningAssignment[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>("all");
  const [modal, setModal] = useState<"create" | "edit" | "grade" | null>(null);
  const [confirm, setConfirm] = useState<"publish" | "archive" | null>(null);
  const [selected, setSelected] = useState<TeacherLearningAssignment | null>(null);
  const [submission, setSubmission] = useState<TeacherLearningSubmission | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Bài tập mới");
  const [type, setType] = useState<string | null>("Bài tập về nhà");
  const [sessionId, setSessionId] = useState<string | null>("session-5");
  const [dueAt, setDueAt] = useState("2026-09-03T14:00:00.000Z");
  const [maxScore, setMaxScore] = useState<number | string>(10);
  const [attempts, setAttempts] = useState<number | string>(1);
  const [instructions, setInstructions] = useState("Đọc yêu cầu, hoàn thành trực tiếp trên hệ thống và nộp trước hạn.");
  const [rubric, setRubric] = useState("Đúng yêu cầu 6 điểm; trình bày 2 điểm; đúng hạn 2 điểm.");
  const [score, setScore] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");

  const refresh = async () => setItems(await teacherLearningApi.listAssignments(classId));
  useEffect(() => { void refresh().catch(() => setError("Không thể tải bài tập từ máy chủ.")); }, []);
  const rows = useMemo(() => items.filter((item) => (filter === "all" || !filter || item.type === filter) && JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, filter, query]);
  const openCreate = () => { setSelected(null); setTitle("Bài tập mới"); setType("Bài tập về nhà"); setSessionId("session-5"); setDueAt("2026-09-03T14:00:00.000Z"); setMaxScore(10); setAttempts(1); setInstructions("Đọc yêu cầu, hoàn thành trực tiếp trên hệ thống và nộp trước hạn."); setRubric("Đúng yêu cầu 6 điểm; trình bày 2 điểm; đúng hạn 2 điểm."); setModal("create"); };
  const openEdit = (item: TeacherLearningAssignment) => { setSelected(item); setTitle(item.title); setType(item.type); setSessionId(item.sessionId ?? "session-5"); setDueAt(item.dueAt ?? ""); setMaxScore(item.maxScore); setAttempts(item.attempts); setInstructions(item.instructions); setRubric(item.rubric ?? ""); setModal("edit"); };
  const save = async () => {
    if (!title.trim() || !type || !instructions.trim()) { setError("Cần nhập tên, loại và hướng dẫn bài tập."); return; }
    const body = { classId, programId: "ielts-foundation-a2", sessionId: sessionId ?? undefined, title: title.trim(), type, instructions: instructions.trim(), rubric: rubric.trim() || undefined, dueAt: type === "Bài tập trên lớp" ? undefined : dueAt || undefined, maxScore: Number(maxScore), attempts: Number(attempts) };
    try { if (selected) await teacherLearningApi.updateAssignment(selected.id, body); else await teacherLearningApi.createAssignment(body); await refresh(); setNotice(selected ? "Đã lưu thay đổi bài tập." : "Đã tạo bản nháp. Học viên chưa nhìn thấy bài này."); setError(""); setModal(null); } catch { setError("Không thể lưu bài tập."); }
  };
  const changeLifecycle = async () => {
    if (!selected) return;
    try { if (confirm === "publish") await teacherLearningApi.publishAssignment(selected.id); else await teacherLearningApi.archiveAssignment(selected.id); await refresh(); setNotice(confirm === "publish" ? "Đã giao bài cho lớp. Học viên có thể nộp bài." : "Đã lưu trữ bài tập và giữ lịch sử nộp bài."); setConfirm(null); setSelected(null); } catch { setError("Không thể cập nhật trạng thái bài tập."); }
  };
  const openGrade = (item: TeacherLearningAssignment) => {
    const target = item.submissions?.find((entry) => entry.lifecycle === "submitted" || entry.lifecycle === "graded");
    if (!target) { setNotice("Chưa có bài nộp để chấm."); return; }
    setSelected(item); setSubmission(target); setScore(target.score ?? ""); setFeedback(target.feedback ?? ""); setModal("grade");
  };
  const grade = async () => {
    if (!selected || !submission || score === "") return;
    try { await teacherLearningApi.gradeSubmission(selected.id, submission.id, { score: Number(score), feedback, publicationStatus: "published" }); await refresh(); setNotice("Đã công bố điểm và nhận xét cho học viên cùng phụ huynh có quyền."); setModal(null); } catch { setError("Không thể công bố kết quả chấm."); }
  };
  const columns = [
    { accessorKey: "title", header: "Bài", cell: ({ row }: any) => <button className="tableLinkButton" type="button" onClick={() => openEdit(row.original)}><Text fw={600}>{row.original.title}</Text><Text size="xs" c="dimmed">{sessions.find((entry) => entry.value === row.original.sessionId)?.label ?? "Chưa gắn buổi"}</Text></button> },
    { accessorKey: "type", header: "Loại" },
    { id: "due", header: "Hạn", cell: ({ row }: any) => dueLabel(row.original.dueAt) },
    { id: "submitted", header: "Đã nộp", cell: ({ row }: any) => (row.original.submissions ?? []).filter((entry: TeacherLearningSubmission) => entry.lifecycle !== "draft").length + "/18" },
    { id: "graded", header: "Đã chấm", cell: ({ row }: any) => { const all = (row.original.submissions ?? []).filter((entry: TeacherLearningSubmission) => entry.lifecycle !== "draft").length; const graded = (row.original.submissions ?? []).filter((entry: TeacherLearningSubmission) => entry.lifecycle === "graded").length; return graded + "/" + all; } },
    { id: "status", header: "Trạng thái", cell: ({ row }: any) => <UiStatusBadge role={row.original.lifecycle === "assigned" ? "success" : row.original.lifecycle === "archived" ? "neutral" : "warning"}>{stateLabel(row.original)}</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }: any) => { const item = row.original as TeacherLearningAssignment; const status = stateLabel(item); return <UiRowActions actions={{ view: () => openGrade(item), edit: status !== "Đã lưu trữ" ? () => openEdit(item) : undefined, publish: status === "Bản nháp" ? () => { setSelected(item); setConfirm("publish"); } : undefined, archive: status === "Đã giao" ? () => { setSelected(item); setConfirm("archive"); } : undefined }} labels={{ archive: "Lưu trữ" }} />; } },
  ];
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  return <Stack gap="md"><Group justify="space-between"><Group><UiStatusBadge role="warning">{items.flatMap((item) => item.submissions ?? []).filter((item) => item.lifecycle === "submitted").length} chờ chấm</UiStatusBadge><UiStatusBadge role="info">{items.filter((item) => item.lifecycle === "assigned").length} bài đã giao</UiStatusBadge></Group><UiButton leftSection={<Plus size={16} />} onClick={openCreate}>Tạo bài</UiButton></Group>{notice ? <UiStatusBadge role="success">{notice}</UiStatusBadge> : null}{error ? <UiStatusBadge role="danger">{error}</UiStatusBadge> : null}<Group className="toolbar"><UiTextInput aria-label="Tìm bài tập" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm bài tập..." /><UiSelect aria-label="Lọc loại bài" w={210} value={filter} onChange={setFilter} data={[{ value: "all", label: "Tất cả loại" }, "Bài tập trên lớp", "Bài tập về nhà", "Bài kiểm tra", "Bài luyện tập"]} /></Group><Paper className="panel" p="md" withBorder><UiDataTable table={table} columnCount={columns.length} minWidth={1120} emptyTitle="Chưa có bài tập." /></Paper><UiEditModal opened={modal === "create" || modal === "edit"} onClose={() => setModal(null)} title={modal === "create" ? "Tạo bài tập cho lớp" : "Chỉnh sửa bài tập"} onSave={save} saveLabel={modal === "create" ? "Lưu bản nháp" : "Lưu thay đổi"}><UiTextInput label="Tên bài" value={title} onChange={(event) => setTitle(event.currentTarget.value)} /><UiSelect label="Loại bài" value={type} onChange={setType} data={["Bài tập trên lớp", "Bài tập về nhà", "Bài kiểm tra", "Bài luyện tập"]} /><UiSelect label="Gắn với buổi học" value={sessionId} onChange={setSessionId} data={sessions} /><Textarea label="Hướng dẫn" minRows={3} value={instructions} onChange={(event) => setInstructions(event.currentTarget.value)} /><Group grow><UiTextInput label="Hạn nộp (ISO)" value={dueAt} onChange={(event) => setDueAt(event.currentTarget.value)} disabled={type === "Bài tập trên lớp"} /><NumberInput label="Điểm tối đa" value={maxScore} onChange={setMaxScore} min={1} /><NumberInput label="Số lần nộp" value={attempts} onChange={setAttempts} min={1} /></Group><Textarea label="Tiêu chí chấm" minRows={3} value={rubric} onChange={(event) => setRubric(event.currentTarget.value)} /></UiEditModal><UiEditModal opened={modal === "grade"} onClose={() => setModal(null)} title={"Chấm bài · " + (selected?.title ?? "")} onSave={grade} saveLabel="Công bố kết quả"><Text size="sm" c="dimmed">Kết quả công bố sẽ được đồng bộ vào cổng học viên và phụ huynh theo quyền.</Text><Textarea label="Bài làm" value={submission?.answer ?? ""} readOnly minRows={4} /><Group grow><NumberInput label="Điểm" min={0} max={selected?.maxScore ?? 10} value={score} onChange={setScore} /><UiTextInput label="Nhận xét" value={feedback} onChange={(event) => setFeedback(event.currentTarget.value)} /></Group></UiEditModal><UiConfirmModal opened={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "publish" ? "Giao bài cho lớp" : "Lưu trữ bài tập"} description={confirm === "publish" ? "Bài tập sẽ hiển thị cho học viên lớp và cho phép nộp bài." : "Bài tập sẽ ngừng hiển thị cho học viên; dữ liệu lịch sử vẫn được giữ."} confirmLabel={confirm === "publish" ? "Giao bài" : "Lưu trữ"} onConfirm={changeLifecycle} /></Stack>;
}
