import React from "react";
import { TextField } from "@mui/material";
import useFormBuilderContext from "../../containers/CreateFormNew/hooks/useFormBuilderContext";

type Props = {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  fontSize?: number;
  className?: string;
  disabled?: boolean;
  color?: string;
};

export const ColorfulMarkdownTextarea: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  minRows,
  maxRows,
  fontSize,
  className,
  disabled,
  color,
}) => {
  const { formSettings } = useFormBuilderContext();
  const globalColor = color ?? formSettings.colors?.global ?? formSettings.globalColor ?? "black";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <TextField
        multiline
        fullWidth
        value={value}
        minRows={minRows}
        maxRows={maxRows}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        variant="standard"
        slotProps={{
          input: {
            // Builder inline-editing look: no box, no padding, type-over text
            // (matches the old borderless antd TextArea the wrappers styled).
            disableUnderline: true,
            sx: {
              p: 0,
              fontSize: fontSize ?? "inherit",
              color: globalColor,
              backgroundColor: "transparent",
              "&.Mui-focused": { backgroundColor: "transparent" },
            },
          },
        }}
        sx={{ p: 0 }}
      />
    </div>
  );
};
