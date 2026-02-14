import { Button, Divider, Dropdown, Switch, Typography, MenuProps } from "antd";
import { DeleteOutlined, DownOutlined } from "@ant-design/icons";
import Validation from "../Validation";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { INPUTS_MENU } from "../../configs/menuConfig";
import StyleWrapper from "./style";
import { RightAnswer } from "./RightAnswer";
import { IAnswerSettings } from "./types";
import { AnswerTypes, Field } from "../../../../nostr/types";
import { SignatureSettings } from "./settings/SignatureSettings";
import { FileUploadSettings } from "./settings/FileUploadSettings";

const { Text } = Typography;

function AnswerSettings() {
  const { questionsList, questionIdInFocus, editQuestion, deleteQuestion } =
    useFormBuilderContext();

  if (!questionIdInFocus) {
    return null;
  }
  const questionIndex = questionsList.findIndex(
    (field: Field) => field[1] === questionIdInFocus
  );
  if (questionIndex === -1) {
    return null;
  }
  const question = questionsList[questionIndex];
  const answerSettings = JSON.parse(
    question[5] || '{ "renderElement": "shortText"}'
  );

  const answerType = INPUTS_MENU.find(
    (option) =>
      option.answerSettings.renderElement === answerSettings.renderElement
  );

  const handleRightAnswer = (rightAnswer: string | string[]) => {
    const field = question;
    let newAnswerSettings = {
      ...answerSettings,
      validationRules: {
        ...answerSettings.validationRules,
        match: { answer: rightAnswer },
      },
    };
    field[5] = JSON.stringify(newAnswerSettings);
    editQuestion(field, field[1]);
  };

  const renderExtraSettings = () => {
    switch (answerSettings.renderElement) {
      case AnswerTypes.signature:
        return (
          <SignatureSettings
            answerSettings={answerSettings}
            handleAnswerSettings={handleAnswerSettings}
          />
        );
      case AnswerTypes.fileUpload:
        return (
          <FileUploadSettings
            answerSettings={answerSettings}
            handleAnswerSettings={handleAnswerSettings}
          />
        );
      // other case blocks like:
      // case AnswerTypes.shortText: return <ShortTextSettings ... />
      default:
        return null;
    }
  };

  const updateAnswerType: MenuProps["onClick"] = ({ key }) => {
    const selectedItem = INPUTS_MENU.find((item) => item.key === key);
    if (!selectedItem) return;
    let field = question;
    field[2] = selectedItem.primitive;
    let newAnswerSettings = selectedItem.answerSettings;
    field[5] = JSON.stringify(newAnswerSettings);
    editQuestion(field, field[1]);
  };

  const updateIsRequired = (checked: boolean) => {
    let field = question;
    let newAnswerSettings = { ...answerSettings, required: checked };
    field[5] = JSON.stringify(newAnswerSettings);
    editQuestion(field, question[1]);
  };

  const handleAnswerSettings = (newAnswerSettings: IAnswerSettings) => {
    let changedSettings = { ...answerSettings, ...newAnswerSettings };
    let field = question;
    field[5] = JSON.stringify(changedSettings);
    editQuestion(field, field[1]);
  };

  return (
    <StyleWrapper>
      <Text className="question">
        Question {questionIndex + 1} of {questionsList.length}
      </Text>
      <Divider className="divider" />
      <div className="input-property">
        <Text className="property-title">Properties</Text>
        <div className="property-setting">
          <Text className="property-name">Type</Text>
          <Dropdown menu={{ items: INPUTS_MENU, onClick: updateAnswerType }}>
            <Text>
              {answerType?.label} <DownOutlined />
            </Text>
          </Dropdown>
        </div>
        {answerType && (
          <div className="property-setting">
            <Text className="property-name">Required</Text>
            <Switch
              checked={answerSettings.required}
              onChange={updateIsRequired}
            />
          </div>
        )}
      </div>
      <Divider className="divider" />

      <Validation
        key={question[1] + "validation"}
        answerType={answerSettings.renderElement}
        answerSettings={answerSettings}
        handleAnswerSettings={handleAnswerSettings}
      />
      <Divider className="divider" />
      {answerType && (
        <RightAnswer
          key={question[1] + "rightAnswer"}
          answerType={answerSettings.renderElement}
          answerSettings={answerSettings}
          choices={question[4]}
          onChange={handleRightAnswer}
        />
      )}
      <Divider className="divider" />
      <div className="input-property">{renderExtraSettings()}</div>
      <Divider />
      <Button
        danger
        type="text"
        className="delete-button"
        onClick={() => deleteQuestion(question[1])}
      >
        <DeleteOutlined /> Delete
      </Button>
      <Divider className="divider" />
    </StyleWrapper>
  );
}

export default AnswerSettings;
