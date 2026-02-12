import ShortText from "./InputElements/ShortText";
import { RadioButtonCreator } from "./InputElements/OptionTypes/RadioButtonCreator";
import { CheckboxCreator } from "./InputElements/OptionTypes/CheckBoxCreator";
import { DropdownCreator } from "./InputElements/OptionTypes/DropdownCreator";
import { DatePicker, Input, InputNumber, TimePicker } from "antd";
import { Choice } from "./InputElements/OptionTypes/types";
import { AnswerSettings, AnswerTypes, GridOptions } from "../../../../nostr/types";
import SignatureInput from "./InputElements/Signature";
import { GridCreator } from "./InputElements/GridCreator";
import FileUploadBuilder from "./InputElements/FileUploadBuilder";

interface InputsProps {
  inputType: string;
  options: Array<Choice>;
  answerSettings: AnswerSettings;
  answerSettingsHandler: (answerSettings: AnswerSettings) => void;
  optionsHandler: (options: Array<Choice>) => void;
}

const Inputs: React.FC<InputsProps> = ({
  inputType,
  options,
  answerSettings,
  answerSettingsHandler,
  optionsHandler,
}) => {
  const updateAnswerSettings = (settingKey: string, property: unknown) => {
    let newAnswerSettings = { ...answerSettings, [settingKey]: property };
    answerSettingsHandler(newAnswerSettings);
  };
  const getInputElement = () => {
    switch (inputType) {
      case AnswerTypes.shortText:
        return (
          <>
            <ShortText />
          </>
        );
      case AnswerTypes.paragraph:
        return <Input.TextArea disabled={true} />;
      case AnswerTypes.number:
        return <InputNumber disabled={true} />;
      case AnswerTypes.radioButton:
        return (
          <RadioButtonCreator
            initialValues={options}
            onValuesChange={optionsHandler}
          />
        );
      case AnswerTypes.checkboxes:
        return (
          <CheckboxCreator
            initialValues={options}
            onValuesChange={optionsHandler}
          />
        );
      case AnswerTypes.dropdown:
        return (
          <DropdownCreator
            initialValues={options}
            onValuesChange={optionsHandler}
          />
        );
      case AnswerTypes.date:
        return <DatePicker disabled={true} />;
      case AnswerTypes.time:
        return <TimePicker disabled={true} />;
      case AnswerTypes.signature:
        return <SignatureInput answerSettings={answerSettings} />;
      case AnswerTypes.datetime:
        return <DatePicker disabled={true} placeholder="Pick Date & Time" />;
      case AnswerTypes.fileUpload:
        return <FileUploadBuilder answerSettings={answerSettings} handleAnswerSettings={answerSettingsHandler} />;
      case AnswerTypes.multipleChoiceGrid:
      case AnswerTypes.checkboxGrid: {
        const gridOptions = options as unknown as GridOptions;
        return (
          <GridCreator
            initialValue={gridOptions}
            onValuesChange={(newOptions) => {
              optionsHandler(newOptions as unknown as Array<Choice>);
            }}
            allowMultiple={inputType === AnswerTypes.checkboxGrid}
          />
        );
      }
      default:
        <></>;
        break;
    }
  };
  return <>{getInputElement()}</>;
};

export default Inputs;
