import { UserOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { FC, useEffect, useState } from "react";
import { getDefaultRelays } from "../../nostr/common";
import { pool } from "../../pool";

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
    const profile = await pool.get(defaultRelays, filter);
    if (profile) setProfile(JSON.parse(profile.content) as Profile);
  }
  useEffect(() => {
    if (!profile && pubkey) getProfile();
  });
  return (
    <Avatar
      src={profile?.picture || <UserOutlined style={{ color: "black" }} />}
      alt={profile?.name}
    />
  );
};
