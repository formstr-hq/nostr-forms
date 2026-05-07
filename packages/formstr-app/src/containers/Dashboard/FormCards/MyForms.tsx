import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormEventCard } from "./FormEventCard";
import { Spin, Card, Button, Divider } from "antd";
import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMyForms } from "../../../provider/MyFormsProvider";
import DeleteFormTrigger from "./DeleteForm";
import { makeFormNAddr, naddrUrl } from "../../../utils/utility";
import { responsePath } from "../../../utils/formUtils";

export const MyForms = () => {
  const { formEvents, refreshing, deleteForm, retryForm } = useMyForms();
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const handleFormDeleted = async (formId: string, formPubkey: string) => {
    deleteForm(formId, formPubkey);
  };

  const handleRetry = async (formId: string) => {
    setRetrying((prev) => new Set(prev).add(formId));
    await retryForm(formId);
    setRetrying((prev) => {
      const next = new Set(prev);
      next.delete(formId);
      return next;
    });
  };

  return (
    <>
      {refreshing ? (
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#F7931A" }} spin />
          }
        />
      ) : null}
      {[...formEvents.values()]
        .sort((a, b) => {
          if (!a.event && !b.event) return 0;
          if (!a.event) return 1;
          if (!b.event) return -1;
          return b.event.created_at - a.event.created_at;
        })
        .map((formMetadata) => {
          const { formId, formPubkey } = formMetadata;

          if (!formMetadata.event) {
            return (
              <Card
                key={formId}
                className="form-card"
                title={formId}
                style={{ fontSize: 12, color: "grey" }}
                extra={
                  <DeleteFormTrigger
                    formKey={`${formPubkey}:${formId}`}
                    onDeleted={() => handleFormDeleted(formId, formPubkey)}
                  />
                }
              >
                <p style={{ marginBottom: 16 }}>
                  {"Could not find this form's event on the default relays."}
                  {formMetadata.relay
                    ? ` Will also check: ${formMetadata.relay}`
                    : ""}
                </p>
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
                      onClick={() => {
                        const relays = formMetadata.relay
                          ? [formMetadata.relay]
                          : [];
                        const { secretKey, viewKey } = formMetadata.secrets;
                        navigate(
                          responsePath(
                            secretKey,
                            makeFormNAddr(formPubkey, formId, relays),
                            viewKey,
                          ),
                        );
                      }}
                      type="dashed"
                      style={{ color: "purple", borderColor: "purple" }}
                    >
                      View Responses
                    </Button>
                    <Button
                      onClick={() => {
                        const relays = formMetadata.relay
                          ? [formMetadata.relay]
                          : ["wss://relay.damus.io"];
                        navigate(
                          naddrUrl(
                            formPubkey,
                            formId,
                            relays,
                            formMetadata.secrets.viewKey,
                          ),
                        );
                      }}
                      type="dashed"
                      style={{
                        marginLeft: 10,
                        color: "green",
                        borderColor: "green",
                      }}
                    >
                      Open Form
                    </Button>
                  </div>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => handleRetry(formId)}
                    loading={retrying.has(formId)}
                    type="dashed"
                    style={{ color: "purple", borderColor: "purple" }}
                  >
                    Retry
                  </Button>
                </div>
              </Card>
            );
          }

          return (
            <FormEventCard
              event={formMetadata.event}
              key={formId}
              onDeleted={() => handleFormDeleted(formId, formPubkey)}
              secretKey={formMetadata.secrets.secretKey}
              viewKey={formMetadata.secrets.viewKey}
              relay={formMetadata.relay}
            />
          );
        })}
    </>
  );
};
