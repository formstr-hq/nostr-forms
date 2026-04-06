import {
  BASIC_MENU_KEYS,
  INPUTS_TYPES,
  PRE_BUILT_MENU_KEYS,
} from "./constants";
import { AnswerTypes } from "../../../nostr/types";
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
} from "@ant-design/icons";

export const BASIC_MENU = [
  {
    key: BASIC_MENU_KEYS.TITLE,
    label: "Label",
    icon: <FontColorsOutlined style={{ color: "var(--app-color-secondary)" }} />,
    primitive: "label",
    answerSettings: {
      renderElement: AnswerTypes.label,
    },
  },
  {
    key: BASIC_MENU_KEYS.SECTION,
    label: "Section",
    icon: <AppstoreOutlined style={{ color: "var(--app-color-info)" }} />,
    primitive: "section",
    answerSettings: undefined,
  },
];

export const INPUTS_MENU = [
  {
    key: INPUTS_TYPES.SHORT_ANSWER,
    label: "Short answer",
    icon: <FormOutlined style={{ color: "var(--app-color-success)" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.shortText,
    },
  },
  {
    key: INPUTS_TYPES.PARAGRAPH,
    label: "Paragraph",
    icon: <FileTextOutlined style={{ color: "var(--app-color-success-active)" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.paragraph,
    },
  },
  {
    key: INPUTS_TYPES.NUMBER,
    label: "Number",
    icon: <NumberOutlined style={{ color: "var(--app-color-warning)" }} />,
    primitive: "number",
    answerSettings: {
      renderElement: AnswerTypes.number,
    },
  },
  {
    key: INPUTS_TYPES.MULTIPLE_CHOICE,
    label: "Multiple choice",
    icon: <CheckSquareOutlined style={{ color: "var(--app-color-info)" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.checkboxes,
    },
  },
  {
    key: INPUTS_TYPES.SINGLE_CHOICE,
    label: "Single choice",
    icon: <CheckCircleOutlined style={{ color: "var(--app-color-secondary)" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.radioButton,
    },
  },
  {
    key: INPUTS_TYPES.SELECT,
    label: "Select",
    icon: <CaretDownOutlined style={{ color: "var(--app-color-warning)" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.dropdown,
    },
  },
  {
    key: INPUTS_TYPES.DATE,
    label: "Date",
    icon: <CalendarOutlined style={{ color: "var(--app-color-primary)" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.date,
    },
  },
  {
    key: INPUTS_TYPES.TIME,
    label: "Time",
    icon: <ClockCircleOutlined style={{ color: "var(--app-color-secondary)" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.time,
    },
  },
  {
    key: INPUTS_TYPES.SIGNATURE,
    label: "Signature",
    icon: <EditOutlined style={{ color: "var(--app-color-error)" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.signature,
      signature: {
        prefilledContent: "I confirm  that all the data filled is true",
      },
    },
  },
  {
    key: INPUTS_TYPES.FILE_UPLOAD,
    label: "File upload",
    icon: <CloudUploadOutlined style={{ color: "var(--app-color-error)" }} />,
    primitive: "file",
    answerSettings: {
      renderElement: AnswerTypes.fileUpload,
      blossomServer: "https://nostr.download",
      maxFileSize: 10, // 10MB default
    },
  },
  {
    key: INPUTS_TYPES.DATETIME,
    label: "Date & Time",
    icon: <FieldTimeOutlined style={{ color: "var(--app-color-warning)" }} />,
    primitive: "datetime",
    answerSettings: {
      renderElement: AnswerTypes.datetime,
    },
  },
  {
    key: INPUTS_TYPES.MULTIPLE_CHOICE_GRID,
    label: "Single choice grid",
    icon: <TableOutlined style={{ color: "var(--app-color-success)" }} />,
    primitive: "grid",
    answerSettings: {
      renderElement: AnswerTypes.multipleChoiceGrid,
      allowMultiplePerRow: false,
    },
  },
  {
    key: INPUTS_TYPES.CHECKBOX_GRID,
    label: "Multiple choice grid",
    icon: <TableOutlined style={{ color: "var(--app-color-info)" }} />,
    primitive: "grid",
    answerSettings: {
      renderElement: AnswerTypes.checkboxGrid,
      allowMultiplePerRow: true,
    },
  },
];

export const PRE_BUILT_MENU = [
  {
    key: PRE_BUILT_MENU_KEYS.DATE_OF_BIRTH,
    label: "Date of birth",
    icon: <CalendarOutlined style={{ color: "var(--app-color-info)" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.date,
    },
  },
  {
    key: PRE_BUILT_MENU_KEYS.EMAIL,
    label: "Email",
    icon: <MailOutlined style={{ color: "var(--app-color-info)" }} />,
    answerSettings: {
      renderElement: AnswerTypes.shortText,
      validationRules: {
        regex: {
          pattern: "^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}",
          errorMessage: "This is not a valid email",
        },
      },
    },
    primitive: "text",
  },
];
