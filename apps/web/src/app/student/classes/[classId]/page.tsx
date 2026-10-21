"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowLeft, BookOpen, Eye, FileText, Presentation, Search, Video, Youtube } from "lucide-react";
import { Group, Paper, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import {
  findStudentClass,
  listStudentSessions,
  type StudentMaterial,
  type StudentSession,
  type StudentSessionStatus,
} from "../student-class-data";
import { getStudentLearningOutput } from "@/lib/student-learning-api";

const statusRole: Record<StudentSessionStatus, "success" | "info" | "neutral"> = {
  "Đã học": "success",
  "Đang học": "info",
  "Sắp học": "neutral",
};

function getYoutubeEmbedUrl(source: string) {
  try {
    const url = new URL(source);
    const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

function isRemoteSource(source: string) {
  return /^https?:\/\//i.test(source);
}

function getOfficeViewerUrl(source: string) {
  return isRemoteSource(source)
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(source)}`
    : "";
}

function materialType(contentType: string): StudentMaterial["type"] {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("youtube")) return "YouTube";
  if (normalized.includes("video")) return "Video";
  if (normalized.includes("slide") || normalized.includes("ppt")) return "PPTX";
  if (normalized.includes("doc")) return "DOCX";
  return "PDF";
}

export default function StudentClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classInfo = findStudentClass(params.classId);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const classId = classInfo?.id ?? params.classId;
  const [sessions, setSessions] = useState(() => listStudentSessions(classId));
  const [selected, setSelected] = useState<StudentSession | null>(null);
  const [viewer, setViewer] = useState<StudentMaterial | null>(null);
  const [apiState, setApiState] = useState<"loading" | "ready" | "fallback">("loading");
  useEffect(() => {
    let active = true;
    setSessions(listStudentSessions(classId));
    setApiState("loading");
    void getStudentLearningOutput("student-minh-anh", classId)
      .then((outputs) => {
        if (!active) return;
        const learning = outputs[0];
        if (!learning) { setApiState("fallback"); return; }
        setSessions((current) => current.map((session) => {
          const sessionKey = session.id.replace(classId + "-", "");
          const materials = learning.materials
            .filter((item) => !item.sessionId || item.sessionId === session.id || item.sessionId === sessionKey)
            .map((item) => ({ id: item.id, title: item.title, type: materialType(item.contentType), source: item.source ?? "internal://materials/" + item.id, published: true }));
          const attendance = learning.attendance.find((item) => item.sessionId === session.id || item.sessionId === sessionKey);
          return { ...session, ...(materials.length ? { materials } : {}), ...(attendance ? { attendance: attendance.status === "present" ? "Có mặt" : attendance.status === "late" ? "Muộn" : attendance.status === "excused" ? "Có phép" : "Vắng" } : {}) };
        }));
        setApiState("ready");
      })
      .catch(() => { if (active) setApiState("fallback"); });
    return () => { active = false; };
  }, [classId]);
  const data = useMemo(
    () =>
      sessions.filter(
        (item) =>
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) &&
          (status === "all" || !status || item.status === status),
      ),
    [query, sessions, status],
  );
  const columns = useMemo<ColumnDef<StudentSession>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Buổi",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>Buổi {row.original.number}</Text>
            <Text size="xs" c="dimmed">
              {row.original.date} · {row.original.time}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: "Nội dung buổi học",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.title}</Text>
            <Text size="xs" c="dimmed">
              {row.original.objective}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "mode",
        header: "Hình thức",
        cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            {row.original.mode === "Online" ? <Video size={15} /> : <BookOpen size={15} />}
            <Text size="sm">{row.original.mode}</Text>
          </Group>
        ),
      },
      {
        accessorKey: "materials",
        header: "Học liệu",
        cell: ({ getValue }) => <Text size="sm">{getValue<StudentMaterial[]>().length} nội dung</Text>,
      },
      { accessorKey: "assignments", header: "Bài tập" },
      { accessorKey: "attendance", header: "Điểm danh" },
      { accessorKey: "score", header: "Điểm" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<StudentSessionStatus>();
          return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiButton size="compact-xs" variant="subtle" onClick={() => setSelected(row.original)}>
            Xem buổi học
          </UiButton>
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
  if (!classInfo)
    return (
      <div className="page">
        <PageHeader
          title="Không tìm thấy lớp học"
          subtitle="Lớp học không tồn tại hoặc bạn không còn quyền truy cập."
        />
        <UiButton component={Link} href="/student/classes" leftSection={<ArrowLeft size={16} />}>
          Quay lại lớp học
        </UiButton>
      </div>
    );
  const completed = sessions.filter((item) => item.status === "Đã học").length;
  return (
    <div className="page studentWorkspace">
      <Group mb="sm">
        <UiButton component={Link} href="/student/classes" variant="subtle" leftSection={<ArrowLeft size={16} />}>
          Lớp học của tôi
        </UiButton>
      </Group>
      <PageHeader
        title={`${classInfo.code} · ${classInfo.course}`}
        subtitle={`${classInfo.subject} · ${classInfo.program} · GV ${classInfo.teacher} · ${classInfo.schedule}`}
      />
      <Group gap="xs" mb="md">
        <UiStatusBadge role="success">{classInfo.status}</UiStatusBadge>
        <UiStatusBadge role="info">{classInfo.room}</UiStatusBadge>
        <UiStatusBadge role={apiState === "ready" ? "success" : apiState === "loading" ? "info" : "warning"}>
          {apiState === "ready" ? "Học liệu đã đồng bộ" : apiState === "loading" ? "Đang đồng bộ" : "Dữ liệu mẫu"}
        </UiStatusBadge>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="md">
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            TIẾN ĐỘ KHÓA
          </Text>
          <Text fz={25} fw={700}>
            {classInfo.progress}%
          </Text>
          <Progress value={classInfo.progress} mt="xs" />
        </Paper>
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            BUỔI ĐÃ HỌC
          </Text>
          <Text fz={25} fw={700}>
            {completed}/{sessions.length}
          </Text>
          <Text size="xs" c="dimmed">
            Theo lịch công bố
          </Text>
        </Paper>
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            ĐIỂM DANH
          </Text>
          <Text fz={25} fw={700}>
            {classInfo.attendance}
          </Text>
          <Text size="xs" c="dimmed">
            Tỷ lệ tham dự của bạn
          </Text>
        </Paper>
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            ĐIỂM GẦN NHẤT
          </Text>
          <Text fz={25} fw={700}>
            {classInfo.score}
          </Text>
          <Text size="xs" c="dimmed">
            Cập nhật theo bài đã công bố
          </Text>
        </Paper>
      </SimpleGrid>
      <Paper className="panel" p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={700}>Các buổi học của lớp</Text>
            <Text size="sm" c="dimmed">
              Mỗi buổi là một mốc tiến độ gồm nội dung, học liệu, bài tập, điểm danh và điểm số.
            </Text>
          </div>
          <UiStatusBadge role="info">
            {data.length}/{sessions.length} buổi
          </UiStatusBadge>
        </Group>
        <PageToolbar className="toolbar">
          <UiTextInput
            aria-label="Tìm buổi học"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            leftSection={<Search size={16} />}
            placeholder="Tìm nội dung, ngày, học liệu..."
            style={{ minWidth: 280 }}
          />
          <UiSelect
            aria-label="Lọc trạng thái buổi học"
            w={170}
            value={status}
            onChange={setStatus}
            data={[{ value: "all", label: "Tất cả trạng thái" }, "Đã học", "Đang học", "Sắp học"]}
          />
        </PageToolbar>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1340}
          emptyTitle="Không tìm thấy buổi học phù hợp."
          getRowProps={(row) => ({ onClick: () => setSelected(row.original), style: { cursor: "pointer" } })}
        />
        <Text size="xs" c="dimmed" mt="sm">
          Học liệu, bài tập và điểm chỉ xuất hiện sau khi giáo viên công bố trong lớp này.
        </Text>
        {selected ? (
          <Paper className="classInfoCallout" p="lg" mt="md">
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={700}>
                  Buổi {selected.number} · {selected.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {selected.date} · {selected.time} · {selected.mode} · {selected.room}
                </Text>
              </div>
              <UiButton variant="subtle" onClick={() => setSelected(null)}>
                Thu gọn
              </UiButton>
            </Group>
            <Text size="sm" mb="md">
              {selected.objective}
            </Text>
            <Stack gap="xs">
              <Text fw={600}>Bài giảng và tài nguyên đính kèm</Text>
              {selected.materials.length ? (
                selected.materials
                  .filter((material) => material.published)
                  .map((material) => (
                    <Group
                      key={material.id}
                      justify="space-between"
                      py="xs"
                      style={{ borderBottom: "1px solid var(--app-border)" }}
                    >
                      <Group gap="sm">
                        {material.type === "PPTX" ? (
                          <Presentation size={16} />
                        ) : material.type === "Video" ? (
                          <Video size={16} />
                        ) : material.type === "YouTube" ? (
                          <Youtube size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                        <div>
                          <Text size="sm" fw={600}>
                            {material.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {material.type} · Nội dung đã công bố · chỉ xem trên hệ thống
                          </Text>
                        </div>
                      </Group>
                      <UiButton
                        size="compact-xs"
                        variant="default"
                        leftSection={<Eye size={14} />}
                        onClick={() => setViewer(material)}
                      >
                        Mở xem
                      </UiButton>
                    </Group>
                  ))
              ) : (
                <Text size="sm" c="dimmed">
                  Buổi học chưa có học liệu được công bố.
                </Text>
              )}
              {selected.assignments !== "Chưa mở" ? (
                <Group justify="space-between" py="xs">
                  <Group gap="sm">
                    <BookOpen size={16} />
                    <div>
                      <Text size="sm" fw={600}>
                        Bài tập của buổi học
                      </Text>
                      <Text size="xs" c="dimmed">
                        {selected.assignments} · mở trong luồng bài tập
                      </Text>
                    </div>
                  </Group>
                  <UiButton
                    component={Link}
                    href={`/student/homework?classId=${classInfo.code.toLowerCase()}&session=${selected.number}`}
                    size="compact-xs"
                    leftSection={<ArrowLeft size={14} />}
                  >
                    Mở bài tập
                  </UiButton>
                </Group>
              ) : (
                <Text size="sm" c="dimmed">
                  Bài tập chưa được giáo viên mở.
                </Text>
              )}
            </Stack>
          </Paper>
        ) : null}
      </Paper>
      <UiModal
        opened={viewer !== null}
        onClose={() => setViewer(null)}
        title={viewer?.title ?? "Nội dung buổi học"}
        size="lg"
      >
        {viewer ? (
          <Stack gap="md">
            <Group justify="space-between">
              <UiStatusBadge role="success">Đã cấp quyền xem</UiStatusBadge>
              <Text size="sm" c="dimmed">
                {viewer.type}
              </Text>
            </Group>
            {viewer.type === "Video" && isRemoteSource(viewer.source) ? (
              <video
                src={viewer.source}
                controls
                controlsList="nodownload"
                style={{ width: "100%", borderRadius: 6, background: "#111" }}
              />
            ) : viewer.type === "YouTube" && getYoutubeEmbedUrl(viewer.source) ? (
              <div
                style={{
                  position: "relative",
                  paddingTop: "56.25%",
                  overflow: "hidden",
                  borderRadius: 6,
                  background: "#111",
                }}
              >
                <iframe
                  title={viewer.title}
                  src={getYoutubeEmbedUrl(viewer.source)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                />
              </div>
            ) : viewer.type === "PDF" && isRemoteSource(viewer.source) ? (
              <iframe
                title={viewer.title}
                src={`${viewer.source}#toolbar=0&navpanes=0`}
                style={{ width: "100%", height: 620, border: 0, borderRadius: 6 }}
              />
            ) : viewer.type === "DOCX" || viewer.type === "PPTX" ? (
              getOfficeViewerUrl(viewer.source) ? (
                <div style={{ position: "relative", paddingTop: "70%", overflow: "hidden", borderRadius: 6 }}>
                  <iframe
                    title={viewer.title}
                    src={getOfficeViewerUrl(viewer.source)}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </div>
              ) : (
                <Paper className="panelHighlight" p="xl">
                  <Text ta="center" fw={600}>
                    Chưa có URL tệp để hiển thị {viewer.type}
                  </Text>
                  <Text ta="center" size="sm" c="dimmed" mt="xs">
                    Bản demo mới lưu tên tệp. Khi API trả URL stream được cấp quyền, tài liệu sẽ mở trực tiếp trong
                    trình xem.
                  </Text>
                </Paper>
              )
            ) : (
              <Paper className="panelHighlight" p="xl">
                <Text ta="center" fw={600}>
                  Bản xem trước {viewer.type} được bảo vệ
                </Text>
                <Text ta="center" size="sm" c="dimmed" mt="xs">
                  Tài liệu được hiển thị trong HN LMS theo quyền của lớp. Không cho phép tải xuống hoặc chia sẻ bản gốc
                  nhằm bảo vệ tác quyền.
                </Text>
                <Text ta="center" size="xs" c="dimmed" mt="md">
                  Nguồn: {viewer.source.replace("internal://materials/", "")}
                </Text>
              </Paper>
            )}
            <Group justify="flex-end">
              <UiButton onClick={() => setViewer(null)}>Đóng trình xem</UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
