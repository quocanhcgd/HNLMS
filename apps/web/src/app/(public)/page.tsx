import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Badge, Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { ArrowRight, Check, GraduationCap, MapPin, Quote, Sparkles } from "lucide-react";
import { featuredPrograms } from "@/features/public-catalog/catalog-data";
import { ProgramCard } from "@/features/public-catalog/program-card";

export const metadata: Metadata = {
  title: { absolute: "Trang chủ | HN Learning" },
  description:
    "HN Learning - Nền tảng học tập đa chi nhánh với chương trình IELTS, Tiếng Anh giao tiếp, Tiếng Anh thiếu niên và kỹ năng học thuật. Giáo viên đồng hành, lộ trình minh bạch.",
  openGraph: {
    title: "HN Learning - Học đúng lộ trình, tiến bộ có thể nhìn thấy",
    description:
      "Chương trình cá nhân hóa, giáo viên đồng hành và hệ thống theo dõi minh bạch cho học viên và phụ huynh.",
    url: "/",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "HN Learning" }],
  },
  alternates: {
    canonical: "/",
  },
};

const branches = [
  ["Cầu Giấy", "Tầng 4, 36 Hoàng Quốc Việt", "8 lớp đang tuyển"],
  ["Hai Bà Trưng", "Tầng 2, 181 Đại Cồ Việt", "6 lớp đang tuyển"],
  ["Online Studio", "Lịch học linh hoạt trên toàn quốc", "12 lớp đang tuyển"],
];

const stories = [
  ["Minh Anh", "IELTS 7.0", "Từ 5.5 lên 7.0 sau 8 tháng. Điều mình quý nhất là biết rõ cần làm gì ở mỗi giai đoạn."],
  [
    "Thanh Nam",
    "Giao tiếp doanh nghiệp",
    "Mình không còn ngại họp bằng tiếng Anh và tự tin thuyết trình với đối tác nước ngoài.",
  ],
];

const news = [
  ["08.08.2026", "Mở lớp IELTS Foundation cuối tháng 8", "Cầu Giấy"],
  ["02.08.2026", "Workshop: Chọn lộ trình IELTS phù hợp", "Online"],
  ["29.07.2026", "HN Learning đạt chuẩn đối tác phát triển", "Thông báo"],
];

