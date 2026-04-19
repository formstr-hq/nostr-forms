import { Spin, Typography, Button } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export const SaveStatus = ({
  savedLocally,
  savedOnNostr,
  userPub,
  requestPubkey,
}: {
  savedLocally: boolean;
  savedOnNostr: boolean;
  userPub: string | undefined;
  requestPubkey: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="save-status">
      <div>
        {t("builder.formDetails.savedLocally")} {savedLocally ? "✅" : "❌"}
      </div>
      {userPub ? (
        <div className="nostr-save-status">
          {!savedOnNostr ? (
            <div className="saving-indicator">
              <Text>{t("builder.formDetails.savingToProfile")}</Text>
              <Spin size="small" style={{ marginLeft: 4 }} />
            </div>
          ) : (
            <div>
              {t("builder.formDetails.savedToProfile")}{" "}
              {savedOnNostr ? "✅" : "❌"}
            </div>
          )}
        </div>
      ) : (
        <div className="login-prompt">
          <Text>{t("builder.formDetails.loginToSave")}</Text>
          <Button onClick={requestPubkey} className="ml-2">
            {t("common.actions.login")}
          </Button>
        </div>
      )}
    </div>
  );
};
