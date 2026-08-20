import Link from "next/link";
import { Button, Group, Paper, SimpleGrid, Text, Title } from "@mantine/core";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <main className="publicMain">
      <section className="publicHero">
        <div className="heroInner">
          <Text tt="uppercase" fw={700} c="cyan.2" size="sm">
            Ngoại ngữ · Kỹ năng · Chuyên môn
          </Text>
          <Title order={1} fz={{ base: 42, sm: 62 }} lh={1.08} mt="md">
            Học đúng lộ trình.
            <br />
            Tiến bộ có thể nhìn thấy.
          </Title>
          <Text fz="lg" mt="xl" c="gray.2" maw={620}>
            Chương trình đào tạo cá nhân hóa, đội ngũ giảng viên giàu kinh nghiệm và hệ thống theo dõi tiến độ minh bạch
            cho học viên và phụ huynh.
          </Text>
          <Group mt={32}>
            <Button component={Link} href="#consultation" size="md" rightSection={<ArrowRight size={18} />}>
              Đăng ký tư vấn
            </Button>
            <Button size="md" variant="white" color="dark">
              Xem chương trình
            </Button>
          </Group>
        </div>
      </section>
      <section id="programs" style={{ padding: "54px max(6vw,24px)" }}>
        <Text c="dimmed" size="sm" fw={700}>
          CHƯƠNG TRÌNH NỔI BẬT
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} mt="lg">
          {[
            ["IELTS", "Lộ trình 4.0 đến 7.5+"],
            ["Tiếng Anh giao tiếp", "Tự tin trong học tập và công việc"],
            ["Tiếng Anh thiếu niên", "Nền tảng vững chắc theo độ tuổi"],
          ].map(([a, b]) => (
            <Paper className="panel" p="xl" key={a}>
              <Title order={3}>{a}</Title>
              <Text c="dimmed" mt="xs">
                {b}
              </Text>
              <Button variant="subtle" px={0} mt="lg">
                Khám phá <ArrowRight size={15} />
              </Button>
            </Paper>
          ))}
        </SimpleGrid>
      </section>
    </main>
  );
}
