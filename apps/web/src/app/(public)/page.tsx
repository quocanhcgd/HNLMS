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
  ["Cau Giay", "Tang 4, 36 Hoang Quoc Viet", "8 lop dang tuyen"],
  ["Hai Ba Trung", "Tang 2, 181 Dai Co Viet", "6 lop dang tuyen"],
  ["Online Studio", "Lich hoc linh hoat tren toan quoc", "12 lop dang tuyen"],
];

const stories = [
  ["Minh Anh", "IELTS 7.0", "Tu 5.5 len 7.0 sau 8 thang. Dieu minh quy nhat la biet ro can lam gi o moi giai doan."],
  [
    "Thanh Nam",
    "Giao tiep doanh nghiep",
    "Minh khong con ngai hop bang tieng Anh va tu tin thuyet trinh voi doi tac nuoc ngoai.",
  ],
];

const news = [
  ["08.08.2026", "Mo lop IELTS Foundation cuoi thang 8", "Cau Giay"],
  ["02.08.2026", "Workshop: Chon lo trinh IELTS phu hop", "Online"],
  ["29.07.2026", "HN Learning dat chuan doi tac phat trien", "Thong bao"],
];

export default function Landing() {
  return (
    <main className="publicMain">
      <section className="publicHero" aria-labelledby="hero-title">
        <div className="heroInner">
          <Badge className="heroBadge" variant="filled" leftSection={<Sparkles size={14} />}>
            Ngoai ngu - Ky nang - Chuyen mon
          </Badge>
          <Title id="hero-title" order={1} className="heroTitle">
            Hoc dung lo trinh.
            <br />
            Tien bo co the nhin thay.
          </Title>
          <Text fz={{ base: "md", sm: "lg" }} mt="xl" className="heroDescription">
            Chuong trinh ca nhan hoa, giao vien dong hanh va he thong theo doi minh bach cho hoc vien va phu huynh.
          </Text>
          <Group mt={32} gap="md">
            <Button component={Link} href="#consultation" size="md" rightSection={<ArrowRight size={18} />}>
              Dang ky tu van
            </Button>
            <Button component={Link} href="/programs" size="md" variant="white" color="dark">
              Xem chuong trinh
            </Button>
          </Group>
        </div>
        <div className="heroProof" aria-label="Thanh tuu cua HN Learning">
          <span>
            <strong>12+</strong> nam dong hanh
          </span>
          <span>
            <strong>8,500</strong> hoc vien tien bo
          </span>
          <span>
            <strong>94%</strong> hai long
          </span>
        </div>
      </section>

      <section className="publicSection" id="programs" aria-labelledby="programs-title">
        <div className="sectionHeading">
          <div>
            <Text className="sectionEyebrow">CHUONG TRINH</Text>
            <Title id="programs-title" order={2}>
              Bat dau tu muc tieu cua ban.
            </Title>
          </div>
          <Button component={Link} href="/programs" variant="subtle" rightSection={<ArrowRight size={16} />}>
            Xem tat ca
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
            <Text className="sectionEyebrow">LO TRINH MINH BACH</Text>
            <Title id="pathway-title" order={2}>
              Biet minh dang o dau va se di den dau.
            </Title>
            <Text c="dimmed" mt="md" maw={530}>
              Moi lo trinh bat dau bang trao doi muc tieu va danh gia dau vao. Ban nhan duoc ke hoach hoc, moc tien do
              va phan hoi deu dan.
            </Text>
            <Stack gap="md" mt="xl" className="pathwayChecklist">
              {[
                "Danh gia dau vao theo ky nang",
                "Ke hoach hoc theo muc tieu ca nhan",
                "Bao cao tien do va dieu chinh dinh ky",
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
              Tu danh gia den ket qua
            </Title>
            <div className="pathwaySteps">
              {["Kham pha muc tieu", "Xay lo trinh", "Theo doi tien bo"].map((step, index) => (
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
            <Text className="sectionEyebrow">KHONG GIAN HOC</Text>
            <Title id="branches-title" order={2}>
              Gan ban, dung nhu cau hoc.
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
            <Text fw={700}>Teaching with intent</Text>
          </div>
        </div>
        <div className="teamCopy">
          <Text className="sectionEyebrow">DOI NGU</Text>
          <Title id="team-title" order={2}>
            Giao vien day bang chuyen mon va su quan tam.
          </Title>
          <Text c="dimmed" mt="md">
            Giao vien va co van hoc tap cung nhin vao muc tieu cua ban, dua phan hoi cu the va giu nhip hoc ben vung.
          </Text>
          <Group mt="xl" gap="xl">
            <div>
              <Text className="teamStat">48</Text>
              <Text size="sm" c="dimmed">
                giao vien, co van
              </Text>
            </div>
            <div>
              <Text className="teamStat">14</Text>
              <Text size="sm" c="dimmed">
                nam kinh nghiem TB
              </Text>
            </div>
          </Group>
        </div>
      </section>

      <section className="publicSection publicSection--muted" aria-labelledby="stories-title">
        <div className="sectionHeading">
          <div>
            <Text className="sectionEyebrow">CAU CHUYEN HOC VIEN</Text>
            <Title id="stories-title" order={2}>
              Ket qua den tu mot ke hoach ro rang.
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
            <Text className="sectionEyebrow">TIN TUC VA THONG BAO</Text>
            <Title id="news-title" order={2}>
              Cap nhat tu HN Learning.
            </Title>
          </div>
          <Button variant="subtle" rightSection={<ArrowRight size={16} />}>
            Xem tat ca
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
          <Text className="sectionEyebrow">BAT DAU CUOC TRO CHUYEN</Text>
          <Title id="consultation-title" order={2}>
            Chon dung lo trinh cho muc tieu cua ban.
          </Title>
          <Text mt="md" maw={590}>
            Dat lich trao doi 20 phut voi co van. Chung toi se lang nghe muc tieu va goi y buoc bat dau phu hop.
          </Text>
        </div>
        <Button size="lg" variant="white" color="dark" component={Link} href="mailto:hello@hanoilearning.vn">
          Nhan tu van
        </Button>
      </section>
    </main>
  );
}
