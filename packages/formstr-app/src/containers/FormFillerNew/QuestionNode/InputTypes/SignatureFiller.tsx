import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { IAnswerSettings } from "../../../CreateFormNew/components/AnswerSettings/types";
import { Field } from "../../../../nostr/types";
import { signerManager } from "../../../../signer";
import { useTranslation } from "react-i18next";

interface SignatureFillerProps {
  fieldConfig: IAnswerSettings;
  onChange: (value: string, displayValue?: string) => void;
  field?: Field;
  disabled?: boolean;
  defaultValue?: string;
}

export const SignatureFiller: React.FC<SignatureFillerProps> = ({
  fieldConfig,
  onChange,
  disabled,
  defaultValue,
}) => {
  const { t } = useTranslation();
  const sig = fieldConfig.signature || {};

  const parseExistingSignature = (value: string | undefined) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && parsed.content !== undefined) {
        return parsed;
      }
    } catch (e) {
      return null;
    }
  };

  const existingSignature = parseExistingSignature(defaultValue);

  const [content, setContent] = useState(
    existingSignature?.content || sig.prefilledContent || "",
  );
  const [signedEvent, setSignedEvent] = useState<string | null>(
    defaultValue || null,
  );
  const [kind, setKind] = useState<number>(
    existingSignature?.kind ?? sig.kind ?? 22157,
  );
  const [isSigning, setIsSigning] = useState(false);

  const getInitialCreatedAt = (): Dayjs => {
    if (existingSignature?.created_at) {
      return dayjs(existingSignature.created_at * 1000);
    }
    return dayjs(Date.now());
  };
  const [createdAt, setCreatedAt] = useState<Dayjs>(getInitialCreatedAt());

  useEffect(() => {
    const parsed = parseExistingSignature(defaultValue);
    if (parsed) {
      setSignedEvent(defaultValue || null);
      setContent(parsed.content || sig.prefilledContent || "");
      if (parsed.created_at) {
        setCreatedAt(dayjs(parsed.created_at * 1000));
      }
      setKind(parsed.kind ?? sig.kind ?? 22157);
    } else if (!defaultValue) {
      setSignedEvent(null);
      setContent(sig.prefilledContent || "");
      setCreatedAt(dayjs(Date.now()));
      setKind(sig.kind ?? 22157);
    }
  }, [defaultValue, sig.prefilledContent, sig.kind]);

  const handleSign = async () => {
    const event = {
      kind: sig.editableKind ? kind : sig.kind || 22157,
      created_at: sig.editableCreatedAt
        ? Math.floor(createdAt.valueOf() / 1000)
        : Math.floor(Date.now() / 1000),
      content,
      tags: [],
    };

    try {
      setIsSigning(true);
      const signer = await signerManager.getSigner();
      const signed = await signer.signEvent(event);
      const signedString = JSON.stringify(signed, null, 2);
      setSignedEvent(signedString);
      onChange(signedString, "Signed nostr event");
    } catch (e) {
      console.error(e);
      alert(t("filler.inputs.signatureFailed"));
    } finally {
      setIsSigning(false);
    }
  };

  const hasExistingSignature = !!existingSignature;

  return (
    <Box sx={{ height: "auto" }}>
      {!hasExistingSignature && (
        <>
          <TextField
            value={content}
            disabled={disabled || !sig.editableContent}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
            fullWidth
            size="small"
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mt: 1,
            }}
          >
            {sig.editableCreatedAt && (
              <>
                <Typography variant="body2">
                  {t("filler.inputs.signatureDate")}:
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    value={createdAt}
                    onChange={(date) => date && setCreatedAt(date)}
                    disabled={disabled}
                    slotProps={{
                      textField: {
                        size: "small",
                        placeholder: t("filler.inputs.pickDateTime"),
                      },
                    }}
                  />
                </LocalizationProvider>
              </>
            )}
            {sig.editableKind && (
              <>
                <Typography variant="body2">
                  {t("filler.inputs.signatureKind")}:
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={kind}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setKind(Number.isNaN(parsed) ? 22157 : parsed);
                  }}
                  disabled={disabled}
                  slotProps={{ htmlInput: { min: 0 } }}
                  sx={{ width: 140 }}
                />
              </>
            )}
          </Box>
          <Button
            variant="contained"
            onClick={handleSign}
            disabled={disabled || isSigning}
            sx={{ mt: 1 }}
          >
            {isSigning
              ? t("filler.inputs.signing")
              : t("filler.inputs.attachSignature")}
          </Button>
        </>
      )}

      {hasExistingSignature && (
        <Box sx={{ mb: 1.5 }}>
          <Typography
            sx={{ fontWeight: 600, display: "block", mb: 1 }}
          >
            {`\u2713 ${t("filler.inputs.signatureAttached")}`}
          </Typography>
          {existingSignature.content && (
            <Box
              sx={{
                backgroundColor: "#f0f0f0",
                p: 1.5,
                borderRadius: 1,
                mb: 1,
                whiteSpace: "pre-wrap",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                {t("filler.inputs.signedContent")}:
              </Typography>
              <Typography variant="body2">
                {existingSignature.content}
              </Typography>
            </Box>
          )}
          {existingSignature.created_at && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              {t("filler.inputs.signedOn")}:{" "}
              {dayjs(existingSignature.created_at * 1000).format(
                "YYYY-MM-DD HH:mm:ss",
              )}
            </Typography>
          )}
          {sig.editableKind && existingSignature.kind !== undefined && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              {t("filler.inputs.signatureKind")}: {existingSignature.kind}
            </Typography>
          )}
        </Box>
      )}

      {signedEvent && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{ mt: 1.5, "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>
              {t("filler.inputs.viewSignedEvent")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              value={signedEvent}
              multiline
              minRows={6}
              maxRows={12}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: {
                    fontFamily: "monospace",
                    background: "#fafafa",
                    borderRadius: 1,
                  },
                },
              }}
            />
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};
