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
  Select,
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
  GlobalOutlined,
} from "@ant-design/icons";
import { getHeaderMenu, HEADER_MENU_KEYS } from "./configs";
import { useProfileContext } from "../../hooks/useProfileContext";
import { useLocalForms } from "../../provider/LocalFormsProvider";
import { NostrAvatar } from "./NostrAvatar";
import { ReactComponent as GeyserIcon } from "../../Images/Geyser.svg";
import { useState } from "react";
import { useTemplateContext } from "../../provider/TemplateProvider";
import ThemedUniversalModal from "../UniversalMarkdownModal";
import { nip19 } from "nostr-tools";
import { useTranslation } from "react-i18next";
import { saveLocalePreference, SUPPORTED_LOCALES } from "../../i18n";

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
  const { t, i18n } = useTranslation();
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
        message.success(t("header.storage.enabledSuccess"));
        setShowEncryptionModal(false);
      }
    } catch (e) {
      message.error(t("header.storage.enableFailed"));
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
        message.success(t("header.storage.disabledSuccess"));
        setShowEncryptionModal(false);
      }
    } catch (e) {
      message.error(t("header.storage.disableFailed"));
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
              {t("header.storage.encryptedLoginPrompt")}
            </Paragraph>
            <Button type="primary" onClick={requestPubkey}>
              {t("common.actions.login")}
            </Button>
          </>
        );
      }
      if (encryptionError.type === "wrong_key") {
        return (
          <>
            <Paragraph>
              {t("header.storage.wrongKeyBody")}
            </Paragraph>
            {encryptionError.encryptedBy && (
              <Paragraph>
                <Text strong>{t("common.labels.encryptedBy")}: </Text>
                <Text code>{truncateNpub(encryptionError.encryptedBy)}</Text>
              </Paragraph>
            )}
            {pubkey && (
              <Paragraph>
                <Text strong>{t("common.labels.currentKey")}: </Text>
                <Text code>{truncateNpub(pubkey)}</Text>
              </Paragraph>
            )}
            <Paragraph type="secondary">
              {t("header.storage.wrongKeyHint")}
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
            {t("header.storage.encryptedBody")}
          </Paragraph>
          {encryptionMeta?.encryptedBy && (
            <Paragraph>
              <Text strong>{t("common.labels.key")}: </Text>
              <Text code>{truncateNpub(encryptionMeta.encryptedBy)}</Text>
            </Paragraph>
          )}
          <Alert
            message={t("header.storage.encryptedWarning")}
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
          {t("header.storage.unencryptedBody")}
        </Paragraph>
        {pubkey ? (
          <>
            <Paragraph>
              {t("header.storage.encryptWithCurrentKey")}
            </Paragraph>
            <Paragraph>
              <Text code>{truncateNpub(pubkey)}</Text>
            </Paragraph>
            <Alert
              message={t("header.storage.unencryptedWarning")}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        ) : (
          <Paragraph type="secondary">
            {t("header.storage.unencryptedHint")}
          </Paragraph>
        )}
      </>
    );
  };

  const getEncryptionModalFooter = () => {
    if (encryptionError) {
      return [
        <Button key="close" onClick={() => setShowEncryptionModal(false)}>
          {t("common.actions.close")}
        </Button>,
      ];
    }
    if (isEncrypted) {
      return [
        <Button key="cancel" onClick={() => setShowEncryptionModal(false)}>
          {t("common.actions.cancel")}
        </Button>,
        <Button
          key="disable"
          danger
          onClick={handleDisableEncryption}
          loading={encryptionLoading}
        >
          {t("header.storage.disableAction")}
        </Button>,
      ];
    }
    // Unencrypted
    if (pubkey) {
      return [
        <Button key="cancel" onClick={() => setShowEncryptionModal(false)}>
          {t("common.actions.cancel")}
        </Button>,
        <Button
          key="enable"
          type="primary"
          onClick={handleEnableEncryption}
          loading={encryptionLoading}
        >
          {t("header.storage.enableAction")}
        </Button>,
      ];
    }
    return [
      <Button key="close" onClick={() => setShowEncryptionModal(false)}>
        {t("common.actions.close")}
      </Button>,
      <Button key="login" type="primary" onClick={requestPubkey}>
        {t("common.actions.login")}
      </Button>,
    ];
  };

  const getEncryptionModalTitle = () => {
    if (encryptionError) return t("header.storage.storageError");
    if (isEncrypted) return t("header.storage.disableTitle");
    return t("header.storage.enableTitle");
  };

  const handleLanguageChange = (locale: string) => {
    saveLocalePreference(locale);
    i18n.changeLanguage(locale);
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
            label: <a onClick={logout}>{t("common.actions.logout")}</a>,
          }
        : {
            key: "login",
            label: <a onClick={requestPubkey}>{t("common.actions.login")}</a>,
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
            {t("header.supportUs")}
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
  const newHeaderMenu = [...getHeaderMenu(t), User];
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <Select
                size="small"
                value={i18n.language}
                onChange={handleLanguageChange}
                suffixIcon={<GlobalOutlined />}
                options={SUPPORTED_LOCALES.map((locale) => ({
                  label: locale.label,
                  value: locale.code,
                }))}
                aria-label={t("common.labels.language")}
                style={{ minWidth: 110 }}
              />
              <Menu
                mode="horizontal"
                theme="light"
                defaultSelectedKeys={[]}
                selectedKeys={selectedKey}
                overflowedIndicator={<MenuOutlined />}
                items={newHeaderMenu}
                onClick={onMenuClick}
              />
            </div>
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
        title={t("header.faqTitle")}
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
