import { useEffect, useState } from "react";

export const LOCAL_STORAGE_KEYS = {
  LOCAL_FORMS: "formstr:forms",
  LOCAL_FORMS_ENCRYPTED: "formstr:forms-encrypted",
  LOCAL_FORMS_META: "formstr:forms-meta",
  DRAFT_FORMS: "formstr:draftForms",
  DRAFT_RESPONSES: "formstr:draft-response",
  AUTO_SAVE_ENABLED: "formstr:auto-save-enabled",
  SUBMISSIONS: "formstr:submissions",
  NOTIFICATIONS: "formstr:notifications",
  NOTIFICATIONS_STATE: "formstr:notifications-state",
  PROFILE: "formstr:profile",
  OLLAMA_CONFIG: "formstr:ollama_config",
  APP_LOCALE: "formstr:locale",
};

export interface LocalFormsMeta {
  encrypted: boolean;
  encryptedBy?: string;
  encryptedAt?: string;
}

export function getItem<T>(key: string, { parseAsJson = true } = {}): T | null {
  let value = localStorage.getItem(key);
  if (value === null) {
    return value;
  }
  if (parseAsJson) {
    try {
      value = JSON.parse(value);
    } catch (e) {
      value = null;
      localStorage.removeItem(key);
    }
  }

  return value as T;
}

export const setItem = (
  key: string,
  value: any,
  { parseAsJson = true } = {}
): boolean => {
  let valueToBeStored = value;
  if (parseAsJson) {
    valueToBeStored = JSON.stringify(valueToBeStored);
  }
  try {
    localStorage.setItem(key, valueToBeStored);
    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (e) {
    // Almost always QuotaExceededError. Return false so callers that can shed
    // load (e.g. the notifications dedup state) may prune and retry, rather
    // than a full quota silently breaking unrelated writes like auth/profile.
    console.log("Error in setItem: ", e);
    return false;
  }
};
