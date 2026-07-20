import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface IAnswerSettings {
  defaultValue?: string | number | Date;
}

interface DateTimeFillerProps {
  fieldConfig?: IAnswerSettings;
  defaultValue?: string;
  onChange: (value: string) => void; // Unix timestamp (seconds) as string
  disabled?: boolean;
  testId?: string;
}

export const DateTimeFiller: React.FC<DateTimeFillerProps> = ({
  fieldConfig,
  defaultValue,
  onChange,
  disabled = false,
  testId = "datetime-filler",
}) => {
  const { t } = useTranslation();

  const parseDefault = (): Dayjs | null => {
    const defaultVal = fieldConfig?.defaultValue || defaultValue;
    if (!defaultVal) return null;

    // If defaultValue is a Unix timestamp (seconds), convert it
    if (typeof defaultVal === "string" && /^\d+$/.test(defaultVal)) {
      const parsed = dayjs(parseInt(defaultVal) * 1000);
      return parsed.isValid() ? parsed : null;
    }
    const parsed = dayjs(defaultVal);
    return parsed.isValid() ? parsed : null;
  };

  const [date, setDate] = useState<Dayjs | null>(parseDefault);

  useEffect(() => {
    setDate(parseDefault());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, fieldConfig?.defaultValue]);

  // Emit initial value on mount
  useEffect(() => {
    if (date) {
      onChange(String(Math.floor(date.valueOf() / 1000)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle date (and time) change
  const handleChange = (newDate: Dayjs | null) => {
    setDate(newDate);
    if (newDate) {
      // Convert milliseconds → seconds
      onChange(String(Math.floor(newDate.valueOf() / 1000)));
    } else {
      onChange("");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        value={date}
        onChange={handleChange}
        format="YYYY-MM-DD HH:mm:ss"
        disabled={disabled}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            placeholder: t("filler.inputs.pickDateTime"),
            // @ts-expect-error data-testid is forwarded to the underlying div
            "data-testid": `${testId}:picker`,
          },
        }}
        sx={{ mb: 1, width: "100%" }}
      />
    </LocalizationProvider>
  );
};
