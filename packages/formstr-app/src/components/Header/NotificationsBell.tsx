import { useNavigate } from "react-router-dom";
import { Badge, Dropdown, Typography, Button } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../provider/NotificationsProvider";
import { responsePath } from "../../utils/formUtils";
import { makeFormNAddr, naddrUrl } from "../../utils/utility";
import type { INotification } from "../../utils/notifications";

const { Text } = Typography;

/**
 * Header bell for the two in-app notification types: a response landed on a
 * form you own (including local-only forms with nobody signed in), or
 * someone shared a form with you. Always renders — device-wide
 * (local-only-form) notifications need to be reachable with no identity
 * active, same reasoning as the "Local" dashboard tab already being
 * available logged out.
 */
export const NotificationsBell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, findOwnedForm } =
    useNotifications();

  const destinationFor = (notification: INotification): string => {
    if (notification.type === "response") {
      const owned = findOwnedForm(notification.formPubkey, notification.formId);
      if (owned?.secretKey) {
        return responsePath(
          owned.secretKey,
          makeFormNAddr(
            notification.formPubkey,
            notification.formId,
            notification.relays,
          ),
          owned.viewKey,
        );
      }
    }
    return naddrUrl(
      notification.formPubkey,
      notification.formId,
      notification.relays,
    );
  };

  const handleSelect = (notification: INotification) => {
    markRead(notification.id);
    navigate(destinationFor(notification));
  };

  const panel = (
    <div
      style={{
        width: 320,
        maxHeight: 420,
        overflowY: "auto",
        background: "white",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Text strong>{t("notifications.title")}</Text>
        <Button type="link" size="small" onClick={markAllRead}>
          {t("notifications.markAllRead")}
        </Button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: 16, textAlign: "center" }}>
          <Text type="secondary">{t("notifications.empty")}</Text>
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(notification)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect(notification);
              }
            }}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              borderBottom: "1px solid #f5f5f5",
              background: notification.seenAt ? undefined : "#fff7e6",
            }}
          >
            <Text>
              {notification.type === "response"
                ? t("notifications.responseText", {
                    formName: notification.formName,
                  })
                : t("notifications.shareText", {
                    formName: notification.formName,
                  })}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {new Date(notification.createdAt * 1000).toLocaleString()}
            </Text>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dropdown dropdownRender={() => panel} trigger={["click"]}>
      <div
        role="button"
        tabIndex={0}
        aria-label={t("notifications.bellLabel", { count: unreadCount })}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
      </div>
    </Dropdown>
  );
};
