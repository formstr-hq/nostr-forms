import { LoadingOutlined, DownOutlined } from "@ant-design/icons";
import { Button, FormInstance, Dropdown, MenuProps, Typography } from "antd";
import React, { useState } from "react";
import { sendNRPCWebhook, sendResponses } from "../../../nostr/common";
import { RelayPublishModal } from "../../../components/RelayPublishModal/RelaysPublishModal";
import { Event, generateSecretKey } from "nostr-tools";
import { Response, Tag } from "../../../nostr/types";
import { getFormSettings } from "./utils";
import { useProfileContext } from "../../../hooks/useProfileContext";

const { Text } = Typography;

interface SubmitButtonProps {
  selfSign: boolean | undefined;
  edit: boolean;
  form: FormInstance;
  formEvent: Event;
  onSubmit: () => Promise<void>;
  disabled?: boolean;
  disabledMessage?: string;
  relays: string[];
  formTemplate: Tag[];
  responderSecretKey: Uint8Array; // Use this for anonymous submissions
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  selfSign,
  edit,
  form,
  onSubmit,
  formEvent,
  disabled = false,
  disabledMessage = "disabled",
  relays,
  formTemplate,
  responderSecretKey,
}) => {
  const { pubkey: userPubKey, requestPubkey } = useProfileContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [acceptedRelays, setAcceptedRelays] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [isValidated, setIsValidated] = useState(false);

  // --- Helpers ---
  const buildResponses = (form: FormInstance): Response[] => {
    const formResponses = form.getFieldsValue(true);
    return Object.keys(formResponses).map((fieldId: string) => {
      let answer = null;
      let message = null;
      if (formResponses[fieldId]) [answer, message] = formResponses[fieldId];
      return ["response", fieldId, answer, JSON.stringify({ message })];
    });
  };

  const fireWebhook = async (
    formTemplate: Tag[],
    responses: Response[],
    anonUser?: Uint8Array
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
      alert("FORM ID NOT FOUND");
      return;
    }

    const pubKey = formEvent.pubkey;
    const responses = buildResponses(form);
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
      (url: string) => setAcceptedRelays((prev) => [...prev, url])
    );
    setIsSubmitting(false);
    onSubmit();
  };

  // --- Webhook Validation ---
  const validateWebhook = async () => {
    setErrorMessage(null);
    setValidationMessage(null);

    try {
      await form.validateFields();
      let errors = form.getFieldsError().filter((e) => e.errors.length > 0);
      if (errors.length > 0) return;
      setIsValidating(true);
      const responses = buildResponses(form);
      // Use responderSecretKey for validation too
      const nrpcResponse = await fireWebhook(formTemplate, responses, responderSecretKey);
      setIsValidating(false);

      if (!nrpcResponse) {
        setErrorMessage("No response from webhook");
        return;
      }

      const status = nrpcResponse.tags.find((t) => t[0] === "status")?.[1];
      if (status === "200") {
        setIsValidated(true);
        setValidationMessage("✅ Validation successful. You can now submit.");
      } else {
        const errorTags = nrpcResponse.tags.filter((t) => t[0] === "error");
        const msg =
          errorTags.map((tag: string[]) => tag[2]).join(", ") ||
          `Validation failed with status ${status}`;
        setErrorMessage(msg);
        setIsValidated(false);
      }
    } catch (err) {
      setIsValidating(false);
      console.log("Error during validation", err);
      setErrorMessage("Validation failed");
    }
  };

  const submitForm = async (anonymous: boolean = true) => {
    setErrorMessage(null);

    // Check if user is logged in when attempting non-anonymous submission
    if (!anonymous && !userPubKey) {
      setErrorMessage("Please login to submit with your identity");
      requestPubkey().then((pubkey) => {
        if (pubkey) {
          setErrorMessage(null);
        }
      });
      return;
    }

    try {
      await form.validateFields();

      let errors = form.getFieldsError().filter((e) => e.errors.length > 0);
      if (errors.length === 0) {
        setIsDisabled(true);

        const responses = buildResponses(form);
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

  const handleMenuClick: MenuProps["onClick"] = async (e) => {
    if (e.key === "signSubmition") {
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
      label: "Submit Anonymously",
      key: "submit",
      disabled: selfSign,
    },
    {
      label: edit ? "Update Response" : "Submit As Yourself",
      key: "signSubmition",
    },
  ];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const settings = getFormSettings(formTemplate);
  const requireWebhookPass = settings?.requireWebhookPass ?? false;

  return (
    <div>
      {/* If webhook required but not validated yet → show Validate button */}
      {requireWebhookPass && !isValidated ? (
        <Button
          type="primary"
          onClick={validateWebhook}
          disabled={isDisabled}
          className="validate-button"
          data-testid="validate-button"
        >
          {isValidating ? (
            <>
              <LoadingOutlined className="mr-2" />
              <span
                style={{
                  top: 10,
                  marginTop: 10,
                  marginLeft: 5,
                  color: "white",
                }}
              >
                Validating...
              </span>
            </>
          ) : (
            <div style={{ top: 7 }}>
              <Text
                style={{
                  top: 10,
                  marginTop: 10,
                  marginLeft: -2,
                  color: "white",
                }}
              >
                Validate
              </Text>
            </div>
          )}
        </Button>
      ) : (
        <Dropdown.Button
          menu={menuProps}
          type="primary"
          onClick={handleButtonClick}
          icon={<DownOutlined />}
          disabled={isDisabled || disabled}
          className="submit-button"
          data-testid="submit-button"
        >
          {disabled ? (
            disabledMessage
          ) : isSubmitting ? (
            <span>
              <LoadingOutlined className="mr-2" />
              Submitting...
            </span>
          ) : selfSign ? (
            items[1].label
          ) : (
            "Submit"
          )}
        </Dropdown.Button>
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
          Error: {errorMessage}
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
