import { Input, InputNumber } from "antd";
import TextArea from "antd/es/input/TextArea";
import { ChangeEvent } from "react";
import { ChoiceFiller } from "./InputTypes/ChoiceFiller";
import { DropdownFiller } from "./InputTypes/DropdownFiller";
import { DateFiller } from "./InputTypes/DateFiller";
import { TimeFiller } from "./InputTypes/TimeFiller";
import { SignatureFiller } from "./InputTypes/SignatureFiller";
import { DateTimeFiller } from "./InputTypes/DateTimeFiller";
import { GridFiller } from "./InputTypes/GridFiller";
import { AnswerTypes, GridOptions, Option } from "../../../nostr/types";

interface InputFillerProps {
  fieldConfig: any;
  options: Option[];
  onChange: (answer: string, message?: string) => void;
  defaultValue?: string | number | boolean;
  disabled?: boolean;
  testId?: string;
  gridOptions?: GridOptions | null;
}

export const InputFiller: React.FC<InputFillerProps> = ({
  fieldConfig,
  options,
  onChange,
  defaultValue,
  disabled = false,
  testId = "input-filler",
  gridOptions,
}) => {
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(e.target.value);
  };

  const handleValueChange = (value: string | null, message?: string) => {
    if (value === null || value === undefined) return;
    onChange(value, message);
  };

  const getInput = (answerType: AnswerTypes) => {
    const INPUT_TYPE_COMPONENT_MAP: { [key in AnswerTypes]?: JSX.Element } = {
      [AnswerTypes.label]: <></>,
      [AnswerTypes.shortText]: (
        <Input
          value={defaultValue as string}
          onChange={handleInputChange}
          placeholder="Please enter your response"
          disabled={disabled}
          data-testid={`${testId}:text-input`}
        />
      ),
      [AnswerTypes.paragraph]: (
        <TextArea
          value={defaultValue as string}
          onChange={handleInputChange}
          placeholder="Please enter your response"
          disabled={disabled}
          data-testid={`${testId}:text-area`}
        />
      ),
      [AnswerTypes.number]: (
        <InputNumber
          value={defaultValue as string}
          onChange={handleValueChange}
          style={{ width: "100%" }}
          placeholder="Please enter your response"
          disabled={disabled}
          data-testid={`${testId}:number-input`}
        />
      ),
      [AnswerTypes.radioButton]: (
        <ChoiceFiller
          answerType={answerType as AnswerTypes.radioButton}
          options={options}
          defaultValue={defaultValue as string}
          onChange={handleValueChange}
          disabled={disabled}
          testId={`${testId}:radio`}
        />
      ),
      [AnswerTypes.checkboxes]: (
        <ChoiceFiller
          defaultValue={defaultValue as string}
          answerType={answerType as AnswerTypes.checkboxes}
          options={options}
          onChange={handleValueChange}
          disabled={disabled}
          testId={`${testId}:checkboxes`}
        />
      ),
      [AnswerTypes.dropdown]: (
        <DropdownFiller
          defaultValue={defaultValue as string}
          options={options}
          onChange={handleValueChange}
          disabled={disabled}
          testId={`${testId}:dropdown`}
        />
      ),
      [AnswerTypes.date]: (
        <DateFiller
          defaultValue={defaultValue as string}
          onChange={handleValueChange}
          disabled={disabled}
          testId={`${testId}:date`}
        />
      ),
      [AnswerTypes.time]: (
        <TimeFiller
          defaultValue={defaultValue as string}
          onChange={handleValueChange}
          disabled={disabled}
          testId={`${testId}:time`}
        />
      ),
      [AnswerTypes.signature]: (
        <SignatureFiller
          defaultValue={defaultValue as string}
          fieldConfig={fieldConfig}
          onChange={onChange}
          disabled={disabled}
        />
      ),
      [AnswerTypes.datetime]: (
        <DateTimeFiller
          fieldConfig={fieldConfig}
          defaultValue={defaultValue as string}
          onChange={handleValueChange}
          disabled={disabled}
          testId={`${testId}:datetime`}
        />
      ),
      [AnswerTypes.multipleChoiceGrid]: (
        <GridFiller
          options={JSON.stringify(gridOptions!)}
          answerType={AnswerTypes.multipleChoiceGrid}
          onChange={handleValueChange}
          defaultValue={defaultValue as string}
          disabled={disabled}
        />
      ),
      [AnswerTypes.checkboxGrid]: (
        <GridFiller
          options={JSON.stringify(gridOptions)}
          answerType={AnswerTypes.checkboxGrid}
          onChange={handleValueChange}
          defaultValue={defaultValue as string}
          disabled={disabled}
        />
      ),
    };

    return INPUT_TYPE_COMPONENT_MAP[answerType];
  };

  return <>{getInput(fieldConfig.renderElement)}</>;
};
