"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Checkbox,
  Divider,
  Grid,
  Group,
  Paper,
  Radio,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Timeline,
} from "@mantine/core";
import { AlertTriangle, CalendarClock, CheckCircle2, Phone, Search, UserRoundPlus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ConfirmationSummary } from "@/components/domain";
import { PageToolbar, UiBadge, UiButton, UiModal, UiSelect, UiTextInput } from "@/components/ui";
import {
  convertLead,
  recordConsultation,
  type AdmissionStatus,
  type ConsultantLead,
  type ConsultationDraft,
  type ConversionDraft,
} from "./consultant-state";

const statusLabels: Record<AdmissionStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  awaiting_assessment: "Chờ thi đầu vào",
  class_proposed: "Đề xuất lớp",
  enrolled: "Đã ghi danh",
  disqualified: "Không phù hợp",
};

const statusColors: Record<AdmissionStatus, string> = {
  new: "cyan",
  contacted: "indigo",
  consulting: "blue",
  awaiting_assessment: "yellow",
  class_proposed: "grape",
  enrolled: "teal",
  disqualified: "gray",
};

const seedLeads: ConsultantLead[] = [
  {
    id: "lead-minh-anh",
    fullName: "Nguyễn Minh Anh",
    phone: "0909 120 286",
    email: "minh.anh@example.vn",
    interest: "IELTS 6.5 trong 6 tháng",
    source: "Facebook",
    branch: "Cầu Giấy",
    owner: "Lan Anh",
    status: "consulting",
    nextAction: "Gửi lịch thi đầu vào",
    nextActionAt: "2026-08-22T04:30:00.000Z",
    duplicateWarning: "Trùng số điện thoại với lead #LD-0182 tại chi nhánh Hà Đông.",
    timeline: [
      {
        id: "event-1",
        kind: "consultation",
        title: "Đã gọi xác nhận nhu cầu",
        detail: "Mục tiêu IELTS 6.5, có thể học tối thứ 2-4-6.",
        occurredAt: "2026-08-22T02:20:00.000Z",
        author: "Lan Anh",
      },
      {
        id: "event-2",
        kind: "assignment",
        title: "Đã phân công tư vấn viên",
        detail: "Phân tuyến theo chương trình IELTS và chi nhánh Cầu Giấy.",
        occurredAt: "2026-08-21T09:05:00.000Z",
        author: "Hệ thống",
      },
    ],
  },
  {
    id: "lead-gia-han",
    fullName: "Phạm Gia Hân",
    phone: "0988 330 448",
    email: "gia.han@example.vn",
    interest: "Tiếng Anh thiếu niên",
    source: "Walk-in",
    branch: "Cầu Giấy",
    owner: "Lan Anh",
    status: "class_proposed",
    nextAction: "Xác nhận lớp và học phí",
    nextActionAt: "2026-08-23T03:00:00.000Z",
    assessment: "CEFR A2 · 62/100 · đề xuất Teen B1",
    timeline: [
      {
        id: "event-3",
        kind: "assessment",
        title: "Đã có kết quả đầu vào",
        detail: "CEFR A2, nghe 64, đọc 60. Đề xuất lớp Teen B1.",
        occurredAt: "2026-08-21T08:00:00.000Z",
        author: "Mai Chi",
      },
    ],
  },
  {
    id: "lead-bao-ngoc",
    fullName: "Lê Bảo Ngọc",
    phone: "0912 440 912",
    email: "bao.ngoc@example.vn",
    interest: "TOEIC 700+",
    source: "Giới thiệu",
    branch: "Hà Đông",
    owner: "Lan Anh",
    status: "new",
    nextAction: "Gọi lần đầu",
    nextActionAt: "2026-08-22T06:00:00.000Z",
    timeline: [],
  },
];

const initialConsultation: ConsultationDraft = {
  notes: "",
  outcome: "Đã xác nhận nhu cầu",
  nextAction: "Gửi thông tin chương trình",
  nextActionAt: "2026-08-24T09:00",
};

