import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Button, Container, Group, SimpleGrid, Text, ThemeIcon, Title } from "@mantine/core";
import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { getProgram, programs } from "@/features/public-catalog/catalog-data";
import { ProgramCard } from "@/features/public-catalog/program-card";

type ProgramDetailParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: ProgramDetailParams }): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) return { title: "Chuong trinh khong tim thay" };
  return { title: program.title, description: program.summary };
}

export default async function ProgramDetailPage({ params }: { params: ProgramDetailParams }) {
  const { slug } = await params;
  const program = getProgram(slug);
  if (!program) notFound();
  const siblings = programs.filter((item) => item.slug !== program.slug).slice(0, 2);

  return (
    <main className="publicMain">
      <Container size="lg" className="publicContainer publicProgramDetail" py="xl">
        <Button component={Link} href="/programs" variant="subtle" leftSection={<ArrowLeft size={16} />}>
          Quay lai danh sach
        </Button>
        <div className="programHero" aria-labelledby="program-title">
          <div>
            <Group gap="sm"><Sparkles size={18} aria-hidden="true" /><Text fw={700}>{program.category}</Text></Group>
            <Title id="program-title" order={1} mt="md">{program.title}</Title>
            <Text fz="lg" c="dimmed" mt="md" maw={600}>{program.summary}</Text>
            <Group mt="xl" gap="md">
              <Group gap="xs"><Clock3 size={18} aria-hidden="true" /><Text fw={600}>{program.duration}</Text></Group>
              <Group gap="xs"><MapPin size={18} aria-hidden="true" /><Text fw={600}>{program.format}</Text></Group>
            </Group>
            <Button mt="xl" component={Link} href="#consultation" rightSection={<ArrowRight size={18} />}>
              Dang ky tu van
            </Button>
          </div>
          <div className="programQuickFacts">
            <Text fw={600}>Thong tin moi truong hoc</Text>
            <Group gap="sm" mt="md">
              <Badge variant="outline" color="cyan">{program.level}</Badge>
              <Badge variant="outline" color="cyan">{program.format}</Badge>
              <Badge variant="outline" color="cyan">{program.duration}</Badge>
            </Group>
            <div className="programStepList">
              {["Danh gia dau vao", "Nhan ke hoach hoc", "Bat dau hoc theo lich phu hop"].map((step) => (
                <Group key={step} gap="sm"><ThemeIcon variant="light" color="cyan" radius="xl"><Check size={16} /></ThemeIcon><Text fw={600}>{step}</Text></Group>
              ))}
            </div>
          </div>
        </div>
        <Title order={2} mt="xl">Cac chuong trinh lien quan</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="lg">
          {siblings.map((item) => <ProgramCard key={item.slug} program={item} />)}
        </SimpleGrid>
      </Container>
    </main>
  );
}
