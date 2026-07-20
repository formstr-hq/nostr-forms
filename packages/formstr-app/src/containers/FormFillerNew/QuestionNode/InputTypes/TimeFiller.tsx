import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useState } from "react";

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
  const [value, setValue] = useState<dayjs.Dayjs | null>(
    defaultValue ? dayjs(defaultValue, "h:mm A") : null,
  );

  useEffect(() => {
    setValue(defaultValue ? dayjs(defaultValue, "h:mm A") : null);
  }, [defaultValue]);

  const handleChange = (val: dayjs.Dayjs | null) => {
    setValue(val);
    if (val && val.isValid()) {
      onChange(val.format("h:mm A"), "");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        ampm
        format="h:mm A"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            // @ts-expect-error data-testid is forwarded to the underlying div
            "data-testid": `${testId}:picker`,
          },
        }}
      />
    </LocalizationProvider>
  );
};
