import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import axios from "../../../../../utils/axiosInstance";
import { useNostrAuth } from "../../../../../hooks/useNostrAuth";
import { appConfig } from "../../../../../config";
import { useProfileContext } from "../../../../../hooks/useProfileContext";
import { ZapQRCodeModal } from "./zapQRModal";
import { useNavigate } from "react-router-dom";
import UniversalMarkdownModal from "../../../../../components/UniversalMarkdownModal";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        setError(
          err.response?.data?.error ||
            t("builder.formDetails.customSlug.serverError"),
        );
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
      setError(
        err.response?.data?.error ||
          t("builder.formDetails.customSlug.paymentError", { error: err }),
      );
    } finally {
      setPaying(false); // stop loading no matter what
    }
  };

  const isLoggedIn = !!pubkey;

  return (
    <Box sx={{ mt: 4, maxWidth: 800 }}>
      {(serverAvailable === true || serverAvailable === null) && (
        <Card variant="outlined" sx={{ mt: 0.5 }}>
          <CardContent>
            <Typography variant="h6">
              {t("builder.formDetails.customSlug.title")}
            </Typography>
            {serverAvailable === null && (
              <Typography color="text.secondary">
                {t("builder.formDetails.customSlug.checkingServer")}
              </Typography>
            )}
            {serverAvailable && (
              <>
                <Typography color="text.secondary" sx={{ my: 1 }}>
                  {t("builder.formDetails.customSlug.introPrefix")}{" "}
                  <code>/i/your-name</code>{" "}
                  {t("builder.formDetails.customSlug.introSuffix")}{" "}
                  <Typography component="span" sx={{ fontWeight: 600 }}>
                    {price} sats
                  </Typography>
                  .
                  <br />
                  {t("builder.formDetails.customSlug.oneTimePurchase")}{" "}
                  <code>Nostr</code>{" "}
                  {t("builder.formDetails.customSlug.nostrProfile")}
                </Typography>
                {!showCustomForm ? (
                  <Button
                    variant="contained"
                    onClick={() =>
                      userPub ? setShowCustomForm(true) : requestPubkey
                    }
                    disabled={!userPub}
                  >
                    {userPub
                      ? t("builder.formDetails.customSlug.claimCustomUrl")
                      : t("builder.formDetails.customSlug.loginToClaim")}
                  </Button>
                ) : (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      {!isLoggedIn && (
                        <Alert severity="warning">
                          {t("builder.formDetails.customSlug.loginRequired")}
                        </Alert>
                      )}

                      <TextField
                        fullWidth
                        size="small"
                        placeholder={t(
                          "builder.formDetails.customSlug.slugPlaceholder",
                        )}
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value.trim());
                          setAvailable(null); // reset availability
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") checkAvailability();
                        }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                /i/
                              </InputAdornment>
                            ),
                            endAdornment: checking ? (
                              <InputAdornment position="end">
                                <CircularProgress size={18} />
                              </InputAdornment>
                            ) : available ? (
                              <InputAdornment position="end">
                                <CheckCircleOutlineOutlinedIcon
                                  sx={{ color: "success.main" }}
                                />
                              </InputAdornment>
                            ) : null,
                          },
                        }}
                        disabled={!isLoggedIn}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={checkAvailability}
                          disabled={!slug || !isLoggedIn}
                        >
                          {t(
                            "builder.formDetails.customSlug.checkAvailability",
                          )}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handlePay}
                          disabled={!available || !isLoggedIn || paying}
                          startIcon={
                            paying ? <CircularProgress size={16} /> : undefined
                          }
                        >
                          {t("builder.formDetails.customSlug.payToClaim")}
                        </Button>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {t("builder.formDetails.customSlug.termsIntro")}{" "}
                        <Link
                          component="button"
                          onClick={() => setShowTermsModal(true)}
                          sx={{ textDecoration: "underline" }}
                        >
                          {t("builder.formDetails.customSlug.termsLink")}
                        </Link>
                        .
                      </Typography>
                      <Box
                        sx={{
                          minHeight: error ? "auto" : 0,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {error && (
                          <Alert
                            severity="error"
                            sx={{ animation: "fadeIn 0.3s ease", m: 0 }}
                          >
                            {error}
                          </Alert>
                        )}
                      </Box>

                      {showAccessWarning && (
                        <Alert severity="warning">
                          <Typography component="span" sx={{ fontSize: 10 }}>
                            {t("builder.formDetails.customSlug.accessWarning")}
                          </Typography>
                          {onEditClick && (
                            <Button
                              variant="text"
                              size="small"
                              sx={{ ml: 0.25, p: 0, fontSize: 10, minWidth: 0 }}
                              onClick={onEditClick}
                            >
                              {t("builder.formDetails.customSlug.here")}
                            </Button>
                          )}
                        </Alert>
                      )}
                    </Box>
                  </>
                )}
              </>
            )}
          </CardContent>
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
        title={t("builder.formDetails.customSlug.termsTitle")}
        filePath="/docs/TermsOfUse.md"
      />
    </Box>
  );
};
