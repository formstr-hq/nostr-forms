import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { SectionData } from "../../providers/FormBuilder/typeDefs";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import SectionDeleteButton from "./SectionDeleteButton";
import { useTranslation } from "react-i18next";

interface SectionProps {
  section: SectionData;
  children: React.ReactNode;
  sectionIndex?: number;
  totalSections?: number;
}

const Section: React.FC<SectionProps> = ({
  section,
  children,
  sectionIndex = 1,
  totalSections = 1,
}) => {
  const { t } = useTranslation();
  const {
    updateSection,
    removeSection,
    moveQuestionToSection,
    deleteQuestion,
  } = useFormBuilderContext();
  const [collapsed, setCollapsed] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDelete = () => {
    removeSection(section.id);
  };

  const handleTitleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updateSection(section.id, { title: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updateSection(section.id, { description: e.target.value });
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);

    const questionId = e.dataTransfer.getData("questionId");
    if (questionId) {
      moveQuestionToSection(questionId, section.id);
    }
  };

  const handleDeleteWithQuestions = () => {
    section.questionIds.forEach((questionId) => {
      deleteQuestion(questionId);
    });
    removeSection(section.id);
  };

  return (
    <Box sx={{ mb: "24px" }}>
      <Box
        sx={{
          background: "#ff5733",
          color: "white",
          padding: "2px 16px",
          borderRadius: "6px 6px 0 0",
          fontSize: 14,
          fontWeight: 500,
          display: "inline-block",
          position: "relative",
          zIndex: 2,
        }}
      >
        {t("builder.sectionsUi.label", {
          current: sectionIndex,
          total: totalSections,
        })}
      </Box>

      <Box
        sx={{
          height: 12,
          background: "#ff5733",
          borderRadius: "0 9px 0px 0px",
          position: "relative",
          zIndex: 1,
        }}
      />

      <Box
        sx={{ position: "relative" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDropTarget && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(24, 144, 255, 0.1)",
              border: "2px dashed #1890ff",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              {t("builder.sectionsUi.dropHere")}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: "relative",
            transition: "all 0.2s",
            borderRadius: "8px",
            mt: "-6px",
            zIndex: 0,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            border: isDropTarget ? "1px solid #1890ff" : "1.5px dashed #000000",
          }}
        >
          <Card
            elevation={0}
            sx={{
              border: "none",
              borderRadius: 0,
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
          >
            <CardHeader
              sx={{ backgroundColor: "transparent" }}
              action={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setCollapsed(!collapsed)}
                  >
                    {collapsed ? (
                      <KeyboardArrowDownIcon />
                    ) : (
                      <KeyboardArrowUpIcon />
                    )}
                  </IconButton>
                  <SectionDeleteButton
                    onDelete={handleDelete}
                    onDeleteWithQuestions={handleDeleteWithQuestions}
                    questionCount={section.questionIds.length}
                    sectionTitle={section.title}
                    className="action-icon"
                  />
                </Box>
              }
            />
            <CardContent sx={{ pt: 2, backgroundColor: "transparent" }}>
              <Box sx={{ mb: "24px" }}>
                <Box
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <TextField
                      variant="standard"
                      fullWidth
                      value={section.title || ""}
                      onChange={handleTitleChange}
                      placeholder={t("builder.sectionsUi.titlePlaceholder")}
                      onClick={(e) => e.stopPropagation()}
                      slotProps={{
                        input: {
                          disableUnderline: true,
                          sx: { fontSize: 18, fontWeight: 500 },
                        },
                      }}
                      sx={{ mb: 1 }}
                    />

                    {!collapsed && (
                      <TextField
                        variant="standard"
                        multiline
                        fullWidth
                        value={section.description || ""}
                        onChange={handleDescriptionChange}
                        placeholder={t("builder.defaults.sectionDescription")}
                        onClick={(e) => e.stopPropagation()}
                        slotProps={{
                          input: {
                            disableUnderline: true,
                            sx: { color: "rgba(0, 0, 0, 0.65)" },
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>

                {!collapsed && (
                  <>
                    <Divider />
                    <Box sx={{ mt: 2 }}>{children}</Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Section;
