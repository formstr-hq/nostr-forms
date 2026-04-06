import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Typography,
  Alert,
  Space,
  Row,
  Col,
  Divider,
  Card,
} from "antd";
import { CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import axios from "../../../../../utils/axiosInstance";
import { useNostrAuth } from "../../../../../hooks/useNostrAuth";
import { appConfig } from "../../../../../config";
import { useProfileContext } from "../../../../../hooks/useProfileContext";
import { ZapQRCodeModal } from "./zapQRModal";
import { useNavigate } from "react-router-dom";
import UniversalMarkdownModal from "../../../../../components/UniversalMarkdownModal";

const { Text } = Typography;

export const CustomSlugForm = ({
  formId,
  formPubkey,
  relays,
  viewKey,
  showAccessWarning = false,
  onEditClick,
}: {
  formId: string;
  formPubkey: string;
  relays: string[];
  viewKey?: string;
  showAccessWarning?: boolean;
  onEditClick?: () => void;
}) => {
  const [slug, setSlug] = useState(formId?.toLocaleLowerCase().trim());
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState(0);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const { pubkey: userPub, requestPubkey } = useProfileContext();
  const [paying, setPaying] = useState(false);

  const navigate = useNavigate();
  const { generateAuthHeader, error: authError } = useNostrAuth();
  const { pubkey } = useProfileContext();

  useEffect(() => {
    const checkServer = async () => {
      try {
        const amountPath = `/api/price`;
        const apiUrl = `${appConfig.apiBaseUrl}${amountPath}`;
        const res = await axios.get(apiUrl);
        setPrice(res.data.amount);
        setServerAvailable(true);
      } catch (error) {
        setServerAvailable(false);
        console.error("Failed to fetch amount:", error);
      }
    };
    checkServer();
  }, []);

  const checkAvailability = async () => {
    if (!slug) return;
    setChecking(true);
    setAvailable(null);
    setError(null);
    try {
      const formPath = `/api/forms/${slug}`;
      const apiURl = `${appConfig.apiBaseUrl}${formPath}`;
      await axios.get(formPath, { withCredentials: false });
      setAvailable(false); // exists = taken
    } catch (err: any) {
      if (err.response?.status === 404) {
        setAvailable(true); // not found = available
      } else {
        setError(err.response?.data?.error || "Server error");
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const fetchAmount = async () => {
      try {
        const amountPath = `/api/amount`;
        const apiUrl = `${appConfig.apiBaseUrl}${amountPath}`;
        const res = await axios.get(apiUrl);
        setPrice(res.data.amount);
      } catch (error) {}
    };
    fetchAmount();
  }, []);

  const handleZapSuccess = () => {
    navigate(`/i/${slug}`);
  };

  const handlePay = async () => {
    setPaying(true);
    const payPath = `/api/generateInvoice`;
    const apiUrl = `${appConfig.apiBaseUrl}${payPath}`;
    try {
      const authHeader = await generateAuthHeader(apiUrl, "POST", {
        slug,
        formId,
        formPubkey,
        relays,
        viewKey,
      });
      const res = await axios.post(
        apiUrl,
        { slug, formId, formPubkey, relays, viewKey },
        { headers: { Authorization: authHeader } },
      );

      const { invoice, paymentHash, amount } = res.data;
      setAmount(amount);
      setInvoice(invoice);
      setHash(paymentHash);
    } catch (err: any) {
      setError(err.response?.data?.error || `Payment error: ${err}`);
    } finally {
      setPaying(false); // ✅ stop loading no matter what
    }
  };

  const isLoggedIn = !!pubkey;

  return (
    <div style={{ marginTop: 32, maxWidth: 800 }}>
      {(serverAvailable === true || serverAvailable === null) && (
        <Card style={{ marginTop: 5 }}>
          <Typography.Title level={5}>
            Custom URL for Your Form
          </Typography.Title>
          {serverAvailable === null && (
            <Typography.Paragraph type="secondary">
              Checking server status...
            </Typography.Paragraph>
          )}
          {serverAvailable && (
            <>
              <Typography.Paragraph type="secondary">
                Get a personalized form URL like{" "}
                <Typography.Text code>/i/your-name</Typography.Text> for{" "}
                <Typography.Text strong>{price} sats</Typography.Text>.
                <br />
                This one-time purchase is tied to your{" "}
                <Typography.Text code>Nostr</Typography.Text> profile.
              </Typography.Paragraph>
              {!showCustomForm ? (
                <Button
                  type="primary"
                  onClick={() =>
                    userPub ? setShowCustomForm(true) : requestPubkey
                  }
                  disabled={!userPub}
                >
                  {userPub ? "Claim Custom URL" : "Login to claim custom URL"}
                </Button>
              ) : (
                <>
                  <Divider />
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    {!isLoggedIn && (
                      <Alert
                        message="You must be logged in with Nostr to claim a custom URL."
                        type="warning"
                        showIcon
                      />
                    )}

                    <Input
                      placeholder="your-custom-slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.trim());
                        setAvailable(null); // reset availability
                      }}
                      onPressEnter={checkAvailability}
                      addonBefore="/i/"
                      suffix={
                        checking ? (
                          <LoadingOutlined />
                        ) : available ? (
                          <CheckCircleOutlined style={{ color: "var(--app-color-success)" }} />
                        ) : null
                      }
                      disabled={!isLoggedIn}
                    />
                    <Row gutter={8}>
                      <Col>
                        <Button
                          onClick={checkAvailability}
                          disabled={!slug || !isLoggedIn}
                        >
                          Check Availability
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          onClick={handlePay}
                          disabled={!available || !isLoggedIn || paying}
                          loading={paying}
                        >
                          Pay to Claim
                        </Button>
                      </Col>
                    </Row>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      By continuing, you agree to our{" "}
                      <a
                        onClick={() => setShowTermsModal(true)}
                        style={{ textDecoration: "underline" }}
                      >
                        Terms of Service and Privacy Policy
                      </a>
                      .
                    </Text>
                    <div
                      style={{
                        minHeight: error ? "auto" : 0,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {error && (
                        <Alert
                          type="error"
                          message={error}
                          style={{
                            animation: "fadeIn 0.3s ease",
                            margin: 0,
                          }}
                        />
                      )}
                    </div>

                    {showAccessWarning && (
                      <Alert
                        message={
                          <>
                            <Text style={{ fontSize: 10 }}>
                              Your current current form visitibilty is set to
                              "Anyone with the link can access your form", if
                              you proceed with customized links with this
                              setting Formstr Inc will also be able to access
                              this form. To change it, so that only fixed
                              participants can access the form, please click
                            </Text>
                            {onEditClick && (
                              <Button
                                type="link"
                                style={{
                                  marginLeft: 2,
                                  padding: 0,
                                  fontSize: 10,
                                }}
                                onClick={onEditClick}
                              >
                                here
                              </Button>
                            )}
                          </>
                        }
                        type="warning"
                        showIcon
                      />
                    )}
                  </Space>
                </>
              )}
            </>
          )}
        </Card>
      )}

      <ZapQRCodeModal
        open={!!invoice}
        invoice={invoice!}
        hash={hash!}
        amount={amount!}
        onSuccess={handleZapSuccess}
        onClose={() => setInvoice(null)}
      />
      <UniversalMarkdownModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms & Privacy"
        filePath="/docs/TermsOfUse.md"
      />
    </div>
  );
};
