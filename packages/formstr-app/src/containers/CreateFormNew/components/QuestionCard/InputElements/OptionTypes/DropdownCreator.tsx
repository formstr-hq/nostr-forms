import { CaretDownOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Dropdown, Input, MenuProps } from "antd";
import { useState } from "react";
import OptionsStyle from "./Options.style";
import { AddOption } from "./AddOption";
import { handleDelete, handleLabelChange, normalizeChoices } from "./utils";
import { MenuItemType } from "antd/es/menu/hooks/useItems";
import { Choice, ChoiceSettings } from "./types";
import { useTranslation } from "react-i18next";

interface RadioButtonCreatorProps {
  initialValues?: Array<Choice>;
  onValuesChange: (options: Choice[]) => void;
}

export const DropdownCreator: React.FC<RadioButtonCreatorProps> = ({
  initialValues,
  onValuesChange,
}) => {
  const { t } = useTranslation();
  const [choices, setChoices] = useState<Array<Choice>>(() =>
    normalizeChoices(initialValues),
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleNewChoices = (choices: Array<Choice>) => {
    setChoices(choices);
    onValuesChange(choices);
    setIsOpen(true);
  };

  const getMenuItems = (): MenuProps["items"] => {
    return choices.map((choice) => {
      let [choiceId, label, settingsString] = choice;
      let settings = JSON.parse(settingsString || "{}") as ChoiceSettings;
      return {
        label: (
          <div className="radioButtonItem" key={choiceId}>
            <Input
              defaultValue={label}
              key={choiceId}
              onChange={(e) => {
                handleLabelChange(
                  e.target.value,
                  choiceId!,
                  choices,
                  handleNewChoices
                );
              }}
              className="choice-input"
              placeholder={t("builder.inputPreviews.optionPlaceholder")}
              disabled={settings.isOther}
            />
            <div>
              {choices.length >= 2 && (
                <CloseOutlined
                  onClick={(e) => {
                    handleDelete(choiceId!, choices, handleNewChoices);
                  }}
                />
              )}
            </div>
          </div>
        ),
        key: choiceId,
      } as MenuItemType;
    });
  };
  return (
    <OptionsStyle>
      <Dropdown
        menu={{ items: getMenuItems(), onClick: () => {} }}
        open={isOpen}
        className="dropdown"
        onOpenChange={(nextOpen, info) => {
          if (info.source === "trigger") setIsOpen(nextOpen);
        }}
      >
        <Button onClick={(e) => e.preventDefault()}>
          {t("builder.inputPreviews.optionsCount", { count: choices.length })}{" "}
          <CaretDownOutlined />
        </Button>
      </Dropdown>
      <AddOption
        disable={choices.some((choice) => {
          let [choiceId, label, settingsString] = choice;
          return label === "";
        })}
        choices={choices}
        callback={handleNewChoices}
        displayOther={false}
      />
    </OptionsStyle>
  );
};
