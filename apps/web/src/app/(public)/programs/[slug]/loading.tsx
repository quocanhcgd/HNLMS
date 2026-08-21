import { Center, Container, Group, Skeleton, Stack, Text } from "@mantine/core";

export default function ProgramDetailLoading() {
  return (
    <main className="publicMain">
      <Container size="lg" className="publicContainer" py="xl">
        <Skeleton height={36} width={160} radius="md" />
        <div className="programHero">
          <Stack>
            <Group gap="sm">
              <Skeleton height={16} width={120} radius="sm" />
            </Group>
            <Skeleton height={56} width="100%" maw={500} />
            <Skeleton height={20} width="100%" maw={600} />
            <Group mt="xl" gap="md">
              <Skeleton height={24} width={100} />
              <Skeleton height={24} width={100} />
            </Group>
            <Skeleton height={44} mt="xl" width={180} radius="md" />
          </Stack>
          <Skeleton height={260} radius="md" />
        </div>
        <Center py="xl">
          <Text size="sm" c="dimmed">
            Đang tải thông tin chương trình...
          </Text>
        </Center>
      </Container>
    </main>
  );
}
