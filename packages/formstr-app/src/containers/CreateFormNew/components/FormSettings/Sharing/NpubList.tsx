import {
  Avatar,
  Button,
  Divider,
  Input,
  Space,
  Tooltip,
  Typography,
  message,
} from "antd";
import AddNpubStyle from "../addNpub.style";
import { FC, useEffect, useState } from "react";
import { isValidNpub } from "./utils";
import { nip19 } from "nostr-tools";
import {
  CloseCircleOutlined,
  CopyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { pool } from "../../../../../pool";
import { getDefaultRelays } from "../../../../../nostr/common";

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
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

  useEffect(() => {
    const getProfile = async () => {
      const relays = getDefaultRelays();
      try {
        const profileEvent = await pool.get(relays, {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        });
        if (profileEvent) {
          setProfile(JSON.parse(profileEvent.content));
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    if (pubkey) {
      getProfile();
    }
  }, [pubkey]);

  const npub = nip19.npubEncode(pubkey);
  const shortNpub = `${npub.substring(0, 10)}...${npub.substring(
    npub.length - 5,
  )}`;
  const displayName = profile?.display_name || profile?.name || shortNpub;

  const handleCopy = () => {
    navigator.clipboard.writeText(npub);
    message.success("Copied npub!");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Avatar src={profile?.picture} icon={<UserOutlined />} />
        <Typography.Text>{displayName}</Typography.Text>
      </div>
      <Space>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {shortNpub}
        </Typography.Text>
        <Tooltip title="Copy npub">
          <Button type="text" icon={<CopyOutlined />} onClick={handleCopy} />
        </Tooltip>
        <Tooltip title="Remove">
          <Button
            type="text"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => onRemove(pubkey)}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export const NpubList: React.FC<NpubListProps> = ({
  setNpubList,
  NpubList,
  ListHeader,
}) => {
  const [newNpub, setNewNpub] = useState<string>();

  const removeParticipant = (participant: string) => {
    const updatedList = new Set(NpubList);
    updatedList.delete(participant);
    setNpubList(updatedList);
  };

  return (
    <div>
      <AddNpubStyle className="modal-container">
        <Typography.Text
          style={{
            fontSize: 18,
          }}
        >
          {ListHeader}
        </Typography.Text>
        <Divider />

        <div
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            marginBottom: "16px",
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
            <Typography.Text type="secondary">
              No users added yet.
            </Typography.Text>
          )}
        </div>

        <Input
          placeholder="Enter nostr npub"
          value={newNpub}
          onChange={(e) => setNewNpub(e.target.value)}
          className="npub-input"
        />
        {newNpub && !isValidNpub(newNpub) && (
          <div>
            <Typography.Text className="error-npub">
              this is not a valid npub
            </Typography.Text>
          </div>
        )}
        <Button
          type="primary"
          className="add-button"
          disabled={!isValidNpub(newNpub || "")}
          onClick={() => {
            setNpubList(
              new Set(NpubList).add(nip19.decode(newNpub!).data as string),
            );
            setNewNpub("");
          }}
        >
          {" "}
          Add{" "}
        </Button>
      </AddNpubStyle>
    </div>
  );
};
