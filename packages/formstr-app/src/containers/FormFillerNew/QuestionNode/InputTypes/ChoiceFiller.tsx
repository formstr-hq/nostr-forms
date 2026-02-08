import {
  Button,
  Checkbox,
  Input,
  Radio,
  RadioChangeEvent,
  RadioGroupProps,
  Space,
} from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import { CheckboxValueType } from "antd/es/checkbox/Group";
import ChoiceFillerStyle from "./choiceFiller.style";
import { ChangeEvent, useState } from "react";
import SafeMarkdown from "../../../../components/SafeMarkdown";
import { AnswerTypes, Option } from "../../../../nostr/types";

interface ChoiceFillerProps {
  answerType: AnswerTypes.checkboxes | AnswerTypes.radioButton;
  options: Option[];
  onChange: (value: string, message: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  testId?: string;
}

export const ChoiceFiller: React.FC<ChoiceFillerProps> = ({
  answerType,
  options,
  onChange,
  defaultValue,
  disabled = false,
  testId = "choice-filler",
}) => {
  console.log("Received Options", options);
  const [otherMessage, setOtherMessage] = useState("");

  function handleChoiceChange(e: RadioChangeEvent): void;

  function handleChoiceChange(checkedValues: CheckboxValueType[]): void;

  function handleChoiceChange(e: RadioChangeEvent | CheckboxValueType[]) {
    if (Array.isArray(e)) {
      onChange(e.sort().join(";"), otherMessage);
      return;
    }
    onChange(e.target.value, otherMessage);
  }

  function handleMessage(e: ChangeEvent<HTMLInputElement>) {
    const msg = e.target.value;
    setOtherMessage(msg);
    if (defaultValue) {
      onChange(defaultValue, msg);
    }
  }

  function isOtherSelected(choiceId: string) {
    if (!defaultValue) return false;
    if (answerType === AnswerTypes.checkboxes) {
      return defaultValue.split(";").includes(choiceId);
    }
    return defaultValue === choiceId;
  }

  function handleClear() {
    setOtherMessage("");
    onChange("", "");
  }

  let ElementConfig:
    | {
        Element: typeof Radio;
        defaultValue?: RadioGroupProps["defaultValue"];
      }
    | {
        Element: typeof Checkbox;
        defaultValue?: CheckboxGroupProps["defaultValue"];
      } = {
    Element: Radio,
    defaultValue: defaultValue,
  };
  if (answerType === AnswerTypes.checkboxes) {
    ElementConfig = {
      Element: Checkbox,
      defaultValue: defaultValue?.split(";"),
    };
  }
  return (
    //@ts-ignore
    <ChoiceFillerStyle>
      <ElementConfig.Element.Group
        onChange={handleChoiceChange}
        value={ElementConfig.defaultValue}
        disabled={disabled}
        data-testid={`${testId}:group`}
      >
        <Space direction="vertical">
          {options.map((choice) => {
            let [choiceId, label, configString] = choice;
            let config = JSON.parse(configString || "{}");
            console.log("choice is ", choiceId, label, choice);
            return (
              <ElementConfig.Element
                key={choiceId}
                value={choiceId}
                disabled={disabled}
                data-testid={`${testId}:option-${choiceId}`}
              >
                <SafeMarkdown>{label}</SafeMarkdown>
                {config.isOther && (
                  <Input
                    placeholder="Add an optional message..."
                    value={otherMessage}
                    onChange={handleMessage}
                    disabled={disabled || !isOtherSelected(choiceId)}
                    data-testid={`${testId}-other-input-${choiceId}`}
                  />
                )}
              </ElementConfig.Element>
            );
          })}
        </Space>
      </ElementConfig.Element.Group>
      {defaultValue && !disabled && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="link"
            size="small"
            onClick={handleClear}
            style={{ padding: "4px 0", fontSize: "12px" }}
          >
            Clear selection
          </Button>
        </div>
      )}
    </ChoiceFillerStyle>
  );
};
