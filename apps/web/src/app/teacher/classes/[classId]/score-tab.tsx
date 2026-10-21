"use client";

import { useEffect, useMemo, useState } from "react";
import { Group, NumberInput, Paper, Stack, Text, Textarea } from "@mantine/core";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { UiButton, UiConfirmModal, UiDataTable, UiEditModal, UiRowActions, UiStatusBadge } from "@/components/ui";
import { teacherLearningApi, type TeacherLearningAssignment, type TeacherLearningSubmission } from "@/lib/teacher-learning-api";

type SubmissionRow = { assignment: TeacherLearningAssignment; submission: TeacherLearningSubmission; studentName: string };
const classId = "if-2609";
const studentName = (id: string) => id === "student-minh-anh" ? "Nguyễn Minh Anh" : id === "student-gia-huy" ? "Trần Gia Huy" : id;
const scoreState = (submission: TeacherLearningSubmission) => submission.gradePublicationStatus === "voided" ? "Đã hủy hiệu lực" : submission.lifecycle === "graded" && submission.gradePublicationStatus === "published" ? "Đã công bố" : submission.lifecycle === "graded" ? "Đã chấm, chưa công bố" : "Chờ chấm";
const voidedRecordStatus = { status: "Đã hủy hiệu lực" as const };

export function ScoreTab() {
  const [assignments, setAssignments] = useState<TeacherLearningAssignment[]>([]);
  const [selected, setSelected] = useState<SubmissionRow | null>(null);
  const [score, setScore] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voidTarget, setVoidTarget] = useState<SubmissionRow | null>(null);
  const refresh = async () => { setLoading(true); setError(""); try { setAssignments(await teacherLearningApi.listAssignments(classId)); } catch { setError("Không tải được danh sách bài nộp từ hệ thống."); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, []);
  const rows = useMemo<SubmissionRow[]>(() => assignments.flatMap((assignment) => (assignment.submissions ?? []).filter((submission) => submission.lifecycle === "submitted" || submission.lifecycle === "graded").map((submission) => ({ assignment, submission, studentName: studentName(submission.studentId) }))), [assignments]);
  const waiting = rows.filter((row) => row.submission.lifecycle === "submitted").length;
  const published = rows.filter((row) => row.submission.lifecycle === "graded" && row.submission.gradePublicationStatus === "published").length;
  const openGrade = (row: SubmissionRow) => { setSelected(row); setScore(row.submission.score ?? ""); setFeedback(row.submission.feedback ?? ""); setError(""); };
  const save = async () => { if (!selected || score === "" || Number(score) < 0 || Number(score) > selected.assignment.maxScore) { setError("Điểm phải nằm trong thang điểm của bài tập."); return; } setSaving(true); try { await teacherLearningApi.gradeSubmission(selected.assignment.id, selected.submission.id, { score: Number(score), feedback, publicationStatus: "published" }); await refresh(); setSelected(null); setNotice("Đã công bố điểm và nhận xét. Học viên và phụ huynh có quyền sẽ thấy kết quả."); } catch { setError("Không thể lưu kết quả chấm."); } finally { setSaving(false); } };
  const voidPublished = async () => { if (!voidTarget) return; setSaving(true); setError(""); try { await teacherLearningApi.voidGrade(voidTarget.assignment.id, voidTarget.submission.id); await refresh(); setVoidTarget(null); setNotice("Đã hủy hiệu lực điểm công bố; lịch sử và audit vẫn được giữ."); } catch { setError("Không thể hủy hiệu lực điểm đã công bố."); } finally { setSaving(false); } };
  const columns = [
    { accessorKey: "studentName", header: "Học viên", cell: ({ row }: any) => <button className="tableLinkButton" type="button" onClick={() => openGrade(row.original)}><Text fw={600}>{row.original.studentName}</Text><Text size="xs" c="dimmed">Mở bài làm để chấm</Text></button> },
    { id: "assignment", header: "Bài tập", cell: ({ row }: any) => <div><Text fw={600}>{row.original.assignment.title}</Text><Text size="xs" c="dimmed">{row.original.assignment.type} · thang {row.original.assignment.maxScore}</Text></div> },
    { id: "submittedAt", header: "Nộp lúc", cell: ({ row }: any) => row.original.submission.submittedAt ? new Date(row.original.submission.submittedAt).toLocaleString("vi-VN") : "Bản nháp" },
    { id: "score", header: "Điểm", cell: ({ row }: any) => row.original.submission.lifecycle === "graded" ? row.original.submission.score + "/" + row.original.assignment.maxScore : "Chưa chấm" },
    { id: "status", header: "Trạng thái", cell: ({ row }: any) => { const value = scoreState(row.original.submission); return <UiStatusBadge role={value === "Đã công bố" ? "success" : value === "Chờ chấm" ? "warning" : "info"}>{value}</UiStatusBadge>; } },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }: any) => { const item = row.original as SubmissionRow; const status = scoreState(item.submission); return <UiRowActions actions={{ view: () => openGrade(item), edit: status !== "Đã hủy hiệu lực" ? () => openGrade(item) : undefined, void: status === "Đã công bố" ? () => setVoidTarget(item) : undefined }} labels={{ view: "Chấm và công bố" }} />; } },
  ];
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  return <Stack gap="md"><Group justify="space-between"><Group><UiStatusBadge role="warning">{waiting} bài chờ chấm</UiStatusBadge><UiStatusBadge role="success">{published} kết quả đã công bố</UiStatusBadge></Group><UiButton variant="default" onClick={() => void refresh()} loading={loading}>Tải lại</UiButton></Group>{notice ? <UiStatusBadge role="success">{notice}</UiStatusBadge> : null}{error ? <UiStatusBadge role="danger">{error}</UiStatusBadge> : null}<Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed" mb="md">Chỉ hiển thị bài đã nộp. Điểm trên lớp và bài kiểm tra ngoài luồng bài tập sẽ được bổ sung qua cùng sổ điểm học tập khi có API nghiệp vụ tương ứng.</Text><UiDataTable table={table} columnCount={columns.length} minWidth={1080} emptyTitle={loading ? "Đang tải bài nộp..." : "Chưa có bài nộp cần chấm."} /></Paper><UiEditModal opened={selected !== null} onClose={() => setSelected(null)} title={selected ? "Chấm bài · " + selected.studentName : "Chấm bài"} onSave={() => { void save(); }} saveLabel={saving ? "Đang công bố..." : "Công bố kết quả"}><Stack gap="sm">{selected ? <><Text fw={600}>{selected.assignment.title}</Text><Text size="sm" c="dimmed">Học viên đã nộp: {selected.submission.submittedAt ? new Date(selected.submission.submittedAt).toLocaleString("vi-VN") : "Không rõ thời gian"}</Text><Textarea label="Bài làm" value={selected.submission.answer} readOnly minRows={5} /><Group grow><NumberInput label={"Điểm (tối đa " + selected.assignment.maxScore + ")"} min={0} max={selected.assignment.maxScore} value={score} onChange={setScore} disabled={saving || selected.submission.gradePublicationStatus === "voided"} /><Textarea label="Nhận xét" value={feedback} onChange={(event) => setFeedback(event.currentTarget.value)} minRows={2} disabled={saving || selected.submission.gradePublicationStatus === "voided"} /></Group><Text size="xs" c="dimmed">Lưu thao tác này sẽ công bố kết quả cho học viên và phụ huynh được ủy quyền. Điểm đã hủy hiệu lực chỉ để xem lịch sử.</Text></> : null}</Stack></UiEditModal><UiConfirmModal opened={voidTarget !== null} onClose={() => setVoidTarget(null)} title="Hủy hiệu lực điểm đã công bố" description={voidTarget ? `Điểm của ${voidTarget.studentName} sẽ không còn hiển thị cho học viên/phụ huynh; lịch sử và audit vẫn được giữ.` : ""} confirmLabel="Hủy hiệu lực" destructive onConfirm={() => { void voidPublished(); }} /></Stack>;
}
