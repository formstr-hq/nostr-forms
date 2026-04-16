import {
  Layout,
  Menu,
  Row,
  Col,
  Dropdown,
  MenuProps,
  Typography,
  Modal,
  Button,
  Alert,
  message,
} from "antd";
import { Link } from "react-router-dom";
import "./index.css";
import { ReactComponent as Logo } from "../../Images/formstr.svg";
import {
  DownOutlined,
  MenuOutlined,
  LockOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { HEADER_MENU, HEADER_MENU_KEYS } from "./configs";
import { useProfileContext } from "../../hooks/useProfileContext";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { NostrAvatar } from "./NostrAvatar";
import { ReactComponent as GeyserIcon } from "../../Images/Geyser.svg";
import { useState } from "react";
import { useTemplateContext } from "../../provider/TemplateProvider";
import ThemedUniversalModal from "../UniversalMarkdownModal";
import { nip19 } from "nostr-tools";

const { Text, Paragraph } = Typography;

const truncateNpub = (pubkey: string): string => {
  try {
    const npub = nip19.npubEncode(pubkey);
    return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
  } catch {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  }
};

export const NostrHeader = () => {
  const { Header } = Layout;
  const { pubkey, requestPubkey, logout } = useProfileContext();
  const {
    isEncrypted,
    encryptionMeta,
    encryptionError,
    enableEncryption,
    disableEncryption,
  } = useLocalForms();
  const [isFAQModalVisible, setIsFAQModalVisible] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptionLoading, setEncryptionLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string[]>([]);
  const { openTemplateModal } = useTemplateContext();

  const handleEnableEncryption = async () => {
    setEncryptionLoading(true);
    try {
      const result = await enableEncryption();
      if (result.error) {
        message.error(result.error.message);
      } else {
        message.success("Storage encryption enabled!");
        setShowEncryptionModal(false);
      }
    } catch (e) {
      message.error("Failed to enable encryption.");
    } finally {
      setEncryptionLoading(false);
    }
  };

  const handleDisableEncryption = async () => {
    setEncryptionLoading(true);
    try {
      const result = await disableEncryption();
      if (result.error) {
        message.error(result.error.message);
      } else {
        message.success("Storage encryption disabled.");
        setShowEncryptionModal(false);
      }
    } catch (e) {
      message.error("Failed to disable encryption.");
    } finally {
      setEncryptionLoading(false);
    }
  };

  const getEncryptionMenuLabel = () => {
    if (encryptionError) {
      if (encryptionError.type === "wrong_key") return "Wrong Encryption Key";
      if (encryptionError.type === "login_required") return "Login to Decrypt";
      return "Storage Error";
    }
    if (isEncrypted) return "Storage Encrypted";
    return "Unencrypted Storage";
  };

  const getEncryptionMenuIcon = () => {
    if (encryptionError) {
      return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
    }
    if (isEncrypted) return <LockOutlined style={{ color: "#52c41a" }} />;
    return <WarningOutlined style={{ color: "#faad14" }} />;
  };

  const renderEncryptionModalContent = () => {
    if (encryptionError) {
      if (encryptionError.type === "login_required") {
        return (
          <>
            <Paragraph>
              Your forms are encrypted. Please login to access them.
            </Paragraph>
            <Button type="primary" onClick={requestPubkey}>
              Login
            </Button>
          </>
        );
      }
      if (encryptionError.type === "wrong_key") {
        return (
          <>
            <Paragraph>
              Your forms were encrypted with a different Nostr key.
            </Paragraph>
            {encryptionError.encryptedBy && (
              <Paragraph>
                <Text strong>Encrypted by: </Text>
                <Text code>{truncateNpub(encryptionError.encryptedBy)}</Text>
              </Paragraph>
            )}
            {pubkey && (
              <Paragraph>
                <Text strong>Current key: </Text>
                <Text code>{truncateNpub(pubkey)}</Text>
              </Paragraph>
            )}
            <Paragraph type="secondary">
              Please login with the correct key to access your forms.
            </Paragraph>
          </>
        );
      }
      return <Paragraph>{encryptionError.message}</Paragraph>;
    }

    if (isEncrypted) {
      return (
        <>
          <Paragraph>
            Your form keys are encrypted with your Nostr key.
          </Paragraph>
          {encryptionMeta?.encryptedBy && (
            <Paragraph>
              <Text strong>Key: </Text>
              <Text code>{truncateNpub(encryptionMeta.encryptedBy)}</Text>
            </Paragraph>
          )}
          <Alert
            message="Disabling encryption will store your form keys in plain text in this browser."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </>
      );
    }

    // Unencrypted
    return (
      <>
        <Paragraph>
          Your form keys are stored unencrypted in this browser. If your browser
          is compromised, these keys could be exposed.
        </Paragraph>
        {pubkey ? (
          <>
            <Paragraph>
              Your forms will be encrypted with your current Nostr key:
            </Paragraph>
            <Paragraph>
              <Text code>{truncateNpub(pubkey)}</Text>
            </Paragraph>
            <Alert
              message="You'll only be able to access your locally stored forms when logged in with this key. If you lose access to this key, your forms will be inaccessible."
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        ) : (
          <Paragraph type="secondary">
            Login to enable encryption for your stored forms.
          </Paragraph>
        )}
      </>
    );
  };

  const getEncryptionModalFooter = () => {
    if (encryptionError) {
      return [
        <Button key="close" onClick={() => setShowEncryptionModal(false)}>
          Close
        </Button>,
      ];
    }
    if (isEncrypted) {
      return [
        <Button key="cancel" onClick={() => setShowEncryptionModal(false)}>
          Cancel
        </Button>,
        <Button
          key="disable"
          danger
          onClick={handleDisableEncryption}
          loading={encryptionLoading}
        >
          Disable Encryption
        </Button>,
      ];
    }
    // Unencrypted
    if (pubkey) {
      return [
        <Button key="cancel" onClick={() => setShowEncryptionModal(false)}>
          Cancel
        </Button>,
        <Button
          key="enable"
          type="primary"
          onClick={handleEnableEncryption}
          loading={encryptionLoading}
        >
          Enable Encryption
        </Button>,
      ];
    }
    return [
      <Button key="close" onClick={() => setShowEncryptionModal(false)}>
        Close
      </Button>,
      <Button key="login" type="primary" onClick={requestPubkey}>
        Login
      </Button>,
    ];
  };

  const getEncryptionModalTitle = () => {
    if (encryptionError) return "Storage Error";
    if (isEncrypted) return "Disable Encryption?";
    return "Encrypt Local Storage?";
  };

  const onMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === HEADER_MENU_KEYS.USER) {
      return;
    }
    if (e.key === HEADER_MENU_KEYS.HELP) {
      setIsFAQModalVisible(true);
      setSelectedKey([e.key]);
      return;
    }
    if (e.key === HEADER_MENU_KEYS.CREATE_FORMS) {
      openTemplateModal();
      return;
    }
    setSelectedKey([e.key]);
  };

  const dropdownMenuItems: MenuProps["items"] = [
    ...[
      pubkey
        ? {
            key: "logout",
            label: <a onClick={logout}>Logout</a>,
          }
        : {
            key: "login",
            label: <a onClick={requestPubkey}>Login</a>,
          },
    ],
    {
      key: "encryption",
      icon: getEncryptionMenuIcon(),
      label: getEncryptionMenuLabel(),
      onClick: () => setShowEncryptionModal(true),
    },
    {
      key: "Support Us",
      icon: (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <GeyserIcon
            style={{
              color: "white",
              strokeWidth: 20,
              fill: "black",
              stroke: "black",
              maxHeight: 20,
              maxWidth: 20,
              backgroundColor: "black",
              marginRight: 5,
            }}
          />
          <Typography.Text style={{ marginTop: 2 }}>
            {" "}
            Support Us
          </Typography.Text>
        </div>
      ),
      onClick: () => {
        window.open("https://geyser.fund/project/formstr", "_blank");
      },
    },
  ];

  const User = {
    key: HEADER_MENU_KEYS.USER,
    icon: (
      <div>
        <Dropdown
          menu={{
            items: dropdownMenuItems,
            overflowedIndicator: null,
            style: { overflow: "auto" },
          }}
          trigger={["click"]}
        >
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <NostrAvatar pubkey={pubkey} /> <DownOutlined />
          </div>
        </Dropdown>
      </div>
    ),
  };
  const newHeaderMenu = [...HEADER_MENU, User];
  return (
    <>
      <Header
        className="header-style"
        style={{
          background: "white",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Row className="header-row" justify="space-between">
          <Col>
            <Link className="app-link" to="/">
              <Logo />
            </Link>
          </Col>
          <Col md={12} xs={10} sm={2}>
            <Menu
              mode="horizontal"
              theme="light"
              defaultSelectedKeys={[]}
              selectedKeys={selectedKey}
              overflowedIndicator={<MenuOutlined />}
              items={newHeaderMenu}
              onClick={onMenuClick}
            />
          </Col>
        </Row>
      </Header>
      <ThemedUniversalModal
        visible={isFAQModalVisible}
        onClose={() => {
          setIsFAQModalVisible(false);
          setSelectedKey([]);
        }}
        filePath="/docs/faq.md"
        title="Frequently Asked Questions"
      />
      <Modal
        title={getEncryptionModalTitle()}
        open={showEncryptionModal}
        onCancel={() => setShowEncryptionModal(false)}
        footer={getEncryptionModalFooter()}
      >
        {renderEncryptionModalContent()}
      </Modal>
    </>
  );
};
