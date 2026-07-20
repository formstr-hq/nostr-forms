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
        slotProps={{ htmlInput: { style: { fontSize, color: globalColor } } }}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        size="small"
      />
    </div>
  );
};
