"use client";
import { UiBadge, UiButton, UiTable } from "@/components/ui";
import { Group, Paper, Progress, Table, Text, Title } from "@mantine/core";
import { Activity, Database, Server, ShieldCheck } from "lucide-react";
type KpiIcon = typeof Server;
type Kpi = readonly [string, string, KpiIcon, string];

const tenants = [
  ["Hanoi Learning", "SaaS", "Healthy", "Pro", "68%"],
  ["Bright English", "Dedicated", "Healthy", "Enterprise", "42%"],
  ["EduSkill Center", "SaaS", "Maintenance", "Basic", "84%"],
  ["Future Academy", "SaaS", "License grace", "Pro", "91%"],
];
export default function Platform() {
  return (
    <main style={{ minHeight: "100vh", background: "light-dark(#f5f7f8,#080d12)" }}>
      <div className="page">
        <div className="pageHeader">
          <div>
            <div className="eyebrow">Platform / Tenants</div>
            <Title order={2}>Tenant operations</Title>
            <Text c="dimmed" size="sm">
              License, database và deployment status trên toàn hệ thống
            </Text>
          </div>
          <UiButton>Provision tenant</UiButton>
        </div>
        <div className="kpiGrid">
          {(
            [
              ["Active tenants", "24", Server, "cyan"],
              ["Databases healthy", "23/24", Database, "teal"],
              ["License alerts", "3", ShieldCheck, "yellow"],
              ["Open incidents", "1", Activity, "red"],
            ] as Kpi[]
          ).map(([l, v, I, c]) => (
            <Paper className="kpi" key={l}>
              <div className="kpiTop">
                <span>{l}</span>
                <I size={18} color={`var(--mantine-color-${c}-5)`} />
              </div>
              <div className="kpiValue">{v}</div>
              <Text size="xs" c="dimmed">
                Updated 2 minutes ago
              </Text>
            </Paper>
          ))}
        </div>
        <div className="tableWrap">
          <UiTable verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tenant</Table.Th>
                <Table.Th>Deployment</Table.Th>
                <Table.Th>Runtime</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Quota usage</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tenants.map((r) => (
                <Table.Tr key={r[0]}>
                  <Table.Td>
                    <Text fw={600} size="sm">
                      {r[0]}
                    </Text>
                    <Text size="xs" c="dimmed">
                      tenant-{r[0].toLowerCase().replaceAll(" ", "-")}
                    </Text>
                  </Table.Td>
                  <Table.Td>{r[1]}</Table.Td>
                  <Table.Td>
                    <UiBadge
                      color={r[2] === "Healthy" ? "teal" : r[2] === "Maintenance" ? "yellow" : "orange"}
                      variant="light"
                    >
                      {r[2]}
                    </UiBadge>
                  </Table.Td>
                  <Table.Td>{r[3]}</Table.Td>
                  <Table.Td>
                    <Group wrap="nowrap">
                      <Progress value={parseInt(r[4])} w={110} />
                      <Text size="xs">{r[4]}</Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </UiTable>
        </div>
      </div>
    </main>
  );
}
