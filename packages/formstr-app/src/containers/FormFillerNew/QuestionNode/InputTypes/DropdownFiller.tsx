import { Select } from "antd";
import { Option } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

interface DropdownFillerProps {
  options: Option[];
  onChange: (text: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  testId?: string;
}

export const DropdownFiller: React.FC<DropdownFillerProps> = ({
  options,
  onChange,
  defaultValue,
  disabled = false,
  testId = "dropdown-filler",
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Select
        onChange={onChange}
        options={options.map((choice) => {
          let [choiceId, label] = choice;
          return { value: choiceId, label: label };
        })}
        value={defaultValue}
        placeholder={t("filler.inputs.selectOption")}
        disabled={disabled}
        data-testid={`${testId}:select`}
      />
    </>
  );
};
