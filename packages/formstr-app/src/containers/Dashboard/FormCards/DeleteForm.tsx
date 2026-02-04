import { DeleteOutlined } from "@ant-design/icons";
import { Button, Modal, message } from "antd";
import { useState } from "react";
import { useLocalForms } from "../../../provider/LocalFormsProvider";
import { IDeleteFormsLocal, IDeleteFormsTrigger } from "./types";

function DeleteConfirmationLocal({
  formKey,
  onCancel,
  onDeleted,
}: IDeleteFormsLocal) {
  const { deleteLocalForm } = useLocalForms();
  const [loading, setLoading] = useState(false);

  const onDeleteForm = async () => {
    setLoading(true);
    try {
      await deleteLocalForm(formKey);
      onDeleted();
    } catch (e) {
      message.error("Failed to delete form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={"Are you sure you want to delete this form from your device?"}
      open
      onOk={onDeleteForm}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <p>This action is irreversible</p>
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