const initialConversion: ConversionDraft = {
  classId: "",
  studentMode: "create",
  financeAcknowledged: false,
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function ConsultantPortal() {
  const [leads, setLeads] = useState(seedLeads);
  const [selectedId, setSelectedId] = useState(seedLeads[0]!.id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("active");
  const [consultationOpened, setConsultationOpened] = useState(false);
  const [conversionOpened, setConversionOpened] = useState(false);
  const [consultation, setConsultation] = useState(initialConsultation);
  const [conversion, setConversion] = useState<ConversionDraft>(initialConversion);
  const [feedback, setFeedback] = useState("");

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesQuery = `${lead.fullName} ${lead.phone} ${lead.interest}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus =
          status === "active"
            ? lead.status !== "enrolled" && lead.status !== "disqualified"
            : status === "all" || lead.status === status;
        return matchesQuery && matchesStatus;
      }),
    [leads, query, status],
  );
  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0]!;
  const selectedClass = conversion.classId === "class-teen-b1" ? "Teen B1 · TB1-2608" : "IELTS Foundation · IF-2609";

  function saveConsultation() {
    try {
      const next = recordConsultation(selected, consultation, {
        id: `consultation-${Date.now()}`,
        now: new Date().toISOString(),
        author: "Lan Anh",
      });
      setLeads((current) => current.map((lead) => (lead.id === next.id ? next : lead)));
      setConsultation(initialConsultation);
      setConsultationOpened(false);
      setFeedback("Đã lưu ghi chú và lịch bước tiếp theo.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Không thể lưu tư vấn.");
    }
  }

  function confirmConversion() {
    try {
      const next = convertLead(selected, conversion, {
        id: `conversion-${Date.now()}`,
        now: new Date().toISOString(),
        author: "Lan Anh",
        className: selectedClass,
      });
      setLeads((current) => current.map((lead) => (lead.id === next.id ? next : lead)));
      setConversion(initialConversion);
      setConversionOpened(false);
      setFeedback("Đã chuyển đổi lead thành ghi danh và khởi tạo nghĩa vụ tài chính.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Không thể hoàn tất ghi danh.");
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Không gian tư vấn tuyển sinh"
        subtitle="Theo dõi khách phụ trách, lịch sử chăm sóc, bước tiếp theo và chuyển đổi ghi danh."
        action="Tạo khách tiềm năng"
      />

      {feedback ? (
        <Alert
          mb="md"
          color={feedback.startsWith("Đã") ? "teal" : "red"}
          title="Cập nhật quy trình"
          withCloseButton
          onClose={() => setFeedback("")}
        >
          {feedback}
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            Cần xử lý hôm nay
          </Text>
          <Text fw={700} fz={24}>
            3
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            Quá hạn bước tiếp theo
          </Text>
          <Text fw={700} fz={24} c="red">
            1
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            Sẵn sàng ghi danh
          </Text>
          <Text fw={700} fz={24} c="teal">
            1
          </Text>
        </Paper>
      </SimpleGrid>

      <PageToolbar className="toolbar">
        <UiTextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm khách, số điện thoại, nhu cầu..."
          style={{ minWidth: 280 }}
        />
        <UiSelect
          aria-label="Lọc work queue"
          value={status}
          onChange={setStatus}
          data={[
            { value: "active", label: "Đang cần xử lý" },
            { value: "all", label: "Tất cả" },
            { value: "awaiting_assessment", label: "Chờ thi đầu vào" },
            { value: "class_proposed", label: "Đề xuất lớp" },
            { value: "enrolled", label: "Đã ghi danh" },
          ]}
          w={210}
        />
      </PageToolbar>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder p="xs">
            <Group justify="space-between" px="sm" py="xs">
              <Text fw={700}>Work queue của tôi</Text>
              <UiBadge>{filteredLeads.length}</UiBadge>
            </Group>
            <ScrollArea h={610}>
              <Stack gap="xs">
                {filteredLeads.map((lead) => (
                  <Paper
                    component="button"
                    type="button"
                    key={lead.id}
                    withBorder
                    p="sm"
                    onClick={() => {
                      setSelectedId(lead.id);
                      setFeedback("");
                    }}
                    aria-pressed={lead.id === selected.id}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      background: lead.id === selected.id ? "var(--mantine-color-blue-light)" : undefined,
                    }}
                  >
                    <Group wrap="nowrap" align="flex-start">
                      <Avatar color="cyan">{lead.fullName.split(" ").at(-1)?.[0]}</Avatar>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={650} size="sm">
                            {lead.fullName}
                          </Text>
                          <UiBadge color={statusColors[lead.status]}>{statusLabels[lead.status]}</UiBadge>
                        </Group>
                        <Text size="xs" c="dimmed" truncate>
                          {lead.interest}
                        </Text>
                        <Text size="xs" mt={7}>
                          <CalendarClock size={12} style={{ verticalAlign: "middle" }} /> {lead.nextAction}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {displayDate(lead.nextActionAt)}
                        </Text>
                      </div>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack>
            <Paper withBorder p="lg">
              <Group justify="space-between" align="flex-start">
                <Group>
                  <Avatar size={48} color="blue">
                    {selected.fullName.split(" ").at(-1)?.[0]}
                  </Avatar>
                  <div>
                    <Group gap="xs">
                      <Text fz="xl" fw={700}>
                        {selected.fullName}
                      </Text>
                      <UiBadge color={statusColors[selected.status]}>{statusLabels[selected.status]}</UiBadge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {selected.phone} · {selected.email}
                    </Text>
                  </div>
                </Group>
                <Group>
                  <UiButton
                    variant="default"
                    leftSection={<Phone size={16} />}
                    onClick={() => setConsultationOpened(true)}
                  >
                    Ghi nhận tư vấn
                  </UiButton>
                  <UiButton
                    leftSection={<UserRoundPlus size={16} />}
                    disabled={selected.status !== "class_proposed"}
                    onClick={() => setConversionOpened(true)}
                  >
                    Chuyển đổi ghi danh
                  </UiButton>
                </Group>
              </Group>
              {selected.duplicateWarning ? (
                <Alert mt="md" color="yellow" icon={<AlertTriangle size={18} />} title="Cần kiểm tra hồ sơ trùng">
                  {selected.duplicateWarning}
                </Alert>
              ) : null}
              <Divider my="md" />
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <div>
                  <Text size="xs" c="dimmed">
                    Nhu cầu
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.interest}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Nguồn / chi nhánh
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.source} · {selected.branch}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    Tư vấn viên
                  </Text>
                  <Text size="sm" fw={600}>
                    {selected.owner}
                  </Text>
                </div>
              </SimpleGrid>
              <Paper mt="md" p="md" bg="var(--mantine-color-blue-light)">
                <Group align="flex-start" wrap="nowrap">
                  <ThemeIcon variant="light">
                    <CalendarClock size={17} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">
                      Bước tiếp theo
                    </Text>
                    <Text fw={650}>{selected.nextAction}</Text>
                    <Text size="xs">{displayDate(selected.nextActionAt)}</Text>
                  </div>
                </Group>
              </Paper>
              {selected.assessment ? (
                <Paper mt="sm" p="md" withBorder>
                  <Text size="xs" c="dimmed">
                    Kết quả đầu vào
                  </Text>
                  <Text fw={650}>{selected.assessment}</Text>
                </Paper>
              ) : null}
            </Paper>

            <Paper withBorder p="lg">
              <Text fw={700} mb="md">
                Lịch sử chăm sóc
              </Text>
              {selected.timeline.length ? (
                <Timeline bulletSize={26} lineWidth={2}>
                  {selected.timeline.map((entry) => (
                    <Timeline.Item
                      key={entry.id}
                      bullet={entry.kind === "conversion" ? <CheckCircle2 size={15} /> : <Phone size={14} />}
                      title={entry.title}
                    >
                      <Text size="sm">{entry.detail}</Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        {displayDate(entry.occurredAt)} · {entry.author}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text size="sm" c="dimmed">
                  Chưa có hoạt động chăm sóc. Hãy ghi nhận lần liên hệ đầu tiên.
                </Text>
              )}
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>

      <UiModal
        opened={consultationOpened}
        onClose={() => setConsultationOpened(false)}
        title={`Ghi nhận tư vấn · ${selected.fullName}`}
        size="lg"
      >
        <Stack>
          <Textarea
            label="Nội dung trao đổi"
            required
            minRows={4}
            value={consultation.notes}
            onChange={(event) => setConsultation({ ...consultation, notes: event.currentTarget.value })}
            placeholder="Nhu cầu, băn khoăn và thông tin đã thống nhất..."
          />
          <TextInput
            label="Kết quả liên hệ"
            value={consultation.outcome}
            onChange={(event) => setConsultation({ ...consultation, outcome: event.currentTarget.value })}
          />
          <Grid>
            <Grid.Col span={7}>
              <TextInput
                label="Bước tiếp theo"
                required
                value={consultation.nextAction}
                onChange={(event) => setConsultation({ ...consultation, nextAction: event.currentTarget.value })}
              />
            </Grid.Col>
            <Grid.Col span={5}>
              <TextInput
                type="datetime-local"
                label="Hạn xử lý"
                required
                value={consultation.nextActionAt}
                onChange={(event) => setConsultation({ ...consultation, nextActionAt: event.currentTarget.value })}
              />
            </Grid.Col>
          </Grid>
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setConsultationOpened(false)}>
              Hủy
            </UiButton>
            <UiButton onClick={saveConsultation}>Lưu hoạt động</UiButton>
          </Group>
        </Stack>
      </UiModal>

      <UiModal
        opened={conversionOpened}
        onClose={() => setConversionOpened(false)}
        title={`Chuyển đổi ghi danh · ${selected.fullName}`}
        size="lg"
      >
        <Stack>
          <Alert color="blue" title="Xem trước chuyển đổi">
            Thao tác sẽ tạo hoặc liên kết hồ sơ học viên, tạo ghi danh lớp và khởi tạo nghĩa vụ tài chính theo chính
            sách.
          </Alert>
          <UiSelect
            label="Lớp ghi danh"
            required
            value={conversion.classId}
            onChange={(value) => setConversion({ ...conversion, classId: value ?? "" })}
            data={[
              { value: "class-teen-b1", label: "Teen B1 · TB1-2608 · còn 4 chỗ" },
              { value: "class-ielts-f01", label: "IELTS Foundation · IF-2609 · còn 7 chỗ" },
            ]}
          />
          <Radio.Group
            label="Hồ sơ học viên"
            value={conversion.studentMode}
            onChange={(value) => setConversion({ ...conversion, studentMode: value as ConversionDraft["studentMode"] })}
          >
            <Group mt="xs">
              <Radio value="create" label="Tạo hồ sơ mới" />
              <Radio value="link" label="Liên kết hồ sơ có sẵn" />
            </Group>
          </Radio.Group>
          {conversion.studentMode === "link" ? (
            <TextInput
              label="Mã học viên"
              required
              value={conversion.linkedStudentId ?? ""}
              onChange={(event) => setConversion({ ...conversion, linkedStudentId: event.currentTarget.value })}
            />
          ) : null}
          <Paper withBorder p="md">
            <ConfirmationSummary
              title="Kết quả sau xác nhận"
              consequence="Hệ thống tạo hoặc liên kết học viên, ghi danh lớp và khởi tạo nghĩa vụ tài chính."
            >
              <Text size="sm">Khách hàng: {selected.fullName}</Text>
              <Text size="sm">Lớp: {conversion.classId ? selectedClass : "Chưa chọn"}</Text>
            </ConfirmationSummary>
          </Paper>
          <Checkbox
            checked={conversion.financeAcknowledged}
            onChange={(event) => setConversion({ ...conversion, financeAcknowledged: event.currentTarget.checked })}
            label="Tôi đã kiểm tra lớp, hồ sơ học viên và việc khởi tạo nghĩa vụ tài chính."
          />
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setConversionOpened(false)}>
              Hủy
            </UiButton>
            <UiButton color="teal" onClick={confirmConversion}>
              Xác nhận ghi danh
            </UiButton>
          </Group>
        </Stack>
      </UiModal>
    </div>
  );
}
