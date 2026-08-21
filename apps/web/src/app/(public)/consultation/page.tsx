import type { Metadata } from "next";
import { Container, SimpleGrid, Text, Title } from "@mantine/core";
import { ConsultationForm } from "./consultation-form";

export const metadata: Metadata = {
  title: "Đăng ký tư vấn",
  description: "Gửi yêu cầu để Hanoi Learning tư vấn lộ trình học phù hợp.",
};

export default function ConsultationPage() {
  return (
    <main className="consultationPage" id="consultation">
      <Container size="lg" py={{ base: 48, sm: 80 }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 32, sm: 64 }} verticalSpacing="xl">
          <div>
            <Text c="cyan.4" fw={700} tt="uppercase" size="sm">
              Hanoi Learning
            </Text>
            <Title order={1} fz={{ base: 38, sm: 54 }} lh={1.08} mt="md">
              Một cuộc trò chuyện, một lộ trình rõ ràng hơn.
            </Title>
            <Text fz="lg" c="dimmed" mt="xl">
              Chia sẻ mục tiêu của bạn. Tư vấn viên sẽ đề xuất chương trình, lớp học và thời gian phù hợp, không có
              nghĩa vụ đăng ký.
            </Text>
            <Text size="sm" c="dimmed" mt="xl">
              Thông tin của bạn chỉ được dùng để phản hồi yêu cầu tư vấn này.
            </Text>
          </div>
          <ConsultationForm />
        </SimpleGrid>
      </Container>
    </main>
  );
}
