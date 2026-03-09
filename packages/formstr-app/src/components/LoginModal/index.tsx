import React, { useState } from "react";
import { Modal, Button, Typography, Space, Input, Tabs, message, Alert, Divider } from "antd";
import { KeyOutlined, LinkOutlined, LockOutlined } from "@ant-design/icons";
import QRCode from "qrcode.react";
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
    message.success("Connected to Remote Signer");
    onSuccess();
  };

  const handleConnectManual = async () => {
    if (!bunkerUri) {
      message.error("Please enter a bunker URI.");
      return;
    }
    setLoadingConnect(true);
    try {
      await connectToBunkerUri(bunkerUri);
    } catch (err) {
      message.error("Connection failed.");
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
        <TabPane tab="Paste URI" key="manual">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              placeholder="Enter bunker URI"
              value={bunkerUri}
              onChange={(e) => setBunkerUri(e.target.value)}
            />
            <Button
              type="primary"
              onClick={handleConnectManual}
              loading={loadingConnect}
            >
              Connect
            </Button>
          </Space>
        </TabPane>
        <TabPane tab="QR Code" key="qr">
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <QRCode value={qrPayload} size={180} />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Using relay.nsec.app for communication
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
  const [ncryptsec, setNcryptsec] = useState(() => getNcryptsecFromLocalStorage() ?? "");
  const [storedNcryptsec, setStoredNcryptsec] = useState(() => !!getNcryptsecFromLocalStorage());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!ncryptsec.trim() || !password) {
      message.error("Please enter your encrypted key and password.");
      return;
    }
    setLoading(true);
    try {
      await signerManager.loginWithNcryptsec(ncryptsec.trim(), password);
      message.success("Logged in successfully.");
      onSuccess();
    } catch {
      message.error("Invalid key or wrong password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForget = () => {
    Modal.confirm({
      title: "Forget saved key?",
      content:
        "This will remove your encrypted key from this device. You will need to paste it manually next time you sign in. Make sure you have it backed up before continuing.",
      okText: "Forget key",
      okType: "danger",
      cancelText: "Cancel",
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
          placeholder="ncryptsec1..."
          value={ncryptsec}
          onChange={(e) => setNcryptsec(e.target.value)}
        />
        {storedNcryptsec && (
          <Text
            type="secondary"
            style={{ fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            onClick={handleForget}
          >
            Forget saved key
          </Text>
        )}
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleLogin}
        />
        <Button type="primary" block loading={loading} onClick={handleLogin}>
          Sign In
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
      message.error("Password is required.");
      return;
    }
    if (password !== confirmPassword) {
      message.error("Passwords do not match.");
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
      message.error("Account creation failed. Please try again.");
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
              Save this encrypted key. It's the only way to recover your account.
            </Text>
          }
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Your encrypted private key (ncryptsec):
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
          I've saved my key
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
            This information will be public on the Nostr network — share only
            as much as you're comfortable with.
          </Text>
        }
        style={{ marginBottom: 4 }}
      />
      <Input
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Username (optional)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input.TextArea
        placeholder="About (optional)"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={2}
      />
      <Input
        placeholder="Picture URL (optional)"
        value={picture}
        onChange={(e) => setPicture(e.target.value)}
      />

      <Divider style={{ margin: "8px 0" }} />

      <Text type="secondary" style={{ fontSize: 12 }}>
        Your Nostr key will be encrypted with this password. Choose it carefully
        — there's no way to recover your account without it.
      </Text>
      <Input.Password
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input.Password
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button type="primary" block loading={loading} onClick={handleCreate}>
        Create Account
      </Button>
    </Space>
  );
};

// Footer info component
const FooterInfo: React.FC = () => {
  const [isFAQModalVisible, setIsFAQModalVisible] = useState(false);

  return (
    <div style={{ marginTop: 24, textAlign: "center" }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Your keys never leave your control.
      </Text>
      <br />
      <a
        style={{ fontSize: 12 }}
        onClick={() => {
          setIsFAQModalVisible(true);
        }}
      >
        Need help?
      </a>
      <ThemedUniversalModal
        visible={isFAQModalVisible}
        onClose={() => {
          setIsFAQModalVisible(false);
        }}
        filePath="/docs/faq.md"
        title="Frequently Asked Questions"
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
  const [showNip46, setShowNip46] = useState(false);
  const [showNcryptsec, setShowNcryptsec] = useState(() => !!getNcryptsecFromLocalStorage());

  const [loadingNip07, setLoadingNip07] = useState(false);

  const handleNip07 = async () => {
    console.log("handle nip07 called");
    if ((window as any).nostr) {
      setLoadingNip07(true);
      try {
        await signerManager.loginWithNip07();
        message.success("Logged in with NIP-07");
        onLogin();
      } catch (err) {
        message.error("Login failed.");
        onClose();
      } finally {
        setLoadingNip07(false);
      }
    } else {
      message.error("No NIP-07 extension found.");
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered width={420} zIndex={1100} destroyOnClose>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4}>Welcome to Formstr</Title>
        <Text type="secondary">Sign in or create a new account</Text>
      </div>
      <Tabs defaultActiveKey="signin">
        <TabPane tab="Sign In" key="signin">
          <Space direction="vertical" style={{ width: "100%" }}>
            <LoginOptionButton
              icon={<KeyOutlined />}
              text="Sign in with Nostr Extension (NIP-07)"
              type="primary"
              onClick={handleNip07}
              loading={loadingNip07}
            />
            <LoginOptionButton
              icon={<LockOutlined />}
              text="Sign in with Encrypted Key"
              onClick={() => { setShowNcryptsec(!showNcryptsec); setShowNip46(false); }}
            />
            {showNcryptsec && <NcryptsecSection onSuccess={onLogin} />}
            <LoginOptionButton
              icon={<LinkOutlined />}
              text="Connect with Remote Signer (NIP-46)"
              onClick={() => { setShowNip46(!showNip46); setShowNcryptsec(false); }}
            />
            {showNip46 && <Nip46Section onSuccess={() => { onLogin(); }} />}
          </Space>
          <FooterInfo />
        </TabPane>
        <TabPane tab="Create Account" key="signup">
          <SignUpSection onLogin={onLogin} />
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default LoginModal;
