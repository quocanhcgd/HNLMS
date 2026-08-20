import { Modal, type ModalProps } from "@mantine/core";

export function UiModal(props: ModalProps) {
  return <Modal centered overlayProps={{ backgroundOpacity: 0.55, blur: 2 }} {...props} />;
}
