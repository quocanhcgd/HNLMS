import type { Metadata } from "next";
import { Container, SimpleGrid, Text, Title } from "@mantine/core";
import { programs } from "@/features/public-catalog/catalog-data";
import { ProgramCard } from "@/features/public-catalog/program-card";

export const metadata: Metadata = {
  title: "Chuong trinh hoc",
  description: "Xem danh sach chuong trinh IELTS, tieng Anh giao tiep va ky nang hoc thuat dang mo tai HN Learning.",
};

export default function ProgramsPage() {
  return (
    <main className="publicMain">
      <Container size="lg" className="publicContainer" py="xl">
        <Text className="sectionEyebrow">CATALOG</Text>
        <Title order={1}>Tim lo trinh phu hop voi muc tieu cua ban.</Title>
        <Text c="dimmed" mt="md" maw={680}>
          Danh sach nay la noi ban khoai ngh, so sanh chu trinh va chon buoc tiep theo truoc khi dat tu van.
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt="xl">
          {programs.map((program) => <ProgramCard key={program.slug} program={program} />)}
        </SimpleGrid>
      </Container>
    </main>
  );
}
