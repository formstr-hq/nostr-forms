import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import RelayStatusIndicator from "../../../../components/RelayStatusIndicator";
import { RelayItem, RelayStatus } from "../../providers/FormBuilder/typeDefs";
import { isValidWebSocketUrl } from "../../utils";
import { checkRelayConnection } from "../../../../utils/relayUtils";

interface EditableRelayItemProps {
  relayItem: RelayItem;
  status: RelayStatus;
  onEdit: (tempId: string, newUrl: string) => void;
  onDelete: (tempId: string) => void;
  onTestConnection: (tempId: string, url: string) => void;
}

const EditableRelayListItem: React.FC<EditableRelayItemProps> = ({
  relayItem,
  status,
  onEdit,
  onDelete,
  onTestConnection,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState(relayItem.url);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSave = () => {
    if (!isValidWebSocketUrl(editedUrl)) {
      setEditError(t("builder.relayManager.invalidUrl"));
      return;
    }
    setEditError(null);
    onEdit(relayItem.tempId, editedUrl);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedUrl(relayItem.url);
    setIsEditing(false);
    setEditError(null);
  };

  useEffect(() => {
    setEditedUrl(relayItem.url);
  }, [relayItem.url]);

  return (
    <ListItem
      disableGutters
      secondaryAction={
        isEditing ? (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={t("common.actions.save")}>
              <IconButton size="small" onClick={handleSave}>
                <SaveOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("common.actions.cancel")}>
              <IconButton size="small" color="error" onClick={handleCancelEdit}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={t("builder.relayManager.testConnection")}>
              <IconButton
                size="small"
                onClick={() =>
                  onTestConnection(relayItem.tempId, relayItem.url)
                }
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("builder.relayManager.editRelay")}>
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("builder.relayManager.deleteRelay")}>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(relayItem.tempId)}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
      sx={{ py: 1, alignItems: "center" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexGrow: 1,
          minWidth: 0,
          mr: 1,
        }}
      >
        <RelayStatusIndicator status={status} />
        {isEditing ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              ml: 1,
            }}
          >
            <TextField
              size="small"
              fullWidth
              value={editedUrl}
              onChange={(e) => setEditedUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            {editError && (
              <Typography color="error" sx={{ fontSize: 12, mt: 0.5 }}>
                {editError}
              </Typography>
            )}
          </Box>
        ) : (
          <ListItemText
            primary={relayItem.url}
            slotProps={{
              primary: { noWrap: true, sx: { fontSize: 14 } },
            }}
            sx={{ ml: 1, minWidth: 0 }}
          />
        )}
      </Box>
    </ListItem>
  );
};

interface RelayManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelayManagerModal: React.FC<RelayManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { relayList, addRelayToList, editRelayInList, deleteRelayFromList } =
    useFormBuilderContext();

  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [localRelayStatuses, setLocalRelayStatuses] = useState<
    Map<string, RelayStatus>
  >(new Map());
  const prevRelayListRef = useRef<RelayItem[]>([]);

  const updateLocalRelayStatus = useCallback(
    (relayId: string, status: RelayStatus) => {
      setLocalRelayStatuses((prevStatuses) =>
        new Map(prevStatuses).set(relayId, status),
      );
    },
    [],
  );

  const testLocalRelayConnection = useCallback(
    async (relayId: string, url: string) => {
      updateLocalRelayStatus(relayId, "pending");
      try {
        const status = await checkRelayConnection(url);
        updateLocalRelayStatus(relayId, status);
      } catch (error) {
        updateLocalRelayStatus(relayId, "error");
      }
    },
    [updateLocalRelayStatus],
  );

  const testAllLocalRelayConnections = useCallback(() => {
    relayList.forEach((relay) => {
      testLocalRelayConnection(relay.tempId, relay.url);
    });
  }, [relayList, testLocalRelayConnection]);

  useEffect(() => {
    if (isOpen) {
      const initialStatuses = new Map<string, RelayStatus>();
      let hasNewRelays = false;
      const currentRelayIds = new Set(relayList.map((r) => r.tempId));
      const prevRelayIds = new Set(
        prevRelayListRef.current.map((r) => r.tempId),
      );

      relayList.forEach((relay) => {
        const existingStatus = localRelayStatuses.get(relay.tempId);
        initialStatuses.set(relay.tempId, existingStatus || "unknown");
        if (!prevRelayIds.has(relay.tempId)) {
          hasNewRelays = true;
        }
      });
      localRelayStatuses.forEach((_status, tempId) => {
        if (!currentRelayIds.has(tempId)) {
          initialStatuses.delete(tempId);
        }
      });
      setLocalRelayStatuses(initialStatuses);
      if (
        relayList.length !== prevRelayListRef.current.length ||
        hasNewRelays
      ) {
        testAllLocalRelayConnections();
      }
    }
    prevRelayListRef.current = relayList;
  }, [isOpen, relayList, testAllLocalRelayConnections]);

  const handleAddNewRelay = () => {
    if (!isValidWebSocketUrl(newRelayUrl)) {
      setAddError(t("builder.relayManager.invalidUrl"));
      return;
    }
    setAddError(null);
    addRelayToList(newRelayUrl);
    setNewRelayUrl("");
    setIsAdding(false);
  };

  const handleEditRelay = (tempId: string, newUrl: string) => {
    editRelayInList(tempId, newUrl);
  };

  const handleDeleteRelay = (tempId: string) => {
    deleteRelayFromList(tempId);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("builder.relayManager.title")}</DialogTitle>
      <DialogContent>
        {isAdding ? (
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t("builder.relayManager.placeholder")}
              value={newRelayUrl}
              onChange={(e) => setNewRelayUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNewRelay();
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddNewRelay}
              startIcon={<SaveOutlinedIcon />}
            >
              {t("common.actions.add")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsAdding(false);
                setAddError(null);
                setNewRelayUrl("");
              }}
              startIcon={<CloseIcon />}
            >
              {t("common.actions.cancel")}
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setIsAdding(true)}
            startIcon={<AddIcon />}
            sx={{ mb: 2, borderStyle: "dashed" }}
          >
            {t("builder.relayManager.addRelay")}
          </Button>
        )}
        {addError && (
          <Typography
            color="error"
            sx={{ display: "block", mb: 1, fontSize: 12 }}
          >
            {addError}
          </Typography>
        )}

        {relayList.length === 0 ? (
          <Typography color="text.secondary">
            {t("common.labels.noSupportedRelays")}
          </Typography>
        ) : (
          <List
            sx={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", py: 0 }}
          >
            {relayList.map((item) => (
              <EditableRelayListItem
                key={item.tempId}
                relayItem={item}
                status={localRelayStatuses.get(item.tempId) || "unknown"}
                onEdit={handleEditRelay}
                onDelete={handleDeleteRelay}
                onTestConnection={testLocalRelayConnection}
              />
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={testAllLocalRelayConnections}
          startIcon={<RefreshIcon />}
        >
          {t("builder.relayManager.testAll")}
        </Button>
        <Button onClick={onClose}>{t("common.actions.close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelayManagerModal;
