import { Button, Card } from "antd";
import { getItem, LOCAL_STORAGE_KEYS } from "../../../utils/localStorage";
import { Tag } from "../../../nostr/types";
import { DeleteOutlined } from "@ant-design/icons";
import { deleteDraft } from "../../../utils/utility";
import { useEffect, useState } from "react";
import { constructDraftUrl } from "../../../utils/formLinks";

export const Drafts = () => {
  type Draft = { formSpec: Tag[]; tempId: string };
  const [drafts, setDrafts] = useState<Draft[]>(
    getItem(LOCAL_STORAGE_KEYS.DRAFT_FORMS) || [],
  );

  useEffect(() => {
    setDrafts(getItem(LOCAL_STORAGE_KEYS.DRAFT_FORMS) || []);
  }, []);

  return (
    <>
      {drafts.map((d: Draft) => {
        const name = d.formSpec.filter((t) => t[0] === "name")?.[0][1];
        const questionCount = d.formSpec.filter((f) => f[0] === "field").length;

        return (
          <Card
            key={d.tempId}
            title={`${name} (${questionCount} ${
              questionCount === 1 ? "question" : "questions"
            })`}
            className="form-card"
            extra={
              <DeleteOutlined
                onClick={() => {
                  deleteDraft(d.tempId);
                  setDrafts(getItem(LOCAL_STORAGE_KEYS.DRAFT_FORMS) || []);
                }}
              />
            }
          >
            <Button
              onClick={() =>
                window.open(
                  constructDraftUrl(d, window.location.origin),
                  "_blank",
                )
              }
            >
              Open Draft
            </Button>
          </Card>
        );
      })}
    </>
  );
};
