import React, { useState, useRef, useEffect } from "react";
import { IconButton } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import { useSnackbar } from "../../../../providers/SnackbarProvider";

interface DeleteButtonProps {
  onDelete: () => void;
  className?: string;
}

/**
 * Two-step delete with a 2s undo window. The countdown toast rides on the
 * MUI snackbar (re-showing replaces the current message).
 */
const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, className }) => {
  const [showUndoDelete, setShowUndoDelete] = useState(false);
  const { showMessage } = useSnackbar();
  const timeoutRef = useRef<number>();
  const intervalRef = useRef<number>();

  const clearTimers = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  };

  const handleDelete = () => {
    setShowUndoDelete(true);
    let count = 2;

    showMessage(`Question will be deleted in ${count}s`, "info");

    intervalRef.current = window.setInterval(() => {
      count -= 1;
      showMessage(`Question will be deleted in ${count}s`, "info");
    }, 1000);

    timeoutRef.current = window.setTimeout(() => {
      onDelete();
      setShowUndoDelete(false);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }, 2000);
  };

  const handleUndo = () => {
    clearTimers();
    setShowUndoDelete(false);
    showMessage("Deletion cancelled", "success");
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return showUndoDelete ? (
    <IconButton
      aria-label="undo delete"
      size="small"
      className={className}
      onClick={handleUndo}
      sx={{
        height: 28,
        width: 28,
        bgcolor: "rgba(0, 0, 0, 0.05)",
        borderRadius: "50%",
        mr: 1,
        color: "error.main",
      }}
    >
      <UndoIcon sx={{ fontSize: 14 }} />
    </IconButton>
  ) : (
    <IconButton
      aria-label="delete question"
      size="small"
      className={className}
      onClick={handleDelete}
      sx={{
        height: 28,
        width: 28,
        bgcolor: "rgba(0, 0, 0, 0.05)",
        borderRadius: "50%",
        mr: 1,
        color: "error.main",
      }}
    >
      <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
    </IconButton>
  );
};

export default DeleteButton;