export default function Landing() {
  return (
    <main className="publicMain">
      <section className="publicHero" aria-labelledby="hero-title">
        <div className="heroInner">
          <Badge className="heroBadge" variant="filled" leftSection={<Sparkles size={14} />}>
            Ngoại ngữ - Kỹ năng - Chuyên môn
          </Badge>
          <Title id="hero-title" order={1} className="heroTitle">
            Học đúng lộ trình.
            <br />
            Tiến bộ có thể nhìn thấy.
          </Title>
          <Text fz={{ base: "md", sm: "lg" }} mt="xl" className="heroDescription">
            Chương trình cá nhân hóa, giáo viên đồng hành và hệ thống theo dõi minh bạch cho học viên và phụ huynh.
          </Text>
          <Group mt={32} gap="md">
            <Button component={Link} href="#consultation" size="md" rightSection={<ArrowRight size={18} />}>
              Đăng ký tư vấn
            </Button>
            <Button component={Link} href="/programs" size="md" variant="white" color="dark">
              Xem chương trình
            </Button>
          </Group>
        </div>
        <div className="heroProof" aria-label="Thành tựu của HN Learning">
          <span>
            <strong>12+</strong> năm đồng hành
          </span>
          <span>
            <strong>8,500</strong> học viên tiến bộ
          </span>
          <span>
            <strong>94%</strong> hài lòng
          </span>
        </div>
      </section>

      <section className="publicSection" id="programs" aria-labelledby="programs-title">
        <div className="sectionHeading">
          <div>
            <Text className="sectionEyebrow">CHƯƠNG TRÌNH</Text>
            <Title id="programs-title" order={2}>
              Bắt đầu từ mục tiêu của bạn.
            </Title>
          </div>
          <Button component={Link} href="/programs" variant="subtle" rightSection={<ArrowRight size={16} />}>
            Xem tất cả
          </Button>
        </div>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {featuredPrograms.map((program, index) => (
            <ProgramCard key={program.slug} program={program} priority={index === 0} />
          ))}
        </SimpleGrid>
      </section>

      <section className="publicSection publicSection--muted" aria-labelledby="pathway-title">
        <div className="pathwayLayout">
          <div>
            <Text className="sectionEyebrow">LỘ TRÌNH MINH BẠCH</Text>
            <Title id="pathway-title" order={2}>
              Biết mình đang ở đâu và sẽ đi đến đâu.
            </Title>
            <Text c="dimmed" mt="md" maw={530}>
              Mỗi lộ trình bắt đầu bằng trao đổi mục tiêu và đánh giá đầu vào. Bạn nhận được kế hoạch học, mốc tiến độ
              và phản hồi đều đặn.
            </Text>
            <Stack gap="md" mt="xl" className="pathwayChecklist">
              {[
                "Đánh giá đầu vào theo kỹ năng",
                "Kế hoạch học theo mục tiêu cá nhân",
                "Báo cáo tiến độ và điều chỉnh định kỳ",
              ].map((item) => (
                <Group key={item} gap="sm">
                  <ThemeIcon variant="light" color="cyan" radius="xl">
                    <Check size={16} />
                  </ThemeIcon>
                  <Text fw={600}>{item}</Text>
                </Group>
              ))}
            </Stack>
          </div>
          <Paper className="pathwayCard" p="xl">
            <Text className="pathwayNumber">01 - 03</Text>
            <Title order={3} mt="xs">
              Từ đánh giá đến kết quả
            </Title>
            <div className="pathwaySteps">
              {["Khám phá mục tiêu", "Xây lộ trình", "Theo dõi tiến bộ"].map((step, index) => (
                <div key={step}>
                  <span>0{index + 1}</span>
                  <Text fw={600}>{step}</Text>
                </div>
              ))}
            </div>
          </Paper>
        </div>
      </section>

      <section className="publicSection" id="branches" aria-labelledby="branches-title">
        <div className="sectionHeading">
          <div>
            <Text className="sectionEyebrow">KHÔNG GIAN HỌC</Text>
            <Title id="branches-title" order={2}>
              Gần bạn, đúng nhu cầu học.
            </Title>
          </div>
        </div>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {branches.map(([name, address, availability]) => (
            <Paper className="branchCard" p="xl" key={name} component="article">
              <ThemeIcon variant="light" color="cyan" size="lg">
                <MapPin size={20} />
              </ThemeIcon>
              <Title order={3} mt="xl">
                {name}
              </Title>
              <Text c="dimmed" mt="xs">
                {address}
              </Text>
              <Badge variant="outline" color="cyan" mt="xl">
                {availability}
              </Badge>
            </Paper>
          ))}
        </SimpleGrid>
      </section>

      <section className="publicSection publicSection--split" id="team" aria-labelledby="team-title">
        <div className="teamVisual">
          <div className="teamVisualFrame">
            <GraduationCap size={52} />
            <Text fw={700}>Dạy học bằng chuyên môn và sự tận tâm</Text>
          </div>
        </div>
        <div className="teamCopy">
          <Text className="sectionEyebrow">ĐỘI NGŨ</Text>
          <Title id="team-title" order={2}>
            Giáo viên dạy bằng chuyên môn và sự quan tâm.
          </Title>
          <Text c="dimmed" mt="md">
            Giáo viên và cố vấn học tập cùng nhìn vào mục tiêu của bạn, đưa phản hồi cụ thể và giữ nhịp học bền vững.
          </Text>
          <Group mt="xl" gap="xl">
            <div>
              <Text className="teamStat">48</Text>
              <Text size="sm" c="dimmed">
                giáo viên, cố vấn
              </Text>
            </div>
            <div>
              <Text className="teamStat">14</Text>
              <Text size="sm" c="dimmed">
                năm kinh nghiệm trung bình
              </Text>
            </div>
          </Group>
        </div>
      </section>

      <section className="publicSection publicSection--muted" aria-labelledby="stories-title">
        <div className="sectionHeading">
          <div>
            <Text className="sectionEyebrow">CÂU CHUYỆN HỌC VIÊN</Text>
            <Title id="stories-title" order={2}>
              Kết quả đến từ một kế hoạch rõ ràng.
            </Title>
          </div>
        </div>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {stories.map(([name, result, quote]) => (
            <Paper className="storyCard" p="xl" key={name} component="article">
              <Quote size={30} className="storyQuote" />
              <Text className="storyText">{quote}</Text>
              <Group mt="xl">
                <Avatar color="cyan" radius="xl">
                  {name.slice(0, 1)}
                </Avatar>
                <div>
                  <Text fw={700}>{name}</Text>
                  <Text size="sm" c="dimmed">
                    {result}
                  </Text>
                </div>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      </section>

      <section className="publicSection" id="news" aria-labelledby="news-title">
        <div className="sectionHeading">
          <div>
            <Text className="sectionEyebrow">TIN TỨC VÀ THÔNG BÁO</Text>
            <Title id="news-title" order={2}>
              Cập nhật từ HN Learning.
            </Title>
          </div>
          <Button variant="subtle" rightSection={<ArrowRight size={16} />}>
            Xem tất cả
          </Button>
        </div>
        <div className="newsList">
          {news.map(([date, headline, category]) => (
            <article className="newsItem" key={headline}>
              <Text className="newsDate">{date}</Text>
              <Title order={3}>{headline}</Title>
              <Badge variant="light" color="gray">
                {category}
              </Badge>
              <ArrowRight size={20} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="consultationBand" id="consultation" aria-labelledby="consultation-title">
        <div>
          <Text className="sectionEyebrow">BẮT ĐẦU CUỘC TRÒ CHUYỆN</Text>
          <Title id="consultation-title" order={2}>
            Chọn đúng lộ trình cho mục tiêu của bạn.
          </Title>
          <Text mt="md" maw={590}>
            Đặt lịch trao đổi 20 phút với cố vấn. Chúng tôi sẽ lắng nghe mục tiêu và gợi ý bước bắt đầu phù hợp.
          </Text>
        </div>
        <Button size="lg" variant="white" color="dark" component={Link} href="mailto:hello@hanoilearning.vn">
          Nhận tư vấn
        </Button>
      </section>
    </main>
  );
}
