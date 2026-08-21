"use client";

import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { AlertTriangle } from "lucide-react";

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Center mih="60vh" px="md">
      <Stack align="center" maw={480} ta="center">
        <AlertTriangle size={40} aria-hidden="true" />
        <Title order={2}>Không thể tải trang</Title>
        <Text c="dimmed">
          Đã xảy ra lỗi khi tải nội dung trang công khai. Vui lòng thử lại hoặc quay lại trang chủ.
        </Text>
        {error.digest ? (
          <Text size="sm" c="dimmed">
            Mã lỗi: {error.digest}
          </Text>
        ) : null}
        <Button onClick={reset} mt="md">
          Thử lại
        </Button>
      </Stack>
    </Center>
  );
}
