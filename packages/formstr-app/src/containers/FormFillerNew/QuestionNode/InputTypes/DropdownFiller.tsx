import { FormControl, MenuItem, Select, Typography } from "@mui/material";
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
  const placeholder = t("filler.inputs.selectOption");
  return (
    <FormControl fullWidth size="small">
      <Select
        value={defaultValue ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        displayEmpty
        data-testid={`${testId}:select`}
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Typography component="span" color="text.disabled">
                {placeholder}
              </Typography>
            );
          }
          const match = options.find((choice) => choice[0] === selected);
          return match ? match[1] : selected;
        }}
      >
        {options.map((choice) => {
          let [choiceId, label] = choice;
          return (
            <MenuItem key={choiceId} value={choiceId}>
              {label}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
