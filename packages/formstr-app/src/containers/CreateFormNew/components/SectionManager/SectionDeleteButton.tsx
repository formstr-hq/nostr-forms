import React, { useState } from "react";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal, Button, Space } from "antd";

interface SectionDeleteButtonProps {
  onDelete: () => void;
  onDeleteWithQuestions?: () => void;
  className?: string;
  questionCount: number;
  sectionTitle: string;
}

const SectionDeleteButton: React.FC<SectionDeleteButtonProps> = ({
  onDelete,
  onDeleteWithQuestions,
  className,
  questionCount,
  sectionTitle,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleDelete = () => {
    // If no questions, delete immediately without modal
    if (questionCount === 0) {
      onDelete();
      return;
    }

    // Show custom modal for sections with questions
    setIsModalVisible(true);
  };

  const handleMoveToUnsectioned = () => {
    onDelete();
    setIsModalVisible(false);
  };

  const handleDeleteWithQuestions = () => {
    // Show confirmation for deleting questions too
    Modal.confirm({
      title: "Delete Everything?",
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete the section "${sectionTitle}" and all ${questionCount} question${
        questionCount !== 1 ? "s" : ""
      } in it. This action cannot be undone.`,
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        onDeleteWithQuestions?.();
        setIsModalVisible(false);
      },
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <DeleteOutlined
        className={className}
        style={{ color: "var(--app-color-error)" }}
        onClick={handleDelete}
      />

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExclamationCircleOutlined style={{ color: "var(--app-color-warning)" }} />
            Delete Section "{sectionTitle}"?
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={480}
      >
        <div style={{ marginBottom: "24px" }}>
          <p>
            This section contains{" "}
            <strong>
              {questionCount} question{questionCount !== 1 ? "s" : ""}
            </strong>
            .
          </p>
          <p>What would you like to do?</p>
        </div>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" block onClick={handleMoveToUnsectioned}>
            Delete Section Only (Move Questions to Unsectioned)
          </Button>

          {onDeleteWithQuestions && (
            <Button danger block onClick={handleDeleteWithQuestions}>
              Delete Section and All Questions
            </Button>
          )}

          <Button block onClick={handleCancel}>
            Cancel
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default SectionDeleteButton;
