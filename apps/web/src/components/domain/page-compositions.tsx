import { Stack } from "@mantine/core";

export function PageFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`pageFrame ${className}`}>{children}</section>;
}

export function ConfirmationSummary({
  title,
  consequence,
  children,
}: {
  title: string;
  consequence: string;
  children?: React.ReactNode;
}) {
  return (
    <Stack gap="xs">
      <strong>{title}</strong>
      <span className="muted">{consequence}</span>
      {children}
    </Stack>
  );
}
