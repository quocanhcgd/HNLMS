import Link from "next/link";
import { Badge, Group, Paper, Text, Title } from "@mantine/core";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { Program } from "./catalog-data";

export function ProgramCard({ program, priority = false }: { program: Program; priority?: boolean }) {
  return (
    <Paper className={`catalogCard catalogCard--${program.accent}`} p="xl" component="article">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Badge variant="light" color={program.accent} radius="sm">
          {program.category}
        </Badge>
        <ArrowUpRight size={20} aria-hidden="true" />
      </Group>
      <Title order={3} mt="xl" className="catalogCardTitle">
        {program.title}
      </Title>
      <Text mt="sm" c="dimmed" className="catalogCardSummary">
        {program.summary}
      </Text>
      <div className="catalogCardMeta">
        <span>
          <Clock3 size={15} aria-hidden="true" />
          {program.duration}
        </span>
        <span>
          <MapPin size={15} aria-hidden="true" />
          {program.format}
        </span>
      </div>
      <Link href={`/programs/${program.slug}`} className="catalogCardLink" aria-label={`Xem chi tiet ${program.title}`}>
        Xem lo trinh <span aria-hidden="true">-&gt;</span>
      </Link>
      {priority ? <span className="catalogCardPriority" aria-hidden="true" /> : null}
    </Paper>
  );
}
