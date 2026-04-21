import { Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { isMobile } from "../../../../../utils/utility";
import useFormBuilderContext from "../../../hooks/useFormBuilderContext";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import AddNpubStyle from "../addNpub.style";
import { Editors } from "./Editors";
import { Participants } from "./Participants";
import { useProfileContext } from "../../../../../hooks/useProfileContext";

enum ROLE {
  VIEW,
  EDIT,
}

const { Text } = Typography;
export const Sharing = () => {
  const { t } = useTranslation();
  const { pubkey: userPubkey, requestPubkey } = useProfileContext();
  const [isEditListOpen, setIsEditListOpen] = useState<boolean>(false);
  const [isViewListOpen, setIsViewListOpen] = useState<boolean>(false);
  return (
    <>
      <Tooltip
        title={t("builder.sharing.configureTooltip")}
        trigger={isMobile() ? "click" : "hover"}
      >
        <div className="sharing-settings">
          <div className="property-setting">
            <Text>{t("builder.sharing.configureAdmins")}</Text>
            <EditOutlined
              onClick={() => {
                setIsEditListOpen(true);
              }}
            />
          </div>
          <div className="property-setting">
            <Text>{t("builder.sharing.participantsVisibility")}</Text>
            <EditOutlined onClick={() => setIsViewListOpen(true)} />
          </div>
          <Editors
            open={isEditListOpen}
            onCancel={() => setIsEditListOpen(false)}
          />
          <Participants
            open={isViewListOpen}
            onCancel={() => setIsViewListOpen(false)}
          />
        </div>
      </Tooltip>
    </>
  );
};
