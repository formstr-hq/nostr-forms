import { ImportOutlined } from "@ant-design/icons";

export const HEADER_MENU_KEYS = {
  BUILDER: "BUILDER",
  PREVIEW: "PREVIEW",
  PUBLISH: "PUBLISH",
  AI_BUILDER: "AI_BUILDER",
  IMPORT_FORMS: "IMPORT_FORMS",
};

export const HEADER_MENU = [
  {
    key: HEADER_MENU_KEYS.IMPORT_FORMS,
    label: "Import",
    icon: <ImportOutlined />
  },
  {
    key: HEADER_MENU_KEYS.AI_BUILDER,
    label: "AI Builder",
  },
  {
    key: HEADER_MENU_KEYS.BUILDER,
    label: "Form Builder",
  },
  {
    key: HEADER_MENU_KEYS.PREVIEW,
    label: "Preview",
  },
];