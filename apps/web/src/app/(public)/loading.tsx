import { Center, Skeleton, Text } from "@mantine/core";

export default function PublicLoading() {
  return (
    <main className="publicMain">
      <section className="publicHero" aria-label="Loading content">
        <div className="heroInner">
          <Skeleton height={28} width={220} radius="sm" />
          <Skeleton height={64} mt="lg" width="100%" maw={640} />
          <Skeleton height={20} mt="xl" width="100%" maw={520} />
          <Skeleton height={44} mt={32} width={200} radius="md" />
        </div>
      </section>
      <Center py="xl">
        <Text size="sm" c="dimmed">
          Đang tải nội dung trang công khai...
        </Text>
      </Center>
    </main>
  );
}
