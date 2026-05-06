import React, { useState } from "react";
import { DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal, Button, Space } from "antd";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      title: t("builder.sectionDelete.deleteEverythingTitle"),
      icon: <ExclamationCircleOutlined />,
      content: t("builder.sectionDelete.deleteEverythingBody", {
        title: sectionTitle,
        count: questionCount,
      }),
      okText: t("builder.sectionDelete.deleteAll"),
      okType: "danger",
      cancelText: t("common.actions.cancel"),
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
        style={{ color: "red" }}
        onClick={handleDelete}
      />

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            {t("builder.sectionDelete.deleteSectionTitle", {
              title: sectionTitle,
            })}
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={480}
      >
        <div style={{ marginBottom: "24px" }}>
          <p>
            <strong>
              {t("builder.sectionDelete.containsQuestions", {
                count: questionCount,
              })}
            </strong>
          </p>
          <p>{t("builder.sectionDelete.whatToDo")}</p>
        </div>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" block onClick={handleMoveToUnsectioned}>
            {t("builder.sectionDelete.deleteSectionOnly")}
          </Button>

          {onDeleteWithQuestions && (
            <Button danger block onClick={handleDeleteWithQuestions}>
              {t("builder.sectionDelete.deleteSectionAndQuestions")}
            </Button>
          )}

          <Button block onClick={handleCancel}>
            {t("common.actions.cancel")}
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default SectionDeleteButton;
