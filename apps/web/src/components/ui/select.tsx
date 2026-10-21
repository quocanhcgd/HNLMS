import { forwardRef } from "react";
import { Select, type SelectProps } from "@mantine/core";

export const UiSelect = forwardRef<HTMLInputElement, SelectProps>(function UiSelect(props, ref) {
  const { "aria-label": ariaLabel, ...selectProps } = props as SelectProps & { "aria-label"?: string };
  const setRef = (node: HTMLInputElement | null) => {
    if (node && ariaLabel) node.setAttribute("aria-label", ariaLabel);
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  return (
    <Select
      ref={setRef}
      size={props.size ?? "sm"}
      {...selectProps}
      aria-label={ariaLabel}
    />
  );
});
