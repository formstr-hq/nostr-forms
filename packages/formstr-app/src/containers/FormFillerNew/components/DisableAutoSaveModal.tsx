import { Modal } from "antd";

interface DisableAutoSaveModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DisableAutoSaveModal: React.FC<DisableAutoSaveModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      title="Disable Auto-Save?"
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Disable"
      cancelText="Cancel"
    >
      <p>
        Auto-save stores your progress locally so you can continue later if you
        leave the page.
      </p>
      <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        You can re-enable it anytime from the settings icon next to the submit
        button.
      </p>
    </Modal>
  );
};
