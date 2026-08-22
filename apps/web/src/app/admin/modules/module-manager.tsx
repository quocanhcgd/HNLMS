"use client";

import { useMemo, useState } from "react";
import { Card, Divider, Group, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import { Check, LockKeyhole, Power, TriangleAlert } from "lucide-react";
import { UiBadge, UiStatusBadge, UiStatusIcon, type UiStatusRole } from "@/components/ui";
import {
  defaultOrganizationModuleContext,
  getModuleReason,
  organizationModules,
  resolveOrganizationModuleStates,
  setConfiguredModule,
} from "./module-state";

const statusRole: Record<string, UiStatusRole> = {
  enabled: "success",
  disabled_by_configuration: "warning",
  missing_entitlement: "danger",
  dependency_not_effective: "warning",
  module_not_installed: "neutral",
};

export function OrganizationModuleManager() {
  const [context, setContext] = useState(defaultOrganizationModuleContext);
  const states = useMemo(() => resolveOrganizationModuleStates(context), [context]);
  const stateByKey = new Map(states.map((state) => [state.moduleKey, state]));

  return (
    <Stack gap="xl">
      <Card withBorder radius="lg" padding="lg" className="panel">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group align="flex-start" wrap="nowrap">
            <UiStatusIcon role="primary" size={46} radius="md">
              <Power size={22} />
            </UiStatusIcon>
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
          <UiStatusBadge role="primary">Organization scope</UiStatusBadge>
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
                const role = statusRole[state.reason] ?? "neutral";
                return (
                  <Card key={module.key} withBorder radius="lg" padding="lg" component="article">
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Group gap="xs">
                            <Text fw={650}>{module.name}</Text>
                            {isCore && (
                              <UiBadge size="xs" variant="light" color="gray">
                                Core
                              </UiBadge>
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
                            <Check size={16} className="statusIcon statusIcon--success" />
                          ) : (
                            <TriangleAlert size={16} className="statusIcon statusIcon--warning" />
                          )}
                          <Text size="sm" fw={600}>
                            {state.effectiveEnabled ? "Effective" : "Not effective"}
                          </Text>
                        </Group>
                        <UiStatusBadge role={role}>{state.reason.replaceAll("_", " ")}</UiStatusBadge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {getModuleReason(state)}
                      </Text>
                      <Group gap="xs">
                        <UiStatusBadge size="xs" variant="outline" role={state.installed ? "success" : "neutral"}>
                          Installed
                        </UiStatusBadge>
                        <UiStatusBadge
                          size="xs"
                          variant="outline"
                          role={state.configuredEnabled ? "success" : "neutral"}
                        >
                          Configured
                        </UiStatusBadge>
                        <UiStatusBadge size="xs" variant="outline" role={state.licensedEnabled ? "success" : "neutral"}>
                          Entitled
                        </UiStatusBadge>
                        <UiStatusBadge
                          size="xs"
                          variant="outline"
                          role={state.dependencySatisfied ? "success" : "neutral"}
                        >
                          Dependencies
                        </UiStatusBadge>
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
