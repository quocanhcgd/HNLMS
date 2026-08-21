"use client";

import Link from "next/link";
import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { ArrowLeft } from "lucide-react";

export default function ProgramDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="publicMain">
      <Center mih="50vh" px="md">
        <Stack align="center" maw={480} ta="center">
          <Title order={2}>Không thể tải chương trình</Title>
          <Text c="dimmed">
            Có lỗi xảy ra khi tải thông tin chương trình. Vui lòng thử lại hoặc quay lại danh sách chương trình.
          </Text>
          {error.digest ? (
            <Text size="sm" c="dimmed">
              Mã lỗi: {error.digest}
            </Text>
          ) : null}
          <Button onClick={reset} mt="md">
            Thử lại
          </Button>
          <Button component={Link} href="/programs" variant="subtle" leftSection={<ArrowLeft size={16} />}>
            Quay lại danh sách
          </Button>
        </Stack>
      </Center>
    </main>
  );
}
