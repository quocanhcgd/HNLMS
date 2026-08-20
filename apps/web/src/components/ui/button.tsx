import { forwardRef } from "react";
import { Button, type ButtonProps } from "@mantine/core";

export const UiButton = forwardRef<HTMLButtonElement, ButtonProps>(function UiButton(props, ref) {
  return <Button ref={ref} size={props.size ?? "sm"} {...props} />;
});
