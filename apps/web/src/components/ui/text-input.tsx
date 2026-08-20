import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "@mantine/core";

export const UiTextInput = forwardRef<HTMLInputElement, TextInputProps>(function UiTextInput(props, ref) {
  return <TextInput ref={ref} size={props.size ?? "sm"} {...props} />;
});
