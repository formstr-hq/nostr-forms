import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LanguageIcon from "@mui/icons-material/Language";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactComponent as Logo } from "../../Images/formstr.svg";
import { getHeaderMenu, HEADER_MENU_KEYS } from "./configs";
import { ROUTES } from "../../constants/routes";
import { useProfileContext } from "../../hooks/useProfileContext";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { NostrAvatar } from "./NostrAvatar";
import { useTemplateContext } from "../../provider/TemplateProvider";
import ThemedUniversalModal from "../UniversalMarkdownModal";
import { useTranslation } from "react-i18next";
import {
  changeAppLanguage,
  normalizeLocale,
  SUPPORTED_LOCALES,
} from "../../i18n";
import { SupportUsModal } from "@formstr/support-us-button";
import { truncateNpub } from "../../utils/utility";
import { AccountsMenuList } from "./AccountsMenu";
import { UnlockAccountModal } from "./UnlockAccountModal";
import { NotificationsBell } from "./NotificationsBell";
import { useSnackbar } from "../../providers/SnackbarProvider";
import { muiTheme } from "../../theme/muiTheme";

/**
 * MUI app-bar header (ui-rewrite-mui Phase 2). Behavior is unchanged from the
 * antd version: nav (FAQ modal / contact link / bulletin board), Create form,
 * notifications bell, and a user menu with accounts, storage encryption,
 * support, and language. Layout quirks that required CSS overrides in antd
 * (64px line-height, rc-menu overflow) disappear with flex Toolbar + MUI Menu.
 */
