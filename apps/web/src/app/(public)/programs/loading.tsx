import { Center, Container, SimpleGrid, Skeleton, Text } from "@mantine/core";

export default function ProgramsLoading() {
  return (
    <main className="publicMain">
      <Container size="lg" className="publicContainer" py="xl">
        <Skeleton height={16} width={100} radius="sm" />
        <Skeleton height={40} mt="md" width="100%" maw={540} />
        <Skeleton height={18} mt="md" width="100%" maw={680} />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt="xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={335} radius="md" />
          ))}
        </SimpleGrid>
        <Center py="xl">
          <Text size="sm" c="dimmed">
            Đang tải danh sách chương trình...
          </Text>
        </Center>
      </Container>
    </main>
  );
}
