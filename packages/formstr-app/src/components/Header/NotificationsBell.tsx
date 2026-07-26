import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  IconButton,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../provider/NotificationsProvider";
import { responsePath } from "../../utils/formUtils";
import { makeFormNAddr, naddrUrl } from "../../utils/utility";
import type { INotification } from "../../utils/notifications";
import { FORMSTR_COLORS } from "../../theme/muiTheme";

/**
 * Header bell for the two in-app notification types: a response landed on a
 * form you own (including local-only forms with nobody signed in), or
 * someone shared a form with you. Always renders — device-wide
 * (local-only-form) notifications need to be reachable with no identity
 * active, same reasoning as the "Local" dashboard tab already being
 * available logged out.
 *
 * Uses a non-modal Popper (not Popover): the page must stay interactive
 * while the panel is open, like the antd Dropdown it replaces — a modal
 * Popover aria-hides the rest of the document, which also breaks the bell's
 * own aria-label lookup for anything polling the unread count.
 */
export const NotificationsBell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, findOwnedForm } =
    useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

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
    setAnchorEl(null);
    navigate(destinationFor(notification));
  };

  // The name stored on the notification is frozen at record time, when the
  // form's real name may not have loaded yet — so it can be the form's id
  // (d-tag). Prefer the currently-resolved owned-form name, and only fall back
  // to the stored value (e.g. for shared forms we don't own) when that name is
  // actually a name and not just the id echoed back.
  const displayName = (notification: INotification): string => {
    const owned = findOwnedForm(notification.formPubkey, notification.formId);
    if (owned?.formName && owned.formName !== notification.formId) {
      return owned.formName;
    }
    return notification.formName;
  };

  return (
    <>
      <IconButton
        aria-label={t("notifications.bellLabel", { count: unreadCount })}
        onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
        size="small"
        sx={{ color: "text.secondary" }}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        placement="bottom-end"
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
          <Paper
            elevation={8}
            sx={{ borderRadius: 3, mt: 1, overflow: "hidden" }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAnchorEl(null);
            }}
          >
            <Box sx={{ width: 320, maxHeight: 420, overflowY: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="subtitle2">
                  {t("notifications.title")}
                </Typography>
                <Button size="small" onClick={markAllRead}>
                  {t("notifications.markAllRead")}
                </Button>
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("notifications.empty")}
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification, index) => (
                  <Box key={notification.id}>
                    {index > 0 && <Divider />}
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(notification)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(notification);
                        }
                      }}
                      sx={{
                        px: 1.5,
                        py: 1,
                        cursor: "pointer",
                        bgcolor: notification.seenAt
                          ? undefined
                          : FORMSTR_COLORS.primaryTint,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Typography variant="body2">
                        {notification.type === "response"
                          ? t("notifications.responseText", {
                              formName: displayName(notification),
                            })
                          : t("notifications.shareText", {
                              formName: displayName(notification),
                            })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(
                          notification.createdAt * 1000,
                        ).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};
