import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ILocalForm } from "../containers/CreateFormNew/providers/FormBuilder/typeDefs";
import { signerManager } from "../signer";
import {
  getLocalForms,
  setLocalForms,
  enableEncryption as enableEncryptionService,
  disableEncryption as disableEncryptionService,
  isStorageEncrypted,
  getEncryptionMeta,
  initializeEncryptionMeta,
  EncryptedStorageError,
} from "../utils/encryptedStorage";
import { LocalFormsMeta } from "../utils/localStorage";
import { useProfileContext } from "../hooks/useProfileContext";

export interface LocalFormsContextType {
  localForms: ILocalForm[];
  isLoading: boolean;
  isEncrypted: boolean;
  encryptionMeta: LocalFormsMeta | null;
  encryptionError: EncryptedStorageError | null;

  // Operations
  refreshForms: () => Promise<void>;
  saveLocalForm: (form: ILocalForm) => Promise<void>;
  deleteLocalForm: (formKey: string) => Promise<void>;

  // Encryption management
  enableEncryption: () => Promise<{ error?: EncryptedStorageError }>;
  disableEncryption: () => Promise<{ error?: EncryptedStorageError }>;
}

const LocalFormsContext = createContext<LocalFormsContextType | undefined>(
  undefined,
);

interface LocalFormsProviderProps {
  children: ReactNode;
}

export const LocalFormsProvider: React.FC<LocalFormsProviderProps> = ({
  children,
}) => {
  const [localForms, setLocalFormsState] = useState<ILocalForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionError, setEncryptionError] =
    useState<EncryptedStorageError | null>(null);

  const { pubkey } = useProfileContext();

  // Initialize encryption metadata on mount
  useEffect(() => {
    initializeEncryptionMeta();
  }, []);

  // Load forms when pubkey changes or on mount
  const refreshForms = useCallback(async () => {
    setIsLoading(true);
    setEncryptionError(null);

    try {
      let signer = null;
      if (pubkey) {
        try {
          signer = await signerManager.getSigner();
        } catch {
          // No signer available — unencrypted forms can still be read
        }
      }
      const { forms, error } = await getLocalForms(signer, pubkey);
      setLocalFormsState(forms);
      if (error) {
        setEncryptionError(error);
      }
    } catch (e) {
      console.error("Failed to load forms:", e);
    } finally {
      setIsLoading(false);
    }
  }, [pubkey]);

  useEffect(() => {
    refreshForms();
  }, [refreshForms]);

  // Save a form
  const saveLocalForm = useCallback(
    async (form: ILocalForm) => {
      const existingForms = [...localForms];
      const existingIndex = existingForms.findIndex((f) => f.key === form.key);

      let updatedForms: ILocalForm[];
      if (existingIndex >= 0) {
        updatedForms = [...existingForms];
        updatedForms[existingIndex] = form;
      } else {
        updatedForms = [...existingForms, form];
      }

      const signer = await signerManager.getSigner();

      const { error } = await setLocalForms(updatedForms, signer, pubkey);
      if (error) {
        throw new Error(error.message);
      }

      setLocalFormsState(updatedForms);
    },
    [localForms, pubkey],
  );

  // Delete a form
  const deleteLocalForm = useCallback(
    async (formKey: string) => {
      const updatedForms = localForms.filter((f) => f.key !== formKey);

      const signer = await signerManager.getSigner();

      const { error } = await setLocalForms(updatedForms, signer, pubkey);
      if (error) {
        throw new Error(error.message);
      }

      setLocalFormsState(updatedForms);
    },
    [localForms, pubkey],
  );

  // Force a re-render to pick up encryption state changes from localStorage
  // without triggering a full decrypt cycle via refreshForms
  const [, forceUpdate] = useState(0);

  // Enable encryption
  const enableEncryption = useCallback(async () => {
    const signer = await signerManager.getSigner();
    if (!signer) {
      return {
        error: {
          type: "login_required" as const,
          message: "Please login first to enable encryption.",
        },
      };
    }

    let signerPubkey: string;
    try {
      signerPubkey = await signer.getPublicKey();
    } catch {
      return {
        error: {
          type: "login_required" as const,
          message: "Please login first to enable encryption.",
        },
      };
    }

    const result = await enableEncryptionService(signer, signerPubkey);
    if (!result.error) {
      setEncryptionError(null);
      forceUpdate((n) => n + 1);
    }
    return result;
  }, []);

  // Disable encryption
  const disableEncryption = useCallback(async () => {
    const signer = await signerManager.getSigner();
    if (!signer) {
      return {
        error: {
          type: "login_required" as const,
          message: "Please login first to disable encryption.",
        },
      };
    }

    let signerPubkey: string;
    try {
      signerPubkey = await signer.getPublicKey();
    } catch {
      return {
        error: {
          type: "login_required" as const,
          message: "Please login first to disable encryption.",
        },
      };
    }

    const result = await disableEncryptionService(signer, signerPubkey);
    if (!result.error) {
      setEncryptionError(null);
      forceUpdate((n) => n + 1);
    }
    return result;
  }, []);

  const value: LocalFormsContextType = {
    localForms,
    isLoading,
    isEncrypted: isStorageEncrypted(),
    encryptionMeta: getEncryptionMeta(),
    encryptionError,
    refreshForms,
    saveLocalForm,
    deleteLocalForm,
    enableEncryption,
    disableEncryption,
  };

  return (
    <LocalFormsContext.Provider value={value}>
      {children}
    </LocalFormsContext.Provider>
  );
};

export const useLocalForms = (): LocalFormsContextType => {
  const context = useContext(LocalFormsContext);
  if (!context) {
    throw new Error("useLocalForms must be used within a LocalFormsProvider");
  }
  return context;
};

export default LocalFormsContext;
