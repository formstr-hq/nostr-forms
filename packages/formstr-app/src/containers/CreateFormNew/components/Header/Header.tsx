import { Layout, Menu, Row, Col, Typography, MenuProps, message } from "antd";
import { Link } from "react-router-dom";
import { ArrowLeftOutlined, MenuOutlined } from "@ant-design/icons";
import { HEADER_MENU, HEADER_MENU_KEYS } from "./config";
import { Button } from "antd";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import StyleWrapper from "./Header.style";
import { useState } from "react";
import { normalizeURL } from "nostr-tools/utils";
import { RelayPublishModal } from "../../../../components/RelayPublishModal/RelaysPublishModal";

export const CreateFormHeader: React.FC = () => {
  const [isPostPublishModalOpen, setIsPostPublishModalOpen] = useState(false);
  const [acceptedRelays, setAcceptedRelays] = useState<string[]>([]);
  const [publishFailed, setPublishFailed] = useState(false);

  const { Header } = Layout;
  const { Text } = Typography;
  const {
    saveForm,
    setSelectedTab,
    formSettings,
    relayList,
    setIsAiModalOpen,
    selectedTab,
    questionsList,
  } = useFormBuilderContext();

  const onMenuClickHandler: MenuProps["onClick"] = (e) => {
    if (e.key === HEADER_MENU_KEYS.AI_BUILDER) {
      setIsAiModalOpen(true);
      return;
    }
    if (
      e.key === HEADER_MENU_KEYS.BUILDER ||
      e.key === HEADER_MENU_KEYS.PREVIEW
    ) {
      setSelectedTab(e.key);
    }
  };

  const handlePublishClick = async () => {
    if (questionsList.length === 0) {
      message.error("Cannot publish a form with no questions.");
      return;
    }

    if (!formSettings?.formId) {
      message.error("Form ID is required");
      return;
    }

    setIsPostPublishModalOpen(true);
    setAcceptedRelays([]);
    setPublishFailed(false);

    try {
      await saveForm((url: string) => {
        const normalizedUrl = normalizeURL(url);
        setAcceptedRelays((prev) => [...prev, normalizedUrl]);
      });
    } catch (error) {
      console.error("Failed to publish the form", error);
      setPublishFailed(true);
    }
  };

  return (
    <StyleWrapper>
      <Header className="create-form-header">
        <Row className="header-row" justify="space-between" align="middle">
          <Col>
            <Row className="header-row" justify="space-between" align="middle">
              <Col
                style={{
                  paddingRight: 10,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Link className="app-link" to="/">
                  <ArrowLeftOutlined style={{ color: "black" }} />
                </Link>
              </Col>
              <Col style={{ paddingTop: 5 }}>
                <Text>All Forms</Text>
              </Col>
            </Row>
          </Col>

          <Col md={10} xs={12} sm={12}>
            <Row
              className="header-row"
              justify="end"
              align="middle"
              gutter={[8, 0]}
            >
              <Col>
                <Button
                  type="primary"
                  onClick={handlePublishClick}
                  disabled={isPostPublishModalOpen}
                >
                  Publish
                </Button>
              </Col>
              <Col md={12} xs={5} sm={2}>
                <Menu
                  mode="horizontal"
                  theme="light"
                  selectedKeys={[selectedTab]}
                  defaultSelectedKeys={[HEADER_MENU_KEYS.BUILDER]}
                  overflowedIndicator={<MenuOutlined />}
                  items={HEADER_MENU}
                  onClick={onMenuClickHandler}
                  style={{ borderBottom: "none" }}
                />
              </Col>
            </Row>
          </Col>
        </Row>

        <RelayPublishModal
          relays={relayList.map((r) => r.url)}
          acceptedRelays={acceptedRelays}
          isOpen={isPostPublishModalOpen}
          publishFailed={publishFailed}
          onClose={() => {
            setIsPostPublishModalOpen(false);
            setPublishFailed(false);
          }}
        />
      </Header>
    </StyleWrapper>
  );
};
