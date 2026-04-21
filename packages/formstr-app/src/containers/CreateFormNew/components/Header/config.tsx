import { ImportOutlined } from "@ant-design/icons";
import { TFunction } from "i18next";

export const HEADER_MENU_KEYS = {
  BUILDER: "BUILDER",
  PREVIEW: "PREVIEW",
  PUBLISH: "PUBLISH",
  AI_BUILDER: "AI_BUILDER",
  IMPORT_FORMS: "IMPORT_FORMS",
};

export const getHeaderMenu = (t: TFunction) => [
  {
    key: HEADER_MENU_KEYS.IMPORT_FORMS,
    label: t("builder.header.importForms"),
    icon: <ImportOutlined />,
  },
  {
    key: HEADER_MENU_KEYS.AI_BUILDER,
    label: t("builder.header.aiBuilder"),
  },
  {
    key: HEADER_MENU_KEYS.BUILDER,
    label: t("builder.header.formBuilder"),
  },
  {
    key: HEADER_MENU_KEYS.PREVIEW,
    label: t("builder.header.preview"),
  },
];
