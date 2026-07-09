import { TimePicker } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import React from "react";

dayjs.extend(customParseFormat);

interface TimeFillerProps {
  defaultValue?: string;
  onChange: (answer: string, message?: string) => void;
  disabled?: boolean;
  testId?: string;
}

export const TimeFiller: React.FC<TimeFillerProps> = ({
  defaultValue,
  onChange,
  disabled = false,
  testId = "time-filler",
}) => {
  const format = "h:mm A";
  const value = defaultValue ? dayjs(defaultValue, format) : null;

  return (
    <TimePicker
      use12Hours
      format={format}
      value={value}
      onChange={(val) => {
        if (val) {
          onChange(val.format(format), "");
        } else {
          onChange("");
        }
      }}
      allowClear={false}
      disabled={disabled}
      data-testid={`${testId}:picker`}
    />
  );
};
