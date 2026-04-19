import React, { useState } from "react";
import { Modal, Button, Typography, Space, Input, Tabs, message, Alert, Divider } from "antd";
import { KeyOutlined, LinkOutlined, LockOutlined } from "@ant-design/icons";
import QRCode from "qrcode.react";
import { useTranslation } from "react-i18next";
import { signerManager } from "../../signer";
import { getAppSecretKeyFromLocalStorage, getNcryptsecFromLocalStorage, removeNcryptsecFromLocalStorage } from "../../signer/utils";
import { getPublicKey } from "nostr-tools";
import { createNostrConnectURI } from "../../signer/nip46";
import ThemedUniversalModal from "../UniversalMarkdownModal";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Reusable login option button
const LoginOptionButton: React.FC<{
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  type?: "primary" | "default";
  loading?: boolean;
}> = ({ icon, text, onClick, type = "default", loading = false }) => (
  <Button
    type={type}
    icon={icon}
    block
    size="large"
    onClick={onClick}
    style={{ marginBottom: 8 }}
    loading={loading}
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
  const [activeTab, setActiveTab] = useState("manual");
  const [bunkerUri, setBunkerUri] = useState("");
  const [loadingConnect, setLoadingConnect] = useState(false);

  const [qrPayload] = useState(() => generateNostrConnectURI());

  function generateNostrConnectURI() {
    const clientSecretKey = getAppSecretKeyFromLocalStorage();
    const clientPubkey = getPublicKey(clientSecretKey);

    // Required secret (short random string)
    const secret = Math.random().toString(36).slice(2, 10);

    // Permissions you want (optional, but usually good to ask explicitly)
    const perms = [
      "nip44_encrypt",
      "nip44_decrypt",
      "sign_event",
      "get_public_key",
    ];

    // Build query params
    const params = {
      clientPubkey,
      relays: ["wss://relay.nsec.app"],
      secret,
      perms,
      name: "Formstr",
      url: window.location.origin,
    };

    const finalUrl = createNostrConnectURI(params);
    console.log("FINAL URL is", finalUrl);
    return finalUrl;
  }

  const connectToBunkerUri = async (bunkerUri: string) => {
    await signerManager.loginWithNip46(bunkerUri);
    message.success(t("auth.nip46.connected"));
    onSuccess();
  };

  const handleConnectManual = async () => {
    if (!bunkerUri) {
      message.error(t("auth.nip46.enterBunkerUriError"));
      return;
    }
    setLoadingConnect(true);
    try {
      await connectToBunkerUri(bunkerUri);
    } catch (err) {
      message.error(t("auth.nip46.connectionFailed"));
    } finally {
      setLoadingConnect(false);
    }
  };
  return (
    <div style={{ marginTop: 16 }}>
      <Tabs
        activeKey={activeTab}
        onChange={(tab: string) => {
          setActiveTab(tab);
          if (tab === "qr") {
            connectToBunkerUri(qrPayload);
          }
        }}
      >
        <TabPane tab={t("auth.nip46.pasteUri")} key="manual">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              placeholder={t("auth.nip46.enterBunkerUri")}
              value={bunkerUri}
              onChange={(e) => setBunkerUri(e.target.value)}
            />
            <Button
              type="primary"
              onClick={handleConnectManual}
              loading={loadingConnect}
            >
              {t("common.actions.connect")}
            </Button>
          </Space>
        </TabPane>
        <TabPane tab={t("auth.nip46.qrCode")} key="qr">
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <QRCode value={qrPayload} size={180} />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("auth.nip46.usingRelay")}
              </Text>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

// Ncryptsec (encrypted key) Section
interface NcryptsecSectionProps {
  onSuccess: () => void;
}
const NcryptsecSection: React.FC<NcryptsecSectionProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [ncryptsec, setNcryptsec] = useState(() => getNcryptsecFromLocalStorage() ?? "");
  const [storedNcryptsec, setStoredNcryptsec] = useState(() => !!getNcryptsecFromLocalStorage());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!ncryptsec.trim() || !password) {
      message.error(t("auth.ncryptsec.enterCredentials"));
      return;
    }
    setLoading(true);
    try {
      await signerManager.loginWithNcryptsec(ncryptsec.trim(), password);
      message.success(t("auth.ncryptsec.loginSuccess"));
      onSuccess();
    } catch {
      message.error(t("auth.ncryptsec.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleForget = () => {
    Modal.confirm({
      title: t("auth.ncryptsec.forgetSavedKey"),
      content: t("auth.ncryptsec.forgetSavedKeyBody"),
      okText: t("auth.ncryptsec.forgetSavedKeyAction"),
      okType: "danger",
      cancelText: t("common.actions.cancel"),
      onOk() {
        removeNcryptsecFromLocalStorage();
        setNcryptsec("");
        setStoredNcryptsec(false);
      },
    });
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input
          placeholder={t("auth.ncryptsec.encryptedKeyPlaceholder")}
          value={ncryptsec}
          onChange={(e) => setNcryptsec(e.target.value)}
        />
        {storedNcryptsec && (
          <Text
            type="secondary"
            style={{ fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            onClick={handleForget}
          >
            {t("auth.ncryptsec.forgetSavedKeyLink")}
          </Text>
        )}
        <Input.Password
          placeholder={t("auth.ncryptsec.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleLogin}
        />
        <Button type="primary" block loading={loading} onClick={handleLogin}>
          {t("auth.ncryptsec.signIn")}
        </Button>
      </Space>
    </div>
  );
};

// Sign-Up Section
interface SignUpSectionProps {
  onLogin: () => void;
}

const SignUpSection: React.FC<SignUpSectionProps> = ({ onLogin }) => {
  const { t } = useTranslation();
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
      message.error(t("auth.signUp.passwordRequired"));
      return;
    }
    if (password !== confirmPassword) {
      message.error(t("auth.signUp.passwordMismatch"));
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
      message.error(t("auth.signUp.creationFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (step === "backup") {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert
          type="warning"
          showIcon
          message={
            <Text strong>
              {t("auth.signup.backupWarning")}
            </Text>
          }
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t("auth.signup.backupLabel")}
        </Text>
        <Paragraph
          copyable
          style={{
            background: "#f5f5f5",
            padding: 8,
            borderRadius: 4,
            wordBreak: "break-all",
            fontSize: 12,
          }}
        >
          {ncryptsec}
        </Paragraph>
        <Button type="primary" block onClick={onLogin}>
          {t("auth.signup.savedKeyButton")}
        </Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message={
          <Text style={{ fontSize: 12 }}>
            {t("auth.signup.publicInfo")}
          </Text>
        }
        style={{ marginBottom: 4 }}
      />
      <Input
        placeholder={t("auth.signUp.namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder={t("auth.signUp.usernamePlaceholder")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input.TextArea
        placeholder={t("auth.signUp.aboutPlaceholder")}
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={2}
      />
      <Input
        placeholder={t("auth.signUp.picturePlaceholder")}
        value={picture}
        onChange={(e) => setPicture(e.target.value)}
      />

      <Divider style={{ margin: "8px 0" }} />

      <Text type="secondary" style={{ fontSize: 12 }}>
        {t("auth.signup.passwordHint")}
      </Text>
      <Input.Password
        placeholder={t("auth.ncryptsec.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input.Password
        placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button type="primary" block loading={loading} onClick={handleCreate}>
        {t("auth.signUp.createAccount")}
      </Button>
    </Space>
  );
};

// Footer info component
const FooterInfo: React.FC = () => {
  const { t } = useTranslation();
  const [isFAQModalVisible, setIsFAQModalVisible] = useState(false);

  return (
    <div style={{ marginTop: 24, textAlign: "center" }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {t("auth.footer.keysStayWithYou")}
      </Text>
      <br />
      <a
        style={{ fontSize: 12 }}
        onClick={() => {
          setIsFAQModalVisible(true);
        }}
      >
        {t("auth.footer.needHelp")}
      </a>
      <ThemedUniversalModal
        visible={isFAQModalVisible}
        onClose={() => {
          setIsFAQModalVisible(false);
        }}
        filePath="/docs/faq.md"
        title={t("header.faqTitle")}
      />
    </div>
  );
};

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onLogin }) => {
  const { t } = useTranslation();
  const [showNip46, setShowNip46] = useState(false);
  const [showNcryptsec, setShowNcryptsec] = useState(() => !!getNcryptsecFromLocalStorage());

  const [loadingNip07, setLoadingNip07] = useState(false);

  const handleNip07 = async () => {
    console.log("handle nip07 called");
    if ((window as any).nostr) {
      setLoadingNip07(true);
      try {
        await signerManager.loginWithNip07();
        message.success(t("auth.messages.nip07Success"));
        onLogin();
      } catch (err) {
        message.error(t("auth.messages.nip07Failed"));
        onClose();
      } finally {
        setLoadingNip07(false);
      }
    } else {
      message.error(t("auth.messages.nip07Missing"));
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered width={420} zIndex={1100} destroyOnClose>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4}>{t("auth.welcomeTitle")}</Title>
        <Text type="secondary">{t("auth.title")}</Text>
      </div>
      <Tabs defaultActiveKey="signin">
        <TabPane tab={t("auth.signInTab")} key="signin">
          <Space direction="vertical" style={{ width: "100%" }}>
            <LoginOptionButton
              icon={<KeyOutlined />}
              text={t("auth.options.nip07")}
              type="primary"
              onClick={handleNip07}
              loading={loadingNip07}
            />
            <LoginOptionButton
              icon={<LockOutlined />}
              text={t("auth.options.ncryptsec")}
              onClick={() => { setShowNcryptsec(!showNcryptsec); setShowNip46(false); }}
            />
            {showNcryptsec && <NcryptsecSection onSuccess={onLogin} />}
            <LoginOptionButton
              icon={<LinkOutlined />}
              text={t("auth.options.remoteSigner")}
              onClick={() => { setShowNip46(!showNip46); setShowNcryptsec(false); }}
            />
            {showNip46 && <Nip46Section onSuccess={() => { onLogin(); }} />}
          </Space>
          <FooterInfo />
        </TabPane>
        <TabPane tab={t("auth.createAccountTab")} key="signup">
          <SignUpSection onLogin={onLogin} />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default LoginModal;
