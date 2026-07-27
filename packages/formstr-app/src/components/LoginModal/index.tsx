import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import LinkIcon from "@mui/icons-material/Link";
import LockIcon from "@mui/icons-material/Lock";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QRCode from "qrcode.react";
import { useTranslation } from "react-i18next";
import { signerManager } from "../../signer";
import { useSnackbar } from "../../providers/SnackbarProvider";
import ThemedUniversalModal from "../UniversalMarkdownModal";

const DEFAULT_NOSTR_CONNECT_RELAY = "wss://relay.nsec.app";

// Reusable login option button
const LoginOptionButton: React.FC<{
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  variant?: "contained" | "outlined";
  loading?: boolean;
}> = ({ icon, text, onClick, variant = "outlined", loading = false }) => (
  <Button
    variant={variant}
    startIcon={icon}
    fullWidth
    size="large"
    onClick={onClick}
    disabled={loading}
    sx={{
      mb: 1,
      // Let long labels wrap instead of forcing an intrinsic min-width wider
      // than a phone screen (which pushed the dialog paper past the viewport).
      whiteSpace: "normal",
      textAlign: "center",
      lineHeight: 1.2,
    }}
  >
    {text}
  </Button>
);

// NIP-46 Section (Manual + QR)
interface Nip46SectionProps {
  onSuccess: () => void;
}
const Nip46Section: React.FC<Nip46SectionProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [activeTab, setActiveTab] = useState("manual");
  const [bunkerUri, setBunkerUri] = useState("");
  const [loadingConnect, setLoadingConnect] = useState(false);

  const [relaysInput, setRelaysInput] = useState(DEFAULT_NOSTR_CONNECT_RELAY);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [qrConnecting, setQrConnecting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const parseRelays = (input: string) =>
    input
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

  const startNostrConnect = async () => {
    const relays = parseRelays(relaysInput);
    if (relays.length === 0) {
      showMessage(t("auth.nip46.enterRelayError"), "error");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setQrUri(null);
    setQrConnecting(true);
    try {
      await signerManager.loginWithNostrConnect(
        relays,
        (uri) => setQrUri(uri),
        controller.signal,
      );
      showMessage(t("auth.nip46.connected"), "success");
      onSuccess();
    } catch (err) {
      if (!controller.signal.aborted) {
        showMessage(t("auth.nip46.connectionFailed"), "error");
      }
    } finally {
      setQrConnecting(false);
    }
  };

  const connectToBunkerUri = async (bunkerUri: string) => {
    await signerManager.loginWithNip46(bunkerUri);
    showMessage(t("auth.nip46.connected"), "success");
    onSuccess();
  };

  const handleConnectManual = async () => {
    if (!bunkerUri) {
      showMessage(t("auth.nip46.enterBunkerUriError"), "error");
      return;
    }
    setLoadingConnect(true);
    try {
      await connectToBunkerUri(bunkerUri);
    } catch (err) {
      showMessage(t("auth.nip46.connectionFailed"), "error");
    } finally {
      setLoadingConnect(false);
    }
  };
  return (
    <Box sx={{ mt: 2 }}>
      <Tabs
        value={activeTab}
        onChange={(_e, tab: string) => {
          abortRef.current?.abort();
          setActiveTab(tab);
          if (tab === "qr") {
            startNostrConnect();
          }
        }}
      >
        <Tab value="manual" label={t("auth.nip46.pasteUri")} />
        <Tab value="qr" label={t("auth.nip46.qrCode")} />
      </Tabs>
      {activeTab === "manual" && (
        <Stack spacing={1} sx={{ width: "100%", mt: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t("auth.nip46.enterBunkerUri")}
            value={bunkerUri}
            onChange={(e) => setBunkerUri(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleConnectManual}
            disabled={loadingConnect}
          >
            {t("common.actions.connect")}
          </Button>
        </Stack>
      )}
      {activeTab === "qr" && (
        <Stack spacing={1} sx={{ width: "100%", mt: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t("auth.nip46.relaysPlaceholder")}
            value={relaysInput}
            onChange={(e) => setRelaysInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") startNostrConnect();
            }}
          />
          <Button size="small" onClick={startNostrConnect} disabled={qrConnecting}>
            {t("auth.nip46.regenerate")}
          </Button>
          <Box sx={{ textAlign: "center", mt: 1 }}>
            {qrUri ? (
              <QRCode value={qrUri} size={180} />
            ) : (
              <Typography color="text.secondary">
                {t("auth.nip46.generatingQr")}
              </Typography>
            )}
            <Box sx={{ mt: 1 }}>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                {t("auth.nip46.usingRelay")}
              </Typography>
            </Box>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

// Ncryptsec (encrypted key) Section
interface NcryptsecSectionProps {
  onSuccess: () => void;
}
const NcryptsecSection: React.FC<NcryptsecSectionProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [ncryptsec, setNcryptsec] = useState(() => signerManager.getSavedNcryptsec() ?? "");
  const [storedNcryptsec, setStoredNcryptsec] = useState(() => !!signerManager.getSavedNcryptsec());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);

  const handleLogin = async () => {
    if (!ncryptsec.trim() || !password) {
      showMessage(t("auth.ncryptsec.enterCredentials"), "error");
      return;
    }
    setLoading(true);
    try {
      await signerManager.loginWithNcryptsec(ncryptsec.trim(), password);
      showMessage(t("auth.ncryptsec.loginSuccess"), "success");
      onSuccess();
    } catch {
      showMessage(t("auth.ncryptsec.loginFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForget = async () => {
    await signerManager.forgetSavedNcryptsec();
    setNcryptsec("");
    setStoredNcryptsec(false);
    setConfirmForget(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1} sx={{ width: "100%" }}>
        <TextField
          size="small"
          fullWidth
          placeholder={t("auth.ncryptsec.encryptedKeyPlaceholder")}
          value={ncryptsec}
          onChange={(e) => setNcryptsec(e.target.value)}
        />
        {storedNcryptsec && (
          <Typography
            color="text.secondary"
            sx={{ fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setConfirmForget(true)}
          >
            {t("auth.ncryptsec.forgetSavedKeyLink")}
          </Typography>
        )}
        <TextField
          size="small"
          fullWidth
          type="password"
          placeholder={t("auth.ncryptsec.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />
        <Button variant="contained" fullWidth disabled={loading} onClick={handleLogin}>
          {t("auth.ncryptsec.signIn")}
        </Button>
      </Stack>
      <Dialog open={confirmForget} onClose={() => setConfirmForget(false)}>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {t("auth.ncryptsec.forgetSavedKey")}
          </Typography>
          <Typography color="text.secondary">
            {t("auth.ncryptsec.forgetSavedKeyBody")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmForget(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={handleForget}>
            {t("auth.ncryptsec.forgetSavedKeyAction")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Sign-Up Section
interface SignUpSectionProps {
  onLogin: () => void;
}

const SignUpSection: React.FC<SignUpSectionProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [step, setStep] = useState<"form" | "backup">("form");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [about, setAbout] = useState("");
  const [picture, setPicture] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ncryptsec, setNcryptsec] = useState("");

  const handleCreate = async () => {
    if (!password) {
      showMessage(t("auth.signUp.passwordRequired"), "error");
      return;
    }
    if (password !== confirmPassword) {
      showMessage(t("auth.signUp.passwordMismatch"), "error");
      return;
    }
    setLoading(true);
    try {
      const result = await signerManager.signUpWithPassword(password, {
        name: name.trim(),
        username: username.trim() || undefined,
        about: about.trim() || undefined,
        picture: picture.trim() || undefined,
      });
      setNcryptsec(result);
      setStep("backup");
    } catch (err) {
      console.error(err);
      showMessage(t("auth.signUp.creationFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "backup") {
    return (
      <Stack spacing={1} sx={{ width: "100%" }}>
        <Alert severity="warning">
          <Typography sx={{ fontWeight: 600 }}>
            {t("auth.signup.backupWarning")}
          </Typography>
        </Alert>
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
          {t("auth.signup.backupLabel")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            background: "#f5f5f5",
            p: 1,
            borderRadius: 1,
          }}
        >
          <Typography
            sx={{ wordBreak: "break-all", fontSize: 12, flex: 1 }}
          >
            {ncryptsec}
          </Typography>
          <Tooltip title={t("common.actions.copy", "Copy")}>
            <IconButton
              size="small"
              onClick={() => navigator.clipboard.writeText(ncryptsec)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Button variant="contained" fullWidth onClick={onLogin}>
          {t("auth.signup.savedKeyButton")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Alert severity="info" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 12 }}>{t("auth.signup.publicInfo")}</Typography>
      </Alert>
      <TextField
        size="small"
        fullWidth
        placeholder={t("auth.signUp.namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        size="small"
        fullWidth
        placeholder={t("auth.signUp.usernamePlaceholder")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        size="small"
        fullWidth
        multiline
        rows={2}
        placeholder={t("auth.signUp.aboutPlaceholder")}
        value={about}
        onChange={(e) => setAbout(e.target.value)}
      />
      <TextField
        size="small"
        fullWidth
        placeholder={t("auth.signUp.picturePlaceholder")}
        value={picture}
        onChange={(e) => setPicture(e.target.value)}
      />

      <Divider sx={{ my: 1 }} />

      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        {t("auth.signup.passwordHint")}
      </Typography>
      <TextField
        size="small"
        fullWidth
        type="password"
        placeholder={t("auth.ncryptsec.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        size="small"
        fullWidth
        type="password"
        placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button variant="contained" fullWidth disabled={loading} onClick={handleCreate}>
        {t("auth.signUp.createAccount")}
      </Button>
    </Stack>
  );
};

// Footer info component
const FooterInfo: React.FC = () => {
  const { t } = useTranslation();
  const [isFAQModalVisible, setIsFAQModalVisible] = useState(false);

  return (
    <Box sx={{ mt: 3, textAlign: "center" }}>
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        {t("auth.footer.keysStayWithYou")}
      </Typography>
      <br />
      <Typography
        component="a"
        sx={{ fontSize: 12, cursor: "pointer", color: "primary.main" }}
        onClick={() => {
          setIsFAQModalVisible(true);
        }}
      >
        {t("auth.footer.needHelp")}
      </Typography>
      <ThemedUniversalModal
        visible={isFAQModalVisible}
        onClose={() => {
          setIsFAQModalVisible(false);
        }}
        filePath="/docs/faq.md"
        title={t("header.faqTitle")}
      />
    </Box>
  );
};

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onLogin }) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState("signin");
  const [showNip46, setShowNip46] = useState(false);
  const [showNcryptsec, setShowNcryptsec] = useState(() => !!signerManager.getSavedNcryptsec());

  const [loadingNip07, setLoadingNip07] = useState(false);

  const handleNip07 = async () => {
    console.log("handle nip07 called");
    if ((window as any).nostr) {
      setLoadingNip07(true);
      try {
        await signerManager.loginWithNip07();
        showMessage(t("auth.messages.nip07Success"), "success");
        onLogin();
      } catch (err) {
        showMessage(t("auth.messages.nip07Failed"), "error");
        onClose();
      } finally {
        setLoadingNip07(false);
      }
    } else {
      showMessage(t("auth.messages.nip07Missing"), "error");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      sx={{ zIndex: 1100 }}
      slotProps={{
        transition: {
          onExited: () => {
            setShowNip46(false);
            setShowNcryptsec(!!signerManager.getSavedNcryptsec());
            setActiveTab("signin");
          },
        },
      }}
    >
      <DialogContent>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h4">{t("auth.welcomeTitle")}</Typography>
          <Typography color="text.secondary">{t("auth.title")}</Typography>
        </Box>
        <Tabs
          value={activeTab}
          onChange={(_e, tab: string) => setActiveTab(tab)}
          variant="fullWidth"
        >
          <Tab value="signin" label={t("auth.signInTab")} />
          <Tab value="signup" label={t("auth.createAccountTab")} />
        </Tabs>
        {activeTab === "signin" && (
          <Box sx={{ mt: 2 }}>
            <Stack spacing={1} sx={{ width: "100%" }}>
              <LoginOptionButton
                icon={<VpnKeyIcon />}
                text={t("auth.options.nip07")}
                variant="contained"
                onClick={handleNip07}
                loading={loadingNip07}
              />
              <LoginOptionButton
                icon={<LockIcon />}
                text={t("auth.options.ncryptsec")}
                onClick={() => {
                  setShowNcryptsec(!showNcryptsec);
                  setShowNip46(false);
                }}
              />
              {showNcryptsec && <NcryptsecSection onSuccess={onLogin} />}
              <LoginOptionButton
                icon={<LinkIcon />}
                text={t("auth.options.remoteSigner")}
                onClick={() => {
                  setShowNip46(!showNip46);
                  setShowNcryptsec(false);
                }}
              />
              {showNip46 && <Nip46Section onSuccess={() => { onLogin(); }} />}
            </Stack>
            <FooterInfo />
          </Box>
        )}
        {activeTab === "signup" && (
          <Box sx={{ mt: 2 }}>
            <SignUpSection onLogin={onLogin} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
