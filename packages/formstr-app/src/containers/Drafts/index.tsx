import { useNavigate, useParams } from "react-router";
import { Typography } from "@mui/material";
import { ROUTES } from "../../constants/routes";
import useFormBuilderContext from "../CreateFormNew/hooks/useFormBuilderContext";
import { useEffect } from "react";
import { Tag } from "../../nostr/types";
import { useTranslation } from "react-i18next";

export const V1DraftsController = () => {
  const { t } = useTranslation();
  const { encodedForm } = useParams();
  const { initializeForm } = useFormBuilderContext();
  const navigate = useNavigate();

  let draft: string | null = null;
  let parsedDraft: { spec: Tag[]; id: string } | null = null;
  if (encodedForm) {
    draft = window.decodeURIComponent(encodedForm);
    let draftJSON = JSON.parse(decodeURIComponent(window.atob(draft)));
    parsedDraft = {
      spec: draftJSON.formSpec,
      id: draftJSON.tempId,
    };
  }
  useEffect(() => {
    if (!parsedDraft) return;
    initializeForm({ spec: parsedDraft.spec, id: parsedDraft.id });
    navigate(ROUTES.CREATE_FORMS_NEW, {
      state: parsedDraft,
    });
  }, [encodedForm, initializeForm, navigate, parsedDraft]);
  if (!parsedDraft) return <Typography>{t("drafts.invalid")}</Typography>;
  return <Typography>{t("drafts.redirecting")}</Typography>;
};
