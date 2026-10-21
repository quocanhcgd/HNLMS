export type StudentClassStatus = "Đang học" | "Sắp khai giảng" | "Đã hoàn thành";
export type StudentSessionStatus = "Đã học" | "Đang học" | "Sắp học";
export type StudentMaterialType = "PDF" | "DOCX" | "PPTX" | "Video" | "YouTube";

export type StudentMaterial = {
  id: string;
  title: string;
  type: StudentMaterialType;
  source: string;
  published: boolean;
};

export type StudentClass = {
  id: string;
  code: string;
  course: string;
  subject: string;
  program: string;
  teacher: string;
  schedule: string;
  room: string;
  progress: number;
  attendance: string;
  score: string;
  nextSession: string;
  status: StudentClassStatus;
};

export type StudentSession = {
  id: string;
  classId: string;
  number: number;
  date: string;
  time: string;
  title: string;
  mode: "Online" | "Tại trung tâm";
  room: string;
  status: StudentSessionStatus;
  materials: StudentMaterial[];
  assignments: string;
  score: string;
  scoreTitle?: string;
  attendance: string;
  objective: string;
};

export const studentClasses: StudentClass[] = [
  {
    id: "if-2609",
    code: "IF-2609",
    course: "IELTS Foundation",
    subject: "Tiếng Anh",
    program: "IELTS Foundation A2+",
    teacher: "Nguyễn Lan Anh",
    schedule: "T2/T4/T6 · 18:00-19:30",
    room: "Phòng IF-2609 / Zoom",
    progress: 62,
    attendance: "12/14 buổi",
    score: "8.1/10",
    nextSession: "Hôm nay · Unit 5 Listening clinic",
    status: "Đang học",
  },
  {
    id: "toeic-2609",
    code: "TOEIC-2609",
    course: "TOEIC 700+",
    subject: "Tiếng Anh",
    program: "TOEIC 700+ Reading",
    teacher: "Minh Tuấn",
    schedule: "T2/T5 · 19:45-21:15",
    room: "Phòng TOEIC-2609",
    progress: 18,
    attendance: "4/5 buổi",
    score: "560/990",
    nextSession: "Ngày mai · Mini test review",
    status: "Đang học",
  },
  {
    id: "math-2609",
    code: "MATH-2609",
    course: "Toán nâng cao",
    subject: "Toán",
    program: "Nền tảng THCS",
    teacher: "Thu Hà",
    schedule: "T3/T6 · 17:30-19:00",
    room: "Phòng MATH-2609",
    progress: 44,
    attendance: "9/10 buổi",
    score: "7.8/10",
    nextSession: "Thứ sáu · Chuyên đề đại số",
    status: "Đang học",
  },
];

