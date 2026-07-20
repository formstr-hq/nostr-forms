import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import React, { useState } from "react";
import { sendNRPCWebhook, sendResponses } from "../../../nostr/common";
import { RelayPublishModal } from "../../../components/RelayPublishModal/RelaysPublishModal";
import { Event } from "nostr-tools";
import { Response, Tag } from "../../../nostr/types";
import { getFormSettings } from "./utils";
import { useProfileContext } from "../../../hooks/useProfileContext";
import { useTranslation } from "react-i18next";
import { recordSubmission } from "../../../utils/submissions";

interface SubmitButtonProps {
  selfSign: boolean | undefined;
  edit: boolean;
  /** Runs required/rule validation over every field; true when the form is valid. */
  validateForm: () => boolean;
  /** Builds the response tags from the current answers. */
  getResponses: () => Response[];
  formEvent: Event;
  onSubmit: () => Promise<void>;
  disabled?: boolean;
  disabledMessage?: string;
  relays: string[];
  formTemplate: Tag[];
  responderSecretKey?: Uint8Array; // Use this for anonymous submissions, undefined for non-anonymous
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  selfSign,
  edit,
  validateForm,
  getResponses,
  onSubmit,
  formEvent,
  disabled = false,
  disabledMessage,
  relays,
  formTemplate,
  responderSecretKey,
}) => {
  const { t } = useTranslation();
  const { pubkey: userPubKey, requestPubkey } = useProfileContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [acceptedRelays, setAcceptedRelays] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [isValidated, setIsValidated] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // --- Helpers ---
  const fireWebhook = async (
    formTemplate: Tag[],
    responses: Response[],
    anonUser?: Uint8Array,
  ) => {
    const relays = formEvent.tags
      .filter((value: Tag) => value[0] === "relay")
      .map((t) => t[1]);
    return await sendNRPCWebhook(formTemplate, responses, relays, anonUser);
  };

  // --- Main ---
  const saveResponse = async (anonymous: boolean) => {
    let formId = formEvent.tags.find((t) => t[0] === "d")?.[1];
    if (!formId) {
      alert(t("filler.submit.formIdNotFound"));
      return;
    }

    const pubKey = formEvent.pubkey;
    const responses = getResponses();
    // Use the responderSecretKey passed from FormRendererContainer (same key used for file encryption)
    const anonUser = anonymous ? responderSecretKey : null;

    setIsSubmitting(true);
    await sendResponses(
      pubKey,
      formId!,
      responses,
      anonUser,
      true,
      relays,
      (url: string) => setAcceptedRelays((prev) => [...prev, url]),
    );
    setIsSubmitting(false);
    recordSubmission({
      formId: formId!,
      formPubkey: pubKey,
      formName: formTemplate.find((t) => t[0] === "name")?.[1] || formId!,
      relays,
      submittedAt: new Date().toISOString(),
      anonymous,
      submittedAs: anonymous ? undefined : userPubKey || undefined,
    });
    onSubmit();
  };

  // --- Webhook Validation ---
  const validateWebhook = async () => {
    setErrorMessage(null);
    setValidationMessage(null);

    try {
      if (!validateForm()) return;
      setIsValidating(true);
      const responses = getResponses();
      // Use responderSecretKey for validation too
      const nrpcResponse = await fireWebhook(
        formTemplate,
        responses,
        responderSecretKey,
      );
      setIsValidating(false);

      if (!nrpcResponse) {
        setErrorMessage(t("filler.submit.noWebhookResponse"));
        return;
      }

      const status = nrpcResponse.tags.find((t) => t[0] === "status")?.[1];
      if (status === "200") {
        setIsValidated(true);
        setValidationMessage(t("filler.submit.validationSuccess"));
      } else {
        const errorTags = nrpcResponse.tags.filter((t) => t[0] === "error");
        const msg =
          errorTags.map((tag: string[]) => tag[2]).join(", ") ||
          t("filler.submit.validationFailedStatus", { status });
        setErrorMessage(msg);
        setIsValidated(false);
      }
    } catch (err) {
      setIsValidating(false);
      console.log("Error during validation", err);
      setErrorMessage(t("filler.submit.validationFailed"));
    }
  };

  const submitForm = async (anonymous: boolean = true) => {
    setErrorMessage(null);

    // Check if user is logged in when attempting non-anonymous submission
    if (!anonymous && !userPubKey) {
      setErrorMessage(t("filler.submit.loginToSubmit"));
      void requestPubkey().then((pubkey) => {
        if (pubkey) {
          setErrorMessage(null);
        }
      });
      return;
    }

    try {
      if (validateForm()) {
        setIsDisabled(true);

        const responses = getResponses();
        // Use the responderSecretKey for anonymous (same as file encryption)
        const anonUser = anonymous ? responderSecretKey : null;

        if (requireWebhookPass) {
          // When webhook is required, we already validated before
          await saveResponse(anonymous);
        } else {
          // Fire-and-forget webhook after saving
          await saveResponse(anonymous);
          fireWebhook(formTemplate, responses, anonUser || undefined);
        }
      }
    } catch (err) {
      setIsSubmitting(false);
      setIsDisabled(false);
      console.log("Error in sending response", err);
    }
  };

  const handleMenuSelect = async (key: string) => {
    setMenuAnchor(null);
    if (key === "signSubmition") {
      await submitForm(false);
    } else {
      await submitForm(true);
    }
  };

  const handleButtonClick = async () => {
    await submitForm(!selfSign);
  };

  const items = [
    {
      label: t("filler.submit.menu.anonymous"),
      key: "submit",
      disabled: selfSign,
    },
    {
      label: edit
        ? t("filler.submit.menu.updateResponse")
        : t("filler.submit.menu.asYourself"),
      key: "signSubmition",
      disabled: false,
    },
  ];

  const settings = getFormSettings(formTemplate);
  const requireWebhookPass = settings?.requireWebhookPass ?? false;

  return (
    <div>
      {/* If webhook required but not validated yet → show Validate button */}
      {requireWebhookPass && !isValidated ? (
        <Button
          variant="contained"
          color="success"
          onClick={validateWebhook}
          disabled={isDisabled}
          className="validate-button"
          data-testid="validate-button"
          startIcon={
            isValidating ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {isValidating
            ? t("filler.submit.validating")
            : t("common.actions.validate")}
        </Button>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <ButtonGroup
              variant="contained"
              disabled={isDisabled || disabled}
              data-testid="submit-button"
            >
              <Button onClick={handleButtonClick}>
                {disabled ? (
                  disabledMessage || t("filler.submit.disabledFallback")
                ) : isSubmitting ? (
                  <Box
                    component="span"
                    sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
                  >
                    <CircularProgress size={16} color="inherit" />
                    {t("filler.submit.submitting")}
                  </Box>
                ) : selfSign ? (
                  items[1].label
                ) : (
                  t("common.actions.submit")
                )}
              </Button>
              <Button
                aria-label={t("filler.submit.menu.moreOptions")}
                data-testid="submit-options-button"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ minWidth: 36, px: 0.5 }}
              >
                <ArrowDropDownIcon />
              </Button>
            </ButtonGroup>
          </Box>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {items.map((item) => (
              <MenuItem
                key={item.key}
                disabled={item.disabled}
                onClick={() => handleMenuSelect(item.key)}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Feedback messages */}
      {validationMessage && (
        <div
          style={{ color: "green", marginTop: 8 }}
          data-testid="validation-success"
        >
          {validationMessage}
        </div>
      )}
      {errorMessage && (
        <div
          style={{ color: "red", marginTop: 8 }}
          className="submit-button"
          data-testid="submit-error"
        >
          {t("filler.submit.errorPrefix")}: {errorMessage}
        </div>
      )}

      {/* Relay publish status modal */}
      <RelayPublishModal
        relays={relays}
        acceptedRelays={acceptedRelays}
        isOpen={isSubmitting}
      />
    </div>
  );
};
