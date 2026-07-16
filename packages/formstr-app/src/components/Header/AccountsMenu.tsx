import { MouseEvent } from "react";
import { MenuProps, Modal, Typography } from "antd";
import { CheckOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { StoredAccount } from "@formstr/signer";
import { useProfileContext } from "../../hooks/useProfileContext";
import { NostrAvatar } from "./NostrAvatar";
import { truncateNpub } from "../../utils/utility";

const { Text } = Typography;

const METHOD_LABEL_KEYS: Record<StoredAccount["method"], string> = {
  extension: "accounts.methods.extension",
  nip46: "accounts.methods.nip46",
  ncryptsec: "accounts.methods.ncryptsec",
  android: "accounts.methods.android",
};

interface UseAccountsMenuArgs {
  /** Switching landed on a locked ncryptsec account — caller should prompt for its passphrase. */
  onNeedsPassphrase: (pubkey: string) => void;
  onAddAccount: () => void;
}

/**
 * Builds the antd Menu items for the account list + "Add account" entry,
 * following the same `children`-array pattern the header's existing
 * `language` submenu uses. A hook (not a component) because antd v5 menu
 * items are configuration objects, not a JSX subtree.
 */
export const useAccountsMenuItems = ({
  onNeedsPassphrase,
  onAddAccount,
}: UseAccountsMenuArgs): MenuProps["items"] => {
  const { t } = useTranslation();
  const { accounts, pubkey, switchAccount, removeAccount } =
    useProfileContext();

  const handleSwitch = async (account: StoredAccount) => {
    if (account.pubkey === pubkey) return;
    const { locked } = await switchAccount(account.pubkey);
    if (locked) onNeedsPassphrase(account.pubkey);
  };

  const handleRemove = (account: StoredAccount, event: MouseEvent) => {
    event.stopPropagation();
    Modal.confirm({
      title: t("accounts.removeTitle"),
      content:
        account.method === "ncryptsec"
          ? t("accounts.removeBodyNcryptsec")
          : t("accounts.removeBody"),
      okText: t("accounts.removeAction"),
      okType: "danger",
      cancelText: t("common.actions.cancel"),
      onOk: () => removeAccount(account.pubkey),
    });
  };

  const accountItems: MenuProps["items"] = accounts.map((account) => ({
    key: `account-${account.pubkey}`,
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflow: "hidden",
          }}
        >
          <NostrAvatar pubkey={account.pubkey} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            <Text strong={account.pubkey === pubkey}>
              {truncateNpub(account.pubkey)}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t(METHOD_LABEL_KEYS[account.method])}
            </Text>
          </span>
          {account.pubkey === pubkey && (
            <CheckOutlined style={{ color: "#52c41a" }} />
          )}
        </div>
        <DeleteOutlined onClick={(event) => handleRemove(account, event)} />
      </div>
    ),
    onClick: () => handleSwitch(account),
  }));

  return [
    ...accountItems,
    { type: "divider" },
    {
      key: "add-account",
      icon: <PlusOutlined />,
      label: t("accounts.addAccount"),
      onClick: onAddAccount,
    },
  ];
};
