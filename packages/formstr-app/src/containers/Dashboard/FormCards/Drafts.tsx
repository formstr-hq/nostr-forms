import {
  Button,
  Card,
  CardActions,
  CardHeader,
  IconButton,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { getItem, LOCAL_STORAGE_KEYS } from "../../../utils/localStorage";
import { Tag } from "../../../nostr/types";
import { deleteDraft } from "../../../utils/utility";
import { useEffect, useState } from "react";

export function constructDraftUrl(
  draft: { formSpec: unknown; tempId: string },
  host: string,
) {
  if (!draft) return;
  let draftHash = window.btoa(encodeURIComponent(JSON.stringify(draft)));
  draftHash = window.encodeURIComponent(draftHash);
  return `${host}/drafts/${draftHash}`;
}

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
          <Card key={d.tempId} variant="outlined" className="form-card">
            <CardHeader
              title={`${name} (${questionCount} ${
                questionCount === 1 ? "question" : "questions"
              })`}
              action={
                <IconButton
                  aria-label="delete draft"
                  onClick={() => {
                    deleteDraft(d.tempId);
                    setDrafts(getItem(LOCAL_STORAGE_KEYS.DRAFT_FORMS) || []);
                  }}
                  size="small"
                  sx={{ color: "error.main" }}
                >
                  <DeleteOutlinedIcon />
                </IconButton>
              }
              sx={{ "& .MuiCardHeader-content": { minWidth: 0 } }}
            />
            <CardActions>
              <Button
                size="small"
                onClick={() =>
                  window.open(
                    constructDraftUrl(d, window.location.origin),
                    "_blank",
                  )
                }
              >
                Open Draft
              </Button>
            </CardActions>
          </Card>
        );
      })}
    </>
  );
};
