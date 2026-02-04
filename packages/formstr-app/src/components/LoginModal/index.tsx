import React, { useState } from "react";
import { Modal, Button, Typography, Space, Input, Tabs, message } from "antd";
import { KeyOutlined, LinkOutlined, UserOutlined } from "@ant-design/icons";
import QRCode from "qrcode.react";
import { signerManager } from "../../signer";
import { getAppSecretKeyFromLocalStorage } from "../../signer/utils";
import { getPublicKey } from "nostr-tools";
import { createNostrConnectURI } from "../../signer/nip46";
import ThemedUniversalModal from "../UniversalMarkdownModal";

const { Title, Text } = Typography;
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
    <Modal open={open} onCancel={onClose} footer={null} centered width={420} zIndex={1100}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Title level={4}>Sign in to Formstr</Title>
        <Text type="secondary">Choose your preferred login method</Text>
      </div>
      <Space direction="vertical" style={{ width: "100%" }}>
        <LoginOptionButton
          icon={<KeyOutlined />}
          text="Sign in with Nostr Extension (NIP-07)"
          type="primary"
          onClick={handleNip07}
          loading={loadingNip07}
        />
        <LoginOptionButton
          icon={<LinkOutlined />}
          text="Connect with Remote Signer (NIP-46)"
          onClick={() => setShowNip46(!showNip46)}
        />
        {showNip46 && <Nip46Section onSuccess={() => {onLogin()}} />}
      </Space>

      <FooterInfo />
    </Modal>
  );
};

export default LoginModal;
