import { Card, Divider, Typography } from "antd";
import { naddrUrl } from "../../utils/utility";
import { useNavigate } from "react-router-dom";
import { getDefaultRelays } from "../../nostr/common";
import { Event } from "nostr-tools";
import { IFormSettings } from "../CreateFormNew/components/FormSettings/types";
import SafeMarkdown from "../../components/SafeMarkdown";

export default function PublicFormCard({ event }: { event: Event }) {
  const navigate = useNavigate();
  const nameTag = event.tags.find((t) => t[0] === "name");
  const formIdTag = event.tags.find((t) => t[0] === "d");
  const settingsTag = event.tags.find((t) => t[0] === "settings");

  const name = nameTag?.[1] ?? "[Form has no name]";
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
    <>
      {/* custom styles */}
      <style>
        {`
          .ant-card-hoverable {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .ant-card-hoverable:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          }
        `}
      </style>

      <Card
        hoverable
        onClick={() =>
          navigate(naddrUrl(event.pubkey, formId, getDefaultRelays()))
        }
        style={{
          backgroundImage: `url(${settings.titleImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          borderRadius: 8,
          overflow: "hidden",
          width: "80%",
          minWidth: "360px",
          margin: 15,
          cursor: "pointer",
        }}
        bodyStyle={{
          background: "transparent",
          position: "relative",
          zIndex: 2,
          padding: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            background: "var(--app-color-overlay-soft)",
            borderRadius: 8,
            padding: 20,
          }}
        >
          <Typography.Title
            level={4}
            style={{
              color: "var(--app-color-bg-surface)",
              margin: 0,
              textShadow: "2px 2px 4px var(--app-color-overlay-strong)",
            }}
          >
            <SafeMarkdown>{name}</SafeMarkdown>
          </Typography.Title>
          <Divider style={{ borderColor: "var(--app-color-overlay-light)" }} />
          <div
            style={{
              color: "var(--app-color-bg-surface)",
              opacity: "80%",
              textShadow: "2px 2px 4px var(--app-color-overlay-strong)",
            }}
          >
            <SafeMarkdown>{truncatedDescription}</SafeMarkdown>
          </div>
          <Divider style={{ borderColor: "var(--app-color-overlay-light)" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              textShadow: "2px 2px 4px var(--app-color-overlay-strong)",
            }}
          >
            <Typography.Text
              style={{ color: "var(--app-color-bg-surface)", marginTop: 5 }}
            >
              {new Date(event.created_at * 1000).toLocaleDateString()}
            </Typography.Text>
          </div>
        </div>
      </Card>
    </>
  ) : (
    <Card>
      <Typography.Text>Card Content is corrupted</Typography.Text>
    </Card>
  );
}
