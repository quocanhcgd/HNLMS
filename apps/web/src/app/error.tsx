"use client";

import { Button, Center, Stack, Text, Title } from "@mantine/core";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Center mih="60vh">
      <Stack align="center" maw={480} ta="center">
        <Title order={2}>Có lỗi xảy ra</Title>
        <Text c="dimmed">Không thể tải nội dung lúc này. Hãy thử lại hoặc quay lại trang trước.</Text>
        <Button onClick={reset}>Thử lại</Button>
      </Stack>
    </Center>
  );
}
