"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Checkbox,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
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
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Phone, Search, TrendingUp, UserRoundPlus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ConfirmationSummary } from "@/components/domain";
import {
  PageToolbar,
  UiBadge,
  UiButton,
  UiEditModal,
  UiModal,
  UiSelect,
  UiStatusBadge,
  UiTextInput,
  uiStatusRoleColor,
} from "@/components/ui";
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

const statusRoles: Record<AdmissionStatus, "primary" | "success" | "warning" | "info" | "neutral"> = {
  new: "primary",
  contacted: "info",
  consulting: "info",
  awaiting_assessment: "warning",
  class_proposed: "warning",
  enrolled: "success",
  disqualified: "neutral",
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

function createConsultationDraft(): ConsultationDraft {
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
  next.setMinutes(0, 0, 0);
  const local = new Date(next.getTime() - next.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return { notes: "", outcome: "Đã xác nhận nhu cầu", nextAction: "Gửi thông tin chương trình", nextActionAt: local };
}

const initialConversion: ConversionDraft = {
  classId: "",
  studentMode: "create",
  financeAcknowledged: false,
};
type CreateLeadDraft = { fullName: string; phone: string; interest: string };

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
  const [createOpened, setCreateOpened] = useState(false);
  const [conversionOpened, setConversionOpened] = useState(false);
  const [consultation, setConsultation] = useState<ConsultationDraft>(createConsultationDraft);
  const [conversion, setConversion] = useState<ConversionDraft>(initialConversion);
  const [feedback, setFeedback] = useState("");
  const [createDraft, setCreateDraft] = useState<CreateLeadDraft>({ fullName: "", phone: "", interest: "" });

  const dueToday = leads.filter((lead) => lead.status !== "enrolled" && lead.status !== "disqualified").length;
  const overdue = leads.filter((lead) => lead.status !== "enrolled" && lead.status !== "disqualified" && new Date(lead.nextActionAt).getTime() < Date.now()).length;
  const readyToEnroll = leads.filter((lead) => lead.status === "class_proposed").length;
  const enrolled = leads.filter((lead) => lead.status === "enrolled").length;
  const conversionRate = leads.length ? Math.round((enrolled / leads.length) * 100) : 0;
  const nextDue = leads.filter((lead) => lead.status !== "enrolled" && lead.status !== "disqualified").sort((a, b) => new Date(a.nextActionAt).getTime() - new Date(b.nextActionAt).getTime())[0];

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
      setConsultation(createConsultationDraft());
      setConsultationOpened(false);
      setFeedback("Đã lưu ghi chú và lịch bước tiếp theo.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Không thể lưu tư vấn.");
    }
  }

  function createLead() {
    if (!createDraft.fullName.trim() || !createDraft.phone.trim() || !createDraft.interest.trim()) {
      setFeedback("Vui lòng nhập đủ họ tên, số điện thoại và nhu cầu.");
      return;
    }
    const now = new Date();
    const nextActionAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const newLead: ConsultantLead = {
      id: `lead-${Date.now()}`,
      fullName: createDraft.fullName.trim(),
      phone: createDraft.phone.trim(),
      email: "",
      interest: createDraft.interest.trim(),
      source: "Tư vấn trực tiếp",
      branch: "Cầu Giấy",
      owner: "Lan Anh",
      status: "new",
      nextAction: "Gọi xác nhận nhu cầu",
      nextActionAt,
      timeline: [],
    };
    setLeads((current) => [newLead, ...current]);
    setSelectedId(newLead.id);
    setCreateOpened(false);
    setCreateDraft({ fullName: "", phone: "", interest: "" });
    setFeedback("Đã tạo khách tiềm năng và đưa vào work queue.");
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
        onAction={() => setCreateOpened(true)}
      />

      <Paper withBorder p="lg" mb="md" className="admission-overview" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}><Group justify="space-between" align="flex-start" wrap="wrap" gap="xl"><Group align="flex-start" gap="md"><ThemeIcon size={48} radius="md" color="primary"><UsersRound size={25} /></ThemeIcon><div><Text size="sm" c="dimmed">Work queue tuyển sinh</Text><Text fz={32} fw={800} lh={1.1}>{leads.length} hồ sơ đang theo dõi</Text><Group gap="xs" mt={6}><Badge color="blue" variant="light">{dueToday} cần xử lý</Badge><Text size="xs" c="dimmed">Ưu tiên theo hạn bước tiếp theo</Text></Group></div></Group><div className="admission-overview-summary"><Group gap="xl"><div><Text size="xs" c="dimmed">Tỷ lệ ghi danh</Text><Text fw={750}>{conversionRate}%</Text></div><div><Text size="xs" c="dimmed">Sẵn sàng ghi danh</Text><Text fw={750} c="teal">{readyToEnroll}</Text></div><div><Text size="xs" c="dimmed">Quá hạn</Text><Text fw={750} c="red">{overdue}</Text></div></Group><Progress value={conversionRate} color="teal" size="sm" mt="md" /></div></Group></Paper>

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

      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="md">
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            Cần xử lý hôm nay
          </Text>
          <Text fw={700} fz={24}>
            {dueToday}
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            Quá hạn bước tiếp theo
          </Text>
          <Text fw={700} fz={24} c="red">
            {overdue}
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            Sẵn sàng ghi danh
          </Text>
          <Text fw={700} fz={24} c="teal">
            {readyToEnroll}
          </Text>
        </Paper>
        <Paper withBorder p="md"><Group gap="sm" wrap="nowrap"><ThemeIcon color="teal" variant="light" size={36}><TrendingUp size={18} /></ThemeIcon><div><Text size="xs" c="dimmed">Tỷ lệ ghi danh</Text><Text fw={700} fz={24} c="teal">{conversionRate}%</Text><Text size="xs" c="dimmed">{enrolled} hồ sơ đã chuyển đổi</Text></div></Group></Paper>
      </SimpleGrid>

      {nextDue ? <Paper className="panelHighlight" p="md" mb="md"><Group justify="space-between" wrap="wrap"><Group gap="sm"><ThemeIcon variant="light" color={overdue ? "red" : "blue"}><Clock3 size={17} /></ThemeIcon><div><Text size="xs" c="dimmed">Ưu tiên tiếp theo</Text><Text fw={650}>{nextDue.fullName} · {nextDue.nextAction}</Text></div></Group><Text size="sm" c={new Date(nextDue.nextActionAt).getTime() < Date.now() ? "red" : "dimmed"}>{displayDate(nextDue.nextActionAt)}</Text></Group></Paper> : null}

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
                      background:
                        lead.id === selected.id
                          ? "color-mix(in srgb, var(--hn-dark-primary) 16%, var(--app-panel))"
                          : undefined,
                    }}
                  >
                    <Group wrap="nowrap" align="flex-start">
                      <Avatar color="primary">{lead.fullName.split(" ").at(-1)?.[0]}</Avatar>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={650} size="sm">
                            {lead.fullName}
                          </Text>
                          <UiStatusBadge role={statusRoles[lead.status]}>{statusLabels[lead.status]}</UiStatusBadge>
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
                  <Avatar size={48} color="primary">
                    {selected.fullName.split(" ").at(-1)?.[0]}
                  </Avatar>
                  <div>
                    <Group gap="xs">
                      <Text fz="xl" fw={700}>
                        {selected.fullName}
                      </Text>
                      <UiStatusBadge role={statusRoles[selected.status]}>{statusLabels[selected.status]}</UiStatusBadge>
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
                <Alert
                  mt="md"
                  color={uiStatusRoleColor.warning}
                  icon={<AlertTriangle size={18} />}
                  title="Cần kiểm tra hồ sơ trùng"
                >
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
              <Paper mt="md" p="md" className="panelHighlight">
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

      <UiEditModal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title="Tạo khách tiềm năng"
        onSave={createLead}
        saveLabel="Tạo khách hàng"
      >
        <Stack>
          <TextInput label="Họ và tên" required value={createDraft.fullName} onChange={(event) => setCreateDraft({ ...createDraft, fullName: event.currentTarget.value })} placeholder="Nhập tên khách hàng" />
          <TextInput label="Số điện thoại" required value={createDraft.phone} onChange={(event) => setCreateDraft({ ...createDraft, phone: event.currentTarget.value })} placeholder="Nhập số điện thoại" />
          <TextInput label="Nhu cầu / chương trình" required value={createDraft.interest} onChange={(event) => setCreateDraft({ ...createDraft, interest: event.currentTarget.value })} placeholder="Ví dụ: Toán 9 nâng cao, IELTS 6.5..." />
          <Text size="sm" c="dimmed">Sau khi tạo, hồ sơ sẽ ở trạng thái “Mới”; tư vấn viên cần bổ sung thông tin liên hệ trong bước tiếp theo.</Text>
        </Stack>
      </UiEditModal>

      <UiModal
        opened={conversionOpened}
        onClose={() => setConversionOpened(false)}
        title={`Chuyển đổi ghi danh · ${selected.fullName}`}
        size="lg"
      >
        <Stack>
          <Alert color="primary" title="Xem trước chuyển đổi">
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
            <UiButton color={uiStatusRoleColor.success} onClick={confirmConversion}>
              Xác nhận ghi danh
            </UiButton>
          </Group>
        </Stack>
      </UiModal>
    </div>
  );
}
