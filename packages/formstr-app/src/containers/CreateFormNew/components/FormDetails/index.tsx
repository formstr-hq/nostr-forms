import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProfileContext } from "../../../../hooks/useProfileContext";
import {
  constructFormUrl,
  constructNewResponseUrl,
  editPath,
} from "../../../../utils/formUtils";
import { ShareTab } from "./ShareTab";
import { EmbedTab } from "./EmbedTab";
import { SaveStatus } from "./SaveStatus";
import { saveToDevice } from "./utils/saveHelpers";
import { CustomSlugForm } from "./payments/customSlugForm";
import { useNavigate } from "react-router-dom";
import { makeFormNAddr } from "../../../../utils/utility";
import { useMyForms } from "../../../../provider/MyFormsProvider";
import { useLocalForms } from "../../../../provider/LocalFormsProvider";
import { EmbedWithSDKTab } from "./EmbedWithSDKTab";

export const FormDetails = ({
  isOpen,
  pubKey,
  formId,
  secretKey,
  viewKey,
  name,
  relays,
  onClose,
  disablePreview,
}: {
  isOpen: boolean;
  pubKey: string;
  formId: string;
  secretKey: string;
  viewKey?: string;
  name: string;
  relays: string[];
  onClose: () => void;
  disablePreview?: boolean;
}) => {
  const { t } = useTranslation();
  const [savedLocally, setSavedLocally] = useState(false);
  const { pubkey: userPub, requestPubkey } = useProfileContext();
  const { saveToMyForms, inMyForms } = useMyForms();
  const { refreshForms } = useLocalForms();
  const navigate = useNavigate();
  useEffect(() => {
    void saveToDevice(
      pubKey,
      secretKey,
      formId,
      name,
      relays,
      () => {
        setSavedLocally(true);
        // Let the dashboard's "On this device" list see the form without a
        // full reload — the provider caches forms in context state.
        void refreshForms();
      },
      viewKey,
    );
    if (userPub) saveToMyForms(pubKey, secretKey, formId, relays, viewKey);
  }, [userPub]);

  const formUrl = constructFormUrl(
    pubKey,
    formId,
    relays,
    viewKey,
    disablePreview,
  );
  const responsesUrl = constructNewResponseUrl(
    secretKey,
    formId,
    relays,
    viewKey,
    disablePreview,
  );

  const [activeTab, setActiveTab] = useState<"share" | "embed" | "sdk">(
    "share",
  );

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box
          className="form-details"
          sx={{
            display: "flex",
            alignItems: "center",
            textAlign: "center",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <Card
            variant="outlined"
            sx={{ width: "100%", minWidth: 0, border: "none" }}
          >
            <Tabs
              value={activeTab}
              onChange={(_e, value: "share" | "embed" | "sdk") =>
                setActiveTab(value)
              }
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
            >
              <Tab value="share" label={t("builder.formDetails.share")} />
              <Tab value="sdk" label={t("builder.formDetails.embedWithSdk")} />
              <Tab
                value="embed"
                label={t("builder.formDetails.embedAsIframe")}
              />
            </Tabs>
            <CardContent>
              {activeTab === "share" ? (
                <ShareTab formUrl={formUrl} responsesUrl={responsesUrl} />
              ) : null}
              {activeTab === "embed" ? (
                <EmbedTab
                  pubKey={pubKey}
                  formId={formId}
                  relays={relays}
                  viewKey={viewKey}
                />
              ) : null}
              {activeTab === "sdk" ? (
                <EmbedWithSDKTab
                  pubKey={pubKey}
                  formId={formId}
                  relays={relays}
                  viewKey={viewKey}
                />
              ) : null}

              <CustomSlugForm
                formId={formId}
                formPubkey={pubKey}
                relays={relays}
                viewKey={viewKey}
                showAccessWarning={/viewKey/.test(formUrl)}
                onEditClick={() =>
                  navigate(
                    editPath(
                      secretKey,
                      makeFormNAddr(pubKey, formId, relays),
                      viewKey,
                      disablePreview,
                    ),
                  )
                }
              />

              <Divider />
              <SaveStatus
                savedLocally={savedLocally}
                savedOnNostr={inMyForms(pubKey, formId)}
                userPub={userPub}
                requestPubkey={requestPubkey}
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
