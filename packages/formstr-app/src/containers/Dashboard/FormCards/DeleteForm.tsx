import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { useLocalForms } from "../../../provider/LocalFormsProvider";
import { IDeleteFormsLocal, IDeleteFormsTrigger } from "./types";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "../../../providers/SnackbarProvider";
import { requestFormDeletion } from "../../../nostr/deleteForm";

function DeleteConfirmationLocal({
  formKey,
  onCancel,
  onDeleted,
  formPubkey,
  formId,
  signingKey,
  relays,
}: IDeleteFormsLocal) {
  const { t } = useTranslation();
  const { deleteLocalForm } = useLocalForms();
  const { showMessage } = useSnackbar();
  const [loading, setLoading] = useState(false);

  // A real (relay) deletion is only possible when we hold the form's own
  // signing key. Without it we can still remove the form from the local list.
  const canDeleteFromRelays = Boolean(signingKey && formPubkey && formId);

  const onDeleteForm = async () => {
    setLoading(true);
    try {
      if (canDeleteFromRelays) {
        await requestFormDeletion(formPubkey!, formId!, signingKey!, relays);
      }
      await deleteLocalForm(formKey);
      onDeleted();
    } catch (e) {
      showMessage(t("dashboardCards.delete.failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        {canDeleteFromRelays
          ? t("dashboardCards.delete.titleRelay")
          : t("dashboardCards.delete.title")}
      </DialogTitle>
      <DialogContent>
        {canDeleteFromRelays
          ? t("dashboardCards.delete.irreversibleRelay")
          : t("dashboardCards.delete.irreversible")}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t("common.actions.cancel")}</Button>
        <Button
          onClick={onDeleteForm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {t("common.actions.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteFormTrigger({
  formKey,
  onDeleted,
  formPubkey,
  formId,
  signingKey,
  relays,
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
      <IconButton
        aria-label="delete form"
        onClick={() => updateDeleteConfirmationOpen(true)}
        size="small"
        sx={{ color: "error.main" }}
      >
        <DeleteOutlinedIcon />
      </IconButton>
      {deleteConfirmationOpen && (
        <DeleteConfirmationLocal
          formKey={formKey}
          onDeleted={onDelete}
          onCancel={onCancel}
          formPubkey={formPubkey}
          formId={formId}
          signingKey={signingKey}
          relays={relays}
        />
      )}
    </>
  );
}

export default DeleteFormTrigger;
