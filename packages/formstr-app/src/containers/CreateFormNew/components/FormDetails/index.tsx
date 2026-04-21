import { Modal, Card, Divider, Typography, Button, Alert } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import FormDetailsStyle from "./FormDetails.style";
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
  const navigate = useNavigate();
  useEffect(() => {
    saveToDevice(
      pubKey,
      secretKey,
      formId,
      name,
      relays,
      () => {
        setSavedLocally(true);
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
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={600}
    >
      <FormDetailsStyle className="form-details">
        <Card
          bordered={false}
          tabList={[
            { key: "share", label: t("builder.formDetails.share") },
            { key: "sdk", label: t("builder.formDetails.embedWithSdk") },
            { key: "embed", label: t("builder.formDetails.embedAsIframe") },
          ]}
          onTabChange={(key) => setActiveTab(key as "share" | "embed" | "sdk")}
          style={{
            width: "100%",
            minWidth: 0,
          }}
        >
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
        </Card>
      </FormDetailsStyle>
    </Modal>
  );
};
