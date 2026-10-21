"use client";

import { useCallback, useEffect, useState } from "react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { teacherLearningApi, type TeacherLearningMaterial } from "@/lib/teacher-learning-api";

const sessions = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const completed = number <= 4;
  const current = number === 5;
  const futureDates = [
    "02/09/2026",
    "03/09/2026",
    "04/09/2026",
    "05/09/2026",
    "06/09/2026",
    "07/09/2026",
    "08/09/2026",
  ];
  return {
    id: `session-${number}`,
    number,
    title: [
      "Orientation & goals",
      "Vocabulary foundation",
      "Grammar in context",
      "Listening warm-up",
      "Listening clinic",
      "Reading strategies",
      "Writing paragraph",
      "Speaking fluency",
      "Mock test 1",
      "Error correction",
      "Final practice",
      "Course review",
    ][index],
    date: completed ? `${10 + index}/08/2026` : current ? "Hôm nay" : futureDates[index - 5],
    time: "18:00-19:30",
    status: completed ? "Đã học" : current ? "Đang chuẩn bị" : "Chưa học",
    materialCount: completed || current ? (current ? "4/5" : "5/5") : "0/5",
  };
}).sort((left, right) => {
  if (left.number === 5) return -1;
  if (right.number === 5) return 1;
  return left.number - right.number;
});
type Material = {
  id: string;
  title: string;
  type: string;
  status: "Đã công bố" | "Chưa công bố";
  sourceKind: "file" | "youtube";
  source?: string;
  fileName?: string;
};
function materialFromApi(item: TeacherLearningMaterial): Material {
  const source = item.source ?? "";
  return {
    id: item.id,
    title: item.title,
    type: item.contentType,
    status: item.publicationStatus === "published" ? "Đã công bố" : "Chưa công bố",
    sourceKind: /youtube\.com|youtu\.be/i.test(source) ? "youtube" : "file",
    source,
    fileName: source.startsWith("internal://materials/") ? source.replace("internal://materials/", "") : undefined,
  };
}
function getYoutubeEmbedUrl(source?: string) {
  if (!source) return "";
  try {
    const url = new URL(source);
    const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

function isRemoteSource(source?: string) {
  return Boolean(source && /^https?:\/\//i.test(source));
}

function getOfficeViewerUrl(source?: string) {
  return isRemoteSource(source)
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(source as string)}`
    : "";
}

function getMaterialFileName(material: Material) {
  return material.fileName ?? material.source ?? "";
}

export function SessionTab() {
  const [selectedId, setSelectedId] = useState("session-5");
  const [file, setFile] = useState<File | null>(null);
  const [sourceKind, setSourceKind] = useState<"file" | "youtube">("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("Học liệu mới");
  const [type, setType] = useState("Bài giảng");
  const [items, setItems] = useState<Record<string, Material[]>>({});
  const [modal, setModal] = useState<"add" | "edit" | "preview" | null>(null);
  const [current, setCurrent] = useState<Material | null>(null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0];
  const materials = items[selected.id] ?? [];
  const refreshMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const records = await teacherLearningApi.listMaterials("if-2609");
      const next = Object.fromEntries(sessions.map((session) => [session.id, [] as Material[]]));
      records.forEach((record) => {
        const sessionId = record.sessionId && next[record.sessionId] ? record.sessionId : "session-5";
        next[sessionId].push(materialFromApi(record));
      });
      setItems(next);
      setFormError("");
    } catch {
      setFormError("Không thể tải học liệu từ hệ thống. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refreshMaterials(); }, [refreshMaterials]);
  const sessionColumns = [
    {
      accessorKey: "number",
      header: "Buổi",
      cell: ({ row }: any) => (
        <button className="tableLinkButton" type="button" onClick={() => setSelectedId(row.original.id)}>
          <Text fw={600}>Buổi {row.original.number}</Text>
          <Text size="xs" c="dimmed">
            {row.original.date}
          </Text>
        </button>
      ),
    },
    { accessorKey: "title", header: "Nội dung" },
    {
      accessorKey: "materialCount",
      header: "Học liệu",
      cell: ({ row }: any) => (
        <UiStatusBadge
          role={
            row.original.materialCount === "5/5"
              ? "success"
              : row.original.materialCount === "0/5"
                ? "neutral"
                : "warning"
          }
        >
          {row.original.materialCount}
        </UiStatusBadge>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ getValue }: any) => (
        <UiStatusBadge
          role={getValue() === "Đã học" ? "success" : getValue() === "Đang chuẩn bị" ? "warning" : "neutral"}
        >
          {getValue()}
        </UiStatusBadge>
      ),
    },
    {
      id: "action",
      header: "Thao tác",
      cell: ({ row }: any) => (
        <UiButton size="compact-xs" variant="subtle" onClick={() => setSelectedId(row.original.id)}>
          Xem học liệu
        </UiButton>
      ),
    },
  ];
  const materialColumns = [
    { accessorKey: "title", header: "Nội dung" },
    { accessorKey: "type", header: "Loại" },
    {
      accessorKey: "sourceKind",
      header: "Nguồn",
      cell: ({ getValue, row }: any) => (
        <Text size="sm">{getValue() === "youtube" ? "YouTube" : (row.original.source ?? "Tệp")}</Text>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ getValue, row }: any) => (
        <Group gap="xs">
          <UiStatusBadge role={getValue() === "Đã công bố" ? "success" : "warning"}>{getValue()}</UiStatusBadge>
          {getValue() !== "Đã công bố" ? (
            <UiButton
              size="compact-xs"
              onClick={() => {
                void teacherLearningApi.publishMaterial(row.original.id).then(() => { setNotice("Đã công bố học liệu. Học viên và phụ huynh có quyền sẽ thấy nội dung này."); return refreshMaterials(); }).catch(() => setFormError("Không thể công bố học liệu."));
              }}
            >
              Công bố
            </UiButton>
          ) : null}
        </Group>
      ),
    },
    {
      id: "action",
      header: "Thao tác",
      cell: ({ row }: any) => (
        <Group gap="xs">
          <UiButton
            size="compact-xs"
            variant="default"
            onClick={() => {
              setCurrent(row.original);
              setModal("preview");
            }}
          >
            Xem lại
          </UiButton>
          <UiButton
            size="compact-xs"
            onClick={() => {
              setCurrent(row.original);
              setTitle(row.original.title);
              setType(row.original.type);
              setSourceKind(row.original.sourceKind);
              setYoutubeUrl(row.original.sourceKind === "youtube" ? (row.original.source ?? "") : "");
              setModal("edit");
            }}
          >
            Chỉnh sửa
          </UiButton>
        </Group>
      ),
    },
  ];
  const sessionTable = useReactTable({ data: sessions, columns: sessionColumns, getCoreRowModel: getCoreRowModel() });
  const materialTable = useReactTable({
    data: materials,
    columns: materialColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  const openAdd = () => {
    setCurrent(null);
    setTitle("Học liệu mới");
    setType("Bài giảng");
    setSourceKind("file");
    setYoutubeUrl("");
    setFile(null);
    setFormError("");
    setModal("add");
  };
  const save = async () => {
    if (sourceKind === "file" && !file && modal === "add") {
      setFormError("Vui lòng chọn tệp DOCX, PPTX, video hoặc tài liệu trước khi lưu.");
      return;
    }
    if (
      sourceKind === "youtube" &&
      !/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(youtubeUrl.trim())
    ) {
      setFormError("Vui lòng nhập liên kết YouTube hợp lệ.");
      return;
    }
    const source = sourceKind === "youtube" ? youtubeUrl.trim() : file ? `internal://materials/${file.name}` : current?.source;
    try {
      if (modal === "edit" && current) {
        await teacherLearningApi.updateMaterial(current.id, { title: title.trim() || current.title, contentType: type, source, sessionId: selected.id });
      } else {
        await teacherLearningApi.createMaterial({ classId: "if-2609", programId: "ielts-foundation-a2", sessionId: selected.id, title: title.trim() || file?.name || "Học liệu mới", contentType: type, source, publicationStatus: "draft" });
      }
      await refreshMaterials();
      setNotice(modal === "edit" ? "Đã lưu thay đổi học liệu trong kho dùng chung." : "Đã thêm học liệu vào buổi học.");
      setFormError("");
      setFile(null);
      setModal(null);
    } catch {
      setFormError("Không thể lưu học liệu. Nội dung chưa được thay đổi.");
    }
  };
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {[
          ["12", "Tổng số buổi", "info"],
          ["4", "Đã học", "success"],
          ["1", "Đang chuẩn bị", "warning"],
          ["7", "Chưa học", "info"],
        ].map(([value, label, role]) => (
          <Paper key={label} className={`classInfoCard classInfoCard--${role}`} p="md">
            <Text className="classInfoLabel">{label}</Text>
            <Text className="classInfoValue" fw={700}>
              {value}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
      <Paper className="panel" p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={700}>Toàn bộ lịch buổi học của khóa</Text>
          <UiButton onClick={openAdd}>Thêm học liệu cho buổi đã chọn</UiButton>
        </Group>
        {loading ? <Text size="sm" c="dimmed" mb="sm">Đang tải học liệu dùng chung...</Text> : null}
        <UiDataTable
          table={sessionTable}
          columnCount={sessionColumns.length}
          minWidth={820}
          emptyTitle="Chưa có buổi học."
        />
      </Paper>
      <Paper className="classInfoCallout" p="lg">
        <Text fw={700}>
          Buổi {selected.number} · {selected.title}
        </Text>
        {notice ? (
          <UiStatusBadge role="success" mt="sm">
            {notice}
          </UiStatusBadge>
        ) : null}
        <Text fw={700} mt="lg" mb="sm">
          Học liệu của buổi này
        </Text>
        <UiDataTable
          table={materialTable}
          columnCount={materialColumns.length}
          minWidth={980}
          emptyTitle="Buổi này chưa có học liệu."
        />
        <Group mt="md">
          <UiButton onClick={openAdd}>Thêm học liệu</UiButton>
          <UiButton
            variant="default"
            onClick={() => {
              setCurrent(null);
              setModal("preview");
            }}
          >
            Xem trước như học viên
          </UiButton>
        </Group>
      </Paper>
      <UiModal
        opened={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal === "preview"
            ? current
              ? `Xem lại: ${current.title}`
              : "Xem trước theo quyền học viên"
            : modal === "edit"
              ? "Chỉnh sửa học liệu"
              : "Thêm học liệu cho buổi học"
        }
      >
        <Stack>
          {modal === "preview" && current ? (
            <>
              <UiStatusBadge role={current.status === "Đã công bố" ? "success" : "warning"}>
                {current.status}
              </UiStatusBadge>
              {current.sourceKind === "youtube" && getYoutubeEmbedUrl(current.source) ? (
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
                    title={current.title}
                    src={getYoutubeEmbedUrl(current.source)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </div>
              ) : current.sourceKind === "file" &&
                /\.(mp4|webm)$/i.test(getMaterialFileName(current)) &&
                current.source ? (
                <video
                  src={current.source}
                  controls
                  controlsList="nodownload"
                  style={{ width: "100%", borderRadius: 6, background: "#111" }}
                />
              ) : current.sourceKind === "file" && /\.pdf$/i.test(getMaterialFileName(current)) && current.source ? (
                <iframe
                  title={current.title}
                  src={`${current.source}#toolbar=0&navpanes=0`}
                  style={{ width: "100%", height: 620, border: 0, borderRadius: 6 }}
                />
              ) : current.sourceKind === "file" &&
                /\.(doc|docx|ppt|pptx)$/i.test(getMaterialFileName(current)) &&
                getOfficeViewerUrl(current.source) ? (
                <div style={{ position: "relative", paddingTop: "70%", overflow: "hidden", borderRadius: 6 }}>
                  <iframe
                    title={current.title}
                    src={getOfficeViewerUrl(current.source)}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </div>
              ) : (
                <Paper className="panelHighlight" p="lg">
                  <Text fw={700} ta="center">
                    Xem nội dung {current.type}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    {getMaterialFileName(current) || "Tệp đang được lưu trữ"}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" mt="xs">
                    Giáo viên có thể rà soát thông tin học liệu trước khi công bố.
                  </Text>
                </Paper>
              )}
            </>
          ) : modal === "preview" ? (
            <Paper className="panelHighlight" p="lg">
              <Text fw={700}>
                {materials.filter((item) => item.status === "Đã công bố").length} nội dung học viên được xem
              </Text>
              <Text size="sm" c="dimmed">
                Tệp và video mở trực tiếp trong hệ thống; liên kết YouTube dùng chế độ nhúng bảo vệ.
              </Text>
            </Paper>
          ) : (
            <>
              {formError ? <UiStatusBadge role="warning">{formError}</UiStatusBadge> : null}
              <UiTextInput
                label="Tên học liệu"
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
              <UiSelect
                label="Nguồn học liệu"
                value={sourceKind}
                onChange={(value) => setSourceKind((value as "file" | "youtube") || "file")}
                data={[
                  { value: "file", label: "Tệp tải lên" },
                  { value: "youtube", label: "Liên kết YouTube" },
                ]}
              />
              {sourceKind === "youtube" ? (
                <UiTextInput
                  label="URL YouTube"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.currentTarget.value)}
                />
              ) : (
                <label className="mediaFileField">
                  <span>Tệp bài giảng/tài liệu</span>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.mp3,.mp4,.webm,.png,.jpg,.jpeg"
                    onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
                  />
                  <small>
                    {file
                      ? `${file.name} · ${Math.round(file.size / 1024)} KB`
                      : "DOCX, PPTX, MP4, WEBM, PDF, MP3, PNG hoặc JPG"}
                  </small>
                </label>
              )}
              <UiSelect
                label="Loại"
                value={type}
                onChange={(value) => setType(value ?? "Bài giảng")}
                data={["Bài giảng", "Tài liệu tham khảo", "Bài tập trên lớp", "Bài tập về nhà", "Bài kiểm tra"]}
              />
              <Group justify="flex-end">
                <UiButton variant="default" onClick={() => setModal(null)}>
                  Hủy
                </UiButton>
                <UiButton onClick={save}>{modal === "edit" ? "Lưu thay đổi" : "Thêm học liệu"}</UiButton>
              </Group>
            </>
          )}
        </Stack>
      </UiModal>
    </Stack>
  );
}
