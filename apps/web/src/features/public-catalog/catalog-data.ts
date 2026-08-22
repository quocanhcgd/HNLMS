export type Program = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  duration: string;
  format: string;
  level: string;
  accent: "cyan" | "teal" | "orange";
};

export const programs: Program[] = [
  {
    slug: "ielts-foundation",
    category: "Chứng chỉ quốc tế",
    title: "IELTS Foundation",
    summary: "Xây nền tiếng Anh học thuật và chiến lược làm bài từ mức 4.0.",
    duration: "24 tuần",
    format: "Trực tiếp và trực tuyến",
    level: "Đầu vào A2+",
    accent: "cyan",
  },
  {
    slug: "ielts-advanced",
    category: "Chứng chỉ quốc tế",
    title: "IELTS Advanced",
    summary: "Lộ trình mục tiêu 6.5-7.5+, kết hợp luyện đề và phản hồi 1:1.",
    duration: "20 tuần",
    format: "Lớp tối và cuối tuần",
    level: "Đầu vào B1+",
    accent: "teal",
  },
  {
    slug: "english-communication",
    category: "Nguồn năng lực",
    title: "Tiếng Anh giao tiếp",
    summary: "Luyện phản xạ và giao tiếp tự tin trong công việc hằng ngày.",
    duration: "16 tuần",
    format: "Truc tiep",
    level: "Mọi trình độ",
    accent: "orange",
  },
  {
    slug: "teen-english",
    category: "Thiếu niên",
    title: "Tiếng Anh thiếu niên",
    summary: "Nền tảng ngôn ngữ vững chắc theo độ tuổi và mục tiêu học tập.",
    duration: "36 buổi",
    format: "Sau giờ học",
    level: "11-15 tuoi",
    accent: "cyan",
  },
  {
    slug: "business-english",
    category: "Nguồn năng lực",
    title: "Tiếng Anh doanh nghiệp",
    summary: "Thuyết trình, họp và viết email trong bối cảnh công việc thực tế.",
    duration: "12 tuần",
    format: "Theo nhóm doanh nghiệp",
    level: "Đầu vào B1",
    accent: "teal",
  },
  {
    slug: "academic-skills",
    category: "Kỹ năng học thuật",
    title: "Kỹ năng học thuật",
    summary: "Đọc, viết và trình bày ý tưởng cho hành trình học tập dài hạn.",
    duration: "14 tuần",
    format: "Hybrid",
    level: "Đầu vào B1",
    accent: "orange",
  },
];

export const featuredPrograms = programs.slice(0, 3);

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
