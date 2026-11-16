import { MODULE_DEFAULT_RELAYS } from "@formstr/core/relay";

export const DEFAULT_RELAYS: string[] = [...MODULE_DEFAULT_RELAYS.forms];

export const getDefaultRelays = (): string[] => DEFAULT_RELAYS;
