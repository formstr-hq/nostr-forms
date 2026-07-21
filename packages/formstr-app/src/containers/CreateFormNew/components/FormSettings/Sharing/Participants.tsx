import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../../hooks/useFormBuilderContext";
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
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogContent>
        <Typography sx={{ fontSize: 18 }}>
          {t("builder.sharing.visibility")}
        </Typography>
        {formSettings.encryptForm && (
          <Tooltip title={t("builder.sharing.anyoneWithUrlTooltip")}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mt: 1.25,
              }}
            >
              <Typography>{t("builder.sharing.anyoneWithUrl")}</Typography>
              <Switch
                checked={formSettings.viewKeyInUrl}
                onChange={() =>
                  updateFormSetting({
                    ...formSettings,
                    viewKeyInUrl: !formSettings.viewKeyInUrl,
                  })
                }
              />
            </Box>
          </Tooltip>
        )}
        <Divider sx={{ my: 1.5 }} />
        {(viewList || {}).size === 0 && !formSettings.encryptForm ? (
          <>
            <Typography>{t("builder.sharing.publicForEveryone")}</Typography>
            <Divider sx={{ my: 1.5 }} />
          </>
        ) : null}
        {(viewList || {}).size !== 0 && (
          <>
            <Typography>{t("builder.sharing.onlyListedCanFill")}</Typography>
            <Divider sx={{ my: 1.5 }} />
          </>
        )}
        <NpubList
          NpubList={viewList}
          setNpubList={setViewList}
          ListHeader={t("builder.sharing.participants")}
        />
        <Divider sx={{ my: 1.5 }} />
      </DialogContent>
    </Dialog>
  );
};
