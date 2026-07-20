import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface DateFillerProps {
  onChange: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  testId?: string;
}

export const DateFiller: React.FC<DateFillerProps> = ({
  onChange,
  defaultValue,
  disabled = false,
  testId = "date-filler",
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={defaultValue ? dayjs(defaultValue) : null}
        onChange={(date) =>
          onChange(date && date.isValid() ? date.format("YYYY-MM-DD") : "")
        }
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
