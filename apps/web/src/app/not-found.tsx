import Link from "next/link";
import { Button, Center, Stack, Text, Title } from "@mantine/core";

export default function NotFound() {
  return (
    <Center mih="60vh">
      <Stack align="center" maw={480} ta="center">
        <Title order={1}>404</Title>
        <Text c="dimmed">Trang bạn tìm không tồn tại hoặc đã được chuyển.</Text>
        <Button component={Link} href="/">
          Về trang chủ
        </Button>
      </Stack>
    </Center>
  );
}