export const NostrHeader = () => {
  const { t, i18n } = useTranslation();
  const { pubkey, accounts, requestPubkey, addAccount } = useProfileContext();
  const {
    localForms,
    isEncrypted,
    encryptionMeta,
    encryptionError,
    enableEncryption,
    disableEncryption,
  } = useLocalForms();
  const { showMessage } = useSnackbar();
  const [isFAQModalVisible, setIsFAQModalVisible] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [encryptionLoading, setEncryptionLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [unlockPubkey, setUnlockPubkey] = useState<string | undefined>(
    undefined,
  );
  const [confirmAddAccount, setConfirmAddAccount] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [accountsAnchor, setAccountsAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [languageAnchor, setLanguageAnchor] = useState<HTMLElement | null>(
    null,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { openTemplateModal } = useTemplateContext();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const currentLocale = normalizeLocale(i18n.resolvedLanguage || i18n.language);
  const currentLocaleLabel =
    SUPPORTED_LOCALES.find((locale) => locale.code === currentLocale)?.label ||
    currentLocale;

  const closeUserMenu = () => {
    setUserMenuAnchor(null);
    setAccountsAnchor(null);
    setLanguageAnchor(null);
  };

  const handleEnableEncryption = async () => {
    setEncryptionLoading(true);
    try {
      const result = await enableEncryption();
      if (result.error) {
        showMessage(result.error.message, "error");
      } else {
        showMessage(t("header.storage.enabledSuccess"), "success");
        setShowEncryptionModal(false);
      }
    } catch (e) {
      showMessage(t("header.storage.enableFailed"), "error");
    } finally {
      setEncryptionLoading(false);
    }
  };

  const handleDisableEncryption = async () => {
    setEncryptionLoading(true);
    try {
      const result = await disableEncryption();
      if (result.error) {
        showMessage(result.error.message, "error");
      } else {
        showMessage(t("header.storage.disabledSuccess"), "success");
        setShowEncryptionModal(false);
      }
    } catch (e) {
      showMessage(t("header.storage.disableFailed"), "error");
    } finally {
      setEncryptionLoading(false);
    }
  };

  const getEncryptionMenuLabel = () => {
    if (encryptionError) {
      if (encryptionError.type === "wrong_key")
        return t("header.storage.wrongKey");
      if (encryptionError.type === "login_required")
        return t("header.storage.loginToDecrypt");
      return t("header.storage.storageError");
    }
    if (isEncrypted) return t("header.storage.encrypted");
    return t("header.storage.unencrypted");
  };

  const getEncryptionMenuIcon = () => {
    if (encryptionError) {
      return <ErrorOutlinedIcon fontSize="small" sx={{ color: "#faad14" }} />;
    }
    if (isEncrypted)
      return <LockOutlinedIcon fontSize="small" sx={{ color: "#52c41a" }} />;
    return <WarningAmberIcon fontSize="small" sx={{ color: "#faad14" }} />;
  };

  const renderEncryptionModalContent = () => {
    if (encryptionError) {
      if (encryptionError.type === "login_required") {
        return (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t("header.storage.encryptedLoginPrompt")}
            </Typography>
            <Button variant="contained" onClick={requestPubkey}>
              {t("common.actions.login")}
            </Button>
          </>
        );
      }
      if (encryptionError.type === "wrong_key") {
        return (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t("header.storage.wrongKeyBody")}
            </Typography>
            {encryptionError.encryptedBy && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{t("common.labels.encryptedBy")}: </strong>
                <code>{truncateNpub(encryptionError.encryptedBy)}</code>
              </Typography>
            )}
            {pubkey && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{t("common.labels.currentKey")}: </strong>
                <code>{truncateNpub(pubkey)}</code>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {t("header.storage.wrongKeyHint")}
            </Typography>
          </>
        );
      }
      return <Typography variant="body2">{encryptionError.message}</Typography>;
    }

    if (isEncrypted) {
      return (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t("header.storage.encryptedBody")}
          </Typography>
          {encryptionMeta?.encryptedBy && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>{t("common.labels.key")}: </strong>
              <code>{truncateNpub(encryptionMeta.encryptedBy)}</code>
            </Typography>
          )}
          <Alert severity="warning">
            {t("header.storage.encryptedWarning")}
          </Alert>
        </>
      );
    }

    // Unencrypted
    return (
      <>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t("header.storage.unencryptedBody")}
        </Typography>
        {pubkey ? (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("header.storage.encryptWithCurrentKey")}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <code>{truncateNpub(pubkey)}</code>
            </Typography>
            <Alert severity="warning">
              {t("header.storage.unencryptedWarning")}
            </Alert>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("header.storage.unencryptedHint")}
          </Typography>
        )}
      </>
    );
  };

  const renderEncryptionModalActions = () => {
    if (encryptionError) {
      return (
        <Button onClick={() => setShowEncryptionModal(false)}>
          {t("common.actions.close")}
        </Button>
      );
    }
    if (isEncrypted) {
      return (
        <>
          <Button onClick={() => setShowEncryptionModal(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDisableEncryption}
            disabled={encryptionLoading}
          >
            {t("header.storage.disableAction")}
          </Button>
        </>
      );
    }
    if (pubkey) {
      return (
        <>
          <Button onClick={() => setShowEncryptionModal(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleEnableEncryption}
            disabled={encryptionLoading}
          >
            {t("header.storage.enableAction")}
          </Button>
        </>
      );
    }
    return (
      <>
        <Button onClick={() => setShowEncryptionModal(false)}>
          {t("common.actions.close")}
        </Button>
        <Button variant="contained" onClick={requestPubkey}>
          {t("common.actions.login")}
        </Button>
      </>
    );
  };

  const getEncryptionModalTitle = () => {
    if (encryptionError) return t("header.storage.storageError");
    if (isEncrypted) return t("header.storage.disableTitle");
    return t("header.storage.enableTitle");
  };

  const handleAddAccount = () => {
    if (!isEncrypted && localForms.length > 0) {
      setConfirmAddAccount(true);
      return;
    }
    closeUserMenu();
    void addAccount();
  };

  const handleLanguageChange = async (locale: string) => {
    const normalizedLocale = normalizeLocale(locale);
    if (normalizedLocale === currentLocale) return;
    setLanguageLoading(true);
    try {
      await changeAppLanguage(normalizedLocale);
    } catch {
      showMessage(t("common.status.languageChangeFailed"), "error");
    } finally {
      setLanguageLoading(false);
    }
  };

  const onNavClick = (key: string) => {
    if (key === HEADER_MENU_KEYS.HELP) {
      setIsFAQModalVisible(true);
      return;
    }
    if (key === HEADER_MENU_KEYS.PUBLIC_FORMS) {
      navigate(ROUTES.PUBLIC_FORMS);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 0.5, sm: 2 } }}>
            <Link to="/" style={{ display: "flex", flexShrink: 0 }}>
              <Logo />
            </Link>
            <Box sx={{ flexGrow: 1 }} />
            {!isMobile &&
              getHeaderMenu(t).map((item) => (
                <Button
                  key={item.key}
                  color="inherit"
                  startIcon={item.icon}
                  {...("href" in item
                    ? {
                        href: item.href,
                        target: "_blank",
                        rel: "noopener noreferrer",
                      }
                    : {})}
                  onClick={() => onNavClick(item.key)}
                  sx={{
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    ...(item.key === HEADER_MENU_KEYS.PUBLIC_FORMS &&
                    location.pathname.startsWith(ROUTES.PUBLIC_FORMS)
                      ? { color: "primary.main", fontWeight: 600 }
                      : {}),
                  }}
                >
                  {item.label}
                </Button>
              ))}
            <Button
              variant="contained"
              aria-label={t("header.createForm")}
              startIcon={<AddIcon />}
              onClick={openTemplateModal}
              sx={
                isMobile
                  ? {
                      minWidth: 40,
                      px: 1,
                      "& .MuiButton-startIcon": { mr: 0, ml: 0 },
                    }
                  : { whiteSpace: "nowrap" }
              }
            >
              {isMobile ? "" : t("header.createForm")}
            </Button>
            <NotificationsBell />
            <Button
              color="inherit"
              aria-label={t("common.labels.userMenu")}
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{ minWidth: 0, px: { xs: 0.5, sm: 1 } }}
            >
              <NostrAvatar pubkey={pubkey} />
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        anchorEl={userMenuAnchor}
        open={!!userMenuAnchor}
        onClose={closeUserMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {accounts.length > 0 ? (
          <MenuItem onClick={(e) => setAccountsAnchor(e.currentTarget)}>
            <ListItemIcon>
              <PersonOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {pubkey
              ? `${t("accounts.title")}: ${truncateNpub(pubkey)}`
              : t("accounts.title")}
            <ChevronRightIcon fontSize="small" sx={{ ml: 2 }} />
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              closeUserMenu();
              void requestPubkey();
            }}
          >
            {t("common.actions.login")}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            closeUserMenu();
            setShowEncryptionModal(true);
          }}
        >
          <ListItemIcon>{getEncryptionMenuIcon()}</ListItemIcon>
          {getEncryptionMenuLabel()}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeUserMenu();
            setShowSupportModal(true);
          }}
        >
          <ListItemIcon>
            <FlashOnIcon fontSize="small" sx={{ color: "#fadb14" }} />
          </ListItemIcon>
          {t("header.supportUs")}
        </MenuItem>
        <Divider />
        <MenuItem onClick={(e) => setLanguageAnchor(e.currentTarget)}>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          {`${t("common.labels.language")}: ${currentLocaleLabel}`}
          <ChevronRightIcon fontSize="small" sx={{ ml: 2 }} />
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={accountsAnchor}
        open={!!accountsAnchor}
        onClose={closeUserMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 260 } } }}
      >
        <AccountsMenuList
          onNeedsPassphrase={(pk) => {
            closeUserMenu();
            setUnlockPubkey(pk);
          }}
          onAddAccount={handleAddAccount}
          onDone={closeUserMenu}
        />
      </Menu>

      <Menu
        anchorEl={languageAnchor}
        open={!!languageAnchor}
        onClose={closeUserMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <MenuItem
            key={locale.code}
            selected={locale.code === currentLocale}
            disabled={languageLoading}
            onClick={() => {
              closeUserMenu();
              void handleLanguageChange(locale.code);
            }}
          >
            {locale.label}
          </MenuItem>
        ))}
      </Menu>

      <Dialog
        open={confirmAddAccount}
        onClose={() => setConfirmAddAccount(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("accounts.unencryptedWarningTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("accounts.unencryptedWarningBody")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAddAccount(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmAddAccount(false);
              closeUserMenu();
              void addAccount();
            }}
          >
            {t("accounts.continueAnyway")}
          </Button>
        </DialogActions>
      </Dialog>

      <ThemedUniversalModal
        visible={isFAQModalVisible}
        onClose={() => {
          setIsFAQModalVisible(false);
        }}
        filePath="/docs/faq.md"
        title={t("header.faqTitle")}
      />
      <Dialog
        open={showEncryptionModal}
        onClose={() => setShowEncryptionModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{getEncryptionModalTitle()}</DialogTitle>
        <DialogContent>{renderEncryptionModalContent()}</DialogContent>
        <DialogActions>{renderEncryptionModalActions()}</DialogActions>
      </Dialog>
      <SupportUsModal
        open={showSupportModal}
        npub="npub1qu7dsd44275lms4x9snnwvnnmgx926nsppmr7lcw9dlj36n4fltqgs7p98"
        onClose={() => setShowSupportModal(false)}
      />
      <UnlockAccountModal
        open={!!unlockPubkey}
        pubkey={unlockPubkey}
        onClose={() => setUnlockPubkey(undefined)}
      />
    </>
  );
};
