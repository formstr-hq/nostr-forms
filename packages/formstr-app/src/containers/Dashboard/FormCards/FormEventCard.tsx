import { Button, Card, Divider, Dropdown, MenuProps } from "antd";
import { Event } from "nostr-tools";
import { useNavigate } from "react-router-dom";
import DeleteFormTrigger from "./DeleteForm";
import {
  downloadHTMLToDevice,
  makeFormNAddr,
  naddrUrl,
  makeTag,
} from "../../../utils/utility";
import {
  editPath,
  getDecryptedForm,
  getFormData,
  responsePath,
} from "../../../utils/formUtils";
import {
  DownloadOutlined,
  EditOutlined,
  MoreOutlined,
  CopyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { constructDraftUrl } from "./Drafts";
import { FormDetails } from "../../CreateFormNew/components/FormDetails";
import SafeMarkdown from "../../../components/SafeMarkdown";
import { IFormSettings } from "../../CreateFormNew/components/FormSettings/types";
import { Tag } from "../../../nostr/types";

interface FormEventCardProps {
  event: Event;
  onDeleted?: () => void;
  relay?: string;
  secretKey?: string;
  viewKey?: string | null;
  shortLink?: string;
}
export const FormEventCard: React.FC<FormEventCardProps> = ({
  event,
  onDeleted,
  relay,
  secretKey,
  viewKey,
  shortLink,
}) => {
  const navigate = useNavigate();
  const publicForm = event.content === "";
  const [tags, setTags] = useState<Tag[]>([]);
  const [showFormDetails, setShowFormDetails] = useState(false);
  useEffect(() => {
    const initialize = async () => {
      if (event.content === "") {
        setTags(event.tags);
        return;
      } else if (viewKey) {
        setTags(getDecryptedForm(event, viewKey));
      }
    };
    initialize();
  }, []);
  const name = event.tags.find((tag: Tag) => tag[0] === "name") || [];
  const pubKey = event.pubkey;
  const formId = event.tags.find((tag: Tag) => tag[0] === "d")?.[1];
  const relays = event.tags
    .filter((tag: Tag) => tag[0] === "relay")
    .map((t) => t[1]);
  if (!formId) {
    return <Card title="Invalid Form Event">{JSON.stringify(event)}</Card>;
  }
  const formKey = `${pubKey}:${formId}`;
  let settings: IFormSettings = {};
  if (publicForm || viewKey) {
    settings = JSON.parse(
      tags.filter((t) => t[0] === "settings")?.[0]?.[1] || "{}",
    );
  }

  const downloadForm = async () => {
    const naddr = makeFormNAddr(
      pubKey,
      formId,
      relays.length ? relays : ["wss://relay.damus.io"],
    );
    const formData = JSON.stringify(await getFormData(naddr));
    const formFillerUI = (await (await fetch("/api/form-filler-ui")).text())
      ?.replace("@naddr", naddr)
      .replace("@viewKey", viewKey || "")
      .replace("@formContent", btoa(formData));
    downloadHTMLToDevice(formFillerUI, name[1]);
  };

  const saveAndOpen = (duplicatedTags: Tag[], newFormId: string) => {
    const duplicatedForm = {
      formSpec: duplicatedTags,
      tempId: newFormId,
    };

    const existingDrafts = localStorage.getItem("formstr:draftForms");
    let updatedDrafts = existingDrafts ? JSON.parse(existingDrafts) : [];
    updatedDrafts = [duplicatedForm, ...updatedDrafts];
    localStorage.setItem("formstr:draftForms", JSON.stringify(updatedDrafts));
    window.open(
      constructDraftUrl(duplicatedForm, window.location.origin),
      "_blank",
    );
  };

  const handleDuplicate = () => {
    const newFormId = makeTag(6);
    const duplicatedTags = tags.map((tag) => {
      if (tag[0] === "d") return ["d", newFormId];
      if (tag[0] === "settings") {
        try {
          const settings = JSON.parse(tag[1]);
          return [
            "settings",
            JSON.stringify({ ...settings, formId: newFormId }),
          ];
        } catch {
          return tag;
        }
      }
      return [...tag];
    });
    saveAndOpen(duplicatedTags, newFormId);
  };
  const menuItems: MenuProps["items"] = secretKey
    ? [
        {
          key: "download",
          label: "Download",
          icon: <DownloadOutlined />,
          onClick: downloadForm,
        },
        {
          key: "edit",
          label: "Edit",
          icon: <EditOutlined />,
          onClick: () =>
            navigate(
              editPath(
                secretKey,
                makeFormNAddr(
                  pubKey,
                  formId,
                  relays.length !== 0 ? relays : undefined,
                ),
                viewKey,
                settings.disablePreview,
              ),
            ),
        },
        {
          key: "duplicate",
          label: "Duplicate",
          icon: <CopyOutlined />,
          onClick: handleDuplicate,
        },
        {
          key: "details",
          label: "Details",
          icon: <InfoCircleOutlined />,
          onClick: () => setShowFormDetails(true),
        },
      ]
    : [
        {
          key: "download",
          label: "Download",
          icon: <DownloadOutlined />,
          onClick: downloadForm,
        },
        {
          key: "details",
          label: "Details",
          icon: <InfoCircleOutlined />,
          onClick: () => setShowFormDetails(true),
        },
      ];

  return (
    <Card
      title={
        <SafeMarkdown forceColor="#0000">
          {name[1] || "Hidden Form"}
        </SafeMarkdown>
      }
      className="form-card"
      extra={
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{ color: "purple", marginRight: 4, cursor: "pointer" }}
              aria-label="Quick actions"
            >
              <MoreOutlined />
            </Button>
          </Dropdown>
          {onDeleted ? (
            <DeleteFormTrigger formKey={formKey} onDeleted={onDeleted} />
          ) : null}
          {showFormDetails && (
            <FormDetails
              isOpen={showFormDetails}
              onClose={() => setShowFormDetails(false)}
              pubKey={pubKey}
              formId={formId}
              secretKey={secretKey || ""}
              viewKey={event.content !== "" ? viewKey || "" : undefined}
              name={name[1] || ""}
              relays={relays}
              disablePreview={settings.disablePreview}
            />
          )}
        </div>
      }
      style={{
        fontSize: 12,
        color: "grey",
        overflow: "clip",
      }}
    >
      <div
        style={{
          maxHeight: 100,
          textOverflow: "ellipsis",
          marginBottom: 30,
        }}
      >
        <SafeMarkdown forceColor="#0000">
          {settings.description
            ? settings.description?.trim().substring(0, 200) + "..."
            : "Encrypted Content"}
        </SafeMarkdown>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Button
            onClick={(e) => {
              secretKey
                ? navigate(
                    responsePath(
                      secretKey,
                      makeFormNAddr(pubKey, formId, relays),
                      viewKey,
                    ),
                  )
                : navigate(`/r/${pubKey}/${formId}`);
            }}
            type="dashed"
            style={{
              color: "purple",
              borderColor: "purple",
            }}
          >
            View Responses
          </Button>
          <Button
            onClick={(e: any) => {
              e.stopPropagation();
              if (shortLink) {
                navigate(shortLink);
              } else {
                navigate(
                  naddrUrl(
                    pubKey,
                    formId,
                    relays.length ? relays : ["wss://relay.damus.io"],
                    viewKey,
                  ),
                );
              }
            }}
            style={{
              marginLeft: "10px",
              color: "green",
              borderColor: "green",
            }}
            type="dashed"
          >
            Open Form
          </Button>
        </div>
        <div style={{ margin: 7 }}>
          {new Date(event.created_at * 1000).toDateString()}
        </div>
      </div>
    </Card>
  );
};
