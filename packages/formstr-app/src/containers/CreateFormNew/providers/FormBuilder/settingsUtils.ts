import { IFormSettings } from "../../components/FormSettings/types";

export const mergeLoadedFormSettings = (
  initialFormSettings: IFormSettings,
  loadedSettings: IFormSettings,
): IFormSettings => {
  const mergedSettings = {
    ...initialFormSettings,
    ...loadedSettings,
  };

  // Preserve legacy behavior for existing forms that predate the opt-in flag.
  if (
    !Object.prototype.hasOwnProperty.call(
      loadedSettings,
      "notificationEncryption",
    )
  ) {
    delete mergedSettings.notificationEncryption;
  }

  return mergedSettings;
};