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
    icon: <FontColorsOutlined style={{ color: "#800080" }} />,
    primitive: "label",
    answerSettings: {
      renderElement: AnswerTypes.label,
    },
  },
  {
    key: BASIC_MENU_KEYS.SECTION,
    label: "Section",
    icon: <AppstoreOutlined style={{ color: "#1e3f66" }} />,
    primitive: "section",
    answerSettings: undefined,
  },
];

export const INPUTS_MENU = [
  {
    key: INPUTS_TYPES.SHORT_ANSWER,
    label: "Short answer",
    icon: <FormOutlined style={{ color: "#a3ec66ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.shortText,
    },
  },
  {
    key: INPUTS_TYPES.PARAGRAPH,
    label: "Paragraph",
    icon: <FileTextOutlined style={{ color: "#b7ce51ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.paragraph,
    },
  },
  {
    key: INPUTS_TYPES.NUMBER,
    label: "Number",
    icon: <NumberOutlined style={{ color: "#e6b85eff" }} />,
    primitive: "number",
    answerSettings: {
      renderElement: AnswerTypes.number,
    },
  },
  {
    key: INPUTS_TYPES.MULTIPLE_CHOICE,
    label: "Multiple choice",
    icon: <CheckSquareOutlined style={{ color: "#5dc4d6ff" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.checkboxes,
    },
  },
  {
    key: INPUTS_TYPES.SINGLE_CHOICE,
    label: "Single choice",
    icon: <CheckCircleOutlined style={{ color: "#8bd6d2ff" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.radioButton,
    },
  },
  {
    key: INPUTS_TYPES.SELECT,
    label: "Select",
    icon: <CaretDownOutlined style={{ color: "#FFD580" }} />,
    primitive: "option",
    answerSettings: {
      renderElement: AnswerTypes.dropdown,
    },
  },
  {
    key: INPUTS_TYPES.DATE,
    label: "Date",
    icon: <CalendarOutlined style={{ color: "#fdc4adff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.date,
    },
  },
  {
    key: INPUTS_TYPES.TIME,
    label: "Time",
    icon: <ClockCircleOutlined style={{ color: "#f7a2f7ff" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.time,
    },
  },
  {
    key: INPUTS_TYPES.SIGNATURE,
    label: "Signature",
    icon: <EditOutlined style={{ color: "#eba5b1ff" }} />,
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
    icon: <CloudUploadOutlined style={{ color: "#FF6B6B" }} />,
    primitive: "file",
    answerSettings: {
      renderElement: AnswerTypes.fileUpload,
      blossomServer: "https://blossom.primal.net",
      maxFileSize: 10, // 10MB default
    },
  },
  {
    key: INPUTS_TYPES.DATETIME,
    label: "Date & Time",
    icon: <FieldTimeOutlined style={{ color: "#FFD580" }} />,
    primitive: "datetime",
    answerSettings: {
      renderElement: AnswerTypes.datetime,
    },
  },
  {
    key: INPUTS_TYPES.MULTIPLE_CHOICE_GRID,
    label: "Single choice grid",
    icon: <TableOutlined style={{ color: "#B5E7A0" }} />,
    primitive: "grid",
    answerSettings: {
      renderElement: AnswerTypes.multipleChoiceGrid,
      allowMultiplePerRow: false,
    },
  },
  {
    key: INPUTS_TYPES.CHECKBOX_GRID,
    label: "Multiple choice grid",
    icon: <TableOutlined style={{ color: "#A0D3E7" }} />,
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
    icon: <CalendarOutlined style={{ color: "#1e3f66" }} />,
    primitive: "text",
    answerSettings: {
      renderElement: AnswerTypes.date,
    },
  },
  {
    key: PRE_BUILT_MENU_KEYS.EMAIL,
    label: "Email",
    icon: <MailOutlined style={{ color: "#1e3f66" }} />,
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
