import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { Avatar } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { getDefaultRelays } from "../../nostr/common";
import { fetchOne } from "../../dataLayer";

const defaultRelays = getDefaultRelays();

interface NostrAvatarProps {
  pubkey?: string;
}

interface Profile {
  name?: string;
  picture?: string;
}

export const NostrAvatar: FC<NostrAvatarProps> = ({ pubkey }) => {
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  async function getProfile() {
    let filter = {
      kinds: [0],
      authors: [pubkey!],
    };
    const profile = await fetchOne([filter], defaultRelays);
    if (profile) setProfile(JSON.parse(profile.content) as Profile);
  }
  useEffect(() => {
    if (!profile && pubkey) getProfile();
  });
  return (
    <Avatar
      src={profile?.picture}
      alt={profile?.name}
      sx={{ width: 32, height: 32, bgcolor: "#E8E8E8", color: "#6B6B6B" }}
    >
      <PersonOutlinedIcon fontSize="small" />
    </Avatar>
  );
};
