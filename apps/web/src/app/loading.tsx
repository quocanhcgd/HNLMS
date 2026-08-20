import { Center, Loader, Stack, Text } from "@mantine/core";

export default function Loading() {
  return (
    <Center mih="50vh">
      <Stack align="center" gap="xs">
        <Loader color="cyan" size="sm" />
        <Text size="sm" c="dimmed">
          Đang tải nội dung...
        </Text>
      </Stack>
    </Center>
  );
}
