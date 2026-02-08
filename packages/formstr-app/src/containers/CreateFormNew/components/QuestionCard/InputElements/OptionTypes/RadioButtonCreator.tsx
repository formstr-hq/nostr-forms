import { CloseOutlined } from "@ant-design/icons";
import { Input, Radio } from "antd";
import { useState } from "react";
import OptionsStyle from "./Options.style";
import { AddOption } from "./AddOption";
import { handleDelete, handleLabelChange, hasOtherOption } from "./utils";
import { Choice, ChoiceSettings } from "./types";
import { makeTag } from "../../../../../../utils/utility";
import { ColorfulMarkdownTextarea } from "../../../../../../components/SafeMarkdown/ColorfulMarkdownInput";

interface RadioButtonCreatorProps {
  initialValues?: Array<Choice>;
  onValuesChange: (options: Choice[]) => void;
}

export const RadioButtonCreator: React.FC<RadioButtonCreatorProps> = ({
  initialValues,
  onValuesChange,
}) => {
  const [choices, setChoices] = useState<Array<Choice>>(initialValues || []);

  const handleNewChoices = (choices: Array<Choice>) => {
    setChoices(choices);
    onValuesChange(choices);
  };

  return (
    <OptionsStyle>
      {choices?.map((choice) => {
        let [choiceId, label, settingsString] = choice;
        let settings = JSON.parse(settingsString || "{}") as ChoiceSettings;
        return (
          <div className="radioButtonItem" key={choiceId}>
            <Radio disabled key={choiceId + "choice"} />
            {/* <Input
              key={choiceId + "input"}
              defaultValue={label}
              onChange={(e) => {
                handleLabelChange(
                  e.target.value,
                  choiceId,
                  choices,
                  handleNewChoices
                );
              }}
              placeholder="Enter an option"
              className="choice-input"
              disabled={settings.isOther}
            /> */}
            <ColorfulMarkdownTextarea
              key={choiceId + "input"}
              onChange={(val) => {
                handleLabelChange(val, choiceId!, choices, handleNewChoices);
              }}
              value={label}
              placeholder="Enter an option"
              className="choice-input"
              disabled={settings.isOther}
            />
            {settings.isOther && (
              <Input
                placeholder="Respondent's custom answer..."
                disabled
                style={{ maxWidth: 200 }}
                className="choice-input"
              />
            )}
            {choices.length >= 2 && (
              <CloseOutlined
                onClick={(e) => {
                  handleDelete(choiceId!, choices, handleNewChoices);
                }}
              />
            )}
          </div>
        );
      })}
      <AddOption
        disable={choices.some((choice) => {
          let [choiceId, label, settingsString] = choice;
          return label === "";
        })}
        choices={choices}
        callback={handleNewChoices}
        displayOther={!hasOtherOption(choices)}
      />
    </OptionsStyle>
  );
};
