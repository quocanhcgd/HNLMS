"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Divider, Group, Paper, SegmentedControl, Stack, Text, Textarea } from "@mantine/core";
import { Building2, MessageCircle, Plus, Search, Send, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { teacherCommunicationApi } from "@/lib/teacher-communication-api";

type CommunicationMode = "teaching" | "internal";
type ConversationStatus = "Đang mở" | "Chờ phản hồi" | "Đã ghim";
type ConversationChannel = "parent" | "student" | "academic" | "support" | "finance";
type MessageSender = "teacher" | "other";

type ThreadMessage = {
  id: string;
  sender: MessageSender;
  author: string;
  body: string;
  sentAt: string;
};

type Conversation = {
  id: string;
  title: string;
  role: string;
  channel: ConversationChannel;
  context: string;
  subject: string;
  lastMessage: string;
  updatedAt: string;
  unread: number;
  status: ConversationStatus;
  messages: ThreadMessage[];
};

const teachingConversations: Conversation[] = [
  {
    id: "teaching-parent-nguyen-an",
    title: "Nguyễn An",
    role: "Phụ huynh",
    channel: "parent",
    context: "IF-2609 · Listening clinic",
    subject: "Tiến độ học tập tuần này",
    lastMessage: "Cô đã cập nhật nhận xét sau buổi học hôm nay.",
    updatedAt: "15:10",
    unread: 2,
    status: "Đang mở",
    messages: [
      {
        id: "m-1",
        sender: "other",
        author: "Phụ huynh Nguyễn An",
        body: "Cô cho gia đình xin nhận xét về phần nghe của An trong tuần này ạ.",
        sentAt: "14:52",
      },
      {
        id: "m-2",
        sender: "teacher",
        author: "Bạn",
        body: "An đã chủ động hơn trong phần nghe. Cô gửi thêm bài luyện ngắn để con làm trước buổi sau.",
        sentAt: "15:02",
      },
      {
        id: "m-3",
        sender: "teacher",
        author: "Bạn",
        body: "Cô đã cập nhật nhận xét sau buổi học hôm nay.",
        sentAt: "15:10",
      },
    ],
  },
  {
    id: "teaching-student-minh-khang",
    title: "Minh Khang",
    role: "Học viên",
    channel: "student",
    context: "TOEIC-2609 · Reading",
    subject: "Bài tập Reading Unit 5",
    lastMessage: "Em đã nộp lại bài và đánh dấu phần cần cô xem giúp.",
    updatedAt: "Hôm qua",
    unread: 1,
    status: "Chờ phản hồi",
    messages: [
      {
        id: "m-4",
        sender: "other",
        author: "Minh Khang",
        body: "Cô ơi, em chưa hiểu cách tìm keyword ở câu 8 ạ.",
        sentAt: "Hôm qua · 19:04",
      },
      {
        id: "m-5",
        sender: "teacher",
        author: "Bạn",
        body: "Em khoanh vùng danh từ chính trước, sau đó tìm từ đồng nghĩa trong đoạn văn nhé.",
        sentAt: "Hôm qua · 19:14",
      },
      {
        id: "m-6",
        sender: "other",
        author: "Minh Khang",
        body: "Em đã nộp lại bài và đánh dấu phần cần cô xem giúp.",
        sentAt: "Hôm qua · 19:32",
      },
    ],
  },
  {
    id: "teaching-parent-mai-chi",
    title: "Mai Chi",
    role: "Phụ huynh",
    channel: "parent",
    context: "IA-2610 · Speaking practice",
    subject: "Xin hỗ trợ lịch học",
    lastMessage: "Cô xác nhận có thể đổi sang buổi thứ Sáu.",
    updatedAt: "20/08",
    unread: 0,
    status: "Đã ghim",
    messages: [
      {
        id: "m-7",
        sender: "other",
        author: "Phụ huynh Mai Chi",
        body: "Gia đình muốn xin đổi buổi học tuần này vì Chi có lịch thi ở trường.",
        sentAt: "20/08 · 09:10",
      },
      {
        id: "m-8",
        sender: "teacher",
        author: "Bạn",
        body: "Cô xác nhận có thể đổi sang buổi thứ Sáu. Học vụ sẽ cập nhật lịch trên hệ thống.",
        sentAt: "20/08 · 09:24",
      },
    ],
  },
];

const internalConversations: Conversation[] = [
  {
    id: "internal-academic-if2609",
    title: "Học vụ · IF-2609",
    role: "Học vụ",
    channel: "academic",
    context: "Điều phối lớp · IF-2609",
    subject: "Bổ sung học liệu Unit 5",
    lastMessage: "Học vụ đã ghi nhận checklist trước buổi dạy.",
    updatedAt: "16:05",
    unread: 1,
    status: "Đang mở",
    messages: [
      {
        id: "m-9",
        sender: "other",
        author: "Học vụ",
        body: "Bạn có thể xác nhận học liệu Unit 5 trước 17:00 không?",
        sentAt: "15:48",
      },
      {
        id: "m-10",
        sender: "teacher",
        author: "Bạn",
        body: "Mình đã hoàn thiện phần Listening và sẽ công bố cho lớp trước giờ học.",
        sentAt: "15:56",
      },
      {
        id: "m-11",
        sender: "other",
        author: "Học vụ",
        body: "Học vụ đã ghi nhận checklist trước buổi dạy.",
        sentAt: "16:05",
      },
    ],
  },
  {
    id: "internal-support-nguyen-an",
    title: "CSKH · Nguyễn An",
    role: "CSKH",
    channel: "support",
    context: "Hỗ trợ học viên · IF-2609",
    subject: "Theo dõi yêu cầu phụ huynh",
    lastMessage: "CSKH chờ giáo viên xác nhận nội dung phản hồi.",
    updatedAt: "Hôm qua",
    unread: 0,
    status: "Chờ phản hồi",
    messages: [
      {
        id: "m-12",
        sender: "other",
        author: "CSKH",
        body: "Phụ huynh An cần một mốc tiến bộ cụ thể để theo dõi trong tháng này.",
        sentAt: "Hôm qua · 16:20",
      },
      {
        id: "m-13",
        sender: "teacher",
        author: "Bạn",
        body: "Mình đề xuất theo dõi điểm nghe và số lần phát biểu trong ba buổi tới.",
        sentAt: "Hôm qua · 16:42",
      },
      {
        id: "m-14",
        sender: "other",
        author: "CSKH",
        body: "CSKH chờ giáo viên xác nhận nội dung phản hồi.",
        sentAt: "Hôm qua · 17:00",
      },
    ],
  },
  {
    id: "internal-finance-payroll",
    title: "Tài chính · Công dạy tháng 08",
    role: "Tài chính",
    channel: "finance",
    context: "Payroll · Tháng 08/2026",
    subject: "Xác nhận giờ dạy bổ sung",
    lastMessage: "Đã nhận bảng kê 18 giờ lớp và 4 giờ trợ giảng.",
    updatedAt: "19/08",
    unread: 0,
    status: "Đã ghim",
    messages: [
      {
        id: "m-15",
        sender: "other",
        author: "Tài chính",
        body: "Bạn kiểm tra giúp hai buổi trợ giảng trong bảng kê tháng 08.",
        sentAt: "19/08 · 10:02",
      },
      {
        id: "m-16",
        sender: "teacher",
        author: "Bạn",
        body: "Mình đã đối chiếu với worklog và xác nhận đủ hai buổi.",
        sentAt: "19/08 · 10:16",
      },
      {
        id: "m-17",
        sender: "other",
        author: "Tài chính",
        body: "Đã nhận bảng kê 18 giờ lớp và 4 giờ trợ giảng.",
        sentAt: "19/08 · 10:20",
      },
    ],
  },
];

const statusRole: Record<ConversationStatus, "success" | "warning" | "info"> = {
  "Đang mở": "success",
  "Chờ phản hồi": "warning",
  "Đã ghim": "info",
};

const channelIcon: Record<ConversationChannel, typeof UserRound> = {
  parent: UserRound,
  student: UserRound,
  academic: Building2,
  support: UsersRound,
  finance: Building2,
};

export function TeacherCommunicationWorkspace({ mode }: { mode: CommunicationMode }) {
  const isInternal = mode === "internal";
  const initialConversations = isInternal ? internalConversations : teachingConversations;
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState("");
  const [notice, setNotice] = useState("");
  const [newConversationOpened, setNewConversationOpened] = useState(false);
  const [recipient, setRecipient] = useState<string | null>(isInternal ? "Học vụ" : "Nguyễn An · Phụ huynh");
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    let active = true;
    void teacherCommunicationApi
      .list(mode)
      .then((items) => {
        if (!active || !items.length) return;
        setConversations(items as Conversation[]);
        setSelectedId(items[0].id);
        setApiReady(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [mode]);

  const filterData = isInternal
    ? [
        { value: "all", label: "Tất cả" },
        { value: "academic", label: "Học vụ" },
        { value: "support", label: "CSKH" },
        { value: "finance", label: "Tài chính" },
      ]
    : [
        { value: "all", label: "Tất cả" },
        { value: "parent", label: "Phụ huynh" },
        { value: "student", label: "Học viên" },
      ];

  const recipientData = isInternal
    ? ["Học vụ", "CSKH", "Tài chính", "Quản lý học thuật"]
    : ["Nguyễn An · Phụ huynh", "Minh Khang · Học viên", "Mai Chi · Phụ huynh"];

  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (item) =>
          (filter === "all" || item.channel === filter) &&
          JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [conversations, filter, query],
  );
  const selectedConversation =
    visibleConversations.find((conversation) => conversation.id === selectedId) ?? visibleConversations[0];

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? { ...conversation, unread: 0 } : conversation)),
    );
    setNotice("");
  };

  const sendMessage = async () => {
    const body = composer.trim();
    if (!body || !selectedConversation) return;
    if (apiReady) {
      try {
        const saved = await teacherCommunicationApi.send(selectedConversation.id, body);
        setConversations((current) =>
          current.map((conversation) => (conversation.id === saved.id ? (saved as Conversation) : conversation)),
        );
        setComposer("");
        setNotice("Đã gửi tin nhắn và lưu vào cuộc trao đổi.");
        return;
      } catch {
        setNotice("Không thể lưu tin nhắn lên máy chủ; nội dung chưa được gửi.");
        return;
      }
    }
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              lastMessage: body,
              updatedAt: "Vừa xong",
              messages: [
                ...conversation.messages,
                { id: `message-${Date.now()}`, sender: "teacher", author: "Bạn", body, sentAt: "Vừa xong" },
              ],
            }
          : conversation,
      ),
    );
    setComposer("");
    setNotice("Đã gửi tin nhắn trong phạm vi cuộc trao đổi.");
  };

  const createConversation = async () => {
    const cleanSubject = subject.trim();
    const cleanMessage = firstMessage.trim();
    if (!recipient || !cleanSubject || !cleanMessage) return;
    if (apiReady) {
      try {
        const saved = await teacherCommunicationApi.create({
          mode,
          recipient,
          subject: cleanSubject,
          firstMessage: cleanMessage,
        });
        setConversations((current) => [saved as Conversation, ...current]);
        setSelectedId(saved.id);
        setSubject("");
        setFirstMessage("");
        setNewConversationOpened(false);
        setNotice("Đã tạo và lưu cuộc trao đổi.");
        return;
      } catch {
        setNotice("Không thể tạo cuộc trao đổi trên máy chủ; dữ liệu chưa được tạo.");
        return;
      }
    }
    const channel: ConversationChannel = isInternal
      ? recipient === "CSKH"
        ? "support"
        : recipient === "Tài chính"
          ? "finance"
          : "academic"
      : recipient.includes("Học viên")
        ? "student"
        : "parent";
    const newItem: Conversation = {
      id: `conversation-${Date.now()}`,
      title: recipient,
      role: isInternal ? recipient : (recipient.split(" · ")[1] ?? "Người nhận"),
      channel,
      context: isInternal ? "Trao đổi nội bộ · Chưa gắn nghiệp vụ" : "Trao đổi giảng dạy · Chưa gắn lớp",
      subject: cleanSubject,
      lastMessage: cleanMessage,
      updatedAt: "Vừa xong",
      unread: 0,
      status: "Đang mở",
      messages: [
        { id: `message-${Date.now()}`, sender: "teacher", author: "Bạn", body: cleanMessage, sentAt: "Vừa xong" },
      ],
    };
    setConversations((current) => [newItem, ...current]);
    setSelectedId(newItem.id);
    setSubject("");
    setFirstMessage("");
    setNewConversationOpened(false);
    setNotice("Đã tạo cuộc trao đổi mới.");
  };

  return (
    <div className="page teacherWorkspace">
      <PageHeader
        title={isInternal ? "Trao đổi nội bộ" : "Trao đổi giảng dạy"}
        subtitle={
          isInternal
            ? "Phối hợp với các bộ phận liên quan theo lớp, học viên và nghiệp vụ được phân công."
            : "Trao đổi với phụ huynh và học viên trong phạm vi lớp giáo viên phụ trách."
        }
      />
      <PageToolbar
        mode={mode}
        filter={filter}
        filterData={filterData}
        onFilterChange={setFilter}
        onNew={() => setNewConversationOpened(true)}
      />
      {notice ? <UiStatusBadge role="success">{notice}</UiStatusBadge> : null}
      {apiReady ? (
        <Text size="xs" c="teal" mb="sm">
          Đã đồng bộ với máy chủ.
        </Text>
      ) : (
        <Text size="xs" c="orange" mb="sm">
          Đang hiển thị dữ liệu mẫu; máy chủ trao đổi chưa phản hồi.
        </Text>
      )}
      <div className="teacherCommunicationLayout">
        <Paper className="panel teacherConversationList" p="md" withBorder>
          <Group justify="space-between" mb="sm">
            <div>
              <Text fw={700}>Cuộc trao đổi</Text>
              <Text size="xs" c="dimmed">
                {visibleConversations.length}/{conversations.length} cuộc trao đổi
              </Text>
            </div>
            <UiStatusBadge role="info">
              {conversations.reduce((total, item) => total + item.unread, 0)} mới
            </UiStatusBadge>
          </Group>
          <UiTextInput
            aria-label="Tìm cuộc trao đổi"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            leftSection={<Search size={16} />}
            placeholder={isInternal ? "Tìm bộ phận, nghiệp vụ..." : "Tìm phụ huynh, học viên..."}
          />
          <div className="teacherConversationItems" aria-label="Danh sách cuộc trao đổi">
            {visibleConversations.length ? (
              visibleConversations.map((conversation) => {
                const Icon = channelIcon[conversation.channel];
                return (
                  <button
                    className={`teacherConversationRow ${conversation.id === selectedConversation?.id ? "active" : ""}`}
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation.id)}
                  >
                    <Group align="flex-start" wrap="nowrap" gap="sm">
                      <Avatar color={isInternal ? "violet" : "cyan"} radius="sm" size={34}>
                        <Icon size={17} />
                      </Avatar>
                      <div className="teacherConversationRowBody">
                        <Group justify="space-between" gap="xs" wrap="nowrap">
                          <Text size="sm" fw={650} truncate>
                            {conversation.title}
                          </Text>
                          <Text size="xs" c="dimmed" component="span">
                            {conversation.updatedAt}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" truncate>
                          {conversation.context}
                        </Text>
                        <Text size="sm" mt={4} lineClamp={2}>
                          {conversation.lastMessage}
                        </Text>
                      </div>
                      {conversation.unread ? (
                        <span className="teacherConversationUnread" aria-label={`${conversation.unread} tin mới`}>
                          {conversation.unread}
                        </span>
                      ) : null}
                    </Group>
                  </button>
                );
              })
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Không tìm thấy cuộc trao đổi phù hợp.
              </Text>
            )}
          </div>
        </Paper>

        {selectedConversation ? (
          <Paper className="panel teacherConversationThread" p={0} withBorder>
            <div className="teacherThreadHeader">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <Avatar color={isInternal ? "violet" : "cyan"} radius="sm" size={40}>
                    <MessageCircle size={19} />
                  </Avatar>
                  <div>
                    <Text fw={700}>{selectedConversation.title}</Text>
                    <Text size="xs" c="dimmed">
                      {selectedConversation.role} · {selectedConversation.context}
                    </Text>
                  </div>
                </Group>
                <UiStatusBadge role={statusRole[selectedConversation.status]}>
                  {selectedConversation.status}
                </UiStatusBadge>
              </Group>
              <Text size="sm" c="dimmed" mt="sm">
                {selectedConversation.subject}
              </Text>
            </div>
            <Divider />
            <div className="teacherThreadMessages" aria-live="polite">
              {selectedConversation.messages.map((message) => (
                <div
                  className={`teacherMessage ${message.sender === "teacher" ? "teacherMessageSelf" : ""}`}
                  key={message.id}
                >
                  <div className="teacherMessageMeta">
                    <Text size="xs" fw={650}>
                      {message.author}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {message.sentAt}
                    </Text>
                  </div>
                  <div className="teacherMessageBubble">{message.body}</div>
                </div>
              ))}
            </div>
            <Divider />
            <div className="teacherThreadComposer">
              <Textarea
                aria-label="Tin nhắn"
                placeholder={
                  isInternal ? "Viết nội dung cần phối hợp..." : "Viết tin nhắn cho phụ huynh hoặc học viên..."
                }
                value={composer}
                onChange={(event) => setComposer(event.currentTarget.value)}
                autosize
                minRows={2}
                maxRows={5}
              />
              <Group justify="space-between" mt="sm" align="center">
                <Group gap="xs">
                  <ShieldCheck size={15} aria-hidden="true" />
                  <Text size="xs" c="dimmed">
                    Chỉ thành viên trong phạm vi này xem được trao đổi.
                  </Text>
                </Group>
                <UiButton leftSection={<Send size={16} />} onClick={sendMessage} disabled={!composer.trim()}>
                  Gửi tin nhắn
                </UiButton>
              </Group>
            </div>
          </Paper>
        ) : null}
      </div>

      <UiModal
        opened={newConversationOpened}
        onClose={() => setNewConversationOpened(false)}
        title={isInternal ? "Tạo trao đổi nội bộ" : "Tạo trao đổi giảng dạy"}
        size="lg"
      >
        <Stack>
          <UiSelect label="Người nhận" value={recipient} onChange={setRecipient} data={recipientData} searchable />
          <UiTextInput
            label="Chủ đề"
            value={subject}
            onChange={(event) => setSubject(event.currentTarget.value)}
            placeholder={isInternal ? "Ví dụ: Điều phối buổi học tuần này" : "Ví dụ: Tiến độ học tập của học viên"}
          />
          <Textarea
            label="Tin nhắn đầu tiên"
            value={firstMessage}
            onChange={(event) => setFirstMessage(event.currentTarget.value)}
            minRows={4}
            placeholder="Nhập nội dung cần trao đổi..."
          />
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setNewConversationOpened(false)}>
              Hủy
            </UiButton>
            <UiButton
              leftSection={<Plus size={16} />}
              onClick={createConversation}
              disabled={!recipient || !subject.trim() || !firstMessage.trim()}
            >
              Tạo cuộc trao đổi
            </UiButton>
          </Group>
        </Stack>
      </UiModal>
    </div>
  );
}

function PageToolbar({
  mode,
  filter,
  filterData,
  onFilterChange,
  onNew,
}: {
  mode: CommunicationMode;
  filter: string;
  filterData: { value: string; label: string }[];
  onFilterChange: (value: string) => void;
  onNew: () => void;
}) {
  return (
    <Group className="toolbar" justify="space-between" align="center" mb="md" wrap="wrap">
      <SegmentedControl value={filter} onChange={onFilterChange} data={filterData} size="sm" />
      <UiButton leftSection={mode === "internal" ? <UsersRound size={16} /> : <Plus size={16} />} onClick={onNew}>
        {mode === "internal" ? "Tạo trao đổi nội bộ" : "Tạo trao đổi"}
      </UiButton>
    </Group>
  );
}
