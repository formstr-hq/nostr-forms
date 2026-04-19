import { Divider, Modal, Switch, Tooltip, Typography } from "antd";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../../hooks/useFormBuilderContext";
import { isMobile } from "../../../../../utils/utility";
import { NpubList } from "./NpubList";

interface ParticipantProps {
  open: boolean;
  onCancel: () => void;
}

export const Participants: React.FC<ParticipantProps> = ({
  open,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { viewList, setViewList, formSettings, updateFormSetting } =
    useFormBuilderContext();
  return (
    <Modal open={open} onCancel={onCancel} footer={null}>
      <Typography.Text style={{ fontSize: 18 }}>
        {t("builder.sharing.visibility")}
      </Typography.Text>
      {/*  */}
      {formSettings.encryptForm && (
        <Tooltip
          title={t("builder.sharing.anyoneWithUrlTooltip")}
          trigger={isMobile() ? "click" : "hover"}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: 10,
            }}
          >
            <Typography.Text>
              {t("builder.sharing.anyoneWithUrl")}
            </Typography.Text>
            <Switch
              checked={formSettings.viewKeyInUrl}
              onChange={() =>
                updateFormSetting({
                  ...formSettings,
                  viewKeyInUrl: !formSettings.viewKeyInUrl,
                })
              }
            />
          </div>
        </Tooltip>
      )}
      <Divider />
      {(viewList || {}).size === 0 && !formSettings.encryptForm ? (
        <>
          <Typography.Text>
            {t("builder.sharing.publicForEveryone")}
          </Typography.Text>
          <Divider />
        </>
      ) : null}
      {(viewList || {}).size !== 0 && (
        <>
          <Typography.Text>
            {t("builder.sharing.onlyListedCanFill")}
          </Typography.Text>
          <Divider />
        </>
      )}
      <NpubList
        NpubList={viewList}
        setNpubList={setViewList}
        ListHeader={t("builder.sharing.participants")}
      />
      <Divider />
    </Modal>
  );
};
