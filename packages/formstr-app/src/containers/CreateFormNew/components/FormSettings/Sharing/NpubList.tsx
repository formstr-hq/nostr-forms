import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { FC, useEffect, useState } from "react";
import { isValidNpub } from "./utils";
import { nip19 } from "nostr-tools";
import { useTranslation } from "react-i18next";
import { fetchOne } from "../../../../../dataLayer";
import { getDefaultRelays, toHexNpub } from "../../../../../nostr/common";
import { useSnackbar } from "../../../../../providers/SnackbarProvider";

interface NpubListProps {
  NpubList: Set<string> | null;
  setNpubList: (npubs: Set<string>) => void;
  ListHeader: string;
}

interface Profile {
  name?: string;
  picture?: string;
  display_name?: string;
}

const NpubListItem: FC<{
  pubkey: string;
  onRemove: (pubkey: string) => void;
}> = ({ pubkey, onRemove }) => {
  const { t } = useTranslation();
  const { showMessage } = useSnackbar();
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  // Old forms stored npub (bech32) strings while new forms store hex.
  // Normalize to hex so profile lookups and encoding work for both.
  const hexPubkey = toHexNpub(pubkey);

  useEffect(() => {
    const getProfile = async () => {
      const relays = getDefaultRelays();
      try {
        const profileEvent = await fetchOne(
          [
            {
              kinds: [0],
              authors: [hexPubkey],
              limit: 1,
            },
          ],
          relays,
        );
        if (profileEvent) {
          setProfile(JSON.parse(profileEvent.content));
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    if (hexPubkey) {
      getProfile();
    }
  }, [hexPubkey]);

  const npub = nip19.npubEncode(hexPubkey);
  const shortNpub = `${npub.substring(0, 10)}...${npub.substring(
    npub.length - 5,
  )}`;
  const displayName = profile?.display_name || profile?.name || shortNpub;

  const handleCopy = () => {
    navigator.clipboard.writeText(npub);
    showMessage(t("builder.sharing.copiedNpub"), "success");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar src={profile?.picture}>
          <PersonOutlinedIcon />
        </Avatar>
        <Typography>{displayName}</Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
          {shortNpub}
        </Typography>
        <Tooltip title={t("builder.sharing.copyNpub")}>
          <IconButton size="small" onClick={handleCopy}>
            <ContentCopyOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("common.actions.delete")}>
          <IconButton
            size="small"
            color="error"
            onClick={() => onRemove(pubkey)}
          >
            <HighlightOffIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export const NpubList: React.FC<NpubListProps> = ({
  setNpubList,
  NpubList,
  ListHeader,
}) => {
  const { t } = useTranslation();
  const [newNpub, setNewNpub] = useState<string>();

  const removeParticipant = (participant: string) => {
    const updatedList = new Set(NpubList);
    updatedList.delete(participant);
    setNpubList(updatedList);
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 18 }}>{ListHeader}</Typography>
      <Divider sx={{ my: 1 }} />

      <Box
        sx={{
          maxHeight: 200,
          overflowY: "auto",
          mb: 2,
        }}
      >
        {NpubList && Array.from(NpubList).length > 0 ? (
          Array.from(NpubList).map((pubkey) => (
            <NpubListItem
              key={pubkey}
              pubkey={pubkey}
              onRemove={removeParticipant}
            />
          ))
        ) : (
          <Typography color="text.secondary">
            {t("builder.sharing.noUsers")}
          </Typography>
        )}
      </Box>

      <TextField
        size="small"
        fullWidth
        placeholder={t("builder.sharing.enterNpub")}
        value={newNpub ?? ""}
        onChange={(e) => setNewNpub(e.target.value)}
        sx={{ mb: 1 }}
      />
      {newNpub && !isValidNpub(newNpub) && (
        <Box>
          <Typography color="error" sx={{ fontSize: 12, display: "block" }}>
            {t("builder.sharing.invalidNpub")}
          </Typography>
        </Box>
      )}
      <Button
        variant="contained"
        sx={{ mt: 1 }}
        disabled={!isValidNpub(newNpub || "")}
        onClick={() => {
          setNpubList(
            new Set(NpubList).add(nip19.decode(newNpub!).data as string),
          );
          setNewNpub("");
        }}
      >
        {t("common.actions.add")}
      </Button>
    </Box>
  );
};
