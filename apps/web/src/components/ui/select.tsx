import { forwardRef } from "react";
import { Select, type SelectProps } from "@mantine/core";

export const UiSelect = forwardRef<HTMLInputElement, SelectProps>(function UiSelect(props, ref) {
  return <Select ref={ref} size={props.size ?? "sm"} {...props} />;
});
