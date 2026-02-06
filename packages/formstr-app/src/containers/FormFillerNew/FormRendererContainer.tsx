import { Button, Form, Typography } from "antd";
import { Event } from "nostr-tools";
import { Response, Tag } from "../../nostr/types";
import { useProfileContext } from "../../hooks/useProfileContext";
import { getAllowedUsers, getFormSpec } from "../../utils/formUtils";
import { SubmitButton } from "./SubmitButton/submit";
import { FormRenderer } from "./FormRenderer";
import { useEffect, useState, useRef, useCallback } from "react";
import { getResponseRelays } from "../../utils/ResponseUtils";
import { IFormSettings } from "../CreateFormNew/components/FormSettings/types";
import { LOCAL_STORAGE_KEYS, getItem, setItem } from "../../utils/localStorage";

const { Text } = Typography;

// Helper to get the draft storage key for a form
const getDraftStorageKey = (formEvent: Event): string => {
  const formId = formEvent.tags.find((t) => t[0] === "d")?.[1] || "unknown";
  return `${LOCAL_STORAGE_KEYS.DRAFT_RESPONSES}:${formEvent.pubkey}:${formId}`;
};

// Type for stored draft
interface DraftData {
  values: Record<string, [string, string | undefined] | null>;
  savedAt: number;
}

interface FormRendererContainerProps {
  formEvent: Event;
  onSubmitClick: (responses: Response[], formTemplate: Tag[]) => void;
  viewKey: string | null;
  hideTitleImage?: boolean;
  hideDescription?: boolean;
}

export const FormRendererContainer: React.FC<FormRendererContainerProps> = ({
  formEvent,
  onSubmitClick,
  viewKey,
  hideDescription,
  hideTitleImage,
}) => {
  const { pubkey: userPubKey, requestPubkey } = useProfileContext();
  const [form] = Form.useForm();
  const [formTemplate, setFormTemplate] = useState<Tag[]>();
  const [settings, setSettings] = useState<IFormSettings>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    const saved = getItem<boolean>(LOCAL_STORAGE_KEYS.AUTO_SAVE_ENABLED);
    return saved !== false; // Default to true if not set
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftStorageKey = getDraftStorageKey(formEvent);

  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled((prev) => {
      const newValue = !prev;
      setItem(LOCAL_STORAGE_KEYS.AUTO_SAVE_ENABLED, newValue);
      if (!newValue) {
        // Clear draft when disabling
        localStorage.removeItem(draftStorageKey);
        setSaveStatus("idle");
      }
      return newValue;
    });
  }, [draftStorageKey]);

  // Load draft from localStorage on mount (only if auto-save is enabled)
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const savedDraft = getItem<DraftData>(draftStorageKey);
    if (savedDraft?.values) {
      // Restore saved values to form
      Object.entries(savedDraft.values).forEach(([fieldId, value]) => {
        form.setFieldValue(fieldId, value);
      });
    }
  }, [draftStorageKey, form, autoSaveEnabled]);

  // Debounced save to localStorage
  const saveDraft = useCallback(() => {
    if (!autoSaveEnabled) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    setSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(() => {
      const values = form.getFieldsValue(true);
      const draftData: DraftData = {
        values,
        savedAt: Date.now(),
      };
      setItem(draftStorageKey, draftData);
      setSaveStatus("saved");

      // Reset to idle after 2 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 500); // Debounce 500ms
  }, [form, draftStorageKey, autoSaveEnabled]);

  // Clear draft (to be called on successful submit)
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftStorageKey);
    setSaveStatus("idle");
  }, [draftStorageKey]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (formEvent.content === "") {
        setFormTemplate(formEvent.tags);
        const settingsTag = formEvent.tags.find((tag) => tag[0] === "settings");
        if (settingsTag) {
          const parsedSettings = JSON.parse(
            settingsTag[1] || "{}",
          ) as IFormSettings;
          setSettings(parsedSettings);
        }
        return;
      }

      const formSpec = await getFormSpec(
        formEvent,
        userPubKey,
        () => {},
        viewKey,
      );
      if (formSpec) {
        const settings = JSON.parse(
          formSpec.find((tag) => tag[0] === "settings")?.[1] || "{}",
        ) as IFormSettings;
        setSettings(settings);
        setFormTemplate(formSpec);
      }
    };
    initialize();
  }, []);

  const handleInput = (
    questionId: string,
    answer: string,
    message?: string,
  ) => {
    if (!answer || answer === "") {
      form.setFieldValue(questionId, null);
    } else {
      form.setFieldValue(questionId, [answer, message]);
    }
    // Save draft after each input change
    saveDraft();
  };

  const onSubmit = async () => {
    try {
      const formResponses = form.getFieldsValue(true);
      const responses: Response[] = Object.keys(formResponses).map(
        (fieldId) => {
          let answer = null;
          let message = null;
          if (formResponses[fieldId])
            [answer, message] = formResponses[fieldId];
          return ["response", fieldId, answer, JSON.stringify({ message })];
        },
      );
      // Clear draft on successful submit
      clearDraft();
      onSubmitClick(responses, formTemplate!);
    } catch (error) {
      console.error("Form validation failed:", error);
      // The form will automatically show validation errors
    }
  };

  const allowedUsers = getAllowedUsers(formEvent);
  let footer: React.ReactNode = null;

  if (allowedUsers.length === 0) {
    footer = (
      <SubmitButton
        selfSign={!!settings?.disallowAnonymous}
        edit={false}
        onSubmit={onSubmit}
        form={form}
        relays={getResponseRelays(formEvent)}
        formEvent={formEvent}
        formTemplate={formTemplate!}
      />
    );
  } else if (!userPubKey) {
    footer = (
      <Button type="primary" onClick={requestPubkey}>
        Login to fill this form
      </Button>
    );
  } else if (!allowedUsers.includes(userPubKey)) {
    footer = (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Text type="warning" style={{ fontSize: "16px" }}>
          You do not have permission to view this form
        </Text>
      </div>
    );
  } else {
    footer = (
      <SubmitButton
        selfSign={true}
        edit={false}
        onSubmit={onSubmit}
        form={form}
        relays={getResponseRelays(formEvent)}
        formEvent={formEvent}
        formTemplate={formTemplate!}
      />
    );
  }

  if (!formTemplate) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Typography.Text style={{ fontSize: "16px" }}>
          This form is encrypted and requires access keys to view
        </Typography.Text>
        {!userPubKey && (
          <Button type="primary" onClick={requestPubkey}>
            Login to Access Form
          </Button>
        )}
      </div>
    );
  }

  return (
    <FormRenderer
      formTemplate={formTemplate}
      form={form}
      onInput={handleInput}
      footer={footer}
      hideTitleImage={hideTitleImage}
      hideDescription={hideDescription}
      formstrBranding={settings?.formstrBranding}
      saveStatus={saveStatus}
      autoSaveEnabled={autoSaveEnabled}
      onToggleAutoSave={toggleAutoSave}
    />
  );
};
