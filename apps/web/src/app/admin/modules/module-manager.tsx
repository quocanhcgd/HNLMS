"use client";

import { useMemo, useState } from "react";
import { Badge, Card, Divider, Group, SimpleGrid, Stack, Switch, Text, ThemeIcon } from "@mantine/core";
import { Check, LockKeyhole, Power, TriangleAlert } from "lucide-react";
import {
  defaultOrganizationModuleContext,
  getModuleReason,
  organizationModules,
  resolveOrganizationModuleStates,
  setConfiguredModule,
} from "./module-state";

const statusColor = {
  enabled: "teal",
  disabled_by_configuration: "yellow",
  missing_entitlement: "red",
  dependency_not_effective: "orange",
  module_not_installed: "gray",
} as const;

export function OrganizationModuleManager() {
  const [context, setContext] = useState(defaultOrganizationModuleContext);
  const states = useMemo(() => resolveOrganizationModuleStates(context), [context]);
  const stateByKey = new Map(states.map((state) => [state.moduleKey, state]));

  return (
    <Stack gap="xl">
      <Card withBorder radius="lg" padding="lg" style={{ background: "var(--mantine-color-body)" }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group align="flex-start" wrap="nowrap">
            <ThemeIcon size={46} radius="md" variant="light" color="cyan">
              <Power size={22} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="lg">
                Organization modules
              </Text>
              <Text c="dimmed" size="sm" maw={680} mt={4}>
                Configure which licensed capabilities are available to this organization. Effective state is calculated
                from installation, configuration, entitlement and dependencies.
              </Text>
            </div>
          </Group>
          <Badge variant="light" color="cyan">
            Organization scope
          </Badge>
        </Group>
      </Card>

      {Array.from(new Set(organizationModules.map((module) => module.category))).map((category) => (
        <section key={category} aria-labelledby={`module-category-${category}`}>
          <Group justify="space-between" mb="sm">
            <div>
              <Text id={`module-category-${category}`} fw={700}>
                {category}
              </Text>
              <Text c="dimmed" size="xs">
                Configuration changes never delete historical data.
              </Text>
            </div>
            <Text c="dimmed" size="xs">
              {organizationModules.filter((module) => module.category === category).length} modules
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {organizationModules
              .filter((module) => module.category === category)
              .map((module) => {
                const state = stateByKey.get(module.key)!;
                const isCore = module.core === true;
                const color = statusColor[state.reason];
                return (
                  <Card key={module.key} withBorder radius="lg" padding="lg" component="article">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Group gap="xs">
                            <Text fw={650}>{module.name}</Text>
                            {isCore && (
                              <Badge size="xs" variant="light" color="gray">
                                Core
                              </Badge>
                            )}
                          </Group>
                          <Text c="dimmed" size="sm" mt={5}>
                            {module.description}
                          </Text>
                        </div>
                        {isCore ? (
                          <LockKeyhole size={17} aria-label="Core module" />
                        ) : (
                          <Switch
                            checked={state.configuredEnabled}
                            onChange={(event) =>
                              setContext((current) =>
                                setConfiguredModule(current, module.key, event.currentTarget.checked),
                              )
                            }
                            aria-label={`${state.configuredEnabled ? "Disable" : "Enable"} ${module.name}`}
                          />
                        )}
                      </Group>
                      <Divider />
                      <Group gap="xs" justify="space-between" align="center">
                        <Group gap="xs">
                          {state.effectiveEnabled ? (
                            <Check size={16} color="var(--mantine-color-teal-6)" />
                          ) : (
                            <TriangleAlert size={16} color="var(--mantine-color-orange-6)" />
                          )}
                          <Text size="sm" fw={600}>
                            {state.effectiveEnabled ? "Effective" : "Not effective"}
                          </Text>
                        </Group>
                        <Badge color={color} variant="light">
                          {state.reason.replaceAll("_", " ")}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {getModuleReason(state)}
                      </Text>
                      <Group gap="xs">
                        <Badge size="xs" variant="outline" color={state.installed ? "teal" : "gray"}>
                          Installed
                        </Badge>
                        <Badge size="xs" variant="outline" color={state.configuredEnabled ? "teal" : "gray"}>
                          Configured
                        </Badge>
                        <Badge size="xs" variant="outline" color={state.licensedEnabled ? "teal" : "gray"}>
                          Entitled
                        </Badge>
                        <Badge size="xs" variant="outline" color={state.dependencySatisfied ? "teal" : "gray"}>
                          Dependencies
                        </Badge>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
          </SimpleGrid>
        </section>
      ))}
    </Stack>
  );
}
