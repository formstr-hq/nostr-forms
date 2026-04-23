import { DatePicker } from "antd";
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
  // Initialize date from default value if valid
  
  const getInitialDate = (): Dayjs | null => {
    const defaultVal = fieldConfig?.defaultValue || defaultValue;
    if (!defaultVal) return null;
    
    // If defaultValue is a Unix timestamp (seconds), convert it
    if (typeof defaultVal === 'string' && /^\d+$/.test(defaultVal)) {
      const parsed = dayjs(parseInt(defaultVal) * 1000);
      return parsed.isValid() ? parsed : null;
    }
    const parsed = dayjs(defaultVal);
    return parsed.isValid() ? parsed : null;
  };

  const [date, setDate] = useState<Dayjs | null>(getInitialDate);

  useEffect(() => {
    const defaultVal = fieldConfig?.defaultValue || defaultValue;
    if (!defaultVal) {
      setDate(null);
      return;
    }
    let newDate: Dayjs | null = null;
    if (typeof defaultVal === 'string' && /^\d+$/.test(defaultVal)) {
      const parsed = dayjs(parseInt(defaultVal) * 1000);
      newDate = parsed.isValid() ? parsed : null;
    } else {
      const parsed = dayjs(defaultVal);
      newDate = parsed.isValid() ? parsed : null;
    }
    setDate(newDate);
  }, [defaultValue, fieldConfig?.defaultValue]);

  // Emit initial value on mount
  useEffect(() => {
    if (date) {
      onChange(String(Math.floor(date.valueOf() / 1000)));
    }
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
    <div>
      <DatePicker
        value={date}
        onChange={handleChange}
        showTime
        style={{ marginBottom: 8, width: "100%" }}
        disabled={disabled}
        placeholder={t("filler.inputs.pickDateTime")}
        data-testid={`${testId}:picker`}
      />
    </div>
  );
};
