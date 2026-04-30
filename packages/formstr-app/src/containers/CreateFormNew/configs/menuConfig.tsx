import {
  BASIC_MENU_KEYS,
  INPUTS_TYPES,
  PRE_BUILT_MENU_KEYS,
} from "./constants";
import { AnswerTypes } from "../../../nostr/types";
import { TFunction } from "i18next";
import {
  TableOutlined,
  FontColorsOutlined,
  AppstoreOutlined,
  FormOutlined,
  FileTextOutlined,
  NumberOutlined,
  CheckSquareOutlined,
  CheckCircleOutlined,
  CaretDownOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FieldTimeOutlined,
  MailOutlined,
  CloudUploadOutlined,
  StarOutlined,
} from "@ant-design/icons";

export const getBasicMenu = (t: TFunction) => [
  {
    key: BASIC_MENU_KEYS.TITLE,
    label: t("builder.menus.label"),
    icon: <FontColorsOutlined style={{ color: "#800080" }} />,
    primitive: "label",
    answerSettings: {
      renderElement: AnswerTypes.label,
    },
  },
  {
    key: BASIC_MENU_KEYS.SECTION,
    label: t("builder.menus.section"),
    icon: <AppstoreOutlined style={{ color: "#1e3f66" }} />,
    primitive: "section",
    answerSettings: undefined,
  },
];

export const getInputsMenu = (t: TFunction) => [
  {
    key: INPUTS_TYPES.SHORT_ANSWER,
    label: t("builder.menus.shortAnswer"),
    icon: <FormOutlined style={{ color: "#a3ec66ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.shortText,
    },
  },
  {
    key: INPUTS_TYPES.PARAGRAPH,
    label: t("builder.menus.paragraph"),
    icon: <FileTextOutlined style={{ color: "#b7ce51ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.paragraph,
    },
  },
  {
    key: INPUTS_TYPES.NUMBER,
    label: t("builder.menus.number"),
    icon: <NumberOutlined style={{ color: "#e6b85eff" }} />,
    primitive: "number",
    answerSettings: {
      renderElement: AnswerTypes.number,
    },
  },
  {
    key: INPUTS_TYPES.MULTIPLE_CHOICE,
    label: t("builder.menus.multipleChoice"),
    icon: <CheckSquareOutlined style={{ color: "#5dc4d6ff" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.checkboxes,
    },
  },
  {
    key: INPUTS_TYPES.SINGLE_CHOICE,
    label: t("builder.menus.singleChoice"),
    icon: <CheckCircleOutlined style={{ color: "#8bd6d2ff" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.radioButton,
    },
  },
  {
    key: INPUTS_TYPES.SELECT,
    label: t("builder.menus.select"),
    icon: <CaretDownOutlined style={{ color: "#FFD580" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.dropdown,
    },
  },
  {
    key: INPUTS_TYPES.DATE,
    label: t("builder.menus.date"),
    icon: <CalendarOutlined style={{ color: "#fdc4adff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.date,
    },
  },
  {
    key: INPUTS_TYPES.TIME,
    label: t("builder.menus.time"),
    icon: <ClockCircleOutlined style={{ color: "#f7a2f7ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.time,
    },
  },
  {
    key: INPUTS_TYPES.SIGNATURE,
    label: t("builder.menus.signature"),
    icon: <EditOutlined style={{ color: "#eba5b1ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.signature,
      signature: {
        prefilledContent: t("builder.defaults.signatureConfirmation"),
      },
    },
  },
  {
    key: INPUTS_TYPES.FILE_UPLOAD,
    label: t("builder.menus.fileUpload"),
    icon: <CloudUploadOutlined style={{ color: "#FF6B6B" }} />,
    primitive: "file",
    answerSettings: {
      renderElement: AnswerTypes.fileUpload,
      blossomServer: "https://nostr.download",
      maxFileSize: 10, // 10MB default
    },
  },
  {
    key: INPUTS_TYPES.DATETIME,
    label: t("builder.menus.dateTime"),
    icon: <FieldTimeOutlined style={{ color: "#FFD580" }} />,
    primitive: "datetime",
    answerSettings: {
      renderElement: AnswerTypes.datetime,
    },
  },
  {
    key: INPUTS_TYPES.MULTIPLE_CHOICE_GRID,
    label: t("builder.menus.singleChoiceGrid"),
    icon: <TableOutlined style={{ color: "#B5E7A0" }} />,
    primitive: "grid",
    answerSettings: {
      renderElement: AnswerTypes.multipleChoiceGrid,
      allowMultiplePerRow: false,
    },
  },
  {
    key: INPUTS_TYPES.CHECKBOX_GRID,
    label: t("builder.menus.multipleChoiceGrid"),
    icon: <TableOutlined style={{ color: "#A0D3E7" }} />,
    primitive: "grid",
    answerSettings: {
      renderElement: AnswerTypes.checkboxGrid,
      allowMultiplePerRow: true,
    },
  },
  {
    key: INPUTS_TYPES.RATING,
    label: t("builder.menus.rating"),
    icon: <StarOutlined style={{ color: "#FFD700" }} />,
    primitive: "rating",
    answerSettings: {
      renderElement: AnswerTypes.rating,
    },
  },
];

export const getPreBuiltMenu = (t: TFunction) => [
  {
    key: PRE_BUILT_MENU_KEYS.DATE_OF_BIRTH,
    label: t("builder.menus.dateOfBirth"),
    icon: <CalendarOutlined style={{ color: "#1e3f66" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.date,
    },
  },
  {
    key: PRE_BUILT_MENU_KEYS.EMAIL,
    label: t("builder.menus.email"),
    icon: <MailOutlined style={{ color: "#1e3f66" }} />,
    answerSettings: {
      renderElement: AnswerTypes.shortText,
      validationRules: {
        regex: {
          pattern: "^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}",
          errorMessage: t("builder.defaults.emailInvalid"),
        },
      },
    },
    primitive: "text",
  },
];
