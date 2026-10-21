import { BadRequestException, Controller, Get, Headers, Param, Post } from "@nestjs/common";

type HeaderMap = Record<string, string | string[] | undefined>;
type OnlineStatus = "Sắp diễn ra" | "Đang live" | "Đã kết thúc";
type OnlineRow = {
  id: string;
  className: string;
  title: string;
  time: string;
  provider: string;
  status: OnlineStatus;
  attendance: string;
  recording: string;
};

const rows: OnlineRow[] = [
  {
    id: "online-if-2609-05",
    className: "IF-2609",
    title: "Unit 5 · Listening clinic",
    time: "Hôm nay 18:00-19:30",
    provider: "Zoom",
    status: "Sắp diễn ra",
    attendance: "0/18",
    recording: "Chưa có",
  },
  {
    id: "online-toeic-2609-04",
    className: "TOEIC-2609",
    title: "Mini test review",
    time: "Hôm qua 19:45-21:15",
    provider: "Google Meet",
    status: "Đã kết thúc",
    attendance: "14/16",
    recording: "Sẵn sàng",
  },
];

function header(headers: HeaderMap, key: string) {
  const value = headers[key];
  return Array.isArray(value) ? (value[0] ?? "") : String(value ?? "");
}

@Controller("online-sessions")
export class TeacherOnlineController {
  @Get("teacher")
  list(@Headers() headers: HeaderMap) {
    return this.scoped(headers);
  }

  @Post("teacher/:id/open")
  open(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const row = this.scoped(headers).find((item) => item.id === id);
    if (!row) throw new BadRequestException("online_session_not_found");
    if (row.status !== "Sắp diễn ra") throw new BadRequestException("online_session_cannot_open");
    row.status = "Đang live";
    return row;
  }

  @Post("teacher/:id/recording")
  recording(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const row = this.scoped(headers).find((item) => item.id === id);
    if (!row) throw new BadRequestException("online_session_not_found");
    if (row.status !== "Đã kết thúc" || row.recording === "Chưa có")
      throw new BadRequestException("online_recording_not_ready");
    return { id: row.id, title: row.title, status: row.recording };
  }

  private scoped(headers: HeaderMap) {
    const organizationId = header(headers, "x-organization-id") || "org-1";
    return organizationId === "org-1" ? rows : [];
  }
}
