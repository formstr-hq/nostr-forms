import i18n from ".";

const normalizeDateValue = (value: Date | number | string) => {
  if (value instanceof Date) return value;
  return new Date(value);
};

export const formatLocalizedDate = (
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
) => {
  return normalizeDateValue(value).toLocaleDateString(
    i18n.language || "en",
    options,
  );
};

export const formatLocalizedDateTime = (
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
) => {
  return normalizeDateValue(value).toLocaleString(
    i18n.language || "en",
    options,
  );
};
