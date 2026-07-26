import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormEventCard } from "./FormEventCard";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useMyForms } from "../../../provider/MyFormsProvider";
import DeleteFormTrigger from "./DeleteForm";
import { makeFormNAddr, naddrUrl } from "../../../utils/utility";
import { responsePath } from "../../../utils/formUtils";

export const MyForms = () => {
  const { formEvents, refreshing, deleteForm, retryForm, refreshForms } =
    useMyForms();
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleFormDeleted = async (formId: string, formPubkey: string) => {
    deleteForm(formId, formPubkey);
  };

  const handleRetry = async (formId: string) => {
    setRetrying((prev) => new Set(prev).add(formId));
    await retryForm(formId);
    setRetrying((prev) => {
      const next = new Set(prev);
      next.delete(formId);
      return next;
    });
  };

  return (
    <>
      <Box sx={{ gridColumn: "1 / -1", textAlign: "right", mb: -1 }}>
        <Button
          startIcon={
            refreshing ? <CircularProgress size={16} /> : <RefreshIcon />
          }
          onClick={() => void refreshForms(true)}
          disabled={refreshing}
          size="small"
        >
          Reload
        </Button>
      </Box>
      {refreshing ? (
        <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {[...formEvents.values()]
        .sort((a, b) => {
          if (!a.event && !b.event) return 0;
          if (!a.event) return 1;
          if (!b.event) return -1;
          return b.event.created_at - a.event.created_at;
        })
        .map((formMetadata) => {
          const { formId, formPubkey } = formMetadata;

          if (!formMetadata.event) {
            return (
              <Card key={formId} variant="outlined" className="form-card">
                <CardHeader
                  title={formId}
                  action={
                    <DeleteFormTrigger
                      formKey={`${formPubkey}:${formId}`}
                      onDeleted={() => handleFormDeleted(formId, formPubkey)}
                      formPubkey={formPubkey}
                      formId={formId}
                      signingKey={formMetadata.secrets.secretKey}
                      relays={formMetadata.relay ? [formMetadata.relay] : []}
                    />
                  }
                  sx={{ "& .MuiCardHeader-content": { minWidth: 0 } }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {"Could not find this form's event on the default relays."}
                    {formMetadata.relay
                      ? ` Will also check: ${formMetadata.relay}`
                      : ""}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
                  <Box>
                    <Button
                      size="small"
                      onClick={() => {
                        const relays = formMetadata.relay
                          ? [formMetadata.relay]
                          : [];
                        const { secretKey, viewKey } = formMetadata.secrets;
                        navigate(
                          responsePath(
                            secretKey,
                            makeFormNAddr(formPubkey, formId, relays),
                            viewKey,
                          ),
                        );
                      }}
                    >
                      View Responses
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        const relays = formMetadata.relay
                          ? [formMetadata.relay]
                          : ["wss://relay.damus.io"];
                        navigate(
                          naddrUrl(
                            formPubkey,
                            formId,
                            relays,
                            formMetadata.secrets.viewKey,
                          ),
                        );
                      }}
                    >
                      Open Form
                    </Button>
                  </Box>
                  <Button
                    size="small"
                    startIcon={
                      retrying.has(formId) ? (
                        <CircularProgress size={16} />
                      ) : (
                        <RefreshIcon />
                      )
                    }
                    onClick={() => handleRetry(formId)}
                    disabled={retrying.has(formId)}
                  >
                    Retry
                  </Button>
                </CardActions>
              </Card>
            );
          }

          return (
            <FormEventCard
              event={formMetadata.event}
              key={formId}
              onDeleted={() => handleFormDeleted(formId, formPubkey)}
              secretKey={formMetadata.secrets.secretKey}
              viewKey={formMetadata.secrets.viewKey}
              relay={formMetadata.relay}
            />
          );
        })}
    </>
  );
};
