import React, { useState } from "react";
import { Modal, Input, Button, message, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useProfileContext } from "../../hooks/useProfileContext";
import { truncateNpub } from "../../utils/utility";

const { Paragraph } = Typography;

interface UnlockAccountModalProps {
  open: boolean;
  pubkey?: string;
  onClose: () => void;
}

/** Prompts for a passphrase after switchAccount lands on a locked ncryptsec account. */
export const UnlockAccountModal: React.FC<UnlockAccountModalProps> = ({
  open,
  pubkey,
  onClose,
}) => {
  const { t } = useTranslation();
  const { unlockActiveWithPassphrase } = useProfileContext();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPassphrase("");
    onClose();
  };

  const handleUnlock = async () => {
    if (!passphrase) return;
    setLoading(true);
    try {
      await unlockActiveWithPassphrase(passphrase);
      setPassphrase("");
      onClose();
    } catch {
      message.error(t("accounts.unlockFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={t("accounts.unlockTitle")}
      destroyOnClose
    >
      {pubkey && (
        <Paragraph type="secondary">
          {t("accounts.unlockBody", { npub: truncateNpub(pubkey) })}
        </Paragraph>
      )}
      <Input.Password
        placeholder={t("accounts.passphrasePlaceholder")}
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        onPressEnter={() => void handleUnlock()}
      />
      <Button
        type="primary"
        block
        loading={loading}
        onClick={() => void handleUnlock()}
        style={{ marginTop: 16 }}
      >
        {t("accounts.unlockAction")}
      </Button>
    </Modal>
  );
};