const sessionTemplates: Omit<StudentSession, "id" | "classId" | "materials">[] = [
  {
    number: 1,
    date: "10/08/2026",
    time: "18:00-19:30",
    title: "Orientation & goals",
    mode: "Online",
    room: "Zoom",
    status: "Đã học",
    assignments: "Đã nộp",
    score: "8.0/10",
    attendance: "Có mặt",
    objective: "Xác định mục tiêu và cách theo dõi tiến độ.",
  },
  {
    number: 2,
    date: "12/08/2026",
    time: "18:00-19:30",
    title: "Vocabulary foundation",
    mode: "Tại trung tâm",
    room: "Phòng A203",
    status: "Đã học",
    assignments: "Đã nộp",
    score: "8.2/10",
    attendance: "Có mặt",
    objective: "Xây dựng vốn từ theo chủ đề học thuật.",
  },
  {
    number: 3,
    date: "14/08/2026",
    time: "18:00-19:30",
    title: "Grammar in context",
    mode: "Online",
    room: "Zoom",
    status: "Đã học",
    assignments: "Đã nộp",
    score: "7.8/10",
    attendance: "Có mặt",
    objective: "Vận dụng cấu trúc câu trong ngữ cảnh thực tế.",
  },
  {
    number: 4,
    date: "21/08/2026",
    time: "18:00-19:30",
    title: "Listening warm-up",
    mode: "Tại trung tâm",
    room: "Phòng A203",
    status: "Đã học",
    assignments: "Chờ chấm",
    score: "Chưa có",
    attendance: "Có mặt",
    objective: "Luyện nghe lấy ý chính và thông tin chi tiết.",
  },
  {
    number: 5,
    date: "24/08/2026",
    time: "18:00-19:30",
    title: "Listening clinic",
    mode: "Online",
    room: "Zoom",
    status: "Đang học",
    assignments: "Chưa nộp",
    score: "Chưa có",
    attendance: "Chưa điểm danh",
    objective: "Cải thiện kỹ năng ghi chú và độ chính xác khi nghe.",
  },
  {
    number: 6,
    date: "26/08/2026",
    time: "18:00-19:30",
    title: "Reading strategies",
    mode: "Tại trung tâm",
    room: "Phòng A203",
    status: "Sắp học",
    assignments: "Chưa mở",
    score: "Chưa có",
    attendance: "Chưa điểm danh",
    objective: "Áp dụng skimming và scanning khi đọc.",
  },
];

const demoMaterials: Omit<StudentMaterial, "id">[] = [
  {
    title: "Tài liệu ôn tập buổi học.docx",
    type: "DOCX",
    source: "internal://materials/reading-clinic.docx",
    published: true,
  },
  {
    title: "Slide chiến lược làm bài.pptx",
    type: "PPTX",
    source: "internal://materials/reading-strategies.pptx",
    published: true,
  },
  {
    title: "Video hướng dẫn chiến lược đọc.mp4",
    type: "Video",
    source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    published: true,
  },
  {
    title: "Video luyện tập trên YouTube",
    type: "YouTube",
    source: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    published: true,
  },
  { title: "Phiếu bài đọc.pdf", type: "PDF", source: "internal://materials/reading-sheet.pdf", published: true },
];

export function listStudentSessions(classId: string): StudentSession[] {
  const isMath = classId.startsWith("math");
  const isToeic = classId.startsWith("toeic");
  const titles = isMath
    ? [
        "Ôn tập số và phép tính",
        "Biểu thức đại số",
        "Phương trình bậc nhất",
        "Chuyên đề đại số",
        "Luyện tập tổng hợp",
        "Bài toán thực tế",
      ]
    : isToeic
      ? [
          "Diagnostic & test strategy",
          "Vocabulary for Reading",
          "Grammar completion",
          "Reading speed clinic",
          "Mini test review",
          "Error correction",
        ]
      : sessionTemplates.map((session) => session.title);
  const objectives = isMath
    ? [
        "Củng cố nền tảng và xác định mục tiêu đầu vào.",
        "Biến đổi biểu thức đúng quy tắc.",
        "Giải và kiểm tra nghiệm phương trình.",
        "Vận dụng phương pháp vào bài tập tổng hợp.",
        "Rèn tốc độ và độ chính xác khi giải bài.",
        "Đọc hiểu và mô hình hóa bài toán thực tế.",
      ]
    : sessionTemplates.map((session) => session.objective);
  return sessionTemplates.map((session, index) => ({
    ...session,
    title: titles[index],
    objective: objectives[index],
    id: `${classId}-session-${session.number}`,
    classId,
    materials:
      session.status === "Sắp học"
        ? []
        : demoMaterials
            .slice(0, index === 0 ? 5 : index === 4 ? 4 : Math.min(5, index + 4))
            .map((material, materialIndex) => ({
              ...material,
              id: `${classId}-session-${session.number}-material-${materialIndex + 1}`,
            })),
  }));
}

export function findStudentClass(classId: string) {
  return studentClasses.find((item) => item.id === classId || item.code.toLowerCase() === classId.toLowerCase());
}
