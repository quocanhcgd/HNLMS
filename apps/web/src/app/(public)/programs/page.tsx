import type { Metadata } from "next";
import { Button, Center, Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { programs } from "@/features/public-catalog/catalog-data";
import { ProgramCard } from "@/features/public-catalog/program-card";

export const metadata: Metadata = {
  title: "Chương trình học",
  description:
    "Danh sách chương trình IELTS, Tiếng Anh giao tiếp, Tiếng Anh thiếu niên và kỹ năng học thuật đang mở tại HN Learning.",
  openGraph: {
    title: "Chương trình học | HN Learning",
    description:
      "Khám phá các chương trình IELTS, Tiếng Anh giao tiếp và kỹ năng học thuật tại HN Learning.",
    url: "/programs",
  },
  alternates: {
    canonical: "/programs",
  },
};

function EmptyState() {
  return (
    <Center py={80} px="md">
      <Stack align="center" maw={420} ta="center">
        <Inbox size={48} aria-hidden="true" />
        <Title order={3}>Chưa có chương trình nào</Title>
        <Text c="dimmed">
          Hiện tại chưa có chương trình học nào được công bố. Vui lòng quay lại sau hoặc liên hệ tư vấn.
        </Text>
        <Button component={Link} href="/consultation" variant="light" mt="md">
          Đăng ký tư vấn
        </Button>
      </Stack>
    </Center>
  );
}

export default function ProgramsPage() {
  return (
    <main className="publicMain">
      <Container size="lg" className="publicContainer" py="xl">
        <Text className="sectionEyebrow">CATALOG</Text>
        <Title order={1}>Tim lo trinh phu hop voi muc tieu cua ban.</Title>
        <Text c="dimmed" mt="md" maw={680}>
          Danh sach nay la noi ban khoai ngh, so sanh chu trinh va chon buoc tiep theo truoc khi dat tu van.
        </Text>
        {programs.length === 0 ? (
          <EmptyState />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt="xl">
            {programs.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </main>
  );
}
