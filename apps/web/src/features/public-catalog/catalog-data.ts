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
    category: "Chung chi quoc te",
    title: "IELTS Foundation",
    summary: "Xay nen tieng Anh hoc thuat va chien luoc lam bai tu muc 4.0.",
    duration: "24 tuan",
    format: "Truc tiep va online",
    level: "Dau vao A2+",
    accent: "cyan",
  },
  {
    slug: "ielts-advanced",
    category: "Chung chi quoc te",
    title: "IELTS Advanced",
    summary: "Lo trinh muc tieu 6.5-7.5+, ket hop luyen de va phan hoi 1:1.",
    duration: "20 tuan",
    format: "Lop toi va cuoi tuan",
    level: "Dau vao B1+",
    accent: "teal",
  },
  {
    slug: "english-communication",
    category: "Nguon nang luc",
    title: "Tieng Anh giao tiep",
    summary: "Luyen phan xa va giao tiep tu tin trong cong viec hang ngay.",
    duration: "16 tuan",
    format: "Truc tiep",
    level: "Moi trinh do",
    accent: "orange",
  },
  {
    slug: "teen-english",
    category: "Thieu nien",
    title: "Tieng Anh thieu nien",
    summary: "Nen tang ngon ngu vung chac theo do tuoi va muc tieu hoc tap.",
    duration: "36 buoi",
    format: "Sau gio hoc",
    level: "11-15 tuoi",
    accent: "cyan",
  },
  {
    slug: "business-english",
    category: "Nguon nang luc",
    title: "Tieng Anh doanh nghiep",
    summary: "Thuyet trinh, hop va viet email trong boi canh cong viec thuc te.",
    duration: "12 tuan",
    format: "Theo nhom doanh nghiep",
    level: "Dau vao B1",
    accent: "teal",
  },
  {
    slug: "academic-skills",
    category: "Ky nang hoc thuat",
    title: "Ky nang hoc thuat",
    summary: "Doc, viet va trinh bay y tuong cho hanh trinh hoc tap dai han.",
    duration: "14 tuan",
    format: "Hybrid",
    level: "Dau vao B1",
    accent: "orange",
  },
];

export const featuredPrograms = programs.slice(0, 3);

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
