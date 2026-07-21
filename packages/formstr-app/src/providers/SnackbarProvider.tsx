import { Alert, Snackbar } from "@mui/material";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";

interface SnackbarContextValue {
  showMessage: (text: string, severity?: SnackbarSeverity) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({
  showMessage: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

/**
 * Imperative bridge for non-component callers (e.g. utils/fileDownload.ts)
 * that can't use the useSnackbar() hook. The mounted SnackbarProvider
 * registers its handler here; showSnackbar() no-ops until then.
 */
let imperativeShowMessage: SnackbarContextValue["showMessage"] | null = null;

export const showSnackbar = (text: string, severity?: SnackbarSeverity) => {
  imperativeShowMessage?.(text, severity);
};

interface SnackbarState {
  open: boolean;
  text: string;
  severity: SnackbarSeverity;
}

/**
 * MUI replacement for antd's `message` API. Component code calls
 * `useSnackbar().showMessage(...)`; Phase 6 adds an imperative bridge for
 * non-component callers (e.g. utils/fileDownload.ts).
 */
export const SnackbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<SnackbarState>({
    open: false,
    text: "",
    severity: "info",
  });

  const showMessage = useCallback(
    (text: string, severity: SnackbarSeverity = "info") => {
      setState({ open: true, text, severity });
    },
    [],
  );

  useEffect(() => {
    imperativeShowMessage = showMessage;
    return () => {
      if (imperativeShowMessage === showMessage) imperativeShowMessage = null;
    };
  }, [showMessage]);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={state.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {state.text}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export default SnackbarProvider;
