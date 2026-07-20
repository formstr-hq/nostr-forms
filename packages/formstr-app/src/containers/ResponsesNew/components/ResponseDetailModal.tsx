import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from "@mui/material";
import { Event, nip19, getPublicKey } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";
import { Tag } from "../../../nostr/types";
import { FormRenderer } from "../../FormFillerNew/FormRenderer";
import { buildResponseFormValues } from "../../../utils/ResponseUtils";
import { useTranslation } from "react-i18next";

interface ResponseDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  formSpec: Tag[];
  processedInputs: Tag[];
  responseMetadataEvent: Event | null;
  formstrBranding?: boolean;
  editKey?: string | null;
}
export const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  isVisible,
  onClose,
  formSpec,
  processedInputs,
  responseMetadataEvent,
  formstrBranding,
  editKey,
}) => {
  const { t } = useTranslation();
  const [metaData, setMetaData] = useState<{
    author?: string;
    timestamp?: string;
  }>({});

  useEffect(() => {
    if (isVisible && responseMetadataEvent) {
      const authorNpub = nip19.npubEncode(responseMetadataEvent.pubkey);
      const timestamp = new Date(
        responseMetadataEvent.created_at * 1000,
      ).toLocaleString();
      setMetaData({ author: authorNpub, timestamp });
    } else {
      setMetaData({});
    }
  }, [isVisible, responseMetadataEvent, processedInputs, formSpec]);

  return (
    <Dialog
      open={isVisible}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      // Fresh mount per response so FormRenderer re-seeds from initialValues.
      key={responseMetadataEvent?.id}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {t("responses.detail.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("responses.detail.by")}:{" "}
            <Link
              href={`https://njump.me/${metaData.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {metaData.author || t("responses.detail.unknownAuthor")}
            </Link>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("responses.detail.submitted")}:{" "}
            {metaData.timestamp || t("responses.detail.unavailable")}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {formSpec && formSpec.length > 0 ? (
          <FormRenderer
            formTemplate={formSpec}
            onInput={() => {}}
            disabled={true}
            readOnly={true}
            initialValues={buildResponseFormValues(processedInputs)}
            formstrBranding={formstrBranding}
            formAuthorPubkey={
              editKey ? getPublicKey(hexToBytes(editKey)) : undefined
            }
            formEditKey={editKey || undefined}
            uploaderPubkey={responseMetadataEvent?.pubkey}
          />
        ) : (
          <Typography>{t("responses.detail.waiting")}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.actions.close")}</Button>
      </DialogActions>
    </Dialog>
  );
};
