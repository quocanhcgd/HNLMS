import { Group, type GroupProps } from "@mantine/core";

export function PageToolbar(props: GroupProps) {
  return <Group gap="sm" wrap="wrap" mb="md" {...props} />;
}
