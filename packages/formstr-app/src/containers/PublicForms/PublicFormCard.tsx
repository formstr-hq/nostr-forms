import { Box, Card, Divider, Typography } from "@mui/material";
import { naddrUrl } from "../../utils/utility";
import { useNavigate } from "react-router-dom";
import { getDefaultRelays } from "../../nostr/common";
import { Event } from "nostr-tools";
import { useTranslation } from "react-i18next";
import { IFormSettings } from "../CreateFormNew/components/FormSettings/types";
import SafeMarkdown from "../../components/SafeMarkdown";
import { formatLocalizedDate } from "../../i18n/format";

export default function PublicFormCard({ event }: { event: Event }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameTag = event.tags.find((t) => t[0] === "name");
  const formIdTag = event.tags.find((t) => t[0] === "d");
  const settingsTag = event.tags.find((t) => t[0] === "settings");

  const name = nameTag?.[1] ?? t("publicForms.noName");
  const formId = formIdTag?.[1];

  let settings: IFormSettings = {};
  if (settingsTag?.[1]) {
    try {
      settings = JSON.parse(settingsTag[1]);
    } catch (e) {
      console.warn(`Failed to parse settings for event ${event.id}`, e);
    }
  }

  const description = settings?.description ?? "";
  const truncatedDescription =
    description.trim().substring(0, 200) +
    (description.length > 200 ? "..." : "");

  return formId ? (
    <Card
      variant="outlined"
      onClick={() =>
        navigate(naddrUrl(event.pubkey, formId, getDefaultRelays()))
      }
      sx={{
        backgroundImage: `url(${settings.titleImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        width: "100%",
        cursor: "pointer",
        transition: "border-color 0.2s ease-in-out",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          background: "rgba(0,0,0,0.3)",
          borderRadius: 2,
          p: 2.5,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "white",
            m: 0,
            textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
          }}
        >
          <SafeMarkdown>{name}</SafeMarkdown>
        </Typography>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1.5 }} />
        <Box
          sx={{
            color: "white",
            opacity: "80%",
            textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
          }}
        >
          <SafeMarkdown>{truncatedDescription}</SafeMarkdown>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 1.5 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
          }}
        >
          <Typography sx={{ color: "white", mt: 0.5 }}>
            {formatLocalizedDate(event.created_at * 1000)}
          </Typography>
        </Box>
      </Box>
    </Card>
  ) : (
    <Card variant="outlined">
      <Typography sx={{ p: 2 }}>{t("publicForms.corruptedCard")}</Typography>
    </Card>
  );
}
