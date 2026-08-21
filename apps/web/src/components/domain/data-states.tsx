import { Center, Loader, Stack, Text } from "@mantine/core";

export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <Center mih={180}>
      <Stack align="center" gap="xs">
        <Loader color="cyan" size="sm" />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Center mih={180}>
      <Stack align="center" gap="xs" ta="center" maw={420}>
        <Text fw={650}>{title}</Text>
        <Text size="sm" c="dimmed">
          {description}
        </Text>
        {action}
      </Stack>
    </Center>
  );
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  description = "Hãy thử lại hoặc liên hệ người quản trị nếu lỗi tiếp tục.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Center mih={180}>
      <Stack align="center" gap="xs" ta="center" maw={420}>
        <Text fw={650} c="red">
          {title}
        </Text>
        <Text size="sm" c="dimmed">
          {description}
        </Text>
        {action}
      </Stack>
    </Center>
  );
}

export function ForbiddenState({
  title = "Bạn không có quyền truy cập",
  description = "Phạm vi tài khoản hiện tại không bao gồm dữ liệu này.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Center mih={180}>
      <Stack align="center" gap="xs" ta="center" maw={420}>
        <Text fw={650}>{title}</Text>
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>
    </Center>
  );
}
