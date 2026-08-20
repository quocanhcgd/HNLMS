import type { ElementType } from "react";
import { Button, type ButtonProps } from "@mantine/core";

type UiButtonProps = ButtonProps & { component?: ElementType; href?: string; onClick?: () => void };
const PolymorphicButton = Button as unknown as React.ComponentType<UiButtonProps>;

export function UiButton({ size, ...props }: UiButtonProps) {
  return <PolymorphicButton size={size ?? "sm"} {...props} />;
}
