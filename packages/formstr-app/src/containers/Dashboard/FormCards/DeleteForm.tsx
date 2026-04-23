import { DeleteOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";
import { useState } from "react";
import { useLocalForms } from "../../../provider/LocalFormsProvider";
import { IDeleteFormsLocal, IDeleteFormsTrigger } from "./types";
import { useTranslation } from "react-i18next";

function DeleteConfirmationLocal({
  formKey,
  onCancel,
  onDeleted,
}: IDeleteFormsLocal) {
  const { t } = useTranslation();
  const { deleteLocalForm } = useLocalForms();
  const [loading, setLoading] = useState(false);

  const onDeleteForm = async () => {
    setLoading(true);
    try {
      await deleteLocalForm(formKey);
      onDeleted();
    } catch (e) {
      message.error(t("dashboardCards.delete.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t("dashboardCards.delete.title")}
      open
      onOk={onDeleteForm}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <p>{t("dashboardCards.delete.irreversible")}</p>
    </Modal>
  );
}

function DeleteFormTrigger({
  formKey,
  onDeleted,
}: Optional<IDeleteFormsTrigger, "onDeleted" | "onCancel">) {
  const [deleteConfirmationOpen, updateDeleteConfirmationOpen] =
    useState(false);
  const onDelete = () => {
    updateDeleteConfirmationOpen(false);
    if (onDeleted) onDeleted();
  };
  const onCancel = () => {
    updateDeleteConfirmationOpen(false);
  };
  return (
    <>
      <Button
        type={"text"}
        onClick={(e) => {
          updateDeleteConfirmationOpen(true);
        }}
        style={{ color: "red" }}
      >
        <DeleteOutlined />
      </Button>
      {deleteConfirmationOpen && (
        <DeleteConfirmationLocal
          formKey={formKey}
          onDeleted={onDelete}
          onCancel={onCancel}
        />
      )}
    </>
  );
}

export default DeleteFormTrigger;
