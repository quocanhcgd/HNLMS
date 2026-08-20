"use client";
import { Badge, Button, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { TriangleAlert, ArrowUpRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useUI } from "@/lib/providers";

const queue=[
 ["12 lead chưa được phân công","Tuyển sinh","Cần xử lý trước 11:00","red"],
 ["3 lớp sắp vượt sức chứa","Đào tạo","Khai giảng trong 7 ngày","yellow"],
 ["8 hóa đơn quá hạn trên 30 ngày","Tài chính","Tổng dư nợ 86,4 triệu","orange"],
 ["5 đơn nghỉ phép chờ duyệt","Nhân sự","Có 2 đơn cho ngày mai","blue"]
];
const schedule=[["08:00","IELTS Foundation A1","Phòng 301 · 18/20 học viên"],["10:30","Tư vấn tuyển sinh","4 lịch hẹn · Phòng tư vấn"],["14:00","English Placement Test","Online · 12 thí sinh"],["18:30","Giao tiếp doanh nghiệp K12","Phòng 204 · 16/18 học viên"]];
export default function Dashboard(){const {t}=useUI();const kpis=[[t("newLead"),"48","+12,5%","cyan"],[t("conversion"),"31,8%","+4,2%","teal"],[t("activeClasses"),"36","4 sắp khai giảng","blue"],[t("overdue"),"₫186,4M","8 hóa đơn","orange"]]; return <div className="page"><PageHeader title={t("dashboard")} subtitle={t("dashboardSub")} action={t("newConsultation")}/>
<div className="kpiGrid">{kpis.map(([label,value,delta,color])=><Paper className="kpi" key={label}><div className="kpiTop"><span>{label}</span><ThemeIcon variant="light" color={color} size="md"><ArrowUpRight size={15}/></ThemeIcon></div><div className="kpiValue">{value}</div><div className="delta">{delta} so với tháng trước</div></Paper>)}</div>
<div className="dashboardGrid"><Paper className="panel"><div className="panelHeader"><div><Text fw={650}>{t("workQueue")}</Text><Text className="muted">Ưu tiên theo mức độ ảnh hưởng</Text></div><Button variant="subtle" size="xs">{t("viewAll")}</Button></div>{queue.map(([title,area,note,color])=><div className="queueItem" key={title}><ThemeIcon color={color} variant="light"><TriangleAlert size={17}/></ThemeIcon><div><Text size="sm" fw={600}>{title}</Text><Text className="muted">{note}</Text></div><Badge color={color} variant="light">{area}</Badge></div>)}</Paper>
<Paper className="panel"><div className="panelHeader"><div><Text fw={650}>{t("todaySchedule")}</Text><Text className="muted">Thứ Năm, 20/08</Text></div><CalendarDays size={19}/></div>{schedule.map(([time,title,note])=><div className="queueItem" style={{gridTemplateColumns:"52px 1fr"}} key={time}><div className="scheduleTime">{time}</div><div><Text size="sm" fw={600}>{title}</Text><Text className="muted">{note}</Text></div></div>)}</Paper></div>
</div>}


