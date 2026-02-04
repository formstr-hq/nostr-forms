import React from "react";
import { Input } from "antd";
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
};

export const ColorfulMarkdownTextarea: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  fontSize,
  className,
  disabled,
}) => {
  const { formSettings } = useFormBuilderContext();
  const globalColor = formSettings.globalColor || "black";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Input.TextArea
        value={value}
        style={{ fontSize: fontSize, color: globalColor }}
        onChange={handleTextChange}
        placeholder={placeholder}
        disabled={disabled}
        autoSize
      />
    </div>
  );
};
