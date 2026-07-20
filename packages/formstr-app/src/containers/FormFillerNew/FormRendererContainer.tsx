import { Button, Typography } from "@mui/material";
import { Event, generateSecretKey } from "nostr-tools";
import {
  Field,
  FileUploadMetadata,
  Response,
  Tag,
} from "../../nostr/types";
import { useProfileContext } from "../../hooks/useProfileContext";
import { getAllowedUsers, getFormSpec } from "../../utils/formUtils";
import { SubmitButton } from "./SubmitButton/submit";
import { FormRenderer } from "./FormRenderer";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getResponseRelays } from "../../utils/ResponseUtils";
import { IFormSettings } from "../CreateFormNew/components/FormSettings/types";
import { LOCAL_STORAGE_KEYS, getItem, setItem } from "../../utils/localStorage";
import { BlossomClient } from "../../utils/blossom";
import { createAuthEvent } from "../../utils/blossomAuth";
import { useSnackbar } from "../../providers/SnackbarProvider";
import {
  FieldErrors,
  FormValues,
  validateFields,
} from "./validations";

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

const isFileUploadMetadata = (
  value: unknown,
): value is FileUploadMetadata => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FileUploadMetadata>;
  return (
    typeof candidate.sha256 === "string" &&
    typeof candidate.filename === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.mimeType === "string" &&
    typeof candidate.server === "string" &&
    typeof candidate.uploaderPubkey === "string" &&
    typeof candidate.uploadedAt === "number"
  );
};

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
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const { pubkey: userPubKey, requestPubkey } = useProfileContext();
  // React state replaces antd's Form.useForm: values holds the same
  // [answer, message] tuples the antd store did. The ref mirrors state so
  // debounced autosave and submit-time getters always read the latest.
  const [values, setValues] = useState<FormValues>({});
  const valuesRef = useRef<FormValues>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  // Ids of every field that has rendered at least once (antd registered-
  // fields semantics): responses are built for seen fields only.
  const seenFieldsRef = useRef<Set<string>>(new Set());
  const [formTemplate, setFormTemplate] = useState<Tag[]>();
  const [settings, setSettings] = useState<IFormSettings>();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [isFetchingKeys, setIsFetchingKeys] = useState(false);
  const [rendererKey, setRendererKey] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    const saved = getItem<boolean>(LOCAL_STORAGE_KEYS.AUTO_SAVE_ENABLED);
    return saved !== false; // Default to true if not set
  });
  // Generate keypair once for this form session (used for file encryption)
  // Note: File encryption ALWAYS uses this key, even for non-anonymous forms,
  // because signers can't encrypt large files. The uploaderPubkey is stored in metadata.
  const [responderSecretKey] = useState<Uint8Array>(() => generateSecretKey());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftStorageKey = getDraftStorageKey(formEvent);

  const updateValues = useCallback(
    (updater: (prev: FormValues) => FormValues) => {
      setValues((prev) => {
        const next = updater(prev);
        valuesRef.current = next;
        return next;
      });
    },
    [],
  );

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
      // Restore saved values
      updateValues((prev) => ({ ...prev, ...savedDraft.values }));
    }
  }, [draftStorageKey, autoSaveEnabled, updateValues]);

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
      const draftData: DraftData = {
        values: valuesRef.current,
        savedAt: Date.now(),
      };
      setItem(draftStorageKey, draftData);
      setSaveStatus("saved");

      // Reset to idle after 2 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 500); // Debounce 500ms
  }, [draftStorageKey, autoSaveEnabled]);

  // Clear draft (to be called on successful submit)
  const clearDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
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

  // Handle fetching keys - can be called for login or for already-logged-in users
  const handleFetchKeys = async (pubkey: string) => {
    try {
      setIsFetchingKeys(true);

      // Fetch keys with the active signer
      const formSpec = await getFormSpec(
        formEvent,
        pubkey,
        () => {},
        null,
      );

      if (formSpec) {
        const settings = JSON.parse(
          formSpec.find((tag) => tag[0] === "settings")?.[1] || "{}",
        ) as IFormSettings;
        setSettings(settings);
        setFormTemplate(formSpec);
      }
    } catch (error) {
      console.error("Failed to fetch form keys:", error);
    } finally {
      setIsFetchingKeys(false);
    }
  };

  // Handle login and fetch keys - only called when user explicitly clicks login
  const handleLoginAndFetchKeys = async () => {
    const pubkey = await requestPubkey();
    if (!pubkey) return;
    await handleFetchKeys(pubkey);
  };

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

      // If viewKey is provided, decrypt immediately without requiring login
      if (viewKey) {
        const formSpec = await getFormSpec(
          formEvent,
          undefined, // Don't pass userPubKey to avoid triggering fetchKeys
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
        return;
      }

      // If user is already logged in, fetch keys automatically
      if (userPubKey) {
        await handleFetchKeys(userPubKey);
      }
      // If no viewKey and no userPubKey, leave formTemplate undefined
      // which will show the login UI
    };
    initialize();
  }, []);

  const handleInput = (
    questionId: string,
    answer: string,
    message?: string,
  ) => {
    updateValues((prev) => ({
      ...prev,
      [questionId]:
        !answer || answer === ""
          ? null
          : ([answer, message] as [string, string | undefined]),
    }));
    // Clear the field's error on edit, like antd did on change
    setErrors((prev) => {
      if (!(questionId in prev)) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    // Save draft after each input change
    saveDraft();
  };

  // Tracks fields as the renderer mounts them (antd registered-fields semantics)
  const handleFieldsRendered = useCallback((renderedFields: Field[]) => {
    renderedFields.forEach((field) => seenFieldsRef.current.add(field[1]));
  }, []);

  // Per-step validation hook used by FormRenderer's step navigation
  const handleValidateFields = useCallback(
    (stepFields: Field[]): boolean => {
      const stepErrors = validateFields(stepFields, valuesRef.current);
      setErrors((prev) => {
        const next = { ...prev };
        stepFields.forEach((field) => {
          const error = stepErrors[field[1]];
          if (error) next[field[1]] = error;
          else delete next[field[1]];
        });
        return next;
      });
      return Object.keys(stepErrors).length === 0;
    },
    [],
  );

  // Whole-form validation for the SubmitButton
  const validateForm = useCallback((): boolean => {
    const allFields = (formTemplate?.filter((tag) => tag[0] === "field") ||
      []) as Field[];
    const allErrors = validateFields(allFields, valuesRef.current);
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }, [formTemplate]);

  // Builds response tags for every field the user has seen (rendered),
  // replicating antd's getFieldsValue(true) over registered fields.
  const getResponses = useCallback((): Response[] => {
    const currentValues = valuesRef.current;
    return Array.from(seenFieldsRef.current).map((fieldId) => {
      let answer: string | null = null;
      let message: string | undefined;
      const value = currentValues[fieldId];
      if (value) [answer, message] = value;
      // Seen-but-unanswered fields keep the antd-era null answer.
      return [
        "response",
        fieldId,
        answer,
        JSON.stringify({ message }),
      ] as Response;
    });
  }, []);

  const onSubmit = async () => {
    try {
      const responses = getResponses();
      // Clear draft on successful submit
      clearDraft();
      onSubmitClick(responses, formTemplate!);
    } catch (error) {
      console.error("Form validation failed:", error);
      // The form will automatically show validation errors
    }
  };

  const getUploadedFilesFromForm = (): FileUploadMetadata[] => {
    const formValues = valuesRef.current;

    return Object.values(formValues).flatMap((value) => {
      if (!Array.isArray(value) || typeof value[0] !== "string") {
        return [];
      }

      try {
        const parsed = JSON.parse(value[0]);
        return isFileUploadMetadata(parsed) ? [parsed] : [];
      } catch {
        return [];
      }
    });
  };

  const deleteUploadedFiles = async (files: FileUploadMetadata[]) => {
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const authHeader = await createAuthEvent(
          "delete",
          file.sha256,
          60,
          responderSecretKey,
        );
        const client = new BlossomClient(file.server);
        await client.delete(file.sha256, authHeader);
      }),
    );

    if (results.some((result) => result.status === "rejected")) {
      showMessage(
        "Some uploaded files could not be removed from the server.",
        "warning",
      );
    }
  };

  const handleClearForm = async () => {
    const uploadedFiles = getUploadedFilesFromForm();

    if (uploadedFiles.length > 0) {
      await deleteUploadedFiles(uploadedFiles);
    }

    updateValues(() => ({}));
    setErrors({});
    clearDraft();
    setRendererKey((prev) => prev + 1);
  };

  const allowedUsers = getAllowedUsers(formEvent);
  let footer: React.ReactNode = null;

  if (allowedUsers.length === 0) {
    footer = (
      <SubmitButton
        selfSign={!!settings?.disallowAnonymous}
        edit={false}
        onSubmit={onSubmit}
        validateForm={validateForm}
        getResponses={getResponses}
        relays={getResponseRelays(formEvent)}
        formEvent={formEvent}
        formTemplate={formTemplate!}
        responderSecretKey={responderSecretKey}
      />
    );
  } else if (!userPubKey) {
    footer = (
      <Button variant="contained" onClick={requestPubkey}>
        {t("filler.loginToFill")}
      </Button>
    );
  } else if (!allowedUsers.includes(userPubKey)) {
    footer = (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Typography color="warning.main" sx={{ fontSize: "16px" }}>
          {t("filler.noPermission")}
        </Typography>
      </div>
    );
  } else {
    footer = (
      <SubmitButton
        selfSign={true}
        edit={false}
        onSubmit={onSubmit}
        validateForm={validateForm}
        getResponses={getResponses}
        relays={getResponseRelays(formEvent)}
        formEvent={formEvent}
        formTemplate={formTemplate!}
        responderSecretKey={responderSecretKey}
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
        <Typography sx={{ fontSize: "16px" }}>
          {isFetchingKeys
            ? t("filler.fetchingKeys")
            : t("filler.encryptedNotice")}
        </Typography>
        {!userPubKey && !isFetchingKeys && (
          <Button variant="contained" onClick={handleLoginAndFetchKeys}>
            {t("filler.loginToAccess")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <FormRenderer
      key={rendererKey}
      formTemplate={formTemplate}
      onInput={handleInput}
      values={values}
      errors={errors}
      onValidateFields={handleValidateFields}
      onFieldsRendered={handleFieldsRendered}
      footer={footer}
      hideTitleImage={hideTitleImage}
      hideDescription={hideDescription}
      formstrBranding={settings?.formstrBranding}
      saveStatus={saveStatus}
      autoSaveEnabled={autoSaveEnabled}
      onToggleAutoSave={toggleAutoSave}
      formAuthorPubkey={formEvent.pubkey}
      responderSecretKey={responderSecretKey}
      onClearForm={handleClearForm}
    />
  );
};
