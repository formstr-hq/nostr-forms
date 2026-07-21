import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { useTranslation } from "react-i18next";

interface SectionDeleteButtonProps {
  onDelete: () => void;
  onDeleteWithQuestions?: () => void;
  className?: string;
  questionCount: number;
  sectionTitle: string;
}

const SectionDeleteButton: React.FC<SectionDeleteButtonProps> = ({
  onDelete,
  onDeleteWithQuestions,
  className,
  questionCount,
  sectionTitle,
}) => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => {
    // If no questions, delete immediately without dialog
    if (questionCount === 0) {
      onDelete();
      return;
    }

    // Show dialog for sections with questions
    setIsModalVisible(true);
  };

  const handleMoveToUnsectioned = () => {
    onDelete();
    setIsModalVisible(false);
  };

  const handleDeleteWithQuestions = () => {
    // Show confirmation for deleting questions too
    setIsConfirmOpen(true);
  };

  const handleConfirmDeleteAll = () => {
    onDeleteWithQuestions?.();
    setIsConfirmOpen(false);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <IconButton
        className={className}
        size="small"
        sx={{ color: "red" }}
        onClick={handleDelete}
      >
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>

      <Dialog
        open={isModalVisible}
        onClose={handleCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorOutlineIcon sx={{ color: "#faad14" }} />
            {t("builder.sectionDelete.deleteSectionTitle", {
              title: sectionTitle,
            })}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography component="p" sx={{ fontWeight: 600 }}>
              {t("builder.sectionDelete.containsQuestions", {
                count: questionCount,
              })}
            </Typography>
            <Typography component="p">
              {t("builder.sectionDelete.whatToDo")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleMoveToUnsectioned}
            >
              {t("builder.sectionDelete.deleteSectionOnly")}
            </Button>

            {onDeleteWithQuestions && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleDeleteWithQuestions}
              >
                {t("builder.sectionDelete.deleteSectionAndQuestions")}
              </Button>
            )}

            <Button variant="outlined" fullWidth onClick={handleCancel}>
              {t("common.actions.cancel")}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorOutlineIcon sx={{ color: "#faad14" }} />
            {t("builder.sectionDelete.deleteEverythingTitle")}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t("builder.sectionDelete.deleteEverythingBody", {
              title: sectionTitle,
              count: questionCount,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
          <Button
            onClick={handleConfirmDeleteAll}
            variant="contained"
            color="error"
          >
            {t("builder.sectionDelete.deleteAll")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SectionDeleteButton;
