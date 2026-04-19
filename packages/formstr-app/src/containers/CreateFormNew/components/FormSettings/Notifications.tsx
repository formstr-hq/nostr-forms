import { Modal, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { isMobile } from "../../../../utils/utility";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { NpubList } from "./Sharing/NpubList";

const { Text } = Typography;
export const Notifications = () => {
  const { t } = useTranslation();
  const { updateFormSetting, formSettings } = useFormBuilderContext();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSetNpubs = (npubs: Set<string>) => {
    updateFormSetting({
      notifyNpubs: Array.from(npubs),
    });
  };

  const hasNpubs = (formSettings.notifyNpubs || []).length > 0;

  return (
    <>
      <Tooltip
        title={t("builder.notifications.configureTooltip")}
        trigger={isMobile() ? "click" : "hover"}
      >
        <div className="property-setting">
          <Text>{t("builder.notifications.configure")}</Text>
          <EditOutlined onClick={() => setIsModalOpen(true)} />
        </div>
      </Tooltip>
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <NpubList
          NpubList={new Set(formSettings.notifyNpubs || [])}
          setNpubList={handleSetNpubs}
          ListHeader={t("builder.notifications.recipients")}
        />
        {hasNpubs && (
          <Text className="warning-text">
            {t("builder.notifications.warningPrefix")}
            <a
              href="https://github.com/nostr-protocol/nips/blob/master/04.md"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              nip-04{" "}
            </a>
            {t("builder.notifications.warningSuffix")}
          </Text>
        )}
      </Modal>
    </>
  );
};
